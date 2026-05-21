@echo off
REM engram-sync.bat - Wrapper para engram-sync.js en Windows

setlocal enabledelayedexpansion

if "%1"=="" (
    node "%~dp0..\engram-sync.js" --help
    exit /b 0
)

if "%1"=="--export" (
    node "%~dp0..\engram-sync.js" --export
    exit /b %errorlevel%
)

if "%1"=="--import" (
    node "%~dp0..\engram-sync.js" --import
    exit /b %errorlevel%
)

if "%1"=="--status" (
    node "%~dp0..\engram-sync.js" --status
    exit /b %errorlevel%
)

if "%1"=="--help" (
    node "%~dp0..\engram-sync.js" --help
    exit /b 0
)

echo Error: Unknown command "%1"
echo Use: engram-sync --help
exit /b 1
