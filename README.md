# CaromChamps v5.9.0

Actualización enfocada en el flujo de campeonatos tipo Ranking, corrección de visualización Face to Face, alineación de banderas en tablas de grupos, mensajes de confirmación en llaves y scroll del menú lateral.

## Cambios principales v5.9.0

- Face to Face: la partida Final se desplaza hacia abajo para separarla visualmente de las semifinales.
- Face to Face: el card de Campeón/Ganador ahora aparece debajo del card de la Final, con conector vertical.
- PDF Face to Face: aumentada la escala del modo Todo 1 Página y reducido espacio desperdiciado para una visualización más amplia y cómoda.
- Ranking: la columna Jugador ahora incluye historial clicable, asociación y bandera del país alineadas horizontal y verticalmente.
- Ranking: el cálculo ahora incluye solamente jugadores que participaron en campeonatos normales asociados al ranking.
- Ranking: al crear un campeonato tipo Ranking no se requiere ni conserva selección de jugadores participantes.
- `package.json` actualizado a versión `5.9.0`.


## Cambios principales v5.6.0

- Visualización Face to Face reconstruida con geometría tipo árbol, posiciones absolutas por ronda y conectores SVG basados en fuentes reales de partidas.
- R0 se integra como alimentador visual de la primera ronda principal en Face to Face.
- Ranking: puntos de ranking ganados (PRG) en color rojo en tablas generales, detalle y PDF.
- Ranking: métricas acumuladas y por campeonato: PRG, PJ, PG, PP, PE, CAR, ENT y AVG.
- Ranking: nuevo reporte PDF de tabla de posiciones con estándares institucionales de la plataforma.

## Cambios principales v5.5.0

- Campeonatos tipo **Ranking**: se ocultan los pasos operativos normales de grupos, reglas por fase, selección de jugadores y mesas físicas.
- Menú lateral: en campeonatos Ranking se ocultan módulos operativos que no aplican y se redirige automáticamente hacia Ranking si el usuario estaba en una sección no válida.
- Grupos: banderas alineadas en tabla de posiciones y tablas derivadas.
- Llaves: mensajes de confirmación visibles después de generar estructura, resultados de ronda activa, siguiente ronda, PDF y regreso de fase.
- Face to Face: reconstrucción de ramas izquierda/derecha usando fuentes reales de partidas (`source_match1_id` / `source_match2_id`) e inclusión de R0 cuando alimenta posiciones del bracket principal.
- Menú: scroll vertical para que las opciones finales siempre sean visibles al cambiar el tamaño de pantalla.
- Ranking: tabla acumulada por jugador y matriz de puntos por campeonato jugado, más detalle por campeonato asociado.
- `package.json` actualizado a versión `5.6.0`.

## Instalación y validación

```powershell
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run check:syntax
npm.cmd run build
npm.cmd run dev
```

---

# CaromChamps v5.4.0

Actualización funcional y visual enfocada en producción web: pantalla de ingreso premium, modo claro por defecto, menú colapsable, perfil de usuario, fechas localizadas por idioma, reapertura controlada de grupos, mejora del PDF continuo R32/Dieciseisavos y primera versión de campeonatos tipo Ranking.

## Cambios principales v5.2.0

- Pantalla de login/registro rediseñada con diseño visual profesional y acceso social.
- Modo claro como tema por defecto para nuevos usuarios/campeonatos.
- Menú lateral colapsable con iconos y accesos a Perfil/Cerrar sesión.
- Módulo de ajustes de perfil con foto, país y teléfono validado.
- Clasificados en modo oscuro para tablas de grupos con fondo azul claro y texto azul.
- Eliminada restricción de clasificados pares; R0 resuelve cantidades no mágicas.
- División objetivo movida al Paso 1 del campeonato.
- Fechas localizadas por idioma: español, inglés y coreano.
- Botón Reabrir grupos bajo validaciones de seguridad.
- PDF continuo de llave con Dieciseisavos/R32 ampliado para aprovechar mejor la hoja Legal.
- Nueva funcionalidad Ranking: campeonatos tipo Ranking, reglas de puntuación configurables y tabla acumulada por jugadores.

# CaromChamps — Plataforma de Campeonatos v5.2

CaromChamps v5.2 introduce la primera capa de plataforma multiusuario con Supabase: autenticación por correo, Google y Facebook, perfiles de usuario, rol Admin, separación de datos por usuario, sincronización de estado en Supabase y enlaces compartidos de campeonatos para usuarios activos.

