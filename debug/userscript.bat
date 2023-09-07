@echo off
cd..
start http://127.0.0.1:5500/debug/userscript.html
python -m http.server 5500