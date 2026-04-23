# GOING Code Agent — PowerShell helper
# Usage:
#   .\scripts\run-agent.ps1                            # scan core services
#   .\scripts\run-agent.ps1 -Path user-auth-service/src   # scan specific path
#   .\scripts\run-agent.ps1 -Diff                     # only changed files vs main
#   .\scripts\run-agent.ps1 -Path api-gateway/src -Fix    # scan + interactive fix

param(
  [string]$Path = "",
  [switch]$Diff,
  [switch]$Fix
)

if (-not $env:ANTHROPIC_API_KEY) {
  Write-Host "❌ Set ANTHROPIC_API_KEY first:" -ForegroundColor Red
  Write-Host '   $env:ANTHROPIC_API_KEY = "sk-ant-..."'
  exit 1
}

$args_list = @()
if ($Path)  { $args_list += "--path=$Path" }
if ($Diff)  { $args_list += "--diff" }
if ($Fix)   { $args_list += "--fix" }

Write-Host "🤖 Starting Code Agent..." -ForegroundColor Cyan
npx ts-node scripts/code-agent.ts @args_list
