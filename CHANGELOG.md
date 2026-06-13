## v7.5.0 - Tema CaromChamps, selector de interfaz y fix de sincronización

### Identidad visual
- Nuevo tema de marca **CaromChamps "Precision Blue"** como skin opcional (eje independiente del modo claro/oscuro y de la interfaz). `Estándar` sigue siendo el predeterminado, así que nadie ve cambios hasta elegirlo. Incluye paleta clara y oscura, tipografía Montserrat (títulos) / Inter (interfaz) y estilo gráfico (header con degradado, tarjetas redondeadas, acentos azul/amarillo/rojo). Todo aislado bajo `.skin-caromchamps` en `src/styles/skin-caromchamps.css`.
- Logo oficial CaromChamps integrado: lockup completo (`caromchamps-logo.png`) en la barra lateral del tema y en la pantalla de login, e isotipo (`caromchamps-isotipo.png`, la "C" + las tres bolas) en el TopBar y el hero del Grand Dashboard.
- Selector **"Tema visual de la plataforma"** en Configuración (Estándar / CaromChamps), preferencia por dispositivo.

### Interfaz
- La selección de interfaz (ProV / IA / Clásica) se movió a un **combo box en Configuración**; ProV es la predeterminada. Se quitaron los botones de cambio de interfaz inline de los headers IA/Clásica.
- Los pills de selección de interfaz que aparecían en el TopBar y el hero se reemplazaron por el isotipo de marca, alineado.

### Seguridad de datos
- `saveUserAppState` (`src/lib/supabase.js`) ya **no sobrescribe a ciegas** la copia remota de `user_app_states` cuando no se cargó primero en la sesión: si existe una fila y `expectedUpdatedAt` es nulo (p. ej. tras un error de lectura de la nube con estado local por defecto), devuelve conflicto en vez de pisar la copia buena. Corrige la causa raíz de una pérdida de datos donde el estado por defecto reemplazaba los campeonatos del usuario en la nube.

## v7.4.0 - PII fuera del payload público de inscripciones

### Seguridad
- El payload público de inscripciones (`public_registration_publications.payload`, legible con la anon key para la página `#register=<championship_id>`) ya NO contiene PII: se eliminaron `id_number` (cédula), `id_type`, `email` y `phone_e164` de la lista de jugadores publicada. Solo viajan nombre, `player_id` y datos deportivos que ya son públicos en resultados.
- La PII completa se guarda en la nueva columna `private_payload`, sin privilegio de SELECT para `anon`/`authenticated` (revocación a nivel de columna).
- El reconocimiento de jugadores existentes por cédula o correo en la página pública ahora se hace con la RPC `match_public_registration_player` (security definer): recibe el dato digitado y devuelve solo el resumen no sensible del jugador coincidente o `null`. El reconocimiento por nombre sigue siendo local (los nombres permanecen en el payload público). Se descartó publicar hashes SHA-256 de cédulas porque con ~9 dígitos se revientan offline en segundos.
- Nueva migración `docs/supabase_migration_v7_4.sql`: crea la columna y la RPC, ajusta los privilegios y sanea las publicaciones existentes (mueve la PII a `private_payload` y la elimina del payload público). **Debe ejecutarse en el SQL Editor de Supabase al desplegar esta versión; los clientes anteriores a v7.4 vuelven a publicar PII, ver nota operativa al final del script.**

## v7.3.0 - Calidad, seguridad de roles y sincronización segura

### Seguridad
- El cliente ya NO envía la columna `role` al crear/actualizar perfiles en Supabase. El rol lo asigna y protege exclusivamente la base de datos.
- Nueva migración `docs/supabase_migration_v7_3.sql`: trigger `protect_profile_role` que impide la autopromoción de rol, rol por defecto `USER`, y políticas RLS para `profiles`, `user_app_states` y `audit_logs`. **Debe ejecutarse en el SQL Editor de Supabase al desplegar esta versión.**

### Sincronización
- Detección de conflictos al guardar en Supabase: antes de sobrescribir `user_app_states` se compara el `updated_at` remoto con la última lectura conocida. Si otra sesión o dispositivo guardó después, NO se sobrescribe la nube y se muestra un aviso pidiendo recargar (antes el último en escribir pisaba silenciosamente los datos del otro).

### Calidad y tooling
- Suite de tests unitarios con Vitest para `lib/tournament.js` (50 tests): grupos, round robin, validaciones de partida, standings, clasificación, llaves y números mágicos. Ejecutar con `npm test`.
- ESLint (flat config) + Prettier configurados; el script manual `check:syntax` fue reemplazado por `npm run lint`.
- Nuevo script `npm run check` (lint + test + build) como verificación completa local.
- CI con GitHub Actions (`.github/workflows/ci.yml`): lint, tests y build en cada push/PR a main.
- Corregido escape innecesario en regex de `AiSheets.js` detectado por el linter.

### UX
- Nuevo sistema de notificaciones (`src/components/notify.js`): toasts no bloqueantes (`notify`) y confirmaciones asíncronas (`confirmAction`) que reemplazan `alert`/`confirm` nativos. Migrados los diálogos de App.js (feedback, Grupos F2, eliminar campeonato, compartir enlace); los módulos restantes migrarán gradualmente.

### Mantenimiento
- `vite` y `@vitejs/plugin-react` movidos a `devDependencies` (no son dependencias de runtime).
- Claves de preferencias de interfaz (`UX_MODE_KEY`, `UI_THEME_KEY`) centralizadas en `src/data/defaults.js` junto a `STORAGE_KEY`.
- Documento de especificación `.docx` movido a `docs/`.

### Deuda técnica documentada (próximas versiones)
- Normalizar el blob `user_app_states` en tablas reales con RLS por campeonato.
- Migrar fotos de jugadores (data-URLs) a Supabase Storage.
- Consolidar `styles.css` (1,881 `!important`, 45 bloques `@media print`).
- Completar migración de `alert`/`confirm` en módulos restantes.
- Migración gradual a JSX y tipado con JSDoc/TypeScript.

## v7.2.0

- Responsive ProV aplicado solamente bajo `.app-shell.ux-mode-pro`, sin modificar las interfaces IA ni Clasica.
- Navegacion ProV adaptada para tablet y celular: header sticky, tabs horizontales, topbar flexible y controles tactiles.
- Dashboards, formularios, toolbars, cards, tabs de campeonato, paneles de llaves, Partidas, Planillas IA y vistas operativas ajustadas con breakpoints responsivos.
- Tablas operativas convertidas a tarjetas moviles en ProV para Usuarios, Inscripciones, Campeonatos, pendientes, Jugadores, Calendario, Grupos y Ranking.
- Calendario recibio clases especificas para tablas de dias, bloqueos y agenda, permitiendo tarjetas moviles sin afectar otras interfaces.
- README reconstruido como documento principal actualizado con estado real, instalacion, Supabase, Cloudflare Pages, verificacion, modulos e historial consolidado de versiones.
- `package.json` actualizado a `7.2.0`.

