@echo off
echo ========================================
echo 🚀 Lancement de Fleet Management System
echo ========================================

cd /d "%~dp0"

echo.
echo 📍 Démarrage du Backend Flask...
start "Backend Flask" cmd /k "cd backend && python app.py"

timeout /t 3 /nobreak >nul

echo.
echo 🌐 Démarrage du Frontend React...
start "Frontend React" cmd /k "cd frontend && npm start"

echo.
echo ✅ Les deux serveurs sont en cours de démarrage !
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000
echo.
echo Appuyez sur une touche pour fermer ce terminal...
pause >nul
