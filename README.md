# CaromChamps

CaromChamps es una plataforma web React/Vite para la gestión integral de campeonatos de billar carambola a 3 bandas FECOBI / ASOBIGRIE. Cubre jugadores, campeonatos normales, campeonatos ranking, doble fase de grupos, eliminación simple, calendario, captura de partidas, planillas físicas, lectura asistida de planillas, llaves/brackets, reportes PDF/CSV, ranking, cierre, auditoría, usuarios e inscripciones públicas.

## Estado actual

- Versión declarada en `package.json`: `7.2.0`.
- Rama de trabajo esperada: `main`.
- Aplicación: SPA React 18 + Vite 5.
- Publicación web: Cloudflare Pages, proyecto `caromchampsapp`.
- Dominio de producción: `https://www.caromchamps.com`.
- Persistencia: `localStorage` para operación local y Supabase para autenticación, perfiles, estado remoto, publicaciones públicas e inscripciones.
- Interface predeterminada: ProV.
- Interfaces disponibles: ProV, IA y Clásica.

## Cambios recientes v7.2.0

- Responsive ProV aplicado solamente bajo `.app-shell.ux-mode-pro`.
- Breakpoints para tablet y celular en navegación, topbar, dashboards, formularios, toolbars, tabs de campeonato y paneles operativos.
- Tablas operativas convertidas a tarjetas móviles en ProV para Usuarios, Inscripciones, Campeonatos, pendientes, Jugadores, Calendario, Grupos y Ranking.
- Calendario recibió clases específicas para permitir tarjetas móviles sin afectar IA ni Clásica.
- README reconstruido con estado real, instalación, Supabase, Cloudflare Pages, verificación, módulos e historial consolidado.
- Validado con `npm.cmd run check:syntax` y `npm.cmd run build`.

## Módulos principales

- Grand Dashboard de plataforma.
- Campeonatos y dashboard de campeonato.
- Campeonato / Setup.
- Grupos y Grupos F2.
- Calendario.
- Partidas.
- Planillas IA.
- Llaves: Tabular, Continua y Face to Face.
- Reportes PDF/CSV.
- Ranking.
- Inscripciones públicas.
- Usuarios y roles.
- Configuración.
- Perfil.
- Mantenimiento.
- Árbitros.
- Cierre.
- Feedback.
- Auditoría.

## Roles y permisos

Los roles vigentes son:

- `SUPER_USER`: acceso total a plataforma, usuarios, configuración, auditoría y todas las instancias.
- `USER`: operación normal de su propia instancia.
- `VIEWER`: consulta limitada, sin administración ni escritura operativa.

El correo `vsolanos@gmail.com` se considera super usuario por configuración de aplicación y por el script SQL de Supabase.

## Tipos de campeonato

- `NORMAL`: campeonato con fase de grupos y llaves.
- `DOBLE_FASE_GRUPOS`: primera fase de grupos, segunda fase de grupos y etapa final.
- `ELIMINACION_SIMPLE`: sin grupos; los jugadores seleccionados pasan directo a llaves.
- `RANKING`: campeonato usado para consolidar ranking acumulado.

## Instalación local

Requisitos:

- Node.js compatible con Vite 5.
- npm.
- Acceso al registro público de npm.

Comandos recomendados en Windows:

```powershell
cd C:\Proyectos\CaromChamps
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run check:syntax
npm.cmd run build
npm.cmd run dev
```

URL local:

```text
http://localhost:5173/
```

Ejecución diaria local:

```powershell
cd C:\Proyectos\CaromChamps
.\START_CAROMCHAMPS.bat
```

Alternativa PowerShell:

```powershell
cd C:\Proyectos\CaromChamps
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\START_CAROMCHAMPS.ps1
```

Limpieza de caché local de desarrollo:

```powershell
npm.cmd run dev:clean
```

## Scripts npm

- `npm.cmd run dev`: servidor Vite en `127.0.0.1:5173`.
- `npm.cmd run dev:network`: servidor Vite accesible desde la red local.
- `npm.cmd run build`: build de producción.
- `npm.cmd run preview`: preview Vite en `127.0.0.1:4173`.
- `npm.cmd run check:syntax`: validación sintáctica de los archivos JS principales.
- `npm.cmd run start:local`: alias local de Vite.
- `npm.cmd run start:preview`: alias de preview.
- `npm.cmd run verify:registry`: muestra el registry npm activo.

## Supabase

Archivo SQL vigente:

