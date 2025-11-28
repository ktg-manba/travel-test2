"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot, User, Loader, AlertCircle, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useChat } from "ai/react";
import Markdown from "@/components/markdown";
import Link from "next/link";

interface AccessStatus {
  hasAccess: boolean;
  hasEssentialGuide: boolean;
  hasCompletePackage: boolean;
  hasChatbotAccess?: boolean;
}

export default function ChatbotPage() {
  const t = useTranslations();
  const { user, setShowSignModal } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const shouldAutoScrollRef = useRef(true);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef(0);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (error) => {
      if (error.message.includes("upgrade_required")) {
        toast.error(t("travel.chatbot.upgrade_required"));
      } else if (error.message.includes("purchase_required")) {
        toast.error(t("travel.chatbot.purchase_required"));
      } else {
        toast.error(t("travel.chatbot.error"));
      }
    },
  });

  // 检查用户权限
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccessStatus({
          hasAccess: false,
          hasEssentialGuide: false,
          hasCompletePackage: false,
        });
        setCheckingAccess(false);
        return;
      }

      try {
        const response = await fetch("/api/chat");
        const { code, data } = await response.json();
        if (code === 0 && data) {
          setAccessStatus(data);
        } else {
          setAccessStatus({
            hasAccess: false,
            hasEssentialGuide: false,
            hasCompletePackage: false,
          });
        }
      } catch (e) {
        console.error("Failed to check access:", e);
        setAccessStatus({
          hasAccess: false,
          hasEssentialGuide: false,
          hasCompletePackage: false,
        });
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user]);

  // 检查用户是否在底部附近
  const checkIfNearBottom = (container: HTMLDivElement, threshold = 150) => {
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  };

  // 监听滚动事件，检测用户是否在手动滚动
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
      
      // 如果用户向上滚动，禁用自动滚动
      if (isScrollingUp && !checkIfNearBottom(container)) {
        shouldAutoScrollRef.current = false;
      } else if (checkIfNearBottom(container)) {
        // 如果用户在底部附近，恢复自动滚动
        shouldAutoScrollRef.current = true;
      }

      lastScrollTopRef.current = currentScrollTop;

      // 清除之前的定时器
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }

      // 设置新的定时器：如果用户停止滚动一段时间且在底部附近，恢复自动滚动
      userScrollTimeoutRef.current = setTimeout(() => {
        if (checkIfNearBottom(container)) {
          shouldAutoScrollRef.current = true;
        }
      }, 500);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // 智能滚动：只在应该自动滚动时才滚动
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    
    // 检查是否应该自动滚动
    if (!shouldAutoScrollRef.current) {
      return;
    }

    // 再次确认用户在底部附近
    const container = messagesContainerRef.current;
    if (!checkIfNearBottom(container, 200)) {
      // 如果不在底部附近，不自动滚动
      return;
    }

    // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
    const scrollTimeout = setTimeout(() => {
      if (messagesEndRef.current && shouldAutoScrollRef.current) {
        // 再次检查是否还在底部附近
        if (checkIfNearBottom(container, 200)) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, 100);

    return () => clearTimeout(scrollTimeout);
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setShowSignModal(true);
      return;
    }

    if (!input.trim()) {
      return;
    }

    if (!accessStatus?.hasAccess) {
      if (accessStatus?.hasEssentialGuide) {
        toast.error(t("travel.chatbot.upgrade_required"));
      } else {
        toast.error(t("travel.chatbot.purchase_required"));
      }
      return;
    }

    // 用户发送消息时，启用自动滚动
    shouldAutoScrollRef.current = true;
    handleSubmit(e);
  };

  const canChat = accessStatus?.hasAccess && !checkingAccess;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold">{t("travel.chatbot.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("travel.chatbot.description")}</p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t("travel.chatbot.title")}
          </CardTitle>
          <CardDescription>{t("travel.chatbot.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* 权限提示 */}
          {!checkingAccess && !canChat && (
            <Alert className="mb-4" variant={accessStatus?.hasEssentialGuide ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {accessStatus?.hasEssentialGuide
                    ? t("travel.chatbot.upgrade_message")
                    : t("travel.chatbot.purchase_message")}
                </span>
                <Link href="/products">
                  <Button size="sm" variant={accessStatus?.hasEssentialGuide ? "default" : "destructive"}>
                    {accessStatus?.hasEssentialGuide ? (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        {t("travel.chatbot.upgrade")}
                      </>
                    ) : (
                      t("travel.chatbot.buy_access")
                    )}
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-muted/50"
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("travel.chatbot.placeholder")}</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                        <Markdown content={message.content} />
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-background border">
                  <Loader className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={t("travel.chatbot.placeholder")}
              disabled={isLoading || !canChat || checkingAccess}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !canChat || checkingAccess || !input.trim()}>
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-2 text-sm text-destructive">
              {error.message.includes("upgrade_required")
                ? t("travel.chatbot.upgrade_required")
                : error.message.includes("purchase_required")
                ? t("travel.chatbot.purchase_required")
                : t("travel.chatbot.error")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