## v7.1.1

- Hotfix de Inscripciones: corregida la publicación de la página pública para que el estado cambie inmediatamente a publicada después de presionar Publicar inscripción.
- Inscripciones públicas: agregado resolvedor robusto de publicación que primero consulta el registro público y, si no existe, busca la publicación activa en el estado local de la aplicación.
- Inscripciones públicas: mejor manejo de errores de almacenamiento local, mostrando mensaje claro si el navegador no permite guardar la publicación.
- Inscripciones públicas: payload de publicación compactado para reducir riesgo de cuota localStorage y mejorar apertura del enlace.
- Link público de inscripción mantiene formato /#register=ID_CAMPEONATO y permite fallback desde el estado local del campeonato publicado.


## v7.1.0 - Gestión de usuarios e inscripción pública de campeonatos

- Se agrega módulo **Usuarios** para administración de usuarios de plataforma con roles: Super usuario, Usuario normal y Visualizador.
- Se incorporan estados de usuario, alcance de instancia, nivel de seguridad, MFA informativo, trazabilidad de cambios y buenas prácticas de privilegio mínimo.
- Se agrega control de acceso por rol en la navegación ProV, IA y Clásica.
- Se agrega módulo **Inscripciones** dentro del campeonato activo.
- Cada campeonato puede publicar una página pública de inscripción con branding CaromChamps.
- La página pública reconoce jugadores existentes por identificación, correo o nombre; si el jugador es nuevo, solicita los datos requeridos.
- Las solicitudes quedan en bandeja de revisión con estados: RECIBIDA, VALIDADA, APROBADA, RECHAZADA, DUPLICADA y EN_REVISION.
- Al aprobar una inscripción se sincroniza con el maestro de jugadores y con los participantes del campeonato.
- La publicación genera un enlace público `#register=<championship_id>` y mantiene almacenamiento local de publicación/solicitudes para pruebas.
- Preparado para llevar esta lógica a Supabase con RLS, tablas de usuarios, inscripciones y políticas por owner_user_id.


## v7.0.0

- Nueva funcionalidad **Planillas IA** para carga masiva de PDF e imágenes de planillas firmadas.
- Nuevo tab operativo **Planillas IA** dentro del campeonato, ubicado entre Partidas y Llaves.
- Identificación automática de partida por QR, código de partida en archivo, payload estructurado o respuesta de endpoint IA/OCR.
- Bandeja de revisión IA con estado, confianza, partida detectada, marcador, entradas, SM1, SM2, ganador y tipo de resultado.
- Asociación automática de cada archivo o imagen extraída a la partida correspondiente como evidencia consultable.
- Soporte de arquitectura para PDFs multipágina: el endpoint IA/OCR puede retornar una fila por página/partida con imagen extraída.
- Guardado de resultados por revisión humana y aprobación masiva de lecturas de alta confianza.
- Reglas de seguridad: partidas ya finalizadas requieren confirmación y auditoría; duplicados se marcan como tales.
- Control de Promedios = No: la importación IA ignora entradas, pero mantiene carambolas, SM1, SM2, tipo de resultado y ganador.
- Endpoint IA/OCR configurable por campeonato desde el tab Planillas IA.
- `README.md`, `CHANGELOG.md`, `package.json` y validación sintáctica actualizados a v7.0.0.


## v6.9.5

- Hotfix reforzado en modo oscuro / Tab Partidas: Carambolas, Entradas, SM1, SM2, Tipo de resultado y Ganador manual quedan en azul oscuro real `#0F2A5F`.
- Se agregó clase específica `capture-dark-blue-field` y estilo directo desde `Capture.js` para evitar que reglas globales de tablas, inputs o tarjetas sobrescriban el color.
- Se mantiene fondo gris claro `#E5E7EB` en los campos críticos para asegurar legibilidad.

## v6.9.4

- Hotfix: en modo oscuro / tab Partidas se fuerza el color azul oscuro `#0F2A5F` para Carambolas, Entradas, SM1, SM2, Tipo de resultado y Ganador manual.
- Se agrega estilo directo a Entradas en `Capture.js`, quedando alineado con Carambolas, SM1 y SM2.
- Se refuerzan reglas CSS de alta especificidad para evitar que estilos globales sobrescriban el color solicitado.


## v6.9.3

- Hotfix en modo oscuro / Tab Partidas: se fuerza color oscuro real `#111827` para Carambolas, SM1, SM2, Tipo de resultado y Ganador manual.
- Se agregan clases directas y estilo inline desde `Capture.js` para evitar que reglas globales de tarjetas o inputs restauren el color celeste anterior.
- `Select` ahora acepta `className`, `style` y props adicionales para permitir estilos controlados en campos críticos.


## v6.9.2

- Ajuste visual en modo oscuro / Tab Partidas: los campos de Carambolas, SM1, SM2, Tipo de resultado y Ganador manual mantienen texto café claro y ahora usan fondo gris claro para mejorar legibilidad y consistencia visual.


## v6.9.1

- Hotfix visual en modo oscuro para el Tab Partidas.
- Los textos de Carambolas, SM1, SM2, Tipo de resultado y Ganador manual se ajustan a color café claro.
- Se mantiene fondo claro en estos campos para asegurar legibilidad en modo oscuro.

# Changelog

## v6.9.0

- Partidas / modo oscuro: carambolas, SM1, SM2, tipo de resultado y ganador manual cambian de negro a azul oscuro para mantener mejor contraste visual.
- Plataforma: se agrega menú **Feedback** en el panel izquierdo para dar seguimiento a mejoras, bugs y observaciones registradas desde el botón flotante.
- Feedback: cada registro ahora maneja estado editable manualmente: Recibido, En revisión, Priorizado, En desarrollo, Resuelto, Cerrado o Rechazado.
- Feedback: nueva vista de control con filtros por estado, tipo y búsqueda textual, más resumen de total, recibidos, en proceso y cerrados/resueltos.
- Campeonato / Eliminación Simple: en el tab Campeonato se ocultan campos de configuración de grupos y clasificación F2 que no aplican a esta modalidad.
- Campeonato / Eliminación Simple: se reemplazan los cards de Grupos estimados y Clasificados F2 por información propia de llave directa aleatoria + cabezas de serie.


## v6.8.0