## Configuración Supabase requerida

Antes de publicar v5.2, ejecutar en Supabase el script:

```text
docs/supabase_schema_v5.sql
```

Configurar en Cloudflare Pages las variables:

```text
VITE_SUPABASE_URL=https://vmcbaexkbenbesygxccu.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key de Supabase>
```

Configurar en Supabase Auth:

```text
Site URL: https://caromchamps.com
Redirect URLs:
https://caromchamps.com/*
http://localhost:5173/*
```

El usuario `vsolanos@gmail.com` queda definido como Admin por el script de base de datos. La contraseña debe gestionarse únicamente desde Supabase Auth y nunca guardarse en el código.

## Instalación y validación

```powershell
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run check:syntax
npm.cmd run build
npm.cmd run dev
```

## Cambios principales v5.2

- Pantalla inicial de CaromChamps con login y registro.
- Registro con nombre, correo, país, código telefónico, teléfono validado y foto opcional de perfil.
- Autenticación con correo/contraseña, Google y Facebook.
- Confirmación de correo administrada por Supabase Auth.
- Perfil de usuario con foto hasta 5 MB.
- Rol `ADMIN` para `vsolanos@gmail.com`; usuarios nuevos como `ORGANIZER`.
- Datos separados por usuario y sincronización con Supabase en `user_app_states`.
- Migración local inicial para Admin desde la data histórica guardada en navegador.
- Enlaces compartidos de campeonato en modo solo lectura para usuarios activos.
- Vista compartida con grupos, llaves, partidas KO y ranking público.
- Documentación SQL y guía de configuración Supabase en `docs/`.

---

# CaromChamps — Control de Campeonatos v4.14

Versión de transición al repositorio oficial `vsolanos/caromchamps`. Mantiene la instancia inicial FECOBI / ASOBIGRIE, pero establece **CaromChamps** como nombre comercial y nombre técnico del paquete.

Esta versión incorpora tres ajustes operativos: PDF tabular con Dieciseisavos/R32 optimizado para aprovechar mejor el espacio en una sola hoja, intercambio de jugadores en Grupos activo por defecto sin botón de modo, y alineación consistente del nombre del jugador con su bandera en tablas de posiciones.

## Instalación

```powershell
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
```


Aplicación React/Vite para gestión integral de campeonatos de billar carambola a 3 bandas: jugadores, campeonatos, grupos, calendario, partidas, llaves/bracket, reportes, cierre y configuración global.

## Instalación limpia recomendada en Windows

> Importante: si vienes de una versión anterior, usa una carpeta nueva o elimina `node_modules` y `package-lock.json` antes de instalar. Esto evita que npm intente descargar paquetes desde registros internos antiguos.

```powershell
# Dentro de la carpeta del proyecto
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
```

Abrir:

```text
http://localhost:5173/
```

## Instalación rápida si es carpeta nueva

```powershell
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run dev
```

## Validación de sintaxis

```powershell
npm.cmd run check:syntax
```



## Ajustes principales v4.13

- PDF Llave Continua: detección de brackets con Dieciseisavos/R32 o mayores y uso automático de preset Legal Todo 1 Página.
- PDF Llave Continua: agregado modo especial `bracket-continuous-r32plus` con escala, encabezado compacto y reglas anti salto para evitar primera página en blanco.
- PDF Llave Continua: se conserva el comportamiento ya estabilizado de Octavos, Cuartos, Semifinal y Final.
- Grupos: Intercambio y Sustitución ahora son modos independientes; el usuario debe elegir primero la acción.
- Grupos: el modo Intercambio vuelve a operar de forma inmediata seleccionando dos líneas, sin cargar selector de sustitutos.
- Grupos: el selector de sustitutos solo se renderiza en modo Sustitución y después de seleccionar el jugador origen.
- Grupos: validaciones de bloqueo memoizadas para reducir renders y consumo de recursos.
- package.json actualizado a 4.13.0.
- README.md actualizado a v4.13.
- CHANGELOG.md actualizado a v4.13.

## Ajustes principales v4.12

- Corrección crítica: la sección Grupos ya no queda en blanco al seleccionar un jugador para intercambiar o sustituir.
- Causa corregida: `Groups.js` usaba el componente `Select` en la barra de sustitución sin importarlo desde `components/ui.js`.
- Se conserva la funcionalidad de intercambio y sustitución introducida en v4.11.
- Se mantiene el bloqueo de intercambio/sustitución cuando los grupos están cerrados, hay partidas finalizadas, existen clasificados o se generó una fase posterior.
- package.json actualizado a 4.12.0.
- README.md actualizado a v4.12.
- CHANGELOG.md actualizado a v4.12.


