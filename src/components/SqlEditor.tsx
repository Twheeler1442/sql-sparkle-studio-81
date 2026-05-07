import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

export function SqlEditor({
  value,
  onChange,
  onRun,
  height = "100%",
}: {
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
  height?: string;
}) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height={height}
      theme={oneDark}
      extensions={[
        sql({ dialect: SQLite, upperCaseKeywords: true }),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { fontSize: "13px", height: "100%", background: "transparent" },
          ".cm-scroller": { fontFamily: "var(--font-mono)" },
          ".cm-gutters": { background: "transparent", border: "none" },
          "&.cm-focused": { outline: "none" },
        }),
      ]}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          onRun?.();
        }
      }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: true,
        bracketMatching: true,
      }}
    />
  );
}
