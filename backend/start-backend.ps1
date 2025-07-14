# Script pour démarrer uniquement le backend Flask
Write-Host "🚀 Démarrage du Backend Flask..." -ForegroundColor Green
Write-Host ""

# Activer l'environnement virtuel si il existe
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activation de l'environnement virtuel..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

# Démarrer le serveur Flask
Write-Host "Démarrage du serveur Flask sur http://localhost:5000" -ForegroundColor Cyan
python app.py

Write-Host ""
Write-Host "Serveur arrêté." -ForegroundColor Red