- Partidas / modo oscuro: carambolas, SM1, SM2, tipo de resultado y ganador manual se muestran con texto negro y fondo claro.
- Nuevo tipo de campeonato `ELIMINACION_SIMPLE`.
- Eliminación Simple oculta el tab Grupos y permite enviar todos los jugadores seleccionados directamente a llaves.
- Llaves: generación de estructura aleatoria para Eliminación Simple, usando la misma lógica de bracket, R0 y números mágicos existente.
- Llaves: nuevo botón **Regenerar estructura** para Eliminación Simple, con advertencia si ya existen partidas realizadas.
- Si un jugador tiene No CBZ / cabeza de serie en el campeonato, se respeta su posición; los demás jugadores se asignan aleatoriamente.
- Doble Fase Grupos: el tab Grupos F2 queda visible automáticamente al seleccionar este tipo de campeonato.
- Setup: tarjeta informativa para explicar el comportamiento operativo de Eliminación Simple.


## v6.7.2

- Reporte PDF de Grupos: corregida la visibilidad de nombres en filas clasificadas de la tabla de posiciones.
- Reporte PDF de Grupos: toda la línea del jugador ganador en la agenda se muestra en azul.
- Grupos: títulos de sección centrados y uniformes para Grupo, Tabla de posiciones y Agenda del grupo.
- Grupos/PDF: se agrega respaldo de texto plano para nombres de jugadores durante impresión.


## v6.7.1

- Corrección crítica de carga de aplicación: se agregó la importación faltante de `Field` e `Input` en `src/modules/Groups.js`.
- Soluciona el error de runtime `Field is not defined` generado al desplegar la sección de Grupos con los nuevos filtros agregados en v6.7.0.
- Se mantiene sin cambios funcionales adicionales respecto a v6.7.0.

# Changelog

## v6.7.0

### Ajustes de UX/UI
- Modo claro: el campeonato activo en la lista de campeonatos se resalta con textos en azul para mejorar identificación visual.
- Tab Partidas: se agregaron estilos diferenciados por modo claro/oscuro para nombres de jugadores, carambolas, SM1, SM2 y promedio según la regla solicitada.
- Tab Partidas: el código de partida y grupo/ronda ahora se muestra centrado y con tamaño 50% mayor.
- Grupos: el nombre de cada grupo queda centrado y con tamaño 50% mayor.

### Ajustes funcionales
- Grupos: la agenda del grupo ahora muestra cada partida en dos líneas, una por jugador, incluyendo CAR, ENTR, SM1, SM2, PROM y puntos ganados cuando aplica.
- Grupos: se agregó panel de filtros por grupo y por jugador; al buscar un jugador se muestra el grupo completo donde participó.
- Plataforma: se agregó botón flotante de Feedback para registrar mejoras o bugs con interface, menú, tab y sección editable; el registro queda en Auditoría.
- Generación de partidas: se actualizó el orden oficial de enfrentamientos para grupos de 3, 4, 5 y 6 jugadores y se agregó fallback genérico para grupos de 7 o más jugadores.
- Setup/Wizard: se amplió el soporte operativo para tamaños de grupo mayores a 6 mediante opciones adicionales y validación de mínimo 3 jugadores por grupo.

### Archivos actualizados
- `src/App.js`
- `src/modules/Capture.js`
- `src/modules/Groups.js`
- `src/modules/Championships.js`
- `src/modules/Setup.js`
- `src/lib/tournament.js`
- `src/styles.css`
- `package.json`
- `README.md`

## v6.6.0

- Llaves Face to Face: cards estandarizados con el mismo diseño visual de la vista Continua.
- Llaves Continua y Face to Face: label Ganador y nombre del ganador en azul claro.
- Face to Face: card de Campeón/Ganador debajo de la Final con separación aproximada de 3 cm.
- PDF Face to Face: sizing reducido aproximadamente 12% para mejorar salida de una sola página.
- Grand Dashboard: agregado card de versión actual de plataforma.
- Planillas PDF: plantilla base incluye nombre del campeonato y renglones superiores más anchos.
- README reestructurado con historial completo y comandos actualizados.


## v6.5.0

- Planillas PDF: se restaura la primera planilla en blanco como plantilla base del torneo.
- Planillas PDF: se aísla completamente el área de impresión para que no aparezcan tabs, menús ni controles de ProV en la primera página.
- Planillas PDF: ajuste de tamaño, centrado horizontal y vertical operativo para una planilla por página en Carta.
- Llaves Face to Face: rediseño de posicionamiento central mediante layout absoluto para mover Final y Campeón desde la zona inferior hacia el centro superior solicitado.
- Llaves Face to Face: conectores centrales recalculados para enlazar Semis con la Final en la nueva posición.

## v6.4.0

- Agregados scripts de inicio local y autoarranque para evitar confusión por servidor local detenido (`localhost refused to connect`).
- Corregida generación de planillas: sin hoja en blanco inicial, centrado horizontal/vertical, una página por planilla en tamaño Carta.
- Reubicada la Final y el Campeón en Face to Face hacia la zona superior solicitada, manteniendo conectores desde Semis.
- Ajustado cierre/acta para campeonatos con Control de Promedios = No.

## v6.3.0

- ProV: ajustes de tabs en modo oscuro, links en Grand Dashboard/Ranking y mejoras del Dashboard de campeonato.
- Face to Face: reposicionamiento dinámico de Final y campeón, conectores centrales y PDF al 85% relativo.
- Estabilidad SPA local con hash navigation para refresh/forward/back.
- Control de Promedios configurable por campeonato y planillas PDF con sizing reducido.

## v6.2.0

- Correcciones ProV de modo oscuro, tabs, Grand Dashboard y Dashboard de campeonato.
- Enlaces operativos desde gráficos y ranking a dashboards/reportes/historial.
- Bloqueo de Setup posterior a clasificación/cierre en todas las interfaces.
- Face to Face: Final y campeón reposicionados; PDF ajustado a una página.
- Nueva funcionalidad Doble Fase Grupos con tab Grupos F2 y flujo de clasificación hacia KO.


## v6.1.0

- Interface ProV: Wizard en overlay modal, con opciones SELECTIVO e INTERNACIONAL en División.
- Interface ProV: tabs del campeonato rediseñados como flechas de proceso y sticky durante scroll.
- Dashboard de campeonato: AVG acumulado por fase reducido 25%, reubicado al final después de agenda/lista; agregada lista de partidas pendientes.
- Grand Dashboard: gráfica de campeonatos con más jugadores inscritos usando nombres reales.
- Ranking: dashboard con Top 10, participantes por campeonato asociado y AVG general por campeonato asociado.
- Campeonatos: botón Abrir habilitado para campeonato activo y navegación directa al Dashboard.
- Llaves Face to Face: margen superior compactado, conectores Semis→Final corregidos, PDF ampliado y card de campeón más bajo.


