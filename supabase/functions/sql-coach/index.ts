import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = `
TABLES (SQLite engine, but use Snowflake-compatible idioms when possible):

customers(customer_id PK, name, email, country, city, signup_date, segment[Enterprise|SMB|Consumer], channel[organic|paid|referral|partner], lifetime_value)
products(product_id PK, name, category, subcategory, price, cost, supplier_id FK->suppliers, launched_on)
suppliers(supplier_id PK, name, country, rating)
inventory(product_id+warehouse PK, on_hand, reorder_point) -- warehouses: US-EAST|US-WEST|EU|APAC
orders(order_id PK, customer_id FK, order_date, status[completed|cancelled|refunded|pending], channel[web|mobile|partner], total, discount)
order_items(order_item_id PK, order_id FK, product_id FK, quantity, unit_price)
payments(payment_id PK, order_id FK, method[card|paypal|ach|gift], amount, paid_at)
refunds(refund_id PK, order_id FK, amount, reason, refunded_at)
reviews(review_id PK, product_id FK, customer_id FK, rating[1..5], body, created_at)
departments(department_id PK, name, cost_center)
employees(employee_id PK, name, email, department_id FK, manager_id FK->employees [self], title, hire_date, salary, is_active)
marketing_campaigns(campaign_id PK, name, channel[google|meta|email|tiktok|partner], start_date, end_date, spend)
campaign_attribution(attribution_id PK, customer_id FK, campaign_id FK, touched_at, position[first|mid|last])
subscriptions(subscription_id PK, customer_id FK, plan[Free|Pro|Team|Enterprise], mrr, started_on, cancelled_on NULL=active)
web_events(event_id PK, customer_id, session_id, event_type[page_view|add_to_cart|checkout|purchase|signup|login], event_time, page, device[desktop|mobile|tablet])

Approx row counts: customers~30, products~20, suppliers 5, orders 60, order_items ~93, payments ~57, refunds 3, reviews ~23, employees 20, departments 5, campaigns 5, attribution ~16, subscriptions 25, web_events 30.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      mode,
      difficulty,
      topic,
      question,
      userSql,
      result,
      error,
      customScenario,
      coachStyle,
      contextQuestion,
      contextSql,
      contextScratchpad,
      history,
    } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";
    let model = "google/gemini-2.5-flash";

    if (mode === "generate") {
      systemPrompt = `You are a senior data engineer designing SQL practice problems for an interactive trainer.
Schema:
${SCHEMA}

Generate ONE practice problem. Return ONLY valid JSON in this exact shape:
{
  "title": "short descriptive title (max 60 chars)",
  "difficulty": "easy|medium|hard|expert",
  "topic": "joins|aggregation|window|cte|subquery|transformation|recursive|cohort|sessionization|attribution",
  "scenario": "1-2 sentence business framing — WHY this analysis matters.",
  "prompt": "Full problem statement in markdown. Be VERY specific: required columns (in order), filters, sort order, ties, NULL handling, formatting (e.g. 'round to 2dp', 'as YYYY-MM'). Use bullet points.",
  "relevant_tables": ["tables","needed"],
  "hints": ["progressive hint 1","progressive hint 2","progressive hint 3"],
  "expected_columns": ["col1","col2"],
  "expected_row_count": 10,
  "solution_sql": "A reference solution that runs on SQLite. Well-formatted, commented."
}

Difficulty guide:
- easy: simple SELECT/WHERE/ORDER BY/LIMIT/basic aggregation, single table
- medium: 2-3 table JOINs, GROUP BY + HAVING, CASE expressions, basic date functions
- hard: window functions (ROW_NUMBER, RANK, LAG/LEAD, running totals), multi-CTE, self-joins, correlated subqueries, percentiles
- expert: long multi-CTE transformations, recursive CTEs (org tree, date spine), sessionization with gap detection, cohort retention matrix, multi-touch attribution, funnel conversion, MRR movement (new/expansion/churn), period-over-period with windowing

Be creative and realistic. Vary the topic and tables across calls. The "prompt" should read like a real analyst ticket.`;
      userPrompt = `Generate a ${difficulty || "medium"} difficulty problem${
        topic && topic !== "any" ? ` focused on ${topic}` : ""
      }.${
        customScenario
          ? `\n\nUSER-REQUESTED SCENARIO (must drive the problem — invent realistic specifics, edge cases, and ambiguity-resolving constraints around this idea; pick whatever tables fit best, even multiple domains): "${customScenario}"`
          : " Pick interesting business angles (cohorts, attribution, funnels, churn, inventory health, retention, MRR movement, basket analysis, NPS-style, anomaly detection, A/B-style cuts, etc.) when difficulty allows."
      }`;
    } else if (mode === "critique") {
      systemPrompt = `You are an expert SQL reviewer / mentor. Schema:
${SCHEMA}

Review the user's SQL submission against the question. Be specific, cite line/column behavior. Use markdown with headings (## Correctness, ## Style, ## Performance, ## Snowflake idioms). Under 350 words. End with a one-line verdict like **Verdict: ✅ Correct** or **Verdict: ⚠️ Close** or **Verdict: ❌ Incorrect**.`;
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
      const socratic = coachStyle !== "direct";
      systemPrompt = socratic
        ? `You are a SQL coach using the SOCRATIC METHOD. Schema:
${SCHEMA}

RULES — follow strictly:
- Do NOT write full SQL solutions. Do NOT reveal the answer.
- Ask ONE focused guiding question at a time. Make the learner think.
- Typical opening probes: "Okay — what tables do you think we need?", "What's the grain of the final result — one row per what?", "What's the end shape you're aiming for?", "What would you filter first?", "Where could NULLs bite us?"
- If they're truly stuck after 2-3 exchanges, offer a small structural nudge (e.g. "Consider a CTE that first aggregates X per Y") — never the full query.
- Keep replies short (2-4 sentences). Use markdown. Tiny SQL fragments are OK as illustration, never the whole answer.
- Validate good thinking before redirecting. Be warm and patient.`
        : `You are a SQL tutor. Schema:
${SCHEMA}
Give direct, accurate answers with worked SQL examples. Use markdown and code blocks.`;
      const ctx = [
        contextQuestion ? `CURRENT PROBLEM:\n${contextQuestion}` : "",
        contextSql ? `LEARNER'S CURRENT SQL:\n\`\`\`sql\n${contextSql}\n\`\`\`` : "",
        contextScratchpad ? `LEARNER'S SCRATCHPAD NOTES:\n${contextScratchpad}` : "",
        Array.isArray(history) && history.length
          ? `RECENT CONVERSATION:\n${history.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n")}`
          : "",
        `LEARNER ASKS: ${question}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      userPrompt = ctx;
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
          model,
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
