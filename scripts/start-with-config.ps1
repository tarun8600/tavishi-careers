# Thin PowerShell wrapper around the cross-platform Node launcher.
param(
    [ValidateSet("dev", "qa", "prod")]
    [string]$Profile = "dev",

    [ValidateSet("dev", "build", "start")]
    [string]$Mode = "dev",

    [ValidateRange(1, 65535)]
    [int]$Port = 3002
)

$ErrorActionPreference = "Stop"
$launcher = Join-Path $PSScriptRoot "start-with-config.mjs"
& node $launcher --profile $Profile --mode $Mode --port $Port
exit $LASTEXITCODE
