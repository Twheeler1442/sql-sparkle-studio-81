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
  Table2,
  BookOpen,
  MessageCircle,
  StickyNote,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { SchemaExplorer } from "@/components/SchemaExplorer";
import { SqlEditor } from "@/components/SqlEditor";
import { ResultsTable } from "@/components/ResultsTable";
import { CoachChat } from "@/components/CoachChat";
import { TablePreview } from "@/components/TablePreview";
import { Scratchpad } from "@/components/Scratchpad";
import { ensureDb, resetDb, runQuery, type QueryResult } from "@/lib/sql-engine";
import { TABLES } from "@/lib/seed";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  component: PracticePage,
  head: () => ({
    meta: [
      { title: "SnowQL — practice SQL like a real warehouse" },
      { name: "description", content: "Interactive SQL practice with AI-generated questions, instant execution, table previews, and expert critique. Snowflake-style." },
    ],
  }),
});

type Difficulty = "easy" | "medium" | "hard" | "expert";

type Question = {
  title: string;
  difficulty: Difficulty;
  topic: string;
  scenario?: string;
  prompt: string;
  hints: string[];
  expected_columns: string[];
  expected_row_count?: number;
  relevant_tables?: string[];
  solution_sql: string;
};

const TOPICS = [
  "any","joins","aggregation","window","cte","subquery",
  "transformation","recursive","cohort","sessionization","attribution",
];

const DEFAULT_SQL = `-- Welcome to SnowQL. Press Cmd/Ctrl+Enter to run.
-- Tip: tap any table on the left to see its columns and sample rows.
SELECT * FROM customers LIMIT 5;`;

function PracticePage() {
  const isMobile = useIsMobile();
  const [ready, setReady] = useState(false);
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);

  const [question, setQuestion] = useState<Question | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [critique, setCritique] = useState<string>("");
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [topic, setTopic] = useState<string>("any");

  // Mobile tabs
  const [mobileTab, setMobileTab] = useState<"problem" | "editor" | "results" | "schema" | "scratch" | "coach">("problem");
  // Desktop bottom tabs
  const [tab, setTab] = useState<"results" | "critique" | "scratch">("results");

  // Custom scenario modal
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [customScenario, setCustomScenario] = useState("");

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
    if (isMobile) setMobileTab("results");
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
      const q = data as Question;
      setQuestion(q);
      setSql(`-- ${q.title}\n-- Difficulty: ${q.difficulty} · Topic: ${q.topic}\n-- Tables: ${(q.relevant_tables ?? []).join(", ")}\n\n`);
      if (isMobile) setMobileTab("problem");
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
    if (isMobile) setMobileTab("results");
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

  // ---- Reusable panes -------------------------------------------------
  const ProblemPane = (
    <div className="h-full overflow-auto p-4">
      {question ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              question.difficulty === "easy" ? "bg-success/20 text-success" :
              question.difficulty === "medium" ? "bg-primary/20 text-primary" :
              question.difficulty === "hard" ? "bg-warning/20 text-warning" :
              "bg-destructive/20 text-destructive"
            }`}>
              {question.difficulty}
            </span>
            <span className="rounded bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {question.topic}
            </span>
            {question.expected_row_count != null && (
              <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
                ~{question.expected_row_count} rows
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold sm:text-lg">{question.title}</h2>
          {question.scenario && (
            <p className="text-xs italic text-muted-foreground sm:text-sm">{question.scenario}</p>
          )}
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-code:text-primary">
            <ReactMarkdown>{question.prompt}</ReactMarkdown>
          </div>
          {question.expected_columns?.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Expected columns: </span>
              <span className="font-mono text-foreground">{question.expected_columns.join(", ")}</span>
            </div>
          )}

          {/* Relevant tables — auto-shown with question */}
          {question.relevant_tables && question.relevant_tables.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Table2 className="h-3.5 w-3.5 text-primary" />
                Tables you'll need
              </div>
              <div className="space-y-1.5">
                {question.relevant_tables
                  .filter((t) => TABLES.some((x) => x.name === t))
                  .map((t, i) => (
                    <TablePreview key={t} name={t} defaultOpen={i === 0} />
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setShowHints((s) => !s)}
              className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-accent"
            >
              <Lightbulb className="h-3 w-3 text-warning" />
              {showHints ? "Hide hints" : `Hints (${question.hints?.length ?? 0})`}
              <ChevronDown className={`h-3 w-3 transition ${showHints ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => setShowSolution((s) => !s)}
              className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-accent"
            >
              {showSolution ? "Hide solution" : "Reveal solution"}
            </button>
          </div>
          {showHints && (
            <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
              {question.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ol>
          )}
          {showSolution && (
            <pre className="overflow-auto rounded border border-border bg-background/60 p-2 font-mono text-xs">
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
            The warehouse has {TABLES.length} tables — customers, orders, products, suppliers,
            inventory, payments, refunds, reviews, employees, campaigns, subscriptions, web events.
          </p>
          <div className="mt-4 grid w-full max-w-md gap-1.5">
            {TABLES.slice(0, 6).map((t) => (
              <TablePreview key={t.name} name={t.name} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const EditorPane = (
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
            <span className="hidden sm:inline">Critique</span>
          </button>
          <button
            onClick={run}
            disabled={running || !ready}
            className="flex items-center gap-1.5 rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            Run
            <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1 text-[9px] sm:inline">⌘↵</kbd>
          </button>
        </div>
      </div>
      <div ref={editorRef} className="flex-1 overflow-hidden">
        <SqlEditor value={sql} onChange={setSql} onRun={run} />
      </div>
    </div>
  );

  const ResultsPane = (
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
                for AI feedback on correctness, style, performance, and Snowflake idioms.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ---- Layout ---------------------------------------------------------
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/80 backdrop-blur px-3 py-2 sm:px-4">
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

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={generate}
            disabled={genLoading}
            className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-primary to-accent-glow px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
          >
            {genLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden xs:inline sm:inline">New challenge</span>
            <span className="xs:hidden sm:hidden">New</span>
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-xs hover:bg-accent transition"
            title="Reset database"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {isMobile ? (
        // ---- Mobile layout: tab switcher ---------------------------------
        <>
          <div className="flex-1 overflow-hidden">
            {mobileTab === "problem" && ProblemPane}
            {mobileTab === "editor" && EditorPane}
            {mobileTab === "results" && ResultsPane}
            {mobileTab === "schema" && <SchemaExplorer />}
            {mobileTab === "coach" && (
              <CoachChat contextQuestion={question?.prompt} contextSql={sql} />
            )}
          </div>
          <nav className="flex items-stretch border-t border-border bg-surface/80 backdrop-blur">
            {([
              ["problem", BookOpen, "Problem"],
              ["editor", Play, "Editor"],
              ["results", DbIcon, "Results"],
              ["schema", Table2, "Schema"],
              ["coach", MessageCircle, "Coach"],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition ${
                  mobileTab === key
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </>
      ) : (
        // ---- Desktop layout: resizable panels ----------------------------
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
            <div className="h-full border-r border-border bg-surface/40">
              <SchemaExplorer />
            </div>
          </ResizablePanel>
          <ResizableHandle />

          <ResizablePanel defaultSize={54}>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize={40} minSize={15}>
                <div className="h-full border-b border-border bg-surface/30">
                  {ProblemPane}
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={32} minSize={15}>
                {EditorPane}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={28} minSize={15}>
                {ResultsPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />

          <ResizablePanel defaultSize={28} minSize={18}>
            <div className="h-full border-l border-border bg-surface/40">
              <CoachChat
                contextQuestion={question?.prompt}
                contextSql={sql}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