```text
docs/supabase_schema_v5.sql
```

Guía de configuración:

```text
docs/SUPABASE_SETUP_v5.md
```

Variables de entorno requeridas:

```text
VITE_SUPABASE_URL=https://vmcbaexkbenbesygxccu.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key de Supabase>
```

Auth URLs recomendadas:

```text
Site URL: https://caromchamps.com
Redirect URLs:
https://caromchamps.com/*
http://localhost:5173/*
```

El script SQL crea o actualiza:

- `profiles`.
- `user_app_states`.
- `shared_championships`.
- `public_registration_publications`.
- `public_registration_requests`.
- bucket público `user-avatars`.
- políticas RLS para perfiles, estado remoto, vistas compartidas e inscripciones.
- normalización de roles antiguos hacia `SUPER_USER`, `USER` y `VIEWER`.

No guardar contraseñas, anon keys reales privadas ni service-role keys en GitHub.

## Inscripciones públicas

Cada campeonato puede publicar una página pública con URL tipo:

```text
/#register=<championship_id>
```

La publicación e inscripción pueden funcionar con Supabase cuando está configurado. También existe fallback local para pruebas en navegador. El flujo soporta:

- publicación y despublicación del campeonato.
- payload compacto de publicación para reducir riesgo de cuota local.
- identificación de jugadores existentes por documento, correo o nombre.
- solicitudes nuevas con datos requeridos.
- estados `RECIBIDA`, `VALIDADA`, `APROBADA`, `RECHAZADA`, `DUPLICADA` y `EN_REVISION`.
- sincronización de aprobados con el maestro de jugadores y participantes del campeonato.
- consulta pública de publicaciones activas por enlace.

## Planillas IA

El tab Planillas IA permite cargar PDF e imágenes de planillas firmadas para asociarlas a partidas oficiales. Puede trabajar con lectura local limitada o con un endpoint IA/OCR externo.

Formatos soportados por el flujo:

- PDF.
- PNG.
- JPG/JPEG.
- WEBP.
- otros formatos de imagen aceptados por el navegador.

Contrato sugerido para endpoint:

```json
{
  "results": [
    {
      "file_name": "planillas.pdf",
      "page_number": 1,
      "match_code": "P-005",
      "caroms_p1": 39,
      "caroms_p2": 12,
      "innings_p1": 22,
      "innings_p2": 22,
      "s1_p1": 7,
      "s1_p2": 3,
      "s2_p1": 0,
      "s2_p2": 2,
      "winner_id": "PLAYER_ID",
      "match_result_type": "NORMAL",
      "confidence": 0.93,
      "page_image_data_url": "data:image/png;base64,..."
    }
  ]
}
```

Cuando `average_control_enabled` es `false`, CaromChamps ignora entradas al aplicar resultados importados, pero conserva carambolas, SM1, SM2, ganador y tipo de resultado.

## Cloudflare Pages

Proyecto:

```text
caromchampsapp
```

Build local:

```cmd
npm run build
```

Crear proyecto Pages si no existe:

```cmd
npx wrangler pages project create caromchampsapp --production-branch main
```

Desplegar:

```cmd
npx wrangler pages deploy dist --project-name=caromchampsapp
```

Para redeploy:

```cmd
npm run build
npx wrangler pages deploy dist --project-name=caromchampsapp
```

El fallback SPA se maneja con:

```text
public/_redirects
```

Los headers de cache para producción se manejan con:

```text
public/_headers
```

## Verificación recomendada

Antes de publicar:

```powershell
npm.cmd run check:syntax
npm.cmd run build
```

Verificación manual mínima:

- Login o entrada con sesión existente.
- Grand Dashboard.
- Apertura de campeonato.
- Tabs Campeonato, Grupos, Calendario, Partidas, Planillas IA, Llaves, Reportes, Cierre.
- Usuarios e Inscripciones para rol `SUPER_USER`.
- URL pública `/#register=<championship_id>`.
- Modo claro y modo oscuro.
- ProV en desktop, tablet y celular.

## Estructura del proyecto

