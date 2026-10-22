param(
    [ValidateSet("dev", "qa", "prod")]
    [string]$Profile = "dev",

    [ValidateSet("dev", "build", "start")]
    [string]$Mode = "dev",

    [int]$Port = 3002
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$required = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_IMPORT_SECRET"
)

function Get-LocalValues {
    $values = @{}
    if (-not (Test-Path ".env.local")) { return $values }

    foreach ($line in (Get-Content ".env.local")) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $key = $Matches[1]
            $value = $Matches[2].Trim()
            if ($value.Length -ge 2 -and (
                ($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))
            )) { $value = $value.Substring(1, $value.Length - 2) }
            $values[$key] = $value
        }
    }
    return $values
}

$local = Get-LocalValues
$completeLocalDev = $Profile -eq "dev"
foreach ($key in $required) {
    if (-not $local.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($local[$key])) {
        $completeLocalDev = $false
    }
}

# Prevent accidentally serving a production environment with the dev server.
if ($Profile -eq "prod" -and $Mode -eq "dev") {
    throw "For prod, specify -Mode build or -Mode start and use a production deployment."
}

$npmArgs = @("run", $Mode)
if ($Mode -eq "dev" -or $Mode -eq "start") {
    $npmArgs += @("--", "-p", "$Port")
}

if ($completeLocalDev) {
    Write-Host "Starting Tavishi Careers with complete local DEV configuration."
    & npm @npmArgs
} else {
    if (-not (Get-Command infisical -ErrorAction SilentlyContinue)) {
        throw "Infisical CLI not found. Install it, then run 'infisical login' and 'infisical init'."
    }
    Write-Host "Starting Tavishi Careers using Infisical profile '$Profile'."
    # Infisical injects variables into the child process before Next.js loads.
    # Never print secret values or pass secrets as CLI arguments.
    & infisical run "--env=$Profile" -- npm @npmArgs
}

if ($LASTEXITCODE -ne 0) {
    throw "Application command failed with exit code $LASTEXITCODE."
}
