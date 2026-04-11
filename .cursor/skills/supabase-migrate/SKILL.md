---
name: supabase-migrate
description: Apply Supabase schema updates for Intern-Dashboard. Use when the user asks to run migrations, sync schema changes, apply `supabase/migration.sql`, push SQL changes, or says `sb-migrate`.
---

# Supabase Migrate

Use this skill to apply database changes in `Intern-Dashboard` without manual directory changes.

## Trigger and Authorization

If the user message includes `sb-migrate`, treat that phrase as explicit authorization to execute immediately.

If `sb-migrate` is not present, require explicit approval before execution.

## Approval Gate (fallback)

Before running any migration command:

1. Summarize what will run (command + target).
2. Ask for explicit approval in the same turn.
3. Only execute after the user confirms.

If approval is not clear, do not run commands.

## Commands

Run from repo root via:

```bash
bash .cursor/skills/supabase-migrate/scripts/apply_supabase_migration.sh [options]
```

Modes:

- Default (`no args`): applies timestamped migrations using `supabase db push`.
- `--file <path>`: executes one SQL file with `supabase db execute --file`.
- `--dry-run`: prints the resolved command only.

## Recommended Workflow

1. Confirm which schema source changed:
   - `supabase/migrations/*.sql` -> default mode (`supabase db push`)
   - single ad-hoc SQL file (for example `supabase/migration.sql`) -> `--file`
2. If `sb-migrate` is absent, ask for approval.
3. Post status updates:
   - "sb-migrate started: running <command>"
   - "sb-migrate in progress: applying migration"
   - "sb-migrate completed" (or "failed" with error summary)
4. Run the script.
5. Share command output and result status.

## Notes

- The script auto-targets the repository root, so no manual `cd` is needed.
- If Supabase CLI is missing, instruct user to install or open the project environment where it exists.
- If linking/auth is required, surface the exact CLI error and ask before running any corrective commands.
