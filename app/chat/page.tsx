"use client";

import { Bot, MessageCircle } from "lucide-react";

import MainBottomNav from "@/components/main-bottom-nav";

const prompts = [
  "What does Franze specialize in?",
  "Show me recent projects.",
  "What technologies does he use?",
];

export default function ChatPage() {
  const openAssistant = () => {
    window.dispatchEvent(new Event("portfolio:open-chat"));
  };

  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-4xl flex-col justify-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
          Portfolio assistant / live context
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl">
          ASK ABOUT THE WORK.
        </h1>
        <p className="mt-6 max-w-2xl border-l-2 border-foreground pl-4 text-lg leading-7 text-foreground/80">
          The assistant has the portfolio&apos;s projects, experience, stack, education, and availability ready to discuss.
        </p>
        <button
          type="button"
          onClick={openAssistant}
          className="mt-9 inline-flex h-14 w-fit items-center gap-3 bg-foreground px-5 text-sm font-bold uppercase tracking-[0.12em] text-background transition-colors hover:bg-foreground/80"
        >
          <Bot className="h-5 w-5" aria-hidden="true" />
          Open assistant
        </button>
        <div className="mt-10 flex flex-wrap gap-3">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={openAssistant}
              className="inline-flex items-center gap-2 border border-foreground/45 px-4 py-3 text-left text-sm transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}