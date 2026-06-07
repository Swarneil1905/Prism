"""
Comprehensive demo seed — runs automatically on startup.
Seeds:
  - demo.db          (SQLite: 500 customers, 10 products, 5000 orders)
  - PostgreSQL traces (50 realistic LLM traces with spans)
  - PostgreSQL evals  (eval verdict for each trace)
  - PostgreSQL prompts (2 versions of nl2sql-system prompt)

Idempotent: skips if data already exists.
"""
import asyncio
import random
import uuid
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# ── SQLite demo.db ─────────────────────────────────────────────────────────
DEMO_DB = Path(__file__).parent / "demo.db"

PRODUCTS = [
    ("Wireless Headphones", "Electronics",  79.99),
    ("Running Shoes",        "Sports",       59.99),
    ("Python Cookbook",      "Books",        39.99),
    ("Desk Lamp",            "Home",         24.99),
    ("T-Shirt",              "Clothing",     14.99),
    ("USB-C Hub",            "Electronics",  34.99),
    ("Yoga Mat",             "Sports",       29.99),
    ("Coffee Maker",         "Home",         49.99),
    ("Jeans",                "Clothing",     44.99),
    ("Novel: The Brief",     "Books",        12.99),
]


def seed_sqlite():
    """Create and populate demo.db if it doesn't already exist."""
    if DEMO_DB.exists():
        # Check if already seeded
        conn = sqlite3.connect(str(DEMO_DB))
        cur = conn.cursor()
        try:
            cur.execute("SELECT COUNT(*) FROM orders")
            count = cur.fetchone()[0]
            conn.close()
            if count > 0:
                print(f"[seed] demo.db already seeded ({count} orders) — skipping")
                return
        except Exception:
            conn.close()

    conn = sqlite3.connect(str(DEMO_DB))
    cur = conn.cursor()

    cur.executescript("""
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS customers;

        CREATE TABLE customers (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL,
            acquired_at TEXT NOT NULL,
            churn_date  TEXT
        );
        CREATE TABLE products (
            id       TEXT PRIMARY KEY,
            name     TEXT NOT NULL,
            category TEXT NOT NULL,
            price    REAL NOT NULL
        );
        CREATE TABLE orders (
            order_id    TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            product_id  TEXT NOT NULL,
            amount      REAL NOT NULL,
            created_at  TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (product_id)  REFERENCES products(id)
        );
    """)

    product_ids = []
    for name, cat, price in PRODUCTS:
        pid = str(uuid.uuid4())
        product_ids.append(pid)
        cur.execute("INSERT INTO products VALUES (?,?,?,?)", (pid, name, cat, price))

    first_names = ["Alice","Bob","Carol","David","Eve","Frank","Grace","Hank","Iris","Jack",
                   "Karen","Leo","Maya","Nate","Olivia","Paul","Quinn","Rose","Sam","Tina"]
    last_names  = ["Smith","Jones","Brown","Wilson","Davis","Taylor","Clark","Lewis","Young","Hall",
                   "King","Scott","Green","Baker","Adams","Nelson","Carter","Mitchell","Roberts","Turner"]
    customer_ids = []
    base = datetime(2023, 1, 1)
    for i in range(500):
        cid   = str(uuid.uuid4())
        customer_ids.append(cid)
        name  = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"user{i}@example.com"
        acq   = (base + timedelta(days=random.randint(0, 500))).isoformat()
        churn = None if random.random() > 0.2 else (base + timedelta(days=random.randint(300, 700))).isoformat()
        cur.execute("INSERT INTO customers VALUES (?,?,?,?,?)", (cid, name, email, acq, churn))

    for _ in range(5000):
        oid     = str(uuid.uuid4())
        cid     = random.choice(customer_ids)
        idx     = random.randint(0, len(product_ids) - 1)
        pid     = product_ids[idx]
        amount  = PRODUCTS[idx][2] * random.uniform(0.9, 1.1)
        created = (base + timedelta(days=random.randint(0, 700), hours=random.randint(0, 23))).isoformat()
        cur.execute("INSERT INTO orders VALUES (?,?,?,?,?)", (oid, cid, pid, round(amount, 2), created))

    conn.commit()
    conn.close()
    print("[seed] demo.db seeded — 500 customers, 5000 orders, 10 products")


