import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Play,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  Loader2,
  Lightbulb,
  Database as DbIcon,
  Snowflake,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { SqlEditor } from "@/components/SqlEditor";
import { ResultsTable } from "@/components/ResultsTable";
import { CoachChat } from "@/components/CoachChat";
import { ensureDb, resetDb, runQuery, type QueryResult } from "@/lib/sql-engine";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: PracticePage,
  head: () => ({
    meta: [
      { title: "SnowQL — practice SQL like a real warehouse" },
      { name: "description", content: "Interactive SQL practice with AI-generated questions, instant execution, and expert critique. Snowflake-style." },
    ],
  }),
});

type Difficulty = "easy" | "medium" | "hard" | "expert";

type Question = {
  title: string;
  difficulty: Difficulty;
  topic: string;
  prompt: string;
  hints: string[];
  expected_columns: string[];
  solution_sql: string;
};

const TOPICS = [
  "any",
  "joins",
  "aggregation",
  "window functions",
  "CTEs",
  "subqueries",
  "transformations",
  "self-joins",
  "recursive CTE",
  "cohort analysis",
];

const DEFAULT_SQL = `-- Welcome to SnowQL. Press Cmd/Ctrl+Enter to run.
SELECT * FROM customers LIMIT 5;`;

function PracticePage() {
  const [ready, setReady] = useState(false);
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<"results" | "coach" | "critique">("results");

  const [question, setQuestion] = useState<Question | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [critique, setCritique] = useState<string>("");
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [topic, setTopic] = useState<string>("any");

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureDb().then(() => setReady(true));
  }, []);

  const run = async () => {
    if (!ready) return;
    setRunning(true);
    const r = await runQuery(sql);
    setResult(r);
    setRunning(false);
    setTab("results");
    if (r.ok) toast.success(`${r.rowCount} rows · ${r.ms}ms`);
    else toast.error("Query failed — see results panel");
  };

  const reset = async () => {
    await resetDb();
    toast.success("Database reset to seed state");
  };

  const generate = async () => {
    setGenLoading(true);
    setCritique("");
    setShowHints(false);
    setShowSolution(false);
    try {
      const { data, error } = await supabase.functions.invoke("sql-coach", {
        body: {
          mode: "generate",
          difficulty,
          topic: topic === "any" ? undefined : topic,
        },
      });
      if (error) throw error;
      setQuestion(data as Question);
      setSql(`-- ${data.title}\n-- Difficulty: ${data.difficulty} · Topic: ${data.topic}\n\n`);
      setTab("results");
      toast.success("New challenge generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenLoading(false);
    }
  };

  const critiqueQuery = async () => {
    if (!question) {
      toast.info("Generate a question first");
      return;
    }
    setCritiqueLoading(true);
    setTab("critique");
    try {
      const { data, error } = await supabase.functions.invoke("sql-coach", {
        body: {
          mode: "critique",
          question: question.prompt,
          userSql: sql,
          result: result?.ok ? result : undefined,
          error: result && !result.ok ? result.error : undefined,
        },
      });
      if (error) throw error;
      setCritique(data.content);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Critique failed");
    } finally {
      setCritiqueLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent-glow">
            <Snowflake className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">SnowQL</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
              SQL practice console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="rounded-md border border-border bg-input px-2 py-1 text-xs outline-none focus:border-primary"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-md border border-border bg-input px-2 py-1 text-xs outline-none focus:border-primary"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={genLoading}
            className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-primary to-accent-glow px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
          >
            {genLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            New challenge
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-accent transition"
            title="Reset database"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Body */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Schema sidebar */}
        <ResizablePanel defaultSize={16} minSize={10} maxSize={25}>
          <div className="h-full border-r border-border bg-surface/40">
            <SchemaExplorer />
          </div>
        </ResizablePanel>
        <ResizableHandle />

        {/* Center: prompt + editor + results */}
        <ResizablePanel defaultSize={56}>
          <ResizablePanelGroup orientation="vertical">
            {/* Question prompt */}
            <ResizablePanel defaultSize={28} minSize={12}>
              <div className="h-full overflow-auto border-b border-border bg-surface/30 p-4">
                {question ? (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {question.difficulty}
                      </span>
                      <span className="rounded bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {question.topic}
                      </span>
                      <h2 className="text-base font-semibold">{question.title}</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-primary">
                      <ReactMarkdown>{question.prompt}</ReactMarkdown>
                    </div>
                    {question.expected_columns?.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Expected columns:{" "}
                        <span className="font-mono text-foreground">
                          {question.expected_columns.join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowHints((s) => !s)}
                        className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-accent"
                      >
                        <Lightbulb className="h-3 w-3 text-warning" />
                        {showHints ? "Hide hints" : "Show hints"}
                        <ChevronDown className={`h-3 w-3 transition ${showHints ? "rotate-180" : ""}`} />
                      </button>
                      <button
                        onClick={() => setShowSolution((s) => !s)}
                        className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-accent"
                      >
                        {showSolution ? "Hide solution" : "Show solution"}
                      </button>
                    </div>
                    {showHints && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                        {question.hints.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                    {showSolution && (
                      <pre className="mt-2 overflow-auto rounded border border-border bg-background/60 p-2 font-mono text-xs">
                        {question.solution_sql}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <DbIcon className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    <h2 className="text-base font-semibold">Ready to practice?</h2>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Pick a difficulty and topic, then hit{" "}
                      <span className="text-primary font-medium">New challenge</span>.
                      Or just experiment in the editor — the warehouse is loaded with
                      customers, orders, products, employees and web events.
                    </p>
                  </div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Editor */}
            <ResizablePanel defaultSize={36} minSize={15}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border bg-surface/50 px-3 py-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Worksheet
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={critiqueQuery}
                      disabled={!question || critiqueLoading}
                      className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-50 transition"
                    >
                      <ClipboardCheck className="h-3 w-3" />
                      Critique
                    </button>
                    <button
                      onClick={run}
                      disabled={running || !ready}
                      className="flex items-center gap-1.5 rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                    >
                      {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                      Run
                      <kbd className="ml-1 rounded bg-primary-foreground/20 px-1 text-[9px]">⌘↵</kbd>
                    </button>
                  </div>
                </div>
                <div ref={editorRef} className="flex-1 overflow-hidden">
                  <SqlEditor value={sql} onChange={setSql} onRun={run} />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Results / critique */}
            <ResizablePanel defaultSize={36} minSize={15}>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-1 border-b border-border bg-surface/50 px-2">
                  {(["results", "critique"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-3 py-1.5 text-xs font-medium transition ${
                        tab === t
                          ? "border-b-2 border-primary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "results" ? "Results" : "AI Critique"}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-hidden">
                  {tab === "results" ? (
                    <ResultsTable result={result} />
                  ) : (
                    <div className="h-full overflow-auto p-4">
                      {critiqueLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Reviewing your query…
                        </div>
                      ) : critique ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-background/60 prose-pre:border prose-pre:border-border prose-code:text-primary">
                          <ReactMarkdown>{critique}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Run a query against a generated challenge, then click{" "}
                          <span className="text-foreground font-medium">Critique</span>{" "}
                          for AI feedback on correctness, style, and Snowflake idioms.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />

        {/* Right: AI coach */}
        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="h-full border-l border-border bg-surface/40">
            <CoachChat
              contextQuestion={question?.prompt}
              contextSql={sql}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