```text
src/App.js                         Shell principal, navegación, ProV/IA/Clásica
src/data/defaults.js               Data base y configuración inicial
src/lib/tournament.js              Motor deportivo, calendario, ranking y brackets
src/lib/supabase.js                Integración Supabase
src/lib/scoreSheets.js             Lectura local de planillas/QR/text hints
src/lib/print.js                   Motor de impresión/PDF
src/components/*                   Componentes compartidos
src/modules/*                      Módulos operativos
src/styles.css                     Estilos globales y capas por versión
src/styles/theme.css               Tokens de tema
docs/supabase_schema_v5.sql        SQL vigente Supabase
docs/SUPABASE_SETUP_v5.md          Guía Supabase
public/_redirects                  Fallback SPA Cloudflare Pages
public/_headers                    Headers de cache Cloudflare Pages
```

## Historial de versiones

### v7.2.0

- Responsive ProV aplicado solamente bajo `.app-shell.ux-mode-pro`, sin modificar IA ni Clásica.
- Navegación ProV adaptada para tablet y celular con header sticky, tabs horizontales, topbar flexible y controles táctiles.
- Dashboards, formularios, toolbars, cards, tabs de campeonato, paneles de llaves, Partidas, Planillas IA y vistas operativas ajustadas con breakpoints responsivos.
- Tablas operativas convertidas a tarjetas móviles en ProV para Usuarios, Inscripciones, Campeonatos, pendientes, Jugadores, Calendario, Grupos y Ranking.
- Calendario recibió clases específicas para tablas de días, bloqueos y agenda.
- README reconstruido como documento principal actualizado.
- `package.json` actualizado a `7.2.0`.

### v7.1.1

- Hotfix de Inscripciones: la publicación pública cambia inmediatamente a publicada.
- Resolución robusta de publicación pública desde registro remoto o fallback local.
- Mejor manejo de errores de almacenamiento local.
- Payload de publicación compactado para reducir riesgo de cuota `localStorage`.
- Enlace público mantiene formato `/#register=<championship_id>`.
- Integración Supabase reforzada para publicaciones públicas e inscripciones.
- Roles alineados a `SUPER_USER`, `USER` y `VIEWER`.
- SQL v5 actualizado con tablas `public_registration_publications` y `public_registration_requests`.
- Documentación Supabase actualizada para migrar roles antiguos.

### v7.1.0

- Módulo Usuarios para administración de usuarios de plataforma.
- Roles funcionales: Super usuario, Usuario normal y Visualizador.
- Estados de usuario, alcance de instancia, seguridad, MFA informativo y trazabilidad.
- Control de acceso por rol en ProV, IA y Clásica.
- Módulo Inscripciones dentro del campeonato activo.
- Página pública de inscripción con branding CaromChamps.
- Reconocimiento de jugadores existentes por identificación, correo o nombre.
- Bandeja de revisión de solicitudes.
- Aprobación sincronizada con maestro de jugadores y participantes.
- Enlace público `#register=<championship_id>`.
- Preparación de la lógica para Supabase con RLS.

### v7.0.0

- Nueva funcionalidad Planillas IA.
- Tab operativo Planillas IA entre Partidas y Llaves.
- Carga masiva de PDF e imágenes de planillas firmadas.
- Identificación automática por QR, código de archivo, payload estructurado o endpoint IA/OCR.
- Bandeja de revisión con confianza Alta, Media y Baja.
- Asociación de evidencia a la partida correspondiente.
- Soporte de arquitectura para PDF multipágina.
- Guardado de resultados con revisión humana.
- Aprobación masiva de lecturas de alta confianza.
- Auditoría de importaciones, correcciones y partidas finalizadas.
- Endpoint IA/OCR configurable por campeonato.
- Respeto de `average_control_enabled`.

### v6.9.5

- Hotfix reforzado en modo oscuro para campos críticos del tab Partidas.
- Carambolas, Entradas, SM1, SM2, Tipo de resultado y Ganador manual quedan en azul oscuro `#0F2A5F`.
- Clase `capture-dark-blue-field` y estilo directo desde `Capture.js`.
- Fondo gris claro `#E5E7EB` en campos críticos.

### v6.9.4

- Hotfix de legibilidad en Partidas modo oscuro.
- Entradas alineado con Carambolas, SM1 y SM2.
- Reglas CSS de alta especificidad para evitar sobrescrituras globales.

### v6.9.3

- Hotfix en modo oscuro para campos de captura.
- Clases directas e inline style desde `Capture.js`.
- `Select` acepta `className`, `style` y props adicionales.
- Feedback operativo y refinamientos para Eliminación Simple.

### v6.9.2

- Fondo gris claro para campos críticos de Partidas modo oscuro.
- Continuidad visual con texto claro solicitado en v6.9.1.

### v6.9.1