# ── PostgreSQL traces/evals/prompts ────────────────────────────────────────
SAMPLE_QUERIES = [
    ("What are the top 5 products by revenue?",                        "The top 5 products by revenue are: Wireless Headphones ($42,180), Running Shoes ($31,200), Coffee Maker ($28,900), USB-C Hub ($19,400), Jeans ($17,600)."),
    ("How many orders were placed in Q1 2024?",                        "1,247 orders were placed in Q1 2024, representing a 12% increase over Q1 2023."),
    ("Show me average order value by product category",                "Electronics: $57.49 · Sports: $44.99 · Home: $37.49 · Books: $26.49 · Clothing: $29.99"),
    ("Which customers have churned in the last 90 days?",             "23 customers churned in the last 90 days, with a combined lifetime value of $14,230."),
    ("What is the month-over-month revenue growth rate?",             "Revenue grew 8.3% MoM in the most recent period, up from 5.1% the prior month."),
    ("List orders above $100 placed this week",                       "Found 47 orders above $100 this week, totalling $6,821 in revenue."),
    ("How many unique customers made a repeat purchase?",             "312 customers (62.4%) made at least one repeat purchase."),
    ("What is the average time between first and second order?",      "The average time between a customer's first and second order is 23.4 days."),
    ("Which product category has the highest return rate?",           "Electronics has the highest return rate at 4.2%, followed by Clothing at 3.1%."),
    ("Show revenue by country for the last 30 days",                  "US: $18,400 · UK: $6,200 · Canada: $4,100 · Australia: $2,800 · Germany: $1,900"),
    ("What percentage of customers spend more than $200?",            "18.4% of customers have a lifetime spend exceeding $200."),
    ("Find the best-performing day of the week for sales",            "Saturday generates the highest sales volume at $8,240 avg per week, followed by Friday at $7,890."),
    ("How many products have never been ordered?",                    "0 products have zero orders. All 10 products have been purchased at least once."),
    ("What is the median order value across all time?",               "The median order value is $34.99, while the mean is $41.23."),
    ("Show customer acquisition trend by month",                      "Acquisition peaked in March 2023 (89 customers) and trended down to 42/month by December."),
]

MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "gpt-4o-mini", "gpt-4o"]

WORKFLOWS = ["nl2sql-pipeline", "customer-support-bot", "report-generator", "data-analyst-agent"]

NL2SQL_PROMPT_V1 = """You are a SQL expert. Given a database schema and a natural language question, return ONLY valid SQL.

Rules:
- No explanation, no markdown fencing, no comments
- Use standard SQL that works with SQLite
- Always include appropriate JOINs when referencing multiple tables
- Use aliases for readability"""

NL2SQL_PROMPT_V2 = """You are an expert SQL engineer specializing in analytical queries.

Given a database schema and a user question, return ONLY the SQL query — nothing else.

Guidelines:
- Write clean, readable SQL with meaningful aliases
- Prefer CTEs over nested subqueries for complex logic
- Always handle NULL values appropriately
- Use SQLite-compatible syntax (no PIVOT, use CASE WHEN instead)
- For aggregations, always include appropriate GROUP BY clauses
- Limit results to 100 rows maximum unless the user specifies otherwise"""


