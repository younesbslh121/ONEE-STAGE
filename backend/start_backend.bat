@echo off
echo =======================================================
echo         Démarrage du serveur backend Flask
echo =======================================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Python n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

echo Python détecté avec succès.
echo.

REM Installer les dépendances
echo Installation des dépendances...
pip install -r requirements_simple.txt

echo.
echo Démarrage du serveur...
echo Le serveur sera disponible à l'adresse: http://localhost:5000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.

python start_server.py

pause