- Hotfix visual en modo oscuro para Partidas.
- Textos de Carambolas, SM1, SM2, Tipo de resultado y Ganador manual ajustados.
- Fondo claro conservado para legibilidad.

### v6.9.0

- Menú Feedback en panel izquierdo.
- Control de feedbacks con estados Recibido, En revisión, Priorizado, En desarrollo, Resuelto, Cerrado y Rechazado.
- Filtros por estado, tipo y búsqueda textual.
- Resumen de feedbacks totales, recibidos, en proceso y cerrados/resueltos.
- Eliminación Simple oculta campos de grupos/F2 no aplicables en Campeonato.
- Cards propios para jugadores a llaves y llave directa aleatoria con cabezas de serie.

### v6.8.0

- Nuevo tipo `ELIMINACION_SIMPLE`.
- Eliminación Simple no usa fase de grupos.
- Ocultamiento automático de Grupos en ProV, IA y Clásica.
- Jugadores seleccionados pasan directo a llaves.
- Generación aleatoria de estructura inicial usando lógica de bracket, números mágicos y R0.
- Botón Regenerar estructura con advertencia si hay partidas realizadas.
- Respeto de cabeza de serie del campeonato.
- Grupos F2 visible automáticamente en Doble Fase Grupos.
- Tarjeta informativa específica en Setup.
- Ajustes de legibilidad en modo oscuro del tab Partidas.

### v6.7.2

- Reporte PDF de Grupos: nombres de clasificados visibles.
- Agenda PDF de Grupos: filas ganadoras en azul.
- Títulos de Grupo, Tabla de posiciones y Agenda centrados.
- Texto plano de respaldo para nombres de jugadores durante impresión.

### v6.7.1

- Corrección crítica del error `Field is not defined` en Grupos.
- Importación faltante de `Field` e `Input` en `src/modules/Groups.js`.
- Estabilidad de carga restaurada después de v6.7.0.

### v6.7.0

- Campeonato activo en modo claro con textos azules.
- Tab Partidas con colores diferenciados para nombres, ganador, carambolas, SM1, SM2 y promedio.
- Código de partida y grupo/ronda centrado y aumentado.
- Nombre de grupo centrado y aumentado.
- Agenda de grupo por jugador, en dos líneas por partida.
- Filtros en Grupos por grupo y jugador.
- Botón flotante de Feedback con contexto editable.
- Orden oficial de enfrentamientos para grupos de 3, 4, 5 y 6.
- Fallback genérico para grupos de 7 o más.
- Setup ampliado para tamaños de grupo mayores a 6.

### v6.6.0

- Llaves Face to Face estandarizadas con la vista Continua.
- Ganador y nombre del ganador en azul claro en todos los cards.
- Campeón/Ganador debajo de la Final con conector vertical.
- PDF Face to Face reducido aproximadamente 12% para salida en una página.
- Grand Dashboard muestra versión actual.
- Planilla base incluye nombre del campeonato.
- Renglones superiores de planillas ampliados.
- README reestructurado con historial consolidado.

### v6.5.0

- Restaurada primera planilla en blanco como plantilla base.
- Aislamiento total del área imprimible de planillas.
- Corrección del salto de primera planilla a dos páginas.
- Face to Face: Final y Campeón reposicionados hacia el centro superior.
- Conectores centrales recalculados desde Semis hacia Final.

### v6.4.0

- Scripts locales `START_CAROMCHAMPS.bat` y `START_CAROMCHAMPS.ps1`.
- Scripts de autoarranque y retiro de autoarranque.
- Mejor manejo operativo de `localhost refused to connect`.
- Planillas PDF centradas horizontal y verticalmente.
- Una planilla por página en Carta.
- Final y Campeón movidos en Face to Face.
- Cierre, acta y ranking ocultan AVG/entradas cuando Control de Promedios está desactivado.

### v6.3.0

- Refinamientos ProV en modo oscuro.
- Grand Dashboard con gráficos enlazados a reportes e historial.
- Dashboard de campeonato con AVG por fase y Top 7.
- Navegación local estabilizada con hash.
- Nuevo parámetro Control de Promedios Sí/No.
- Desempates ajustados cuando no aplica promedio.
- Planillas PDF con sizing reducido 10%.

### v6.2.0

- Tab Reportes agregado a ProV.
- Doble Fase Grupos con tipo de campeonato y tab Grupos F2.
- Wizard permite Normal o Doble Fase Grupos.
- Grupos F2 se alimenta de clasificados de primera fase.
- Bloqueo de Setup al clasificar o cerrar campeonato.
- Ranking enlaza detalle por campeonato hacia reportes.

