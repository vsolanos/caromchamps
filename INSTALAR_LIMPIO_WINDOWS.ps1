Write-Host "FECOBI / ASOBIGRIE - Instalacion limpia v2.7"
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
