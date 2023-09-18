@echo off
cd /D "%~dp0"
cd..
start http://127.0.0.1:5500/debug/0-local_html.html
python -m http.server 5500