### v6.1.0

- Wizard de campeonatos convertido en overlay.
- Divisiones Selectivo e Internacional en wizard.
- Tabs ProV como flechas de proceso y sticky.
- Dashboard de campeonato con lista de partidas pendientes.
- Ranking Dashboard con Top 10, participantes por campeonato y AVG asociado.
- Botón Abrir habilitado para campeonatos activos.
- Ajustes Face to Face y PDF.

### v6.0.0

- Nueva Interface ProV como predeterminada.
- ProV, IA y Clásica disponibles.
- Preferencia de interface guardada en `localStorage`.
- Grand Dashboard con estadísticas acumuladas.
- Menú izquierdo: Grand Dashboard, Campeonatos, Ranking y Administración.
- Campeonatos normales y Ranking separados.
- Tabs internos por campeonato.
- Wizard para campeonatos normales y ranking.
- Zoom independiente para llaves Continua y Face to Face.

### v5.9.0

- Interface IA guiada por flujo.
- Fallback a Interface Clásica.
- Dashboard como centro de control.
- Siguiente acción recomendada, alertas y checklist de cierre.
- Catálogo de reportes y vista previa de agenda.
- Base técnica `DataTableCarom`.
- Estilos responsive para la nueva navegación guiada.

### v5.8.0

- Face to Face compactado verticalmente.
- Conectores centrales entre Semis y Final.
- PDF Face to Face ampliado en modo Todo 1 Página.
- Ranking reorganizado con historial, asociación y bandera.
- Ranking PDF con columnas C1, C2 y detalle por campeonato.
- Ranking por campeonato ajustado a PRG, CAR, ENT, AVG y Pos#.

### v5.7.0

- Final separada visualmente de Semis.
- Campeón/Ganador debajo de la Final.
- Ranking con jugador, historial, asociación y bandera.
- Ranking filtra solo jugadores participantes.
- Campeonatos Ranking no requieren selección directa de jugadores.

### v5.6.0

- Face to Face reconstruido como árbol.
- Conectores SVG basados en fuentes reales de partidas.
- R0 integrado como alimentador visual.
- Ranking con PRG en rojo.
- Métricas PRG, PJ, PG, PP, PE, CAR, ENT y AVG.
- PDF de ranking.

### v5.5.0

- Campeonatos Ranking ocultan pasos operativos normales.
- Menú Ranking oculta módulos que no aplican.
- Matriz de puntos por campeonato jugado.
- Banderas alineadas en Grupos.
- Confirmaciones en procesos principales de Llaves.
- Face to Face usa `source_match1_id` y `source_match2_id`.
- Menú con scroll vertical responsivo.

### v5.4.0

- Login premium y modo claro por defecto.
- Menú lateral colapsable.
- Perfil con foto, país y teléfono.
- División objetivo en Paso 1.
- R0 para cantidades no mágicas.
- Reapertura controlada de grupos.
- PDF continuo R32 optimizado.
- Primera funcionalidad Ranking.
- Servidor Vite fijado en `localhost:5173` con `strictPort`.
- Script `dev:clean`.
- Headers de Cloudflare para evitar cache agresivo de `index.html`.

### v5.3.0

- Botón Bracket después R0 eliminado para evitar duplicidad.
- Generar siguiente ronda asume bracket principal posterior a R0.
- Auditoría `DUPLICATE_BRACKET_BLOCKED`.
- Face to Face rediseñado como llave izquierda/derecha con final central.
- PDF Face to Face horizontal y Todo 1 Página.
- Clasificados de primera fase en azul.
- `public/_redirects` para fallback SPA.
- Hotfix post-login con AuthGate no bloqueante y timeouts Supabase.

### v5.2.0

- Pantalla de ingreso con Supabase Auth.
- Registro con nombre, correo, país, teléfono y foto.
- Login por correo, Google y Facebook.
- Perfil de usuario y roles iniciales.
- Separación de datos por usuario.
- Sincronización en `user_app_states`.
- Enlaces compartidos de campeonato en solo lectura.
- Vista compartida con grupos, llaves, KO y ranking público.
- Storage `user-avatars`.
- Corrección de pantalla en blanco post-login.
- `AppErrorBoundary`.
- Mejoras de usabilidad, ranking y producción.

### v5.1.0

