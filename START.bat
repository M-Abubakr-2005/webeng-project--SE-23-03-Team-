@echo off
title Mila Chat - Server
cd /d "%~dp0"
echo.
echo ====================================
echo    Mila Chat Web Application
echo ====================================
echo.
echo Starting Django Development Server...
echo.
python manage.py runserver 0.0.0.0:8000
