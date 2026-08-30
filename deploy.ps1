# Fail fast on any cmdlet error instead of silently continuing in the wrong directory
# (e.g. a missing $repoPath must never fall through to git/npm/mvn commands run from wherever
# this script happened to be invoked).
$ErrorActionPreference = "Stop"

$repoPath = "C:\apps\uniservice"
$logFile = "C:\apps\uniservice\deploy.log"

function Log($msg) {
    "$(Get-Date -Format o) $msg" | Out-File -FilePath $logFile -Append
}

if (-not (Test-Path $repoPath)) {
    Write-Error "Deploy checkout not found at $repoPath. Aborting before touching any other directory."
    exit 1
}

Set-Location $repoPath
git fetch origin feature/auth 2>&1 | Out-Null

$local = git rev-parse HEAD
$remote = git rev-parse origin/feature/auth

if ($local -eq $remote) {
    Log "No changes."
    exit 0
}

Log "New commits detected ($local -> $remote). Deploying..."
git pull origin feature/auth 2>&1 | Out-File -FilePath $logFile -Append

Log "Stopping backend service to release file locks..."
Stop-Service uniservice-backend -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Log "Building frontend..."
Set-Location "$repoPath\frontend"
npm install 2>&1 | Out-File -FilePath $logFile -Append
npm run build 2>&1 | Out-File -FilePath $logFile -Append
if ($LASTEXITCODE -ne 0) {
    Log "Frontend build FAILED. Restarting old service and aborting."
    Start-Service uniservice-backend
    exit 1
}

Log "Building backend..."
Set-Location "$repoPath\backend"
& C:\tools\maven\bin\mvn.cmd clean package -DskipTests 2>&1 | Out-File -FilePath $logFile -Append
if ($LASTEXITCODE -ne 0) {
    Log "Backend build FAILED. Restarting old service and aborting."
    Start-Service uniservice-backend
    exit 1
}

Log "Starting backend service..."
Start-Service uniservice-backend

Log "Deploy complete."