## v6.0.0

- Nueva Interface ProV como interface predeterminada de apertura.
- Se mantienen tres interfaces seleccionables: Interface ProV, Interface IA e Interface Clásica.
- La preferencia de interface se recuerda en localStorage.
- Nuevo Grand Dashboard con estadísticas acumuladas, gráficos de AVG, top 7 de jugadores por AVG y campeonatos con más inscripciones.
- Menú Campeonatos filtra únicamente campeonatos tipo Normal.
- Menú Ranking filtra únicamente campeonatos tipo Ranking.
- Módulos operativos del campeonato convertidos en tabs en el panel derecho: Dashboard, Campeonato, Grupos, Calendario, Partidas, Llaves y Cierre.
- Wizard guiado para creación de campeonatos normales.
- Wizard guiado simplificado para creación de campeonatos Ranking sin asociación manual de jugadores.
- Dashboard de campeonato con gráfica de AVG general acumulado por fase.
- Llaves Continua y Face to Face con Zoom In/Zoom Out independiente de la aplicación.
- Face to Face ajustado para acercar margen superior y encabezados de columnas a la visualización Continua.
- README reestructurado con historial consolidado de versiones y cambios.
- package.json actualizado a 6.0.0.


## v5.9.0

- Nueva interface UX guiada opcional, con navegación agrupada por flujo real de operación.
- Se mantiene la interface clásica sin eliminarla; el usuario puede alternar entre la nueva UX y la anterior desde el topbar o menú lateral.
- Dashboard convertido en centro de control con siguiente acción recomendada, alertas, stepper operativo, catálogo de reportes y checklist de cierre.
- Modo Ranking con banner explicativo y comportamiento guiado para evitar confundir ausencia de menús con errores.
- Se incorpora base técnica `DataTableCarom` para estandarizar tablas futuras con búsqueda, ordenamiento, densidad y CSV.
- Se agregan estilos responsive para nueva navegación, panel contextual y componentes UX sin modificar el flujo clásico existente.


## v5.8.0

- Llaves Face to Face: compactación vertical superior para acercar encabezados de columnas a la geometría de la visualización continua.
- Llaves Face to Face: conectores centrales visibles entre Semis y Final; card de campeón bajado un poco más debajo de la Final.
- PDF Face to Face en modo Todo 1 Página: escala ampliada ~20% y mejor aprovechamiento del espacio superior.
- Ranking: celda de jugador reorganizada con nombre/historial y asociación en bloque izquierdo, bandera alineada a la derecha.
- Ranking PDF: columnas resumen de campeonatos referenciadas como C1, C2, etc., con detalle por campeonato rotulado del mismo modo.
- Ranking resumen por campeonato ajustado a PRG, CAR, ENT, AVG y Pos#.

# v5.7.0 - 2026-05-18

- Ajustada la visualización Face to Face para bajar la Final y evitar que se vea pegada a semifinales.
- Reubicado el card de Campeón/Ganador debajo de la Final con conector vertical.
- Ampliada la escala del PDF Face to Face en modo Todo 1 Página para reducir espacio en blanco y mejorar legibilidad.
- Mejorada la tabla Ranking: columna Jugador con historial clicable, asociación y bandera del país alineadas.
- Corregido Ranking para incluir únicamente jugadores participantes en campeonatos normales asociados.
- Ajustado campeonato tipo Ranking para no requerir selección/asociación de jugadores.
- package.json actualizado a `5.7.0`.

# v5.6.0 - 2026-05-18

- Reconstruida la visualización Face to Face con árbol de asociaciones, conectores SVG y posicionamiento derivado de la lógica continua.
- Corregida la integración visual de R0 como ronda alimentadora de Dieciseisavos/Octavos según corresponda.
- Ranking actualizado para mostrar PRG en rojo en todos los puntos donde aparece.
- Ranking ahora muestra PRG, PJ, PG, PP, PE, CAR, ENT y AVG a nivel general y por campeonato jugado.
- Agregado reporte PDF de tabla de posiciones de ranking con controles institucionales de tamaño, orientación y escala.
- package.json actualizado a `5.6.0`.

# v5.5.0 - 2026-05-18

- Ranking: los campeonatos tipo Ranking ya no muestran pasos operativos normales posteriores al Paso 1.
- Ranking: el menú oculta Grupos, Calendario, Partidas, Llaves, Reportes, Árbitros y Cierre cuando el campeonato activo es Ranking.
- Ranking: agregada matriz de puntos por campeonato jugado y detalle por campeonato asociado.
- Grupos: corregida la alineación de banderas en tablas de posiciones y tablas derivadas.
- Llaves: agregados mensajes de confirmación para procesos principales.
- Face to Face: corregida la asociación de ramas con base en fuentes reales de partidas y agregado soporte visual de R0.
- Menú: agregado scroll vertical/responsivo para visualizar opciones finales en pantallas pequeñas.
- package.json actualizado a `5.5.0`.

# v5.3.0 - 2026-05-18

- Eliminado el botón **Bracket después R0** para evitar duplicidad de llaves.
- `Generar siguiente ronda` asume automáticamente la generación del bracket principal posterior a R0.
- Agregada auditoría `DUPLICATE_BRACKET_BLOCKED` para intentos bloqueados de duplicar bracket.
- Rediseñada visualización **Face to Face** como llave izquierda/derecha con final central y campeón.
- PDF **Face to Face** configurado en horizontal y Todo 1 Página.
- Forzado color azul para toda la data de **Clasificados de primera fase** en modo claro y PDF.
- Agregado `public/_redirects` para fallback SPA en Cloudflare Pages al refrescar la página.


## v5.2.0 - Corrección crítica de acceso post-login

- Corrige error crítico que dejaba la aplicación en blanco después de iniciar sesión.
- Agrega estado faltante `menuCollapsed` requerido por el shell principal de la aplicación.
- Agrega `AppErrorBoundary` para evitar pantallas completamente en blanco ante errores de runtime.
- Mantiene la integración Supabase, pantalla de inicio v5.1, perfil, menú colapsable y funcionalidades Ranking.


## v5.2.0 - Ajustes de usabilidad, ranking y producción

