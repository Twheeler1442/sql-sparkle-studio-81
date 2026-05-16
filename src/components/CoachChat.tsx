import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Loader2, Brain, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export function CoachChat({
  contextQuestion,
  contextSql,
  contextScratchpad,
}: {
  contextQuestion?: string;
  contextSql?: string;
  contextScratchpad?: string;
}) {
  const [mode, setMode] = useState<"socratic" | "direct">("socratic");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey — I'm your SQL coach. In **Socratic** mode I'll ask guiding questions to help you think it through. Flip to **Direct** if you want straight answers.\n\nTell me what you're working on, or paste a query.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sql-coach", {
        body: {
          mode: "chat",
          coachStyle: mode,
          question: text,
          contextQuestion,
          contextSql,
          contextScratchpad,
          history: messages.slice(-8),
        },
      });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Coach</span>
        </div>
        <div className="flex rounded-md border border-border bg-surface p-0.5">
          <button
            onClick={() => setMode("socratic")}
            title="Asks guiding questions"
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition ${
              mode === "socratic"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Brain className="h-3 w-3" /> Socratic
          </button>
          <button
            onClick={() => setMode("direct")}
            title="Gives direct answers"
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition ${
              mode === "direct"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-3 w-3" /> Direct
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-6 bg-primary/15 border border-primary/25"
                : "mr-6 bg-surface-elevated border border-border"
            }`}
          >
            <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-background/60 prose-pre:border prose-pre:border-border prose-code:text-primary">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="mr-6 flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>
      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={mode === "socratic" ? "Tell me what you're stuck on…" : "Ask anything…"}
            className="flex-1 rounded-md border border-border bg-input px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
