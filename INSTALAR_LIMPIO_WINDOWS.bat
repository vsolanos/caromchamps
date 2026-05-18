@echo off
echo FECOBI / ASOBIGRIE - Instalacion limpia v2.7
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
call npm.cmd config set registry https://registry.npmjs.org/
call npm.cmd install --registry=https://registry.npmjs.org/
call npm.cmd run dev
