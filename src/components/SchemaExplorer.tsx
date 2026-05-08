import { useEffect, useState } from "react";
import { listTables } from "@/lib/sql-engine";
import { TABLES } from "@/lib/seed";
import { Database, Search } from "lucide-react";
import { TablePreview } from "./TablePreview";

export function SchemaExplorer() {
  const [tables, setTables] = useState<string[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    listTables().then(setTables);
  }, []);

  const filtered = tables.filter((t) => {
    const meta = TABLES.find((x) => x.name === t);
    const hay = `${t} ${meta?.description ?? ""} ${meta?.columns.map((c) => c.name).join(" ") ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Database className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider">warehouse_db</span>
        <span className="ml-auto rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {tables.length} tables
        </span>
      </div>
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tables / columns…"
            className="w-full rounded border border-border bg-input pl-7 pr-2 py-1 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>
      <div className="flex-1 space-y-1.5 overflow-auto p-2">
        {filtered.map((t) => (
          <TablePreview key={t} name={t} />
        ))}
      </div>
    </div>
  );
}
