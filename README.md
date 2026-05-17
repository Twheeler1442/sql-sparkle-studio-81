# SQL Sparkle Studio 81

SQL Sparkle Studio 81 is a starter workspace for building, organizing, and documenting SQL-based data work. Use it as a clean home for SQL scripts, query experiments, schema notes, analytics workflows, and database learning material.

## Overview

This repository is currently set up as a lightweight SQL project scaffold. It can be expanded into a full analytics workspace with organized folders for raw queries, cleaned transformations, documentation, and example outputs.

## Suggested Project Structure

```text
sql-sparkle-studio-81/
├── README.md
├── queries/
│   ├── exploratory/
│   ├── reporting/
│   └── transformations/
├── schemas/
├── docs/
├── sample_data/
└── outputs/
```

### Folder Purpose

| Folder | Purpose |
|---|---|
| `queries/exploratory/` | One-off analysis, testing, joins, filters, and experiments. |
| `queries/reporting/` | Reusable reporting queries and business-facing SQL. |
| `queries/transformations/` | SQL used to clean, reshape, or model source data. |
| `schemas/` | Table definitions, ERD notes, database diagrams, and column dictionaries. |
| `docs/` | Project notes, setup instructions, assumptions, and methodology. |
| `sample_data/` | Small mock or sample datasets only. Avoid committing sensitive data. |
| `outputs/` | Exported CSVs, query results, screenshots, or analysis artifacts. |

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Twheeler1442/sql-sparkle-studio-81.git
cd sql-sparkle-studio-81
```

Create the recommended folders:

```bash
mkdir -p queries/exploratory queries/reporting queries/transformations schemas docs sample_data outputs
```

Add your first SQL file:

```bash
touch queries/exploratory/first_query.sql
```

## SQL Style Guidelines

A consistent style makes the project easier to read, debug, and reuse.

- Use clear, descriptive file names such as `customer_retention_summary.sql`.
- Use uppercase SQL keywords: `SELECT`, `FROM`, `WHERE`, `GROUP BY`.
- Use lowercase or snake_case table and column aliases.
- Keep joins explicit and readable.
- Add comments when logic is not obvious.
- Prefer common table expressions when a query has multiple transformation steps.

Example:

```sql
WITH customer_orders AS (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(order_total) AS lifetime_value
    FROM orders
    GROUP BY customer_id
)

SELECT
    customer_id,
    order_count,
    lifetime_value
FROM customer_orders
WHERE lifetime_value > 1000
ORDER BY lifetime_value DESC;
```

## Documentation Checklist

For each important query, document:

- The purpose of the query.
- Source tables used.
- Key joins and filters.
- Assumptions or known limitations.
- Expected output columns.
- Date last updated.

## Data Safety

Do not commit private, production, customer, medical, financial, or credentialed data to this repository.

Recommended exclusions for `.gitignore`:

```gitignore
.env
*.db
*.sqlite
*.sqlite3
*.csv
*.xlsx
outputs/
sample_data/private/
```

## Roadmap

Potential next steps:

- Add a `.gitignore` file.
- Add sample SQL queries.
- Add schema documentation.
- Add a query naming convention.
- Add example datasets or mock data.
- Add setup notes for the database engine being used.

## License

No license has been added yet. Add a license before sharing or distributing this project publicly.