## Ajustes principales v4.10

- PDF Llave Continua: la columna de Octavos/R16 incrementa 9% el tamaño visual de sus cards frente al ajuste v4.9.
- PDF Llave Continua: todas las demás columnas usan el mismo factor visual de cards que Octavos para mantener consistencia entre fases.
- PDF Llave Continua: conectores horizontales y verticales reforzados para evitar cortes entre cards y fases.
- package.json actualizado a 4.10.0.

## Ajustes principales v4.9

- Llaves continua: la fase activa ya no usa un renderizado especial de card; todas las fases usan el mismo template visual y las mismas dimensiones.
- Llaves continua: corrección del caso en que la Final finalizada, antes de cerrar/generar campeón, se desordenaba o quedaba montada con el card de campeón.
- Llaves continua: el card de Campeón/Ganador aparece únicamente cuando la Final está finalizada y se posiciona como nodo independiente a la derecha de la Final.
- Llaves continua: se agregó conector visual desde la Final hacia el card de Campeón/Ganador.
- PDF llave continua: se replica la misma separación de campeón y template unificado para evitar traslapes en impresión Carta/Legal.
- package.json actualizado a 4.9.0.

## Ajustes principales v4.6

- Llaves continua: la fase activa/current round ahora usa la misma geometría, altura fija y comportamiento visual que las fases anteriores ya consolidadas.
- Llaves continua: se corrigió la visualización de placeholders de ganador para evitar textos largos basados en IDs internos y mostrar referencias legibles tipo Ganador P-###.
- Planillas físicas: la cantidad de líneas se calcula desde el campo **Límite entradas default** del campeonato.
- Planillas físicas: si el límite default es 0, se imprimen 60 líneas máximas.
- Planillas físicas: el resumen inferior de Jugador 1, Árbitro y Jugador 2 duplica la altura útil de sus renglones para facilitar escritura y firmas.
- package.json actualizado a 4.6.0.

## Ajustes principales v4.5

- Jugadores: Tirso González queda como República Dominicana / Internacional. Marcos Valencia, William Pitty, Carlos Núñez, Ricardo Espinoza, Victor Espinoza, Rafael Bardayán, Julio Atencio, Daniel Acosta, Faustino Murillo, Carlos Patiño y Pablo Beltrán quedan como Panamá / Internacional.
- Grupos: nueva función para intercambiar jugadores entre grupos o dentro del mismo grupo seleccionando dos líneas de jugadores. Limpia resultados afectados, clasificaciones y llaves posteriores para evitar inconsistencias.
- Historial de jugador: los nombres de jugadores pasan a ser clicables en módulos clave; se abre historial completo por campeonato con fase, partida, carambolas, entradas, promedio individual, promedio total y detalle de partida.
- Llaves: la visualización continua con fase de preclasificación/R0 ahora alinea esa columna como alimentadora del bracket principal, evitando cards cortadas y asociaciones incorrectas.
- PDF Llave continua: incremento de escala y tamaño de textos para aprovechar mejor el espacio disponible en Carta/Legal Todo 1 Página.
- Planillas físicas: ajuste a tamaño Carta vertical de una página por planilla, centrado y compactado. Columnas de control actualizadas a CONT, CAR, ACUM y espacio en blanco.
- Planillas físicas: resumen final actualizado con Total Carambolas, SM1, SM2 y firmas de Jugador 1, Árbitro y Jugador 2.
- package.json actualizado a 4.5.0.

## Ajustes principales v4.3