- Rediseño completo de pantalla de ingreso basado en layout premium de CaromChamps.
- Tema inicial cambiado a modo claro.
- Agregado menú colapsable: expandido muestra texto e íconos; contraído muestra solo íconos.
- Agregados accesos de Perfil y Cerrar sesión desde el menú.
- Nuevo módulo de perfil para actualizar nombre, país, teléfono y foto.
- En modo oscuro, clasificados de grupos usan fondo azul claro y texto azul.
- Eliminada validación de cantidad par de clasificados a F2; R0 queda como mecanismo de reducción.
- División objetivo movida al Paso 1 de configuración del campeonato.
- Agregada preferencia de idioma para fechas: español, inglés y coreano.
- Agregada reapertura controlada de grupos cuando no existen fases posteriores activas.
- Ajustado PDF continuo vertical Legal con Dieciseisavos para mayor uso de la hoja.
- Agregados campeonatos tipo Ranking, asociación desde campeonatos Normal y tabla acumulada de puntos.

# Changelog

## v5.2.0

- Nueva pantalla de inicio con autenticación Supabase.
- Registro con nombre, correo, país, código telefónico, teléfono validado y foto opcional de perfil.
- Login por correo/contraseña, Google y Facebook; Instagram queda reservado para fase posterior.
- Usuario `vsolanos@gmail.com` definido como Admin mediante trigger/perfil Supabase.
- Separación de datos por usuario y sincronización central en tabla `user_app_states`.
- Los datos actuales pueden migrarse al usuario Admin desde el respaldo local del navegador.
- Enlaces compartidos de campeonatos para cualquier usuario activo con link, en modo solo lectura.
- Nueva vista compartida con grupos, llaves, partidas KO y ranking público.
- Supabase Storage para fotos de perfil en bucket `user-avatars`, máximo 5 MB.
- Se agregan `docs/supabase_schema_v5.sql`, `docs/SUPABASE_SETUP_v5.md` y `.env.example`.
- `package.json` actualizado a versión `5.0.0` y dependencia `@supabase/supabase-js`.

## v4.14.0

- Rebranding inicial a **CaromChamps** para el repositorio oficial `vsolanos/caromchamps`.
- `package.json` actualizado a `caromchamps` versión `4.14.0`.
- Título del navegador actualizado a CaromChamps.
- Dashboard actualizado para mostrar CaromChamps v4.14 como versión activa.
- PDF de Llave Tabular con Dieciseisavos/R32: aumento aproximado de 25% del contenido solo cuando el bracket incluye R32 y se imprime en modo Todo 1 Página.
- Grupos: el intercambio de jugadores vuelve a ser el modo predeterminado; se elimina el botón Modo intercambio.
- Grupos: el Modo sustitución queda como acción explícita e independiente.
- Grupos: en tablas de posiciones se muestra el nombre del jugador junto a la bandera del país, alineados en la misma línea.
- Se agrega `.gitignore` recomendado para uso con GitHub.

# CHANGELOG

## v4.13

- PDF Llave Continua: corrección específica para brackets que inician en Dieciseisavos/R32 o superiores.
- PDF Llave Continua: cuando hay R32/R64/R128 o una columna alimentadora R0 extensa, el exportador usa Legal Todo 1 Página y agrega la clase `bracket-continuous-r32plus`.
- PDF Llave Continua: escala especial de impresión para evitar que el bracket se divida en varias páginas o genere una primera hoja en blanco.
- PDF Llave Continua: reglas de impresión reforzadas para eliminar saltos de página accidentales en `pdf-page-table`, `bracket-print-scope` y `bracket-premium-panel`.
- Grupos: rediseño operativo de Intercambio/Sustitución para que sean modos separados y no se ejecuten simultáneamente.
- Grupos: Modo intercambio selecciona dos líneas y aplica el cambio inmediato, sin renderizar selector de sustitución.
- Grupos: Modo sustitución selecciona un jugador origen y luego muestra la lista de jugadores externos disponibles.
- Grupos: cálculo de bloqueo y lista de sustitutos optimizados con `useMemo` para reducir consumo de recursos.
- package.json actualizado a 4.13.0.
- README.md actualizado a v4.13.

## v4.12

- Corrección crítica en Grupos: al seleccionar un jugador para intercambio o sustitución la aplicación quedaba en blanco.
- Causa técnica: `src/modules/Groups.js` utilizaba el componente `Select` sin importarlo desde `src/components/ui.js`, provocando un `ReferenceError` al renderizar la barra de sustitución.
- Se agregó `Select` al import de `Groups.js`.
- Se conserva sin cambios la lógica de intercambio, sustitución, validación de grupos cerrados, partidas finalizadas y fases posteriores.
- package.json actualizado a 4.12.0.
- README.md actualizado a v4.12.

## v4.11

- Grupos: bandera y nombre del jugador alineados en tablas de posiciones.
- Grupos: función de sustitución de jugador por un jugador externo al campeonato, disponible solo mientras grupos estén abiertos.
- Grupos: intercambio y sustitución bloqueados si hay grupos cerrados, partidas de grupo finalizadas, clasificados o fases posteriores.
- Grupos: advertencia de impacto al volver a generar grupos después de existir datos.
- Partidas/Planillas: carga, visualización y eliminación de planilla firmada desde cada card de partida.
- Partidas/Planillas: asociación masiva automática por nombre P-### y lectura QR en archivos de imagen mediante jsqr.
- Planillas PDF: primera hoja en blanco y ajuste para ocupar mejor página Carta con resumen al final.
- Historial de jugador: panel derecho reemplazado por gráfico de línea de promedio por partida, con comparativa por campeonato y navegación a detalle por campeonato.
- package.json actualizado a 4.11.0.
- README.md actualizado a v4.11.

## v4.10

- PDF Llave Continua: aumentado 9% el tamaño de las cards de Octavos/R16 respecto al ajuste v4.9.
- PDF Llave Continua: aplicado el mismo tamaño visual de card a Cuartos, Semifinal, Final, R0 y rondas mayores para mantener consistencia de columnas.
- PDF Llave Continua: conectores horizontales y verticales reforzados y recalculados para evitar líneas incompletas entre cards y fases.
- package.json actualizado a 4.10.0.
- README.md actualizado a v4.10.

## v4.7

- Llaves continua: se elimina el renderizado especial de la fase activa; la fase actual usa el mismo template, altura y geometría de las fases anteriores.
- Llaves continua: corrección del traslape del card Campeón/Ganador sobre la partida Final cuando la Final ya está completada.
- Llaves continua: el card Campeón/Ganador se posiciona como nodo independiente a la derecha de la Final, 30% más grande, y aparece únicamente cuando la Final está finalizada.
- Llaves continua: se agrega conector visual entre la Final y el card Campeón/Ganador.
- PDF llave continua: se replica la misma lógica de separación de campeón y renderizado unificado en impresión Carta/Legal Todo 1 Página.
- package.json actualizado a 4.7.0.
- README.md actualizado a v4.7.

## v4.6

