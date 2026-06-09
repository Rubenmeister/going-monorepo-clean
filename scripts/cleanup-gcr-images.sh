#!/bin/bash
# cleanup-gcr-images.sh
#
# Borra manifests viejos en gcr.io/going-5d1ae preservando:
#  - Top N más recientes por repo (default 10)
#  - Cualquier manifest con tag "latest"
#  - Cualquier manifest cuyo tag esté actualmente deployado en Cloud Run
#
# Uso:  bash scripts/cleanup-gcr-images.sh [KEEP]   # default KEEP=10

set -uo pipefail

PROJECT=going-5d1ae
REGION=us-central1
KEEP=${1:-10}

echo "=== Recopilando tags deployados en Cloud Run ==="
DEPLOYED=$(gcloud run services list --project=$PROJECT --region=$REGION \
  --format="value(spec.template.spec.containers[0].image)" 2>/dev/null | tr -d '\r')
echo "$DEPLOYED" | wc -l | xargs echo "  Cloud Run services:"
echo ""

REPOS=$(gcloud container images list --repository=gcr.io/$PROJECT --format="value(name)" 2>/dev/null | tr -d '\r')

TOTAL_DELETED=0
TOTAL_KEPT=0

for repo in $REPOS; do
  repo_name=$(basename "$repo")
  # Tags actualmente deployados para este repo (puede ser vacío)
  deployed_tags=$(echo "$DEPLOYED" | grep -E "/(${repo_name}):" | awk -F: '{print $NF}' | sort -u)

  # Listar manifests ordenados por timestamp DESC
  manifests=$(gcloud container images list-tags "$repo" --sort-by=~timestamp \
    --format="csv[no-heading](digest,tags)" --limit=999 2>/dev/null | tr -d '\r')

  if [ -z "$manifests" ]; then
    echo "[$repo_name] vacío"
    continue
  fi

  total=$(echo "$manifests" | wc -l)
  if [ "$total" -le "$KEEP" ]; then
    echo "[$repo_name] $total ≤ $KEEP, skip"
    TOTAL_KEPT=$((TOTAL_KEPT + total))
    continue
  fi

  # Manifests candidatos a borrar: después de los primeros KEEP
  candidates=$(echo "$manifests" | tail -n +$((KEEP + 1)))

  deleted=0
  while IFS=, read -r digest tags; do
    # Preservar si tiene 'latest'
    if [[ ",$tags," == *",latest,"* ]] || [[ "$tags" == "latest" ]] || [[ "$tags" == *",latest"* ]] || [[ "$tags" == "latest,"* ]]; then
      continue
    fi
    # Preservar si algún tag está deployado
    keep=0
    if [ -n "$deployed_tags" ]; then
      for dt in $deployed_tags; do
        if [[ ",$tags," == *",$dt,"* ]] || [[ "$tags" == "$dt" ]]; then
          keep=1; break
        fi
      done
    fi
    if [ "$keep" = "1" ]; then continue; fi

    gcloud container images delete "$repo@sha256:$digest" --quiet --force-delete-tags >/dev/null 2>&1 && deleted=$((deleted + 1))
  done <<< "$candidates"

  kept=$((total - deleted))
  TOTAL_DELETED=$((TOTAL_DELETED + deleted))
  TOTAL_KEPT=$((TOTAL_KEPT + kept))
  echo "[$repo_name] total=$total kept=$kept deleted=$deleted"
done

echo ""
echo "=== Resumen ==="
echo "  Total deleted: $TOTAL_DELETED manifests"
echo "  Total kept:    $TOTAL_KEPT manifests"