- Llaves: nueva función **Regresar fase** de forma ordenada, sin saltarse fases, con confirmación, motivo obligatorio y auditoría.
- Llaves: el regreso elimina únicamente la fase eliminatoria activa más avanzada y conserva fases anteriores; grupos se conservan como última fase de retorno.
- Campeonato: la selección de jugadores queda como **Paso 2** y se mejora con búsqueda, filtros por país/división/asociación/estado/cabeza de serie/selección, contadores y acciones masivas.
- Jugadores: normalización de códigos Gran Prix: S.J. y C.R. => AJOBI; ALAJ => ASOBIGRIE; P => Internacional / Panamá.
- Partidas: generación masiva de planillas físicas imprimibles por partida, con encabezado del campeonato, logo configurable, código de partida, QR, datos precargados, tabla por entradas y firmas de jugadores/árbitro.
- Partidas: carga masiva de planillas firmadas en imagen/PDF/TXT/CSV/JSON, almacenamiento local en IndexedDB y asociación automática por nombre de archivo con formato P-###.
- Partidas: asociación manual asistida cuando el archivo cargado no incluye código de partida.
- Partidas: lectura experimental de texto cuando el archivo cargado es texto/CSV/JSON; las imágenes manuscritas quedan como respaldo documental para captura manual.
- package.json actualizado a 4.3.0 e incorpora dependencia qrcode.react para QR impreso en planillas.
- README.md y CHANGELOG.md actualizados a v4.3.

## Ajustes principales v4.2

- Data de prueba: agregados 43 jugadores nuevos identificados en la lista del Gran Prix Centroamericano Costa Rica Mayo 2026.
- Data de prueba: se omitieron jugadores repetidos ya existentes en la base del MVP, incluyendo variaciones por acentos o nombres equivalentes previamente registrados.
- Jugadores: se conserva trazabilidad del código fuente visible en la lista original mediante `source_association_label`, `source_seed_number` y notas del jugador.
- Asociación/filtro: se agregan códigos de prueba S.J., ALAJ, P y C.R. para poder visualizar y filtrar la información tal como aparece en el archivo fuente.
- Inicialización: si existe `localStorage` previo, la aplicación fusiona los jugadores nuevos sin duplicar los existentes.
- package.json actualizado a 4.2.0.
- README.md y CHANGELOG.md actualizados a v4.2.

## Ajustes principales v4.1

- PDF Llaves / Continua Vertical Carta Todo 1 Página: aumento aproximado del 35% en el tamaño útil del bracket después de revisar el PDF generado.
- PDF Llaves / Continua Vertical Legal Todo 1 Página: ajuste equivalente de escalado para mantener consistencia cuando el bracket inicia en Dieciseisavos/R32 o más.
- PDF Llaves / Continua: reducción controlada de espacio reservado al encabezado institucional para aprovechar mejor el área imprimible sin traslapes.
- PDF Llaves / Continua: textos de fase, orden, AVG, CAR, ENT, jugadores, ganador, marcadores y estado con mayor tamaño para mejorar legibilidad.
- package.json actualizado a 4.1.0.
- README.md y CHANGELOG.md actualizados a v4.1.

## Ajustes principales v4.0

- PDF Llaves / Continua: los textos superiores de card como Fase, Orden, AVG, CAR y ENT usan azul oscuro.
- PDF Llaves / Continua: los nombres de jugadores y texto de ganador usan azul oscuro para mejorar lectura en impresión.
- PDF Llaves / Continua: se crean dos formatos fijos de salida:
  - Vertical Carta · Todo 1 Página cuando el bracket inicia en Octavos/R16.
  - Vertical Legal · Todo 1 Página cuando el bracket inicia en Dieciseisavos/R32 o más.
- PDF Llaves / Continua: la generación de PDF ignora los controles manuales de orientación/tamaño en esta vista para aplicar el subreporte correcto automáticamente.
- Documentación y versión actualizadas a v4.0.

## Ajustes principales v3.9

- Dashboard: el título y resumen de versión ahora se calculan dinámicamente desde `package.json`, evitando textos fijos como v3.0.
- PDF Llaves / Continua: se corrige el traslape de información sobre el encabezado institucional.
- PDF Llaves / Continua Horizontal con sizing **Todo 1 Página**: se aumenta el escalado útil para aprovechar mejor el espacio disponible sin comprimir innecesariamente.
- PDF Llaves / Continua: el escalado se aplica al cuerpo del bracket, no al encabezado/padding institucional.
- Llaves / Continua: textos superiores de card relacionados con fase, orden, AVG, CAR y ENT en celeste claro.

## Ajustes principales v3.8

- Llaves / Continua: se aumentó 30% adicional la altura de las cards de Octavos/R16 respecto a v3.7.
- Llaves / Continua: la card del campeón queda 25% más abajo bajo la card de la Final.
- Llaves / Continua: textos de Jugador/Ganador dentro de las cards en celeste claro.
- PDF Llaves / Continua: el campo Estado de partida tiene mayor ancho para evitar que el texto salga partido.
- PDF Llaves Continua Horizontal con sizing **Todo 1 Página**: se reforzó el escalado especial para compensar la mayor altura de Octavos/R16.

