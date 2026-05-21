@echo off
REM engram-sync.bat - Wrapper para engram-sync.cjs en Windows

setlocal enabledelayedexpansion

if "%1"=="" (
    node "%~dp0engram-sync.cjs" --help
    exit /b 0
)

if "%1"=="--export" (
    node "%~dp0engram-sync.cjs" --export
    exit /b %errorlevel%
)

if "%1"=="--import" (
    node "%~dp0engram-sync.cjs" --import
    exit /b %errorlevel%
)

if "%1"=="--status" (
    node "%~dp0engram-sync.cjs" --status
    exit /b %errorlevel%
)

if "%1"=="--help" (
    node "%~dp0engram-sync.cjs" --help
    exit /b 0
)

echo Error: Unknown command "%1"
echo Use: engram-sync --help
exit /b 1
