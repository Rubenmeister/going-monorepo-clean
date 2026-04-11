# Going Monorepo — Plan de Limpieza

## Archivos a eliminar en la raíz (seguro)

```bash
# HTML de preview/propuestas (no son parte del producto)
rm going-home-preview.html
rm going-splash-preview.html
rm going-user-guide.html
rm goingec-propuesta.html

# Patch file viejo
rm 0001-feat-auth-unified-auth-system-with-role-based-access.patch

# Scripts de deploy manuales (reemplazados por CI/CD)
rm deploy-new-services.ps1
rm deploy-two.ps1
rm push.ps1
rm redeploy-only.ps1

# Cloudbuild yamls duplicados (consolidar en cloudbuild.yaml)
rm cloudbuild-billing.yaml
rm cloudbuild-notification.yaml
# Revisar antes de borrar:
# cloudbuild-customer-support.yaml
# cloudbuild-microservices.yaml
# cloudbuild-notifications.yaml
# cloudbuild-turismo.yaml

# Staging checklist (ya no es necesario)
rm STAGING_DEPLOYMENT_CHECKLIST.md
```

## Carpetas a evaluar

| Carpeta | Estado sugerido | Razón |
|---------|----------------|-------|
| `dist/` | ✅ Eliminar | Artefactos de build, regenerables |
| `tmp/` | ✅ Eliminar | Temporales |
| `docs/` | ✅ Eliminar | Ya eliminado de git, solo untracked |
| `mobile-app/` | ⚠️ Revisar | Posiblemente reemplazado por `mobile-user-app/` |
| `frontend/` | ⚠️ Revisar | Posiblemente reemplazado por `frontend-webapp/` |
| `dataconnect/` | ⚠️ Revisar | Firebase DataConnect (¿en uso?) |
| `iot-service/` | ⚠️ Revisar | ¿Activo en producción? |
| `voice-service/` | ⚠️ Revisar | ¿Activo en producción? |
| `ml-service/` | ⚠️ Revisar | ¿Activo en producción? |
| `social-service/` | ⚠️ Revisar | ¿Activo en producción? |
| `argocd/` | ⚠️ Revisar | ¿Usando ArgoCD actualmente? |
| `k8s/` | ⚠️ Revisar | ¿Kubernetes activo? |

## Agentes a migrar (reemplazar con managed-agents/)

Una vez validado el piloto, estos pueden eliminarse:
- `content-agent/` → migrado a `managed-agents/`
- `financial-agent/` → migrado a `managed-agents/`
- `marketing-agent/` → migrado a `managed-agents/`
- `ops-agent/` → migrado a `managed-agents/`
- `going-agent/` → migrado a `managed-agents/` (going-agent tiene lógica más compleja)

**Ahorro estimado:** ~5 Dockerfiles, ~5 Cloud Run Jobs, ~10 Cloud Scheduler configs eliminados
