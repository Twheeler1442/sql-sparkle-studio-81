import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = `
TABLES (SQLite engine, but use Snowflake-compatible idioms when possible):
customers(customer_id PK, name, email, country, signup_date, segment)
products(product_id PK, name, category, price, cost)
orders(order_id PK, customer_id FK, order_date, status, total)
order_items(order_item_id PK, order_id FK, product_id FK, quantity, unit_price)
departments(department_id PK, name)
employees(employee_id PK, name, department_id FK, manager_id FK->employees, hire_date, salary)
web_events(event_id PK, customer_id, event_type, event_time, page)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, difficulty, topic, question, userSql, result, error } =
      await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "generate") {
      systemPrompt = `You are a senior data engineer designing SQL practice problems. Use this schema:
${SCHEMA}

Generate ONE practice problem. Return ONLY valid JSON in this exact shape:
{
  "title": "short descriptive title",
  "difficulty": "easy|medium|hard|expert",
  "topic": "joins|aggregation|window|cte|subquery|transformation|etc",
  "prompt": "The full problem statement in markdown. Be specific about what columns/order to return.",
  "hints": ["hint1","hint2"],
  "expected_columns": ["col1","col2"],
  "solution_sql": "A reference solution that runs on SQLite"
}

Difficulty guide:
- easy: simple SELECT/WHERE/ORDER BY/basic aggregation
- medium: JOINs across 2-3 tables, GROUP BY, HAVING
- hard: window functions, CTEs, self-joins, correlated subqueries
- expert: multi-CTE transformations, recursive CTEs, complex business logic, sessionization, cohort analysis`;
      userPrompt = `Generate a ${difficulty || "medium"} difficulty problem${
        topic ? ` focused on ${topic}` : ""
      }. Make it realistic and interesting.`;
    } else if (mode === "critique") {
      systemPrompt = `You are an expert SQL reviewer. Schema:
${SCHEMA}

Review the user's SQL submission. Be concise but insightful. Cover:
1. Correctness — does it answer the question? Was the result right?
2. Style — formatting, naming, readability
3. Performance — would it scale? Better approaches?
4. Snowflake-isms — mention QUALIFY, LATERAL FLATTEN, or other Snowflake-native features that would apply
Use markdown. Keep under 250 words.`;
      userPrompt = `Question:\n${question}\n\nUser's SQL:\n\`\`\`sql\n${userSql}\n\`\`\`\n\nExecution result: ${
        error ? `ERROR: ${error}` : `Returned ${result?.rowCount ?? 0} rows in ${result?.ms ?? 0}ms`
      }${
        result?.columns?.length
          ? `\nColumns: ${result.columns.join(", ")}\nFirst rows: ${JSON.stringify(
              result.rows?.slice(0, 5),
            )}`
          : ""
      }`;
    } else if (mode === "chat") {
      systemPrompt = `You are a SQL tutor inside a practice app. Schema:\n${SCHEMA}\nAnswer questions about SQL, the schema, or help debug. Be concise and use markdown code blocks for SQL.`;
      userPrompt = question;
    } else {
      throw new Error("Invalid mode");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...(mode === "generate"
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429)
        return new Response(
          JSON.stringify({ error: "Rate limit hit. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      if (response.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable Cloud." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      throw new Error(`AI gateway: ${response.status} ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    if (mode === "generate") {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sql-coach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
