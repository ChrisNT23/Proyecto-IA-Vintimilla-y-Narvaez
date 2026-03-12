@echo off
REM Script para iniciar el servidor Python en Windows
call "%~dp0venv\Scripts\activate.bat"
python "%~dp0model_server.py"

