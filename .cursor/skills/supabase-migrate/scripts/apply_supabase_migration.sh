#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../../.." && pwd)"

mode="push"
sql_file=""
dry_run="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      mode="file"
      sql_file="${2:-}"
      shift 2
      ;;
    --dry-run)
      dry_run="true"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage:"
      echo "  $0 [--dry-run]"
      echo "  $0 --file <path/to/file.sql> [--dry-run]"
      exit 1
      ;;
  esac
done

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is not installed or not on PATH."
  exit 1
fi

cd "${repo_root}"

if [[ "${mode}" == "file" ]]; then
  if [[ -z "${sql_file}" ]]; then
    echo "--file requires a SQL file path."
    exit 1
  fi
  if [[ ! -f "${sql_file}" ]]; then
    echo "SQL file not found: ${sql_file}"
    exit 1
  fi
  cmd=(supabase db execute --file "${sql_file}")
else
  cmd=(supabase db push)
fi

echo "Repository: ${repo_root}"
echo "Command: ${cmd[*]}"

if [[ "${dry_run}" == "true" ]]; then
  echo "Dry run complete. No changes were applied."
  exit 0
fi

"${cmd[@]}"
