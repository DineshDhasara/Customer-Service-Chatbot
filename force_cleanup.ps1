# Files to keep (relative to project root)
$keepFiles = @(
    "portfolio-frontend.html",
    "portfolio.html",
    "backend\",
    "frontend\",
    ".env",
    "package.json",
    "package-lock.json"
)

# Files to remove (relative to project root)
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
    "backend\package-fixed.json",
    "cleanup.ps1"
)

# Create backup directory if it doesn't exist
$backupDir = "$PSScriptRoot\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir"
}

# Remove files
foreach ($filePattern in $filesToRemove) {
    # Handle wildcards
    if ($filePattern -match '\*') {
        $files = Get-ChildItem -Path $PSScriptRoot -Filter $filePattern -File -Recurse
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace("$PSScriptRoot\", "")
            $backupPath = Join-Path $backupDir (Split-Path -Path $relativePath -Parent)
            
            if (-not (Test-Path $backupPath)) {
                New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
            }
            
            Move-Item -Path $file.FullName -Destination (Join-Path $backupDir $relativePath) -Force -ErrorAction SilentlyContinue
            if ($?) {
                Write-Host "Moved to backup: $relativePath"
            }
        }
    }
    # Handle specific files
    else {
        $fullPath = Join-Path $PSScriptRoot $filePattern
        if (Test-Path $fullPath) {
            $relativePath = $filePattern
            $backupPath = Join-Path $backupDir (Split-Path -Path $relativePath -Parent)
            
            if (-not (Test-Path $backupPath)) {
                New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
            }
            
            Move-Item -Path $fullPath -Destination (Join-Path $backupDir $relativePath) -Force -ErrorAction SilentlyContinue
            if ($?) {
                Write-Host "Moved to backup: $relativePath"
            }
        }
    }
}

# Clean up empty directories
Get-ChildItem -Path $PSScriptRoot -Directory -Recurse | 
    Where-Object { $_.GetFiles().Count -eq 0 -and $_.GetDirectories().Count -eq 0 } | 
    ForEach-Object { 
        $relativePath = $_.FullName.Replace("$PSScriptRoot\", "")
        if ($keepFiles -notcontains "$relativePath\") {
            Remove-Item -Path $_.FullName -Force -Recurse -ErrorAction SilentlyContinue
            if ($?) {
                Write-Host "Removed empty directory: $relativePath"
            }
        }
    }

Write-Host "\nCleanup completed! Backup created at: $backupDir"
Write-Host "\nRemaining project structure:"
Get-ChildItem -Path $PSScriptRoot -Recurse -Directory | Select-Object FullName | Sort-Object FullName | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PSScriptRoot\", "")
    Write-Host "- $relativePath"
}

Write-Host "\nTo restore from backup, run:"
Write-Host "Copy-Item -Path '$backupDir\*' -Destination '$PSScriptRoot' -Recurse -Force"