## Ajustes principales v3.7

- Llaves / Continua: se aumentó 25% adicional la altura de las cards para Octavos/R16 respecto a v3.6.
- Llaves / Continua: la card del campeón queda ubicada justo debajo de la card de la Final.
- PDF Llaves Continua Horizontal con sizing **Todo 1 Página**: se ajustó la compresión especial de impresión para buscar salida en una sola página.
- Reporte General: Estado **Eliminado** y **Subcampeón** usan texto azul oscuro.
- Reporte Clasificados de primera fase: se eliminó la columna **Clasificación**.
- Modo claro en Clasificados de primera fase: columnas en azul oscuro excepto Jugador.

## Comandos oficiales PowerShell

```powershell
# Instalar dependencias desde npm oficial
npm.cmd install --registry=https://registry.npmjs.org/

# Revisar sintaxis del proyecto
npm.cmd run check:syntax

# Ejecutar aplicación en modo desarrollo
npm.cmd run dev
```

## Ajustes principales v3.4

- Cambio estructural de impresión PDF: encabezado institucional repetido mediante tabla de encabezado, evitando traslapes con la data en páginas sin corte manual.
- PDF de Grupos: celdas centradas, excepto columnas de jugador; se elimina ULT AVG REG de la conformación de grupo.
- PDF de Llaves / Continua: tarjeta/fila del jugador ganador en celeste oscuro.
- Llaves / Continua: conectores verticales y horizontales más visibles y alineación de rondas mejorada.
- Se mantiene generación de PDFs en modo claro, aunque la aplicación esté en modo oscuro.

## Notas de PDF

Los PDFs usan la impresión nativa del navegador. Para mejores resultados:

- Activar **Gráficos de fondo** en el diálogo de impresión.
- Usar orientación **Horizontal** para reportes muy anchos.
- Usar **Todo 1 Página** solo para reportes cortos.
- Si el navegador conserva configuraciones anteriores, cerrar la vista previa de impresión y volver a generar el PDF.

## Estructura principal

```text
src/
  App.js
  data/defaults.js
  lib/tournament.js
  lib/print.js
  components/ui.js
  components/Print.js
  modules/
    Championships.js
    Players.js
    Setup.js
    Groups.js
    Schedule.js
    Capture.js
    Bracket.js
    Reports.js
    CloseTournament.js
    Configuration.js
    Officials.js
    Audit.js
  styles.css
  styles/theme.css
```


## v2.8

- Reportes PDF: corte de página por cada sección del módulo Reportes.
- Paleta global: aplicación de tokens CSS solicitados para modo oscuro, modo claro y PDF.
- Se mantiene instalación limpia sin package-lock y registro público npm.


## v3.1
- PDFs siempre fuerzan paleta de modo claro, aunque la aplicación esté en modo oscuro.
- Reportes permite seleccionar secciones a imprimir en PDF con checks persistentes en localStorage.
- PDFs insertan una primera página en blanco antes del contenido para facilitar impresión desde página 2.
- Clasificados de primera fase en modo claro usa el mismo estilo visual que Ranking final consolidado.


## v3.3
- Eliminada primera página en blanco de PDFs.
- Ajustes de colores en Grupos, Partidas y Llaves Continuas.


## v3.4

- Corrección estructural de encabezados PDF usando `PdfDocument` y `table-header-group`.
- Mejoras de centrado en tablas del PDF de Grupos y eliminación de ULT AVG REG en conformación.
- Ajustes visuales en bracket continuo y PDF de bracket continuo.


## v3.5

- Ajuste de margen lateral del encabezado PDF sin mover su posición.
- Centrado de columnas en PDFs de Bracket Tabular y Reportes, dejando campos de jugador alineados a la izquierda.
- Visualización continua de llaves con layout absoluto por slots para mejorar alineación de cards y conectores en R32/R16/QF/SF/F.
- Ganador en PDF de llaves continuas con fondo celeste claro.
- Estados Eliminado y No clasificado con colores solicitados en PDF de Reportes.


## v3.6

- PDF de Llaves Tabular: fila completa del jugador ganador con fondo celeste oscuro.
- Reportes PDF: columnas/campos Jugador alineados siempre a la izquierda, incluyendo reportes, grupos, cierre y bracket tabular.
- PDF de Llaves Visualización/Continua: texto de carambolas en celeste claro.
- Llaves Continua: aumento de altura de cards y slots para que Octavos muestre ambos jugadores y estadísticas completas sin perder asociaciones hacia cuartos, semifinal y final.


