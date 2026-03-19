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

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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
      <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
        {open ? (
          <div className="mb-3 flex h-[32rem] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Portfolio Assistant
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  Powered by Gemini
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--muted)] transition-colors hover:bg-[color:var(--hover)] hover:text-[color:var(--foreground)]"
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
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--foreground)] px-3 py-2 text-sm text-[color:var(--background)]"
                      : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-[color:var(--hover)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                  }
                >
                  {message.content}
                </div>
              ))}
              {isSending ? (
                <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-[color:var(--hover)] px-3 py-2 text-sm text-[color:var(--muted)]">
                  Thinking...
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-3 border-t border-[color:var(--border)] p-3">
              {messages.length <= 2 ? (
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-left text-xs text-[color:var(--muted)] transition-colors hover:bg-[color:var(--hover)] hover:text-[color:var(--foreground)]"
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
                  className="h-10 flex-1 rounded-full border border-[color:var(--border)] bg-transparent px-4 text-sm text-[color:var(--foreground)] outline-none transition-colors placeholder:text-[color:var(--muted)] focus:border-[color:var(--foreground)]"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          className="group flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--foreground)] text-[color:var(--background)] shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-transform hover:scale-105"
          aria-label={open ? "Close assistant" : "Open assistant"}
        >
          <Bot className="h-6 w-6 transition-transform group-hover:scale-110" />
        </button>
      </div>
    </>
  );
}