- Release de continuidad posterior a la capa inicial Supabase.
- Refuerzos de login, perfil y operación multiusuario.

### v5.0.0

- Integración inicial de Supabase Auth.
- Formulario de registro.
- Supabase Storage para fotos de perfil.
- SQL base y guía Supabase.
- Preparación para sincronización remota y vistas compartidas.

### v4.14.0

- Rebranding a CaromChamps.
- Repositorio oficial `vsolanos/caromchamps`.
- Título del navegador actualizado.
- Dashboard con versión CaromChamps.
- PDF Llave Tabular R32 aumentado.
- Intercambio de jugadores vuelve a modo predeterminado.
- Sustitución queda como acción independiente.
- Banderas y nombres alineados en tablas de posiciones.
- `.gitignore` recomendado.

### v4.13

- PDF Llave Continua corregido para R32/R64/R128.
- Legal Todo 1 Página con clase `bracket-continuous-r32plus`.
- Reglas de impresión reforzadas para evitar saltos accidentales.
- Intercambio y Sustitución en Grupos separados.
- Sustitución lista jugadores externos disponibles.
- Optimización con `useMemo`.

### v4.12

- Corrección crítica de pantalla en blanco al seleccionar intercambio/sustitución.
- Import faltante de `Select` en Grupos.
- Lógica deportiva sin cambios.

### v4.11

- Bandera y nombre alineados en Grupos.
- Sustitución de jugador externo disponible mientras grupos están abiertos.
- Bloqueos si hay grupos cerrados, partidas finalizadas, clasificados o fases posteriores.
- Advertencia al regenerar grupos con datos.
- Carga, visualización y eliminación de planilla firmada desde Partidas.
- Asociación masiva automática por nombre P-### y lectura QR con `jsqr`.
- Historial de jugador con gráfico de promedio.

### v4.10

- PDF Llave Continua aumenta 9% cards de Octavos/R16.
- Tamaño visual consistente para Cuartos, Semifinal, Final, R0 y rondas mayores.
- Conectores reforzados y recalculados.

### v4.7

- Llaves continua usa el mismo template para fase activa y anteriores.
- Campeón/Ganador separado de Final.
- Campeón como nodo independiente a la derecha de Final.
- Conector visual Final-Campeón.
- PDF replica la lógica en Carta/Legal Todo 1 Página.

### v4.6

- Fase activa de llave continua corregida.
- Placeholders legibles tipo Ganador P-###.
- Planillas físicas usan límite de entradas del campeonato.
- Si límite es 0, se generan 60 líneas.
- Renglones de resumen inferior duplicados.

### v4.5.0

- Mejora visual de banderas, especialmente Panamá y República Dominicana.
- PDF de llave continua permite Carta/Legal sin desorden por altura.
- Bracket continuo con cards más anchas.
- Campeón 30% más grande a la derecha de Final.
- Historial de jugador con línea seleccionada en rojo y panel reducido.
- Planillas oficiales con columnas NUM, CON, CAR, ACU.

### v4.4

- Normalización de jugadores y asociaciones de Panamá, República Dominicana y otros.
- Intercambio de jugadores entre grupos o dentro del mismo grupo.
- Limpieza de resultados afectados al intercambiar.
- Historial clicable en jugadores, grupos, partidas y llaves.
- Corrección de visualización continua con preclasificación/R0.
- PDF Llave continua con más escala.
- Planillas físicas Carta vertical, una por página.

### v4.3

- Regreso ordenado a fase anterior con motivo, confirmación y auditoría.
- Eliminación solo de la fase activa más avanzada.
- Selección de jugadores reubicada como Paso 2.
- Filtros avanzados, selección, cabeza de serie y acciones masivas.
- Planillas físicas imprimibles por fase, vista filtrada, pendientes o seleccionadas.
- QR, datos precargados, tabla de entradas y firmas.
- Carga de planillas firmadas con asociación automática o manual.
- Lectura experimental de TXT/CSV/JSON.
- Dependencia `qrcode.react`.

### v4.2

- Agregados 43 jugadores de prueba del Gran Prix Centroamericano Costa Rica Mayo 2026.
- Duplicados omitidos.
- Trazabilidad con `source_association_label` y `source_seed_number`.
- Códigos S.J., ALAJ, P y C.R.
- Fusión automática con `localStorage` sin sobrescribir jugadores existentes.

### v4.1

- PDF Llaves Continua Vertical Carta Todo 1 Página aumentado 35%.
- Escalado equivalente para Legal y R32+.
- Menor espacio reservado al encabezado.
- Mayor tamaño de textos de bracket.