- Llaves continua: corrección de la fase activa para que se despliegue con la misma estructura y alineación de las fases anteriores.
- Llaves continua: la fase activa mantiene altura fija de card, stack completo de jugadores y comportamiento visual consistente.
- Llaves continua: los placeholders de ganadores ahora muestran códigos legibles tipo Ganador P-### en lugar de IDs internos largos.
- Planillas físicas: la cantidad de filas usa el campo Límite entradas default del campeonato como fuente principal.
- Planillas físicas: si Límite entradas default es 0, se generan 60 líneas máximas.
- Planillas físicas: se duplicó la altura útil de los renglones del resumen inferior para Jugador 1, Árbitro y Jugador 2.
- package.json actualizado a 4.6.0.
- README.md actualizado a v4.6.


## v4.4

- Jugadores: normalización de Tirso González como República Dominicana / Internacional.
- Jugadores: normalización de Marcos Valencia, William Pitty, Carlos Núñez, Ricardo Espinoza, Victor Espinoza, Rafael Bardayán, Julio Atencio, Daniel Acosta, Faustino Murillo, Carlos Patiño y Pablo Beltrán como Panamá / Internacional.
- Grupos: nueva función de intercambio de jugadores entre grupos o dentro del mismo grupo seleccionando dos líneas.
- Grupos: al intercambiar jugadores se limpian resultados afectados, clasificaciones y llaves posteriores para proteger la consistencia deportiva.
- Historial: nombres de jugadores clicables en jugadores, grupos, partidas y llaves; se despliega historial por campeonato con fase, partida, carambolas, entradas, promedio por partida, promedio total y detalle de partida.
- Llaves: corrección de visualización continua cuando existe preclasificación/R0 para evitar cards cortadas y mejorar asociación visual hacia el bracket principal.
- PDF Llave continua: aumento de escala/tamaño visual para aprovechar mejor el espacio disponible en formatos fijos Carta/Legal Todo 1 Página.
- Planillas físicas: ajuste de impresión a Carta vertical en una página por planilla.
- Planillas físicas: columnas actualizadas a CONT, CAR, ACUM y espacio en blanco para cada jugador.
- Planillas físicas: resumen final con Total Carambolas, SM1, SM2 y firmas de Jugador 1, Árbitro y Jugador 2.
- package.json actualizado a 4.4.0.
- README.md actualizado a v4.4.

## v4.3

- Llaves: agregada función de regreso ordenado a fase anterior con motivo, confirmación y auditoría.
- Llaves: si se regresa desde Final, Semifinal, Cuartos, Octavos, Dieciseisavos o R0, se elimina solo la fase activa más avanzada y se conservan las fases previas.
- Campeonato: selección de jugadores reubicada como Paso 2 y mejorada con filtros avanzados, estado, selección, cabeza de serie y acciones masivas.
- Jugadores: normalización de asociaciones/códigos de la carga Gran Prix: S.J. y C.R. a AJOBI, ALAJ a ASOBIGRIE, P a Internacional/Panamá.
- Partidas: agregado módulo de planillas físicas imprimibles para todas las partidas, por fase, por vista filtrada, pendientes o seleccionadas.
- Partidas: planillas con logo configurable, encabezado del campeonato, código de partida, QR, datos precargados, tabla de entradas según límite del campeonato y firmas.
- Partidas: carga de planillas firmadas con asociación automática por nombre P-###, asociación manual asistida, IndexedDB y auditoría.
- Partidas: lectura experimental de pistas de texto en archivos TXT/CSV/JSON; las imágenes/PDF manuscritos se guardan como respaldo documental.
- package.json actualizado a 4.3.0 y nueva dependencia qrcode.react.
- README.md actualizado a v4.3.

## v4.2

- Data de prueba: agregados 43 jugadores nuevos desde la lista del Gran Prix Centroamericano Costa Rica Mayo 2026.
- Data de prueba: omitidos jugadores repetidos ya existentes en el MVP para evitar duplicidad en el maestro de jugadores.
- Jugadores: agregada trazabilidad de código fuente mediante notas, `source_association_label` y `source_seed_number`.
- Asociaciones de prueba: agregados códigos S.J., ALAJ, P y C.R. para filtros y visualización de los jugadores cargados desde la imagen.
- Inicialización: fusión automática de jugadores nuevos con datos existentes en `localStorage`, sin sobrescribir jugadores ya registrados.
- package.json actualizado a 4.2.0.
- README.md actualizado a v4.2.

## v4.1

- PDF Llaves / Continua Vertical Carta Todo 1 Página: incremento aproximado del 35% en el tamaño visual del bracket para aprovechar mejor el espacio disponible.
- PDF Llaves / Continua Vertical Legal Todo 1 Página: incremento equivalente de escalado para brackets que inician en Dieciseisavos/R32 o más.
- PDF Llaves / Continua: menor espacio reservado al encabezado institucional y mayor área útil para el bracket, manteniendo separación segura.
- PDF Llaves / Continua: mayor tamaño de textos en fase, orden, AVG, CAR, ENT, jugadores, ganador, marcador y estado de partida.
- package.json actualizado a 4.1.0.
- README.md actualizado a v4.1.

## v4.0

- PDF Llaves / Continua: textos superiores del card —Fase, Orden, AVG, CAR y ENT— cambiados a azul oscuro.
- PDF Llaves / Continua: nombres de jugadores y texto de ganador cambiados a azul oscuro.
- PDF Llaves / Continua: formato fijo Vertical Carta Todo 1 Página para brackets que inician en Octavos/R16.
- PDF Llaves / Continua: formato fijo Vertical Legal Todo 1 Página para brackets que inician en Dieciseisavos/R32 o fases mayores.
- Motor de impresión: `startPdfPrint` ahora permite clases múltiples de impresión y escalado diferenciado por subreporte continuo.
- package.json actualizado a 4.0.0.
- README.md actualizado a v4.0.

## v3.9

- Dashboard: texto de versión actualizado dinámicamente desde `package.json`.
- PDF Llaves / Continua: corrección de traslape del contenido sobre el encabezado institucional.
- PDF Llaves Continua Horizontal con sizing Todo 1 Página: escalado ajustado para usar mejor el espacio disponible y reducir compresión innecesaria.
- PDF Llaves / Continua: el escalado de Todo 1 Página se aplica al cuerpo del bracket, conservando el encabezado y su separación.
- Llaves / Continua: textos superiores de Fase, Orden, AVG, CAR y ENT en celeste claro.
- package.json actualizado a 3.9.0.
- README.md actualizado a v3.9.

## v3.8

