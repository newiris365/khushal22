@echo off
set "GIT=D:\git\cmd\git.exe"
echo Committing and pushing changes to GitHub...
"%GIT%" add .
"%GIT%" commit -m "Add Render backend proxy and canteen Netlify function for production"
"%GIT%" pull origin main
"%GIT%" push origin main
echo Done!
pause
