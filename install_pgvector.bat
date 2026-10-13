@echo off
echo ====================================================================
echo ProofLens AI - pgvector Installer for PostgreSQL 16
echo ====================================================================
echo.
echo Checking for Administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This installer requires Administrator permissions.
    echo Please right-click "install_pgvector.bat" and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

set "PG_DIR=C:\Program Files\PostgreSQL\16"
set "PKG_DIR=%~dp0pgvector_pkg"

echo Target PostgreSQL Directory: %PG_DIR%
echo Source Package Directory:    %PKG_DIR%
echo.

if not exist "%PG_DIR%" (
    echo [ERROR] PostgreSQL 16 directory not found at: %PG_DIR%
    pause
    exit /b 1
)

echo [1/3] Copying vector.dll to %PG_DIR%\lib...
copy /Y "%PKG_DIR%\lib\vector.dll" "%PG_DIR%\lib\"
if %errorLevel% neq 0 (
    echo Failed to copy vector.dll!
    pause
    exit /b 1
)

echo [2/3] Copying extension SQL scripts to %PG_DIR%\share\extension...
copy /Y "%PKG_DIR%\share\extension\vector*" "%PG_DIR%\share\extension\"
if %errorLevel% neq 0 (
    echo Failed to copy extension scripts!
    pause
    exit /b 1
)

echo [3/3] Copying C headers to %PG_DIR%\include\server\extension\vector...
if not exist "%PG_DIR%\include\server\extension\vector" (
    mkdir "%PG_DIR%\include\server\extension\vector"
)
copy /Y "%PKG_DIR%\include\server\extension\vector\*" "%PG_DIR%\include\server\extension\vector\" >nul 2>&1

echo.
echo ====================================================================
echo [SUCCESS] pgvector binary files installed successfully!
echo Now activating extension in database 'prooflens'...
echo ====================================================================
echo.

"%PG_DIR%\bin\psql.exe" -U postgres -d prooflens -c "CREATE EXTENSION IF NOT EXISTS vector;"
if %errorLevel% equ 0 (
    echo.
    echo [SUCCESS] Extension 'vector' is now enabled in database 'prooflens'!
) else (
    echo [NOTE] Please enter your postgres password if prompted above.
)

echo.
pause