- Llaves / Continua: aumento adicional del 30% en la altura de las cards de Octavos/R16 respecto a v3.7.
- Llaves / Continua: card de Campeón reubicada 25% más abajo bajo la card de Final.
- Llaves / Continua: texto de Jugador/Ganador dentro de las cards en celeste claro.
- PDF Llaves / Continua: campo Estado de partida ampliado para evitar corte o salto de texto.
- PDF Llaves Continua Horizontal con sizing Todo 1 Página: compresión especial reforzada para compensar la mayor altura de Octavos/R16.
- package.json actualizado a 3.8.0.
- README.md actualizado a v3.8.


## v3.7

- Llaves / Continua: aumento adicional del 25% en la altura de las cards de Octavos/R16 para evitar recortes de información.
- Llaves / Continua: card de Campeón reubicada directamente bajo la card de Final.
- PDF Llaves Continua Horizontal con sizing Todo 1 Página: compresión especial de impresión para salida en una sola página.
- Reporte General / Ranking Final Consolidado: Estado Eliminado y Subcampeón en azul oscuro.
- Reporte Clasificados de primera fase: eliminada columna Clasificación.
- Modo claro / Clasificados de primera fase: columnas en azul oscuro excepto Jugador.
- package.json actualizado a 3.7.0.
- README.md actualizado a v3.7.

## v3.6

- PDF de Llaves Tabular: ganador con fondo celeste oscuro en toda la fila.
- PDFs: refuerzo de alineación izquierda para todo campo/columna Jugador en Reportes, Grupos, Cierre y Bracket Tabular.
- PDF de Llaves Continua: marcador/carambolas con texto celeste claro.
- Llaves Continua: cards más altas y geometría de slots recalculada para que Octavos/R16 muestre la información completa de ambos jugadores sin romper conectores ni asociaciones entre rondas.

## v3.5

- Ajuste de margen izquierdo/derecho del encabezado PDF.
- Centrado de tablas PDF en Bracket Tabular y Reportes, con excepción de columnas de jugador.
- Corrección de alineación de visualización continua de llaves mediante posiciones absolutas por ronda.
- Fondo celeste claro para jugador ganador en PDF de Bracket continuo.
- Colores PDF de estados Eliminado y No clasificado en Reportes.

# CHANGELOG
## v3.4.0
- PDFs: corrección estructural de encabezado repetido sin traslape usando tabla de encabezado (`PdfDocument`).
- PDF de Grupos: tablas con celdas centradas excepto jugador; eliminada columna ULT AVG REG de conformación de grupo.
- PDF de Llaves continua: jugador ganador en celeste oscuro.
- Llaves continua: conectores y alineación de cards mejorados para asociaciones entre rondas.


## v3.3

- Ajuste de color en Partidas modo oscuro para Tipo de resultado y Ganador manual.
- Ajuste de PDF de Grupos: estado No Definido en Azul Oscuro.
- Corrección para preservar No CBZ/cabeza de serie de campeonato al editar datos maestros del jugador.
- Corrección de márgenes de impresión: el encabezado fijo no se mueve y el espacio de página se reserva desde @page para evitar traslapes en páginas sin corte manual.

# CHANGELOG
## v3.2
- Eliminada la primera página en blanco en todos los PDFs.
- Grupos modo oscuro: estado No Definido en azul claro y No calificado en celeste oscuro.
- Partidas modo oscuro: datos de resultados capturados en azul.
- Llaves / Continua modo claro: fecha/hora en azul claro, ronda en azul oscuro y marcadores en gris claro.

## v3.0.0
- Ajustes de color en sección Jugadores modo oscuro: textos secundarios/auxiliares celeste oscuro, deshabilitados gris azulado oscuro, hints gris azulado y botones desactivar/deshabilitados gris azulado.
- Ajustes de color en sección Grupos modo claro: filas clasificadas celeste oscuro, texto finalizada azul oscuro y badge finalizada gris azulado claro.
- Umbrales de Primera y Segunda División editables con tres decimales mediante campos de texto con normalización al salir del campo.
- PDFs forzados a modo claro independientemente del tema activo de la aplicación.
- PDF de Grupos con corte antes de la sección de continuación del Ordenamiento final fase de grupos.
- Agregado PDF de Partidas.
- Agregado PDF de Calendario.

## v2.9.0
- Fechas visibles en español para pantallas y PDFs.
- Agenda de grupos con Estado alineado visualmente a Clasificación.
- PDFs con data de tablas tamaño 12, jugador destacado y cortes de página por sección interna de Reportes.
- Ajustes de colores PDF: texto auxiliar azul oscuro, fondo clasificado celeste, borde tabla azul oscuro.
- Generar Partidas Proy. revisado para calendarizar hasta final y habilitar rondas solamente mediante Generar siguiente ronda, conservando fecha/hora/mesa.
- Bracket proyectado soporta rutas con R0/preclasificación y rondas iniciales R32/R16/QF/SF/F según corresponda.


## v2.8

- Agregado corte de página por sección al imprimir/PDF en Reportes.
- Aplicada tabla oficial de tokens globales CSS para modo oscuro y modo claro.
- Normalizadas variables de color para app, tablas, resaltados, scores, puntos y PDF.


## v2.7.0
- Revisión de calendarización con mesas activas, días de torneo, horarios diarios, blackouts, distribución por bloques y orden round-robin aprobado.
- `Generar Partidas Proy.` ahora genera estructura hasta final y agenda todas las fases con fechas, horas y mesas.
- README actualizado a v2.7 y CHANGELOG reconstruido desde v0.2.
- Instalación corregida: sin `package-lock.json`, `.npmrc` en registro público y dependencias fijadas.
- PDFs: nueva reserva vertical para encabezados repetidos y cortes de página con espacio superior para evitar solapamientos.
- Ordenamiento final de grupos dividido en páginas lógicas para reducir traslapes con encabezado.
- Umbrales de divisiones se muestran con 3 decimales.
- Colores PDF ajustados según solicitud: secundario celeste oscuro, auxiliar gris oscuro, clasificado celeste oscuro y bordes de tabla azul oscuro.

## v2.6.0
- Agregado `src/styles/theme.css` con variables globales para modo oscuro y modo claro.
- Ajustes de color en modo oscuro: bordes dorados, texto principal azul claro, éxito dorado, inputs azul claro, brackets con card gris claro, borde dorado y líneas dorado oscuro.
- Ajustes PDF con encabezado de tabla azul claro y borde azul claro.
- Nuevo `STORAGE_KEY` para evitar contaminación de datos locales.

## v2.5.0
- Agregados campos Director Técnico, Representante 1 y Representante 2 en información general del campeonato.
- Tamaño y orientación PDF por defecto convertidos en combos de configuración.
- `Generar Partidas Proy.` crea rondas planificadas no capturables y conserva fecha/hora/mesa al generar rondas reales.
- Bloqueo de captura sobre partidas planificadas.

