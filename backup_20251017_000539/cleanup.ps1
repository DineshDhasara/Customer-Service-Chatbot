# Create backup directory if it doesn't exist
$backupDir = "$PSScriptRoot\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir"
}

# Files to keep
$keepFiles = @(
    "portfolio-frontend.html",
    "portfolio.html",
    "backend\",
    "frontend\",
    ".env",
    "package.json",
    "package-lock.json"
)

# Files to remove
$filesToRemove = @(
    "advanced-frontend-fixed.html",
    "advanced-frontend.html",
    "chatbot.html",
    "simple-frontend.html",
    "test-frontend.html",
    "ultra-pro-max-frontend.html",
    "test-*.js",
    "list-models.js",
    "4_minute_pitch.md",
    "demo_conversations.md",
    "slides_bullets.md",
    "backend\src\advancedServer.js",
    "backend\src\smartServer.js",
    "backend\src\ultraServer.js",
    "backend\package-fixed.json"
)

# Backup and remove files
foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    # Handle wildcards
    if ($file -match '\*') {
        $matchingFiles = Get-ChildItem -Path $PSScriptRoot -Filter $file -File | Select-Object -ExpandProperty FullName
        foreach ($matchFile in $matchingFiles) {
            $relativePath = $matchFile.Replace("$PSScriptRoot\", "")
            $backupPath = Join-Path $backupDir (Split-Path -Path $relativePath -Parent)
            
            if (-not (Test-Path $backupPath)) {
                New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
            }
            
            Move-Item -Path $matchFile -Destination (Join-Path $backupDir $relativePath) -Force
            Write-Host "Moved to backup: $relativePath"
        }
    }
    # Handle specific files
    elseif (Test-Path $fullPath) {
        $backupPath = Join-Path $backupDir (Split-Path -Path $file -Parent)
        
        if (-not (Test-Path $backupPath)) {
            New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
        }
        
        Move-Item -Path $fullPath -Destination (Join-Path $backupDir $file) -Force
        Write-Host "Moved to backup: $file"
    }
}

Write-Host "\nCleanup completed! Backup created at: $backupDir"
Write-Host "Remaining project structure:"
Get-ChildItem -Path $PSScriptRoot -Recurse -Directory | Select-Object FullName | Sort-Object FullName | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PSScriptRoot\", "")
    Write-Host "- $relativePath"
}

Write-Host "\nTo restore from backup, run:"
Write-Host "Copy-Item -Path '$backupDir\*' -Destination '$PSScriptRoot' -Recurse -Force"
