"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useChat } from "ai/react";

export default function ChatbotPage() {
  const t = useTranslations();
  const { user, setShowSignModal } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (error) => {
      if (error.message.includes("no access")) {
        toast.error(t("travel.chatbot.no_access"));
      } else {
        toast.error(t("travel.chatbot.error"));
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    handleSubmit(e);
  };

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
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-muted/50">
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
              disabled={isLoading || !user}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !user || !input.trim()}>
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-2 text-sm text-destructive">
              {error.message.includes("no access")
                ? t("travel.chatbot.no_access")
                : t("travel.chatbot.error")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


