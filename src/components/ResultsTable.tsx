import type { QueryResult } from "@/lib/sql-engine";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function ResultsTable({ result }: { result: QueryResult | null }) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Run a query to see results.
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <div className="font-medium text-destructive">Query error</div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-destructive/90">
              {result.error}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface/50 px-3 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {result.rowCount} {result.rowCount === 1 ? "row" : "rows"}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {result.ms}ms
        </span>
      </div>
      {result.columns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Statement executed successfully (no rows returned).
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-surface-elevated">
              <tr>
                <th className="border-b border-r border-border px-2 py-1.5 text-left font-mono text-xs text-muted-foreground">
                  #
                </th>
                {result.columns.map((c) => (
                  <th
                    key={c}
                    className="border-b border-r border-border px-3 py-1.5 text-left font-mono text-xs font-semibold"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="hover:bg-accent/40">
                  <td className="border-b border-r border-border/50 px-2 py-1 font-mono text-xs text-muted-foreground">
                    {i + 1}
                  </td>
                  {row.map((v, j) => (
                    <td
                      key={j}
                      className="border-b border-r border-border/50 px-3 py-1 font-mono text-xs"
                    >
                      {v === null ? (
                        <span className="italic text-muted-foreground/60">NULL</span>
                      ) : (
                        String(v)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