### v4.0

- PDF Llaves Continua con textos superiores en azul oscuro.
- Jugadores y ganador en azul oscuro.
- Formato fijo Vertical Carta para R16.
- Formato fijo Vertical Legal para R32+.
- `startPdfPrint` acepta múltiples clases de impresión y escalado diferenciado.

### v3.9

- Dashboard lee versión desde `package.json`.
- Corrección de traslape sobre encabezado institucional en PDF.
- Escalado de Llaves Continua Horizontal Todo 1 Página.
- Textos superiores en celeste claro.

### v3.8

- Cards de Octavos/R16 aumentadas 30%.
- Campeón reubicado más abajo bajo Final.
- Jugador/Ganador en celeste claro.
- Campo Estado ampliado en PDF.
- Compresión reforzada para salida Todo 1 Página.

### v3.7

- Cards de Octavos/R16 aumentadas 25%.
- Campeón directamente bajo Final.
- Compresión especial de impresión.
- Estados Eliminado y Subcampeón en azul oscuro.
- Reporte de clasificados sin columna Clasificación.
- Clasificados en modo claro con columnas azules.

### v3.6

- PDF Llaves Tabular con ganador en fondo celeste oscuro.
- Alineación izquierda reforzada para Jugador en PDFs.
- PDF Continua con marcador/carambolas en celeste claro.
- Cards continuas más altas y geometría recalculada.

### v3.5

- Márgenes de encabezado PDF ajustados.
- Tablas PDF centradas excepto columnas de jugador.
- Corrección de alineación continua con posiciones absolutas.
- Ganador en PDF continuo con fondo celeste claro.
- Colores PDF para estados Eliminado y No clasificado.

### v3.4.0

- Encabezado PDF repetido sin traslape usando `PdfDocument`.
- PDF de Grupos con celdas centradas excepto jugador.
- Eliminada columna ULT AVG REG.
- Ganador en PDF de Llaves continua en celeste oscuro.
- Conectores y alineación de llave continua mejorados.

### v3.3

- Color de Tipo de resultado y Ganador manual en Partidas modo oscuro.
- Estado No Definido en PDF de Grupos en azul oscuro.
- Preservación de No CBZ al editar jugador maestro.
- Corrección de márgenes de impresión.

### v3.2

- Primera página en blanco eliminada de PDFs.
- Grupos modo oscuro con estados en azul/celeste.
- Partidas modo oscuro con resultados en azul.
- Llaves Continua modo claro con fecha/hora azul claro y ronda azul oscuro.

### v3.1

- PDFs forzados a modo claro.
- Selector de secciones imprimibles en Reportes.
- Persistencia de última configuración de impresión.
- Corte de página por sección.
- Clasificados de primera fase alineado visualmente con ranking final.

### v3.0.0

- Ajustes de color en Jugadores modo oscuro.
- Ajustes de color en Grupos modo claro.
- Umbrales de divisiones editables con tres decimales.
- PDFs forzados a modo claro.
- PDF de Grupos con corte antes de continuación de ordenamiento.
- PDF de Partidas.
- PDF de Calendario.

### v2.9.0

- Fechas visibles en español.
- Agenda de grupos con Estado alineado a Clasificación.
- PDFs con data tamaño 12, jugador destacado y cortes internos.
- Colores PDF institucionales.
- Generar Partidas Proy. revisado para calendarizar hasta final.
- Bracket proyectado con R0/R32/R16/QF/SF/F.

### v2.8

- Corte de página por sección al imprimir/PDF en Reportes.
- Tokens globales CSS para modo oscuro y modo claro.
- Variables de color normalizadas.

### v2.7.0

- Calendarización con mesas activas, días, horarios, blackouts y bloques.
- Generar Partidas Proy. agenda todas las fases.
- Changelog reconstruido desde v0.2.
- Instalación corregida con registry público.
- Reserva vertical para encabezados repetidos.
- Ordenamiento final de grupos dividido en páginas lógicas.
- Umbrales con tres decimales.
- Colores PDF ajustados.

### v2.6.0

- `src/styles/theme.css` con variables globales.
- Ajustes de color en modo oscuro.
- Ajustes PDF con encabezado y borde azul claro.
- Nuevo `STORAGE_KEY` para evitar contaminación de datos locales.

### v2.5.0

