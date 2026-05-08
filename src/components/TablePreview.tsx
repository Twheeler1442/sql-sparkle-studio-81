import { useEffect, useState } from "react";
import { runQuery } from "@/lib/sql-engine";
import { TABLES } from "@/lib/seed";
import { Table as TableIcon, Key, Link2, Loader2 } from "lucide-react";

export function TablePreview({ name, defaultOpen = false }: { name: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [rows, setRows] = useState<unknown[][] | null>(null);
  const [cols, setCols] = useState<string[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const meta = TABLES.find((t) => t.name === name);

  const load = async () => {
    if (rows) return;
    setLoading(true);
    const r = await runQuery(`SELECT * FROM ${name} LIMIT 5`);
    const c = await runQuery(`SELECT COUNT(*) AS n FROM ${name}`);
    if (r.ok) {
      setCols(r.columns);
      setRows(r.rows);
    }
    if (c.ok) setCount(Number(c.rows[0]?.[0] ?? 0));
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="rounded-md border border-border bg-surface/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-accent/40 transition rounded-t-md"
      >
        <TableIcon className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-mono text-xs font-medium">{name}</span>
        {count !== null && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {count} rows
          </span>
        )}
        {meta && (
          <span className="ml-1 truncate text-[11px] text-muted-foreground">
            {meta.description}
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-border p-2">
          {meta && (
            <div className="mb-2 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
              {meta.columns.map((c) => (
                <div key={c.name} className="flex items-start gap-1.5 text-[11px] font-mono">
                  {c.pk ? (
                    <Key className="mt-0.5 h-2.5 w-2.5 text-warning shrink-0" />
                  ) : c.fk ? (
                    <Link2 className="mt-0.5 h-2.5 w-2.5 text-primary shrink-0" />
                  ) : (
                    <span className="mt-0.5 inline-block w-2.5 shrink-0" />
                  )}
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-muted-foreground/60">{c.type.toLowerCase()}</span>
                  <span className="text-muted-foreground truncate">— {c.description}</span>
                </div>
              ))}
            </div>
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> loading sample…
            </div>
          ) : rows && rows.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-surface-elevated">
                    {cols.map((c) => (
                      <th key={c} className="border-b border-border px-2 py-1 text-left font-mono font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-accent/30">
                      {r.map((v, j) => (
                        <td key={j} className="border-b border-border/40 px-2 py-0.5 font-mono">
                          {v === null ? <span className="italic text-muted-foreground/60">NULL</span> : String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {count !== null && count > 5 && (
                <div className="mt-1 text-[10px] text-muted-foreground">showing 5 of {count} rows</div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
