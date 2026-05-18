FECOBI / ASOBIGRIE Preproducción v3.1 - Instalación limpia

1. Descomprime el ZIP en una carpeta nueva.
2. Abre PowerShell en la carpeta donde está package.json.
3. Ejecuta:

   npm.cmd config set registry https://registry.npmjs.org/
   npm.cmd install --registry=https://registry.npmjs.org/
   npm.cmd run dev

Si reutilizas una carpeta anterior, antes ejecuta:

   if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
   if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
   npm.cmd config set registry https://registry.npmjs.org/
   npm.cmd install --registry=https://registry.npmjs.org/
   npm.cmd run dev

Abrir en navegador:
http://localhost:5173/