- Campos Director Técnico, Representante 1 y Representante 2.
- Tamaño y orientación PDF como combos de configuración.
- Rondas proyectadas no capturables.
- Bloqueo de captura sobre partidas planificadas.

### v2.4.1

- ZIP sin `package-lock.json`.
- `.npmrc` apuntando a npm público.

### v2.4.0

- Modo oscuro / claro en Configuración.
- Corrección de encabezados PDF y agenda de grupos.
- Penales eliminados de fase de grupos.
- Reporte de clasificación muestra solo clasificados.
- Reporte de rendimiento por promedio, puntos, SM1 y SM2.
- Botón Generar Partidas Proy. en Calendario.

### v2.3.0

- Configuración global de ascenso/descenso y PDF.
- Agenda y partidas completadas resaltadas.
- Reportes alineados a tablas de posiciones.
- Ranking final normaliza estados a Clasificado.

### v2.2.0

- PDF de Grupos con corte por grupo.
- PDF de Bracket tabular con corte por fase.
- Sizing Todo 1 Página.
- Menú inicia en Campeonatos.

### v2.1.0

- Sizing PDF 50% y 60%.
- Mejora de impresión vertical y tablas.
- Número y nombre de grupo visibles en PDF.

### v2.0.0

- PDF en sección Grupos.
- Branding ASOBIGRIE + FECOBI en PDFs.
- Configuración de impresión: tamaño, orientación y sizing.

### v1.9.0

- PDF desde Llaves/Bracket según visualización Tabular, Continua o Face to Face.

### v1.8.0

- Reportería filtrada por campeonato actual y participantes.
- ASOBIGRIE como marca principal y FECOBI secundaria.
- Ajustes visuales en ranking y bracket continuo.

### v1.7.0

- Foto/avatar en conformación de grupos.
- Estados completados en partidas.
- Brackets ordenados con patrones para 4, 8, 16 y 32.
- División objetivo Selectivo y promedios especiales.
- Calendario con estructura proyectada hasta final.

### v1.6.0

- Bracket continuo con tarjetas, foto, bandera, marcador, entradas, promedio, SM1/SM2 y campeón.
- Bracket tabular por fase.
- Orden de partidas aprobado para grupos de 3, 4, 5 y 6.
- Look premium oscuro con menú lateral y branding.

### v1.5.0

- Corrección de guardado de jugadores y fotografía.
- Seed movido desde jugador a inscripción del campeonato.
- Internacional usa asociación INTERNACIONAL y división NA.
- Captura renombrada como Partidas.
- Lógica de bloques por mesa.

### v1.4.0

- Campeonatos múltiples.
- Captura avanzada y guardado masivo.
- Cierre deportivo `FINALIZED` y administrativo `COMPLETED`.
- Reporte 5 y reclasificación de divisiones.
- Acta final institucional y exportaciones CSV.

### v1.3.0

- Paquete funcional de cierre deportivo base.
- Bloqueo y reapertura controlada iniciados.

### v1.2.0

- Bracket tabular, continuo y face-to-face.
- Filtros por ronda en Partidas y Agenda.
- Mejoras de Árbitros, Cierre y Reportes.

### v1.1.0

- Bracket con números mágicos, preclasificación/R0, R16, QF, SF y Final.
- Reportes de fase final y ranking consolidado.

### v1.0.0

- Selección internacional muestra todos los jugadores activos.
- ID consecutivo de partida en calendario, grupos y captura.
- Agenda refleja marcadores capturados.

### v0.9.0

- Selección manual de jugadores por campeonato.
- Tablas de posiciones con estado No Definido hasta completar partidas.
- Agenda editable con filtros, ordenamientos e intercambio de horarios.
- Captura en tarjetas por partida.

### v0.8.0

- Construcción de Campeonato, Grupos y Calendario.
- Reglas por fase/ronda.
- Administración de mesas.

### v0.7.0

- Carga masiva de jugadores por CSV.
- Eliminada dependencia vulnerable `xlsx`.

### v0.6.0

- Carga masiva Excel inicial.
- Banderas del continente americano.
- Asociación INTERNACIONAL automática.
- Promedios con tres decimales.

### v0.5.0

- Banderas SVG internas para países.

### v0.4.0

- Código visible de jugador `JUG-0001`.
- Carga de fotografía JPEG/PNG con vista previa.

### v0.3.0

- Mantenimiento de jugadores con campos extendidos.

### v0.2.0

- Primer paquete modular React/Vite de preproducción fuera de Canvas.
