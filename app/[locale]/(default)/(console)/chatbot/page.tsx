"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot, User, Loader, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useChat } from "ai/react";
import Markdown from "@/components/markdown";

type AccessStatus = "has_access" | "upgrade_required" | "purchase_required" | "not_logged_in" | "loading";

export default function ChatbotPage() {
  const t = useTranslations();
  const { user, setShowSignModal } = useAppContext();
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("loading");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (error) => {
      if (error.message.includes("upgrade_required")) {
        setAccessStatus("upgrade_required");
        toast.error(t("travel.chatbot.upgrade_required") || "Please upgrade to access chatbot");
      } else if (error.message.includes("purchase_required")) {
        setAccessStatus("purchase_required");
        toast.error(t("travel.chatbot.purchase_required") || "Please purchase to access chatbot");
      } else if (error.message.includes("no access")) {
        toast.error(t("travel.chatbot.no_access"));
      } else {
        toast.error(t("travel.chatbot.error"));
      }
    },
  });

  // 检查访问状态
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccessStatus("not_logged_in");
        return;
      }

      try {
        const response = await fetch("/api/chat");
        const { code, data } = await response.json();
        
        if (code === 0 && data) {
          setAccessStatus(data.accessStatus || "purchase_required");
        } else {
          setAccessStatus("purchase_required");
        }
      } catch (e) {
        console.error("Failed to check access:", e);
        setAccessStatus("purchase_required");
      }
    };

    checkAccess();
  }, [user]);

  // 检查是否接近底部
  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // 距离底部 100px 内认为接近底部
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // 滚动到底部
  const scrollToBottom = (force = false) => {
    if (force || shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 监听滚动事件
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      
      // 如果用户向上滚动且不在底部附近，停止自动滚动
      if (currentScrollTop < lastScrollTopRef.current && !checkIfNearBottom()) {
        shouldAutoScrollRef.current = false;
      } else if (checkIfNearBottom()) {
        // 如果用户滚动到底部附近，恢复自动滚动
        shouldAutoScrollRef.current = true;
      }

      lastScrollTopRef.current = currentScrollTop;

      // 清除之前的定时器
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }

      // 如果用户停止滚动一段时间，检查是否在底部
      userScrollTimeoutRef.current = setTimeout(() => {
        if (checkIfNearBottom()) {
          shouldAutoScrollRef.current = true;
        }
      }, 500);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setShowSignModal(true);
      return;
    }

    if (!input.trim()) {
      return;
    }

    // 发送新消息时强制滚动到底部
    shouldAutoScrollRef.current = true;
    handleSubmit(e);
  };

  const canChat = accessStatus === "has_access" && user;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold">{t("travel.chatbot.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("travel.chatbot.description")}</p>
      </div>

      {/* 访问状态提示 */}
      {accessStatus === "upgrade_required" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("travel.chatbot.upgrade_message") || "You need to upgrade to access the chatbot. Please purchase the complete package."}
          </AlertDescription>
        </Alert>
      )}

      {accessStatus === "purchase_required" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("travel.chatbot.purchase_message") || "Please purchase chatbot access to use this feature."}
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t("travel.chatbot.title")}
          </CardTitle>
          <CardDescription>{t("travel.chatbot.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
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
              disabled={isLoading || !canChat}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !canChat || !input.trim()}>
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
                : error.message.includes("no access")
                ? t("travel.chatbot.no_access")
                : t("travel.chatbot.error")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
