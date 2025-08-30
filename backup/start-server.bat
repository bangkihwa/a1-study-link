@echo off
echo ====================================
echo    A1 StudyLink 서버 시작
echo ====================================
echo.

echo [1/2] React 개발 서버 시작 중...
cd client
start cmd /k "npm run dev -- --host"

echo [2/2] 5초 후 브라우저 열기...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo ====================================
echo    서버가 시작되었습니다!
echo ====================================
echo.
echo 로컬: http://localhost:3000
echo 네트워크: http://192.168.219.105:3000
echo.
echo 종료하려면 이 창을 닫으세요.
pause