## v2.4.1
- ZIP sin `package-lock.json` y con `.npmrc` apuntando a npm público para evitar registros internos.

## v2.4.0
- Modo oscuro / modo claro en Configuración.
- Corrección de encabezados PDF y agenda de grupos.
- Regla de negocio: penales eliminados de fase de grupos.
- Reporte de clasificación de primera fase muestra solo clasificados.
- Reporte de rendimiento ordenado por promedio, puntos, SM1 y SM2.
- Botón `Generar Partidas Proy.` agregado al calendario.

## v2.3.0
- Configuración global para rangos de ascenso/descenso y PDF por defecto.
- Agenda y partidas completadas resaltadas en celeste oscuro.
- Reportes alineados al estilo de tablas de posiciones.
- Ranking final normaliza estado `Direct`/`Extra` como `Clasificado`.

## v2.2.0
- PDF de Grupos con corte de página por grupo.
- PDF de Bracket tabular con corte por fase.
- Sizing `Todo 1 Página`.
- Menú inicia con Campeonatos.

## v2.1.0
- Sizing PDF 50% y 60%.
- Mejora de impresión vertical y tablas.
- Visualización de número y nombre de grupo en PDF.

## v2.0.0
- PDF en sección Grupos.
- Branding ASOBIGRIE + FECOBI en PDFs.
- Configuración de impresión: tamaño, orientación y sizing.

## v1.9.0
- PDF desde sección Llaves/Bracket según visualización activa: Tabular, Continua o Face to Face.

## v1.8.0
- Reportería filtrada por campeonato actual y jugadores participantes.
- ASOBIGRIE como marca principal y FECOBI como marca secundaria.
- Ajustes visuales en ranking y bracket continuo.

## v1.7.0
- Foto/avatar en conformación de grupos.
- Estados completados en partidas con celeste oscuro.
- Brackets ordenados con patrones aprobados para 4, 8, 16 y 32 clasificados.
- División objetivo `Selectivo` y promedios especiales para Selectivo e Internacional.
- Calendario con estructura proyectada hasta final.

## v1.6.0
- Bracket continuo rediseñado con tarjetas, foto, bandera, marcador, entradas, promedio, SM1/SM2 y campeón.
- Bracket tabular rediseñado con secciones por fase.
- Orden de partidas por grupo aprobado para grupos de 3, 4, 5 y 6.
- Look & feel premium oscuro con menú lateral y branding.

## v1.5.0
- Corrección de guardado de jugadores y fotografía.
- Seed movido desde jugador a inscripción del campeonato.
- Internacional: asociación INTERNACIONAL y división NA.
- Captura renombrada como Partidas.
- Lógica de bloques por mesa: 0, 1-6, 2D2, 3D2, etc.

## v1.4.0
- Gestión de campeonatos múltiples.
- Captura avanzada y guardado masivo.
- Cierre deportivo `FINALIZED` y administrativo `COMPLETED`.
- Reporte 5 y reclasificación de divisiones.
- Acta final institucional y exportaciones CSV.

## v1.3.0
- Paquete funcional de cierre deportivo base, bloqueo y reapertura controlada iniciado.

## v1.2.0
- Tres visualizaciones de bracket: tabular, continua y face-to-face.
- Filtros por ronda en Partidas y Agenda.
- Mejoras de Árbitros, Cierre y Reportes.

## v1.1.0
- Bracket completo con números mágicos, preclasificación/R0, R16, QF, SF y Final.
- Reportes de fase final y ranking consolidado.

## v1.0.0
- Selección internacional en campeonato muestra todos los jugadores activos.
- ID consecutivo de partida en calendario, grupos y captura.
- Agenda refleja marcadores capturados.

## v0.9.0
- Selección manual de jugadores por campeonato.
- Tablas de posiciones con estado No Definido hasta completar partidas.
- Agenda editable con filtros, ordenamientos e intercambio de horarios.
- Captura en tarjetas por partida.

## v0.8.0
- Construcción de secciones Campeonato, Grupos y Calendario.
- Reglas por fase/ronda y administración de mesas.

## v0.7.0
- Carga masiva de jugadores por CSV.
- Eliminada dependencia vulnerable `xlsx`.

## v0.6.0
- Carga masiva Excel inicial.
- Banderas del continente americano.
- Asociación INTERNACIONAL automática.
- Promedios con 3 decimales.

## v0.5.0
- Banderas SVG internas para países.

## v0.4.0
- Código visible de jugador `JUG-0001`.
- Carga de fotografía JPEG/PNG con vista previa.

## v0.3.0
- Mantenimiento de jugadores con campos extendidos.

## v0.2.0
- Primer paquete modular React/Vite de preproducción fuera de Canvas.
## v3.1
- Forzado de todos los PDFs a modo claro independiente del tema activo de la app.
- Selector discreto de secciones imprimibles en PDF dentro de Reportes, con persistencia de la última configuración.
- Inserción de primera página en blanco en PDFs para impresión manual desde página 2.
- Corte de página por sección interna en Reportes conservado.
- Ajuste visual en modo claro para que Clasificados de primera fase use el mismo look & feel que Ranking final consolidado.



## v4.5.0

- Mejora visual de banderas, especialmente Panamá y República Dominicana.
- Corrección del PDF de llave continua para permitir Carta/Legal y evitar desorden por altura excesiva.
- Cards de bracket continuo más anchas y mejor espaciadas; campeón 30% más grande y ubicado a la derecha de la Final.
- Historial de jugador: línea seleccionada en rojo y panel de detalle reducido 35%.
- Ajustes de colores en modo claro para la visualización continua.
- Planillas oficiales: columnas NUM, CON, CAR, ACU; hora/mesa en blanco; estructura centrada en Carta y resumen final fijo.


### Hotfix v5.3.0 - carga post-login
- Se reforzó AuthGate para que la app principal cargue inmediatamente después del login usando un perfil local de sesión.
- La sincronización con Supabase queda asincrónica y no bloquea el render de la aplicación.
- Se agregaron timeouts y manejo seguro de errores en perfil, estado remoto y auditoría para evitar pantallas en blanco por red/RLS/Supabase.


## v5.4.0

- Hotfix de estabilidad local: servidor Vite fijado en localhost:5173 con strictPort.
- AuthGate ahora libera la pantalla si Supabase no responde al refrescar sesión.
- Agregado script `dev:clean` para limpiar cache local de Vite y `dist`.
- Agregado `public/_headers` para evitar cache agresivo de `index.html` en Cloudflare Pages.