## v4.5.0 - Ajustes visuales y operativos

- Banderas rediseñadas para distinguir mejor Panamá y República Dominicana.
- PDF de llave continua: selección de formato Carta o Legal, manteniendo Todo 1 Página.
- Llave continua: cards más anchas, mayor separación entre columnas y campeón ubicado al lado derecho de la Final con tamaño aumentado.
- Historial de jugador: línea seleccionada en rojo y panel de detalle reducido.
- Modo claro de llave continua: colores oficiales para nombres, clasificado, fase, métricas y ganador.
- Planillas: columnas NUM, CON, CAR, ACU; hora y mesa en blanco; resumen al final de la página; ajuste para una página tamaño carta.


## v4.8.0 - Corrección profunda de Llaves Continua

- Se estabilizó la geometría de la visualización continua para que la fase activa use exactamente el mismo ancho, altura y template que las fases anteriores.
- Se eliminó el uso de padding especial aplicado a la última columna, que podía deformar la fase actual cuando todavía no existía fase siguiente.
- Se fijó un ancho de columna único y explícito para R0, Octavos, Cuartos, Semis y Final.
- El nodo de Campeón se reserva únicamente cuando la Final está finalizada y se muestra a la derecha de la Final sin invadir el card.
- La misma regla se aplica al PDF continuo para evitar que la fase actual se compacte o se desordene.

## v4.9.0 - Corrección de Campeón y PDF continuo

- Se separa el card de Campeón mucho más a la derecha de la Final para evitar traslape.
- Se amplía la reserva horizontal de la columna Final cuando existe campeón.
- En PDF de Llave Continua Todo 1 Página, la columna de Octavos/R16 se reduce 25% para evitar información estrujada o traslapada.
- Se mantiene la geometría estable de fases anteriores, fase activa y conexiones.



### Nota v5.2.0

Esta versión corrige un error crítico posterior al login que podía dejar la aplicación en blanco y agrega una pantalla de recuperación ante errores de runtime.


## v5.4.0 - Ajustes de llaves Face to Face y flujo R0

- Se elimina el botón visible **Bracket después R0**.
- El botón **Generar siguiente ronda** ahora cambia a **Generar bracket principal** cuando corresponde salir de R0.
- Se bloquea la duplicación del bracket principal posterior a R0.
- Se rediseña la vista **Face to Face** con dos mitades simétricas del bracket y final central.
- El PDF Face to Face se genera en horizontal, Todo 1 Página, con diseño alineado a la visualización continua.
- En modo claro, la tabla **Clasificados de primera fase** muestra toda su data en azul.
- Se agrega `public/_redirects` para evitar error al refrescar rutas en Cloudflare Pages.


### Hotfix v5.4.0 - carga post-login
- Se reforzó AuthGate para que la app principal cargue inmediatamente después del login usando un perfil local de sesión.
- La sincronización con Supabase queda asincrónica y no bloquea el render de la aplicación.
- Se agregaron timeouts y manejo seguro de errores en perfil, estado remoto y auditoría para evitar pantallas en blanco por red/RLS/Supabase.


## v5.4.0 - Estabilidad de refresco local y sesión

- Se agregó `vite.config.js` para fijar puerto local `5173` y evitar cambios silenciosos de puerto al reiniciar.
- Se agregó timeout de lectura de sesión Supabase para evitar que la app quede bloqueada al refrescar.
- Se agregó script `npm.cmd run dev:clean` para limpiar cache de Vite/dist cuando Chrome o Vite queden inconsistentes.
- Se agregaron headers de no-cache para `index.html` en Cloudflare Pages.

Comando recomendado de desarrollo:

```powershell
npm.cmd run dev:clean
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run check:syntax
npm.cmd run build
npm.cmd run dev
```

## UX guiada v5.9.0

- Se agrega una interface guiada por flujo de trabajo con navegación agrupada: Inicio, Preparar, Operar, Resultados y Administración.
- Se conserva la interface clásica con cambio temporal desde el menú y el topbar.
- Dashboard guiado con siguiente acción recomendada, alertas, workflow stepper, catálogo de reportes, checklist de cierre y vista previa de agenda por mesa.
- Banner explicativo para campeonatos tipo Ranking.
- Base reusable `DataTableCarom` para futuras tablas con búsqueda, ordenamiento, densidad y exportación CSV.
