$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

function Test-ListeningPort {
  param(
    [int]$Port
  )

  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Resolve-PostgresBin {
  $base = "C:\Program Files\PostgreSQL"

  if (!(Test-Path $base)) {
    throw "PostgreSQL is not installed under $base."
  }

  $versions = Get-ChildItem $base -Directory | Sort-Object Name -Descending

  foreach ($version in $versions) {
    $candidate = Join-Path $version.FullName "bin"

    if (Test-Path (Join-Path $candidate "pg_ctl.exe")) {
      return $candidate
    }
  }

  throw "Unable to find pg_ctl.exe in the PostgreSQL installation."
}

function Ensure-Postgres {
  $pgBin = Resolve-PostgresBin
  $dataDir = Join-Path $repoRoot ".local\postgres-data"
  $logFile = Join-Path $repoRoot "postgres-local.log"
  $psql = Join-Path $pgBin "psql.exe"
  $createdb = Join-Path $pgBin "createdb.exe"
  $initdb = Join-Path $pgBin "initdb.exe"
  $pgctl = Join-Path $pgBin "pg_ctl.exe"

  if (!(Test-Path (Split-Path $dataDir -Parent))) {
    New-Item -ItemType Directory -Path (Split-Path $dataDir -Parent) | Out-Null
  }

  if (!(Test-Path $dataDir)) {
    & $initdb -D $dataDir -A trust -U postgres | Out-Null
  }

  if (!(Test-ListeningPort -Port 5433)) {
    & $pgctl -D $dataDir -l $logFile -o "-p 5433" -w start | Out-Null
  }

  $exists = (& $psql -h 127.0.0.1 -p 5433 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='codeorbit';").Trim()

  if ($exists -ne "1") {
    & $createdb -h 127.0.0.1 -p 5433 -U postgres codeorbit
  }
}

function Ensure-Redis {
  $redisExe = "C:\Program Files\Redis\redis-server.exe"
  $redisConf = "C:\Program Files\Redis\redis.windows.conf"

  if (!(Test-Path $redisExe)) {
    throw "Redis is not installed at $redisExe."
  }

  if (!(Test-ListeningPort -Port 6379)) {
    Start-Process -FilePath $redisExe -ArgumentList $redisConf, "--port", "6379" | Out-Null
    Start-Sleep -Seconds 3
  }
}

function Ensure-ProcessPort {
  param(
    [int]$Port,
    [string[]]$Command
  )

  if (Test-ListeningPort -Port $Port) {
    return
  }

  $npm = (Get-Command npm.cmd).Source
  Start-Process -FilePath $npm -ArgumentList $Command -WorkingDirectory $repoRoot | Out-Null
}

Ensure-Postgres
Ensure-Redis
Ensure-ProcessPort -Port 3000 -Command @("run", "dev")
Ensure-ProcessPort -Port 1999 -Command @("run", "partykit:dev")

Start-Sleep -Seconds 5

[pscustomobject]@{
  next = Test-ListeningPort -Port 3000
  partykit = Test-ListeningPort -Port 1999
  postgres = Test-ListeningPort -Port 5433
  redis = Test-ListeningPort -Port 6379
} | ConvertTo-Json
