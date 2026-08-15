import ChatAssistant from "@/components/chat-assistant";
import MainBottomNav from "@/components/main-bottom-nav";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl items-center gap-10 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
        <section>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            Portfolio assistant / live context
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl">
            ASK ABOUT THE WORK.
          </h1>
          <p className="mt-6 border-l-2 border-foreground pl-4 text-lg leading-7 text-foreground/80">
            The assistant has the portfolio&apos;s projects, experience, stack, education, and availability ready to discuss.
          </p>
        </section>
        <div>
          <ChatAssistant />
        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}