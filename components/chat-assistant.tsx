"use client";

import { Bot, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Ask me about Franze's projects, experience, or tech stack.",
  },
];

const quickPrompts = [
  "What does Franze specialize in?",
  "Show me his recent projects.",
  "What technologies does he use most?",
];

const chatCallouts = [
  "Try to talk to me.",
  "Ask me about projects and tech stack.",
  "I can guide you through the portfolio.",
];

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [calloutVisible, setCalloutVisible] = useState(false);
  const [calloutIndex, setCalloutIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setCalloutVisible(false);
      return;
    }

    setCalloutVisible(true);

    const hideTimeout = window.setTimeout(() => {
      setCalloutVisible(false);
    }, 3000);

    const nextTimeout = window.setTimeout(() => {
      setCalloutIndex((currentIndex) => (currentIndex + 1) % chatCallouts.length);
    }, 5000);

    return () => {
      window.clearTimeout(hideTimeout);
      window.clearTimeout(nextTimeout);
    };
  }, [open, calloutIndex]);

  async function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmedMessage } as const];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            data.reply ?? "I could not generate a response right now. Please try again.",
        },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "I could not connect to the assistant right now.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
        <div
          className={`pointer-events-none absolute right-19 bottom-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
            calloutVisible && !open
              ? "translate-x-0 opacity-100 animate-chat-callout-enter"
              : "translate-x-2 opacity-0"
          }`}
          aria-hidden={!calloutVisible || open}
        >
          <div className="relative w-72 rounded-3xl rounded-tr-sm border border-(--border) bg-(--surface) px-4 py-2.5 pr-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.16)] sm:w-80">
            <span
              aria-hidden="true"
              className="absolute right-[-0.34rem] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border border-(--border) bg-(--surface)"
            />
            <p className="text-xs font-medium leading-5 tracking-[0.01em] text-foreground">
              {chatCallouts[calloutIndex]}
            </p>
          </div>
        </div>

        <div
          className={`pointer-events-auto absolute bottom-19 right-0 w-[min(92vw,22rem)] origin-bottom-right rounded-2xl border border-(--border) bg-(--surface) shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            open
              ? "translate-y-0 scale-100 opacity-100 animate-chat-panel-enter"
              : "pointer-events-none translate-y-3 scale-95 opacity-0"
          }`}
          aria-hidden={!open}
        >
          <div className="flex h-128 flex-col overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Portfolio Assistant
                </p>
                <p className="text-xs text-(--muted)">
                  Powered by Gemini
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--border) text-(--muted) transition-colors hover:bg-(--hover) hover:text-foreground"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-3 py-2 text-sm text-background"
                      : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-(--hover) px-3 py-2 text-sm text-foreground"
                  }
                >
                  {message.content}
                </div>
              ))}
              {isSending ? (
                <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-(--hover) px-3 py-2 text-sm text-(--muted)">
                  Thinking...
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-3 border-t border-(--border) p-3">
              {messages.length <= 2 ? (
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-(--border) px-3 py-1.5 text-left text-xs text-(--muted) transition-colors hover:bg-(--hover) hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask anything about the portfolio..."
                  className="h-10 flex-1 rounded-full border border-(--border) bg-transparent px-4 text-sm text-foreground outline-none transition-colors placeholder:text-(--muted) focus:border-foreground"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          className="group pointer-events-auto absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-full border border-(--border) bg-foreground text-background shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_22px_50px_rgba(0,0,0,0.28)] motion-reduce:transition-none"
          aria-label={open ? "Close assistant" : "Open assistant"}
        >
          <Bot
            className={`h-6 w-6 transition-transform duration-300 group-hover:scale-110 ${
              open ? "animate-chat-bot-open" : "animate-chat-bot-idle"
            }`}
          />
        </button>
      </div>
    </>
  );
}