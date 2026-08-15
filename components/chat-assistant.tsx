"use client";

import { Eraser, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** Set when a reply came from local fallback data instead of a live Gemini answer. */
  warning?: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function clearChat() {
    setMessages(starterMessages);
    setInput("");
    setSendError(null);
  }

  async function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const previousMessages = messages;
    const nextMessages = [...messages, { role: "user", content: trimmedMessage } as const];
    setMessages(nextMessages);
    setInput("");
    setSendError(null);
    setIsSending(true);
    let isStreamingReplyStarted = false;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      // Errors and local fallbacks come back as JSON; live answers stream as text.
      if (!response.ok || contentType.includes("application/json")) {
        // A body that fails to parse as JSON here is treated the same as "no
        // usable server response": the SyntaxError propagates to the outer
        // catch, which shows its own fixed copy rather than a raw parse error.
        const data = (await response.json()) as {
          reply?: string;
          error?: string;
          warning?: string;
        };

        if (!response.ok) {
          // Server-authored error text (a rate-limit wait time, a validation
          // message) is safe and useful — surface it directly instead of
          // throwing, which would discard it in favor of generic copy.
          if (response.status === 400) {
            // The rejected turn is the newly-added user message: drop it from
            // history and hand the text back so it can be edited, rather than
            // leaving a permanently-rejected message stuck in state. Only the
            // 400 path rolls the optimistic message back — other failures
            // (e.g. 429) leave it in place.
            setMessages(previousMessages);
            setInput(trimmedMessage);
          }

          setSendError(data.error ?? "Something went wrong.");
          return;
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content:
              data.reply ?? "I could not generate a response right now. Please try again.",
            warning: data.warning,
          },
        ]);

        return;
      }

      const reader = response.body?.getReader();

      if (!reader) {
        // Deliberately-worded, client-authored copy: show it as written
        // instead of routing it through throw/catch, which would replace it
        // with the catch block's generic message.
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content: "I could not read the response. Please try again.",
          },
        ]);

        return;
      }

      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        assistantText += decoder.decode(value, { stream: true });

        if (!isStreamingReplyStarted) {
          isStreamingReplyStarted = true;
          setIsStreamingReply(true);
          setMessages((currentMessages) => [
            ...currentMessages,
            { role: "assistant", content: assistantText },
          ]);
        } else {
          setMessages((currentMessages) => [
            ...currentMessages.slice(0, -1),
            { role: "assistant", content: assistantText },
          ]);
        }
      }
    } catch (error) {
      // Reserved for cases where no usable server response was obtained at
      // all: a rejected fetch (e.g. offline — the literal "Failed to fetch"
      // must never reach the visitor), a body that failed to parse as JSON,
      // or any other unexpected failure while reading the stream. Everything
      // else (400s, other non-ok statuses, a missing stream reader) is
      // handled above with its own accurate, deliberately-worded copy. Log
      // the real cause for devtools and show fixed copy here.
      console.error(error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "I could not connect to the assistant right now. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
      setIsStreamingReply(false);
    }
  }

  return (
    <section className="flex h-[min(38rem,calc(100dvh-11rem))] flex-col overflow-hidden border border-foreground/35 bg-background shadow-[0_20px_60px_rgba(14,16,15,0.12)]">
      <div className="flex items-center justify-between border-b border-foreground/25 px-4 py-3 sm:px-5">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Portfolio Assistant
                </p>
                <p className="text-xs text-(--muted)">
                  Powered by Gemini
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={isSending}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-foreground/25 text-(--muted) transition-colors hover:bg-foreground/8 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Clear chat"
                >
                  <Eraser className="h-4 w-4" />
                </button>
              </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-foreground px-3 py-2 text-sm text-background"
                        : "rounded-2xl rounded-bl-sm bg-(--hover) px-3 py-2 text-sm text-foreground"
                    }
                  >
                    {message.content}
                  </div>
                  {message.warning ? (
                    <p className="mt-1 px-1 text-xs text-(--muted)">{message.warning}</p>
                  ) : null}
                </div>
              ))}
              {isSending && !isStreamingReply ? (
                <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-(--hover) px-3 py-2 text-sm text-(--muted)">
                  Thinking...
                </div>
              ) : null}
              <div ref={messagesEndRef} />
          </div>

          <div className="space-y-3 border-t border-foreground/25 p-3 sm:p-4">
              {sendError ? (
                <p className="text-xs text-(--muted)" role="alert">
                  {sendError}
                </p>
              ) : null}

              {messages.length <= 2 ? (
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border border-foreground/25 px-3 py-1.5 text-left text-xs text-(--muted) transition-colors hover:bg-foreground/8 hover:text-foreground"
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
                  className="h-10 flex-1 rounded-full border border-foreground/25 bg-transparent px-4 text-sm text-foreground outline-none transition-colors placeholder:text-(--muted) focus:border-foreground"
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
    </section>
  );
}