async def seed_postgres():
    """Seed traces, evals, and prompts into PostgreSQL. Idempotent."""
    try:
        import sqlalchemy as sa
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker

        from app.core.db_url import resolve_database_url

        database_url = resolve_database_url()

        engine = create_async_engine(database_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            # Check if already seeded
            result = await session.execute(sa.text("SELECT COUNT(*) FROM traces"))
            count = result.scalar()
            if count and count > 10:
                print(f"[seed] PostgreSQL already has {count} traces — skipping")
                await engine.dispose()
                return

            now = datetime.utcnow()

            # ── Seed prompts ───────────────────────────────────────────────
            pv1_id = str(uuid.uuid4())
            pv2_id = str(uuid.uuid4())
            await session.execute(sa.text("""
                INSERT INTO prompt_versions (id, name, version, content, created_at)
                VALUES (:id, :name, :version, :content, :created_at)
                ON CONFLICT DO NOTHING
            """), {
                "id": pv1_id, "name": "nl2sql-system", "version": 1,
                "content": NL2SQL_PROMPT_V1,
                "created_at": now - timedelta(days=14),
            })
            await session.execute(sa.text("""
                INSERT INTO prompt_versions (id, name, version, content, created_at)
                VALUES (:id, :name, :version, :content, :created_at)
                ON CONFLICT DO NOTHING
            """), {
                "id": pv2_id, "name": "nl2sql-system", "version": 2,
                "content": NL2SQL_PROMPT_V2,
                "created_at": now - timedelta(days=3),
            })
            print("[seed] prompt versions seeded")

            # ── Seed traces + spans + evals ───────────────────────────────
            trace_ids = []
            for i, (question, answer) in enumerate(SAMPLE_QUERIES * 3):  # 45 traces
                days_ago   = random.uniform(0, 30)
                started_at = now - timedelta(days=days_ago)
                model      = random.choice(MODELS)
                workflow   = random.choice(WORKFLOWS)

                # Realistic token counts
                input_tok  = random.randint(120, 800)
                output_tok = random.randint(40, 300)

                # Cost table (per-token)
                cost_map = {
                    "claude-haiku-4-5-20251001": (0.0000008, 0.000004),
                    "claude-sonnet-4-6":         (0.000003,  0.000015),
                    "gpt-4o-mini":               (0.00000015, 0.0000006),
                    "gpt-4o":                    (0.000005,   0.000015),
                }
                in_rate, out_rate = cost_map.get(model, (0.000001, 0.000005))
                span_cost    = round(input_tok * in_rate + output_tok * out_rate, 6)
                span_latency = random.randint(400, 3200)
                total_latency = span_latency + random.randint(20, 120)  # + overhead

                # Occasionally make a trace fail
                status = "error" if random.random() < 0.12 else "ok"
                output = answer if status == "ok" else "Error: rate limit exceeded — please retry"

                trace_id = str(uuid.uuid4())
                trace_ids.append((trace_id, status))

                await session.execute(sa.text("""
                    INSERT INTO traces
                        (id, workflow_id, name, input, output, status,
                         started_at, ended_at, total_cost, total_latency)
                    VALUES
                        (:id, :wf_id, :name, :input, :output, :status,
                         :started_at, :ended_at, :total_cost, :total_latency)
                    ON CONFLICT DO NOTHING
                """), {
                    "id":            trace_id,
                    "wf_id":         str(uuid.uuid4()),
                    "name":          workflow,
                    "input":         question,
                    "output":        output,
                    "status":        status,
                    "started_at":    started_at,
                    "ended_at":      started_at + timedelta(milliseconds=total_latency),
                    "total_cost":    span_cost,
                    "total_latency": total_latency,
                })

                # One LLM span per trace
                await session.execute(sa.text("""
                    INSERT INTO spans
                        (id, trace_id, name, model, prompt, response,
                         input_tokens, output_tokens, cost_usd, latency_ms,
                         started_at, span_type)
                    VALUES
                        (:id, :trace_id, :name, :model, :prompt, :response,
                         :input_tokens, :output_tokens, :cost_usd, :latency_ms,
                         :started_at, :span_type)
                    ON CONFLICT DO NOTHING
                """), {
                    "id":           str(uuid.uuid4()),
                    "trace_id":     trace_id,
                    "name":         "llm.generate",
                    "model":        model,
                    "prompt":       question,
                    "response":     output,
                    "input_tokens": input_tok,
                    "output_tokens": output_tok,
                    "cost_usd":     span_cost,
                    "latency_ms":   span_latency,
                    "started_at":   started_at,
                    "span_type":    "llm",
                })

                # Add a retrieval span for nl2sql workflow
                if workflow == "nl2sql-pipeline":
                    await session.execute(sa.text("""
                        INSERT INTO spans
                            (id, trace_id, name, model, prompt, response,
                             input_tokens, output_tokens, cost_usd, latency_ms,
                             started_at, span_type)
                        VALUES
                            (:id, :trace_id, :name, :model, :prompt, :response,
                             :input_tokens, :output_tokens, :cost_usd, :latency_ms,
                             :started_at, :span_type)
                        ON CONFLICT DO NOTHING
                    """), {
                        "id":           str(uuid.uuid4()),
                        "trace_id":     trace_id,
                        "name":         "db.introspect",
                        "model":        None,
                        "prompt":       None,
                        "response":     None,
                        "input_tokens": None,
                        "output_tokens": None,
                        "cost_usd":     None,
                        "latency_ms":   random.randint(8, 40),
                        "started_at":   started_at,
                        "span_type":    "retrieval",
                    })

            # ── Seed evals for each trace ──────────────────────────────────
            for trace_id, trace_status in trace_ids:
                # Errors usually fail evals; ok traces mostly pass
                if trace_status == "error":
                    verdict = "fail"
                    score   = round(random.uniform(0.1, 0.45), 2)
                    reason  = random.choice([
                        "Response indicates an error occurred rather than answering the question.",
                        "No SQL was generated; the trace returned an error state.",
                        "Rate limit error — question was not answered.",
                    ])
                else:
                    # ~85% pass rate for successful traces
                    passing  = random.random() < 0.85
                    verdict  = "pass" if passing else "fail"
                    score    = round(random.uniform(0.75, 0.98) if passing else random.uniform(0.3, 0.65), 2)
                    reason   = random.choice([
                        "The response directly answers the question with accurate data and clear formatting.",
                        "SQL query is correct and the result set answers the user's question completely.",
                        "Answer is factually accurate, well-structured, and addresses all parts of the question.",
                        "Response is partially correct but missing some breakdown detail the user asked for.",
                        "The query ran successfully but the output format could be improved.",
                    ]) if passing else random.choice([
                        "The response does not fully address the question — key metrics are missing.",
                        "The SQL generated incorrect results due to a join condition error.",
                        "Answer is vague and does not provide the specific numbers requested.",
                    ])

                await session.execute(sa.text("""
                    INSERT INTO evals
                        (id, trace_id, verdict, score, reasoning,
                         eval_type, judge_model, created_at)
                    VALUES
                        (:id, :trace_id, :verdict, :score, :reasoning,
                         :eval_type, :judge_model, :created_at)
                    ON CONFLICT DO NOTHING
                """), {
                    "id":          str(uuid.uuid4()),
                    "trace_id":    trace_id,
                    "verdict":     verdict,
                    "score":       score,
                    "reasoning":   reason,
                    "eval_type":   "auto",
                    "judge_model": "claude-haiku-4-5-20251001",
                    "created_at":  datetime.utcnow(),
                })

            # ── Seed prompt_version_stats for both versions ────────────────
            # prompt_version_id IS the primary key in this table
            await session.execute(sa.text("""
                INSERT INTO prompt_version_stats
                    (prompt_version_id, trace_count, pass_count, fail_count,
                     avg_cost, avg_latency_ms, updated_at)
                VALUES
                    (:pv_id, :tc, :pc, :fc, :ac, :al, :ua)
                ON CONFLICT (prompt_version_id) DO NOTHING
            """), {
                "pv_id": pv1_id,
                "tc": 28, "pc": 21, "fc": 7,
                "ac": 0.00042, "al": 1240,
                "ua": now - timedelta(days=5),
            })
            await session.execute(sa.text("""
                INSERT INTO prompt_version_stats
                    (prompt_version_id, trace_count, pass_count, fail_count,
                     avg_cost, avg_latency_ms, updated_at)
                VALUES
                    (:pv_id, :tc, :pc, :fc, :ac, :al, :ua)
                ON CONFLICT (prompt_version_id) DO NOTHING
            """), {
                "pv_id": pv2_id,
                "tc": 17, "pc": 15, "fc": 2,
                "ac": 0.00039, "al": 1080,
                "ua": now - timedelta(days=1),
            })

            await session.commit()
            print(f"[seed] PostgreSQL seeded — {len(trace_ids)} traces, {len(trace_ids)} evals, 2 prompt versions")

        await engine.dispose()

    except Exception as e:
        print(f"[seed] PostgreSQL seed error (non-fatal): {e}")


def run():
    seed_sqlite()
    asyncio.run(seed_postgres())


if __name__ == "__main__":
    run()
