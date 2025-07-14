# Fleet Management System - Script de lancement développement
# Auteur: Assistant IA
# Description: Lance automatiquement le backend Flask et le frontend React

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Fleet Management System - Dev Mode  " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtenir le répertoire du script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Fonction pour lancer un terminal
function Start-DevServer {
    param(
        [string]$Title,
        [string]$Path,
        [string]$Command,
        [string]$Color
    )
    
    Write-Host "🔄 Démarrage: $Title" -ForegroundColor $Color
    
    $fullPath = Join-Path $scriptPath $Path
    
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$fullPath'; $Command"
    ) -WindowStyle Normal
    
    Start-Sleep -Seconds 2
}

# Lancement du Backend Flask
Start-DevServer -Title "Backend Flask" -Path "backend" -Command "python app.py" -Color "Green"

# Lancement du Frontend React
Start-DevServer -Title "Frontend React" -Path "frontend" -Command "npm start" -Color "Blue"

Write-Host ""
Write-Host "✅ Serveurs en cours de démarrage..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:  " -NoNewline -ForegroundColor White  
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Ouvrez votre navigateur et accédez au frontend!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur [Entrée] pour fermer ce terminal..." -ForegroundColor Gray
Read-Host
