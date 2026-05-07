import { useEffect, useState } from "react";
import { describeTable, listTables } from "@/lib/sql-engine";
import { Database, Table as TableIcon, Key, ChevronRight } from "lucide-react";

export function SchemaExplorer() {
  const [tables, setTables] = useState<string[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [cols, setCols] = useState<Record<string, { name: string; type: string; pk: number }[]>>({});

  useEffect(() => {
    listTables().then(setTables);
  }, []);

  const toggle = async (t: string) => {
    setOpen((o) => ({ ...o, [t]: !o[t] }));
    if (!cols[t]) {
      const c = await describeTable(t);
      setCols((p) => ({ ...p, [t]: c }));
    }
  };

  return (
    <div className="h-full overflow-auto p-3">
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        warehouse_db
      </div>
      <div className="mt-1 space-y-0.5">
        {tables.map((t) => (
          <div key={t}>
            <button
              onClick={() => toggle(t)}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform ${open[t] ? "rotate-90" : ""}`}
              />
              <TableIcon className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono">{t}</span>
            </button>
            {open[t] && cols[t] && (
              <div className="ml-7 mt-0.5 space-y-0.5 border-l border-border pl-2">
                {cols[t].map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono text-muted-foreground"
                  >
                    {c.pk ? <Key className="h-2.5 w-2.5 text-warning" /> : <span className="w-2.5" />}
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-muted-foreground/60">{c.type.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
