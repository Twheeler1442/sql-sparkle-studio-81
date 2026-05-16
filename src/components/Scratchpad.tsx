import { useEffect, useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";

const KEY = "snowql.scratchpad";
const TEMPLATE = `-- ✏️ SCRATCHPAD —  plan before you code
-- Use this like a sticky note. Nothing here runs.

GOAL:
  • What is the final shape of the output?
  • Columns:
  • Grain (one row per ___):
  • Sort:

TABLES & JOINS:
  • 
  • 

FILTERS:
  • 

TRANSFORMS / WINDOWS / CTES:
  1.
  2.

EDGE CASES:
  • NULLs?
  • Ties?
  • Empty groups?
`;

export function Scratchpad() {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    setText(saved ?? TEMPLATE);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, text);
  }, [text, loaded]);

  return (
    <div className="flex h-full flex-col bg-warning/5">
      <div className="flex items-center justify-between border-b border-border bg-surface/60 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Scratchpad
          </span>
        </div>
        <button
          onClick={() => setText(TEMPLATE)}
          title="Reset to template"
          className="flex items-center gap-1 rounded border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <Trash2 className="h-3 w-3" /> Reset
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder="Sketch your approach here…"
        className="flex-1 w-full resize-none bg-transparent p-3 font-mono text-[12px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60"
      />
      <div className="border-t border-border bg-surface/40 px-3 py-1 text-[10px] text-muted-foreground">
        Auto-saved locally
      </div>
    </div>
  );
}
