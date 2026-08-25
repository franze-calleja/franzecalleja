"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, X, Loader2 } from "lucide-react";
import { retroAudio } from "./game-audio";
import { NPC, WorldObject } from "./game-data";

interface GameDialogueProps {
  npc?: NPC | null;
  worldObject?: WorldObject | null;
  onClose: () => void;
  onOpenModal?: (type: string) => void;
}

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const AZRA_PROMPT_SUGGESTIONS = [
  "What is Franze's core tech stack?",
  "Tell me about his enterprise projects at MSEUF-CI",
  "What DevOps and Observability tools does he use?",
  "How can I contact or hire Franze?",
];

export default function GameDialogue({
  npc,
  worldObject,
  onClose,
  onOpenModal,
}: GameDialogueProps) {
  const isAzra = npc?.interactionKey === "azra" || worldObject?.interactionKey === "azra";
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Gemini AI Chat State (for AZRA)
  const [chatMode, setChatMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine dialogues
  const dialogues = npc?.dialogue || (worldObject?.description ? [worldObject.description] : ["..."]);
  const currentDialogue = dialogues[dialogueIndex] || "";
  const title = npc?.nameTag || worldObject?.title || "Unknown";

  // Typewriter effect for story dialogue
  useEffect(() => {
    if (chatMode) return;
    setDisplayedText("");
    setIsTyping(true);

    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex < currentDialogue.length) {
        setDisplayedText(currentDialogue.slice(0, charIndex + 1));
        if (charIndex % 3 === 0) {
          retroAudio.playTextBlip();
        }
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [currentDialogue, dialogueIndex, chatMode]);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, streamingReply]);

  // Handle advancing dialogue
  const handleAdvance = () => {
    if (isTyping) {
      // Instant skip typewriter
      setDisplayedText(currentDialogue);
      setIsTyping(false);
      return;
    }

    if (dialogueIndex < dialogues.length - 1) {
      retroAudio.playInteract();
      setDialogueIndex((prev) => prev + 1);
    } else {
      if (isAzra && !chatMode) {
        setChatMode(true);
        retroAudio.playInteract();
      } else {
        retroAudio.playCancel();
        onClose();
        if (worldObject?.interactionKey && worldObject.interactionKey !== "general" && worldObject.interactionKey !== "azra") {
          onOpenModal?.(worldObject.interactionKey);
        }
      }
    }
  };

  // Keyboard navigation for dialogue advancing
  useEffect(() => {
    if (chatMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        e.stopPropagation();
        handleAdvance();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        retroAudio.playCancel();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatMode, isTyping, dialogueIndex, dialogues, currentDialogue, isAzra, onClose, onOpenModal, worldObject]);

  // Send message to Gemini API (/api/chat)
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoadingAi) return;

    retroAudio.playInteract();
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: textToSend }];
    setChatHistory(newHistory);
    setInputMessage("");
    setIsLoadingAi(true);
    setStreamingReply("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AZRA");
      }

      // Check if streaming plain text or JSON fallback
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        setChatHistory([...newHistory, { role: "model", content: data.reply || "I am AZRA. How can I assist you today?" }]);
      } else {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            setStreamingReply(accumulated);
            retroAudio.playTextBlip();
          }
        }
        setChatHistory([...newHistory, { role: "model", content: accumulated }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory([
        ...newHistory,
        {
          role: "model",
          content: "AZRA is offline or experiencing high traffic. You can still explore Franze's town to view all projects and skills!",
        },
      ]);
    } finally {
      setIsLoadingAi(false);
      setStreamingReply("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-3 z-40 flex justify-center px-2.5 sm:bottom-4 sm:px-4">
      <div
        className="relative w-full max-w-2xl rounded-lg border-4 border-foreground bg-background p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
        style={{
          boxShadow: "6px 6px 0px 0px rgba(0,0,0,0.8), inset 0 0 0 2px var(--surface)",
        }}
      >
        {/* Header Nameplate */}
        <div className="absolute -top-4 left-4 flex items-center gap-2 border-2 border-foreground bg-foreground px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-background shadow-md">
          {isAzra ? <Bot className="h-3.5 w-3.5 text-cyan-400" /> : <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
          <span>{title}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            retroAudio.playCancel();
            onClose();
          }}
          className="absolute -top-3 -right-2 flex h-7 w-7 items-center justify-center rounded border-2 border-foreground bg-red-600 font-bold text-white shadow hover:bg-red-700 active:translate-y-0.5"
          title="Close Dialogue (Esc)"
        >
          <X className="h-4 w-4" />
        </button>

        {!chatMode ? (
          /* Classic Dialogue Mode */
          <div className="cursor-pointer pt-2 select-none" onClick={handleAdvance}>
            <div className="flex items-start gap-4">
              {/* NPC Portrait Box */}
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded border-2 border-foreground bg-(--surface) p-1">
                {isAzra ? (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded bg-cyan-950 text-cyan-300">
                    <Bot className="h-7 w-7 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400">AI</span>
                  </div>
                ) : npc?.id === "npc-allia" ? (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded bg-pink-950 text-pink-300">
                    <Sparkles className="h-7 w-7 text-pink-400 animate-pulse" />
                    <span className="text-[8px] font-mono font-bold tracking-widest text-pink-300">DEV 💖</span>
                  </div>
                ) : npc?.id === "npc-dog" ? (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded bg-amber-950 text-amber-300">
                    <span className="text-2xl">🐶</span>
                    <span className="text-[8px] font-mono font-bold tracking-widest text-amber-400">KISSES</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded bg-amber-950 text-amber-300">
                    <User className="h-7 w-7" />
                  </div>
                )}
              </div>

              {/* Dialogue Text */}
              <div className="min-h-[72px] flex-1">
                <p className="font-mono text-sm leading-relaxed text-foreground sm:text-base">
                  {displayedText}
                </p>
                {/* Special Portfolio Button for Alliah Mikaela */}
                {npc?.id === "npc-allia" && (
                  <div className="mt-2.5 flex items-center justify-start">
                    <a
                      href="https://alliah-mikaela-revedezo.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        retroAudio.playInteract();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-pink-400 bg-pink-600 px-3 py-1 text-xs font-bold text-white shadow-md transition-all hover:bg-pink-500 hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>OPEN ALLIAH&apos;S PORTFOLIO ↗</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Prompt / Advance Indicator */}
            <div className="mt-3 flex items-center justify-between border-t border-foreground/20 pt-2 font-mono text-xs text-(--muted)">
              <span>
                {isAzra ? "Press Space or click to talk to AZRA" : "Press Space / Click to continue"}
              </span>
              <div className="flex items-center gap-1 font-bold text-foreground">
                <span>[Next]</span>
                <span className="animate-bounce">▼</span>
              </div>
            </div>
          </div>
        ) : (
          /* AZRA Real-Time Gemini AI Chat Mode */
          <div className="flex flex-col pt-1">
            <div className="flex items-center justify-between border-b border-foreground/20 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-xs font-bold text-foreground">
                  AZRA v2.1 // GEMINI REPL LINK ACTIVE
                </span>
              </div>
              <span className="font-mono text-[10px] text-(--muted)">
                Live Portfolio Knowledge
              </span>
            </div>

            {/* Chat History Messages */}
            <div
              ref={chatScrollRef}
              className="max-h-56 min-h-[140px] space-y-3 overflow-y-auto pr-1 font-mono text-xs sm:text-sm"
            >
              {chatHistory.length === 0 && !streamingReply && (
                <div className="rounded border border-foreground/20 bg-(--surface)/60 p-3 text-(--muted)">
                  <p className="text-foreground font-semibold mb-1">
                    Query Franze&apos;s AI Companion:
                  </p>
                  <p className="text-xs">
                    His full-stack projects, Docker telemetry setups, React/Next.js skills, career milestones, or background.
                  </p>
                </div>
              )}

              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 rounded p-2.5 ${
                    msg.role === "user"
                      ? "border border-foreground/30 bg-(--surface)/80"
                      : "border border-cyan-500/40 bg-cyan-950/20 text-cyan-900 dark:text-cyan-200"
                  }`}
                >
                  <span className="shrink-0 font-bold uppercase text-[11px] px-1.5 py-0.5 rounded bg-foreground text-background">
                    {msg.role === "user" ? "YOU" : "AZRA"}
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Streaming token bubble */}
              {streamingReply && (
                <div className="flex items-start gap-2.5 rounded border border-cyan-500/40 bg-cyan-950/20 p-2.5 text-cyan-900 dark:text-cyan-200">
                  <span className="shrink-0 font-bold uppercase text-[11px] px-1.5 py-0.5 rounded bg-foreground text-background">
                    AZRA
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {streamingReply}
                    <span className="inline-block h-3.5 w-1.5 ml-1 bg-cyan-400 animate-pulse" />
                  </div>
                </div>
              )}

              {isLoadingAi && !streamingReply && (
                <div className="flex items-center gap-2 text-xs text-(--muted) p-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />
                  <span>AZRA is consulting portfolio neural matrices...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            {chatHistory.length === 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {AZRA_PROMPT_SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded border border-foreground/30 bg-(--surface) px-2 py-1 font-mono text-[11px] text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-3 flex items-center gap-2 border-t border-foreground/20 pt-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask AZRA something..."
                  disabled={isLoadingAi}
                  className="w-full rounded border-2 border-foreground bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingAi || !inputMessage.trim()}
                className="inline-flex items-center gap-1.5 rounded border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
              >
                <span>SEND</span>
                <Send className="h-3 w-3" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
