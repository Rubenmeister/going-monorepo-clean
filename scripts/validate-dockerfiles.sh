#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

for dir in */; do
  dir="${dir%/}"
  dockerfile="${dir}/Dockerfile"
  [ -f "$dockerfile" ] || continue

  defaults=$(grep -oP 'ARG SERVICE_NAME=\K[^\s]+' "$dockerfile" 2>/dev/null || true)
  [ -z "$defaults" ] && continue

  for name in $defaults; do
    if [ "$name" != "$dir" ]; then
      echo "ERROR: ${dockerfile} has SERVICE_NAME=${name} but directory is ${dir}"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "Found $ERRORS SERVICE_NAME mismatch(es). Fix the Dockerfile ARG defaults."
  exit 1
fi

echo "All Dockerfiles have correct SERVICE_NAME defaults."
