
## v6.4.0

- Solución operativa para `localhost refused to connect`: scripts `START_CAROMCHAMPS.bat/.ps1` y tarea opcional de autoarranque.
- Planillas PDF: se elimina la planilla en blanco inicial del lote, se centra horizontal/verticalmente la hoja y se corrige el salto de la primera planilla a dos páginas.
- Llaves Face to Face: Final y Campeón reposicionados hacia la zona superior de conectores, con líneas de Semis asociadas a la Final.
- Control de promedios desactivado: cierre, acta y ranking de cierre evitan mostrar AVG/entradas cuando no aplica.

# CaromChamps v6.4.0

## v6.3.0

- ProV: rollback del fondo azul claro del panel completo de tabs en modo oscuro; cada flecha del proceso usa fondo azul.
- Grand Dashboard: links de campeonatos y puntos AVG hacia el tab Reportes; Top de jugadores abre historial.
- Dashboard de campeonato: AVG final integrado en la gráfica por fase y Top 7 AVG del torneo con historial.
- Llaves Face to Face: Final reposicionada según semis/conectores, campeón lateral superior y PDF reducido para una página.
- Navegación local: soporte hash para refrescar, forward/back y reapertura de tabs sin perder conexión SPA.
- Nuevo parámetro Control de Promedios Si/No con captura sin entradas/promedios cuando está desactivado.
- Planillas PDF: reducción de sizing 10% para evitar primera planilla en dos páginas.


Plataforma web para gestión integral de campeonatos de billar carambola a 3 bandas FECOBI / ASOBIGRIE: jugadores, campeonatos normales, campeonatos ranking, grupos, calendario, captura de partidas, llaves/brackets, reportes PDF/Excel, ranking, cierre y auditoría.

## Versión activa

**CaromChamps v6.3.0** refina la nueva **Interface ProV** como experiencia predeterminada, manteniendo disponibles las otras dos interfaces para transición controlada:

1. **Interface ProV** — nueva interface predeterminada con Grand Dashboard, menú izquierdo simplificado y tabs internos del campeonato.
2. **Interface IA** — interface guiada introducida en v5.9.0.
3. **Interface Clásica** — interface base usada hasta v5.8 y versiones anteriores.

La selección de interface se guarda en `localStorage`, por lo que el sistema recuerda la preferencia del usuario.

## Instalación y validación

```powershell
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run check:syntax
npm.cmd run build
npm.cmd run dev
```

Abrir localmente:

```text
http://localhost:5173/
```

## Comandos útiles

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
npm.cmd run check:syntax
npm.cmd run dev:clean
```

## Historial de versiones consolidadas


### v6.3.0 — ProV, Control de Promedios y estabilidad SPA

- Rollback del fondo azul claro del panel completo de tabs ProV en modo oscuro; las flechas del proceso quedan con fondo azul.
- Grand Dashboard: gráficos enlazados al tab Reportes del campeonato y Top de jugadores con historial.
- Dashboard del campeonato: AVG final integrado a gráfica por fase y Top 7 de AVG del torneo.
- Llaves Face to Face: Final y Campeón reposicionados dinámicamente respecto a semis/conectores; PDF reducido para una página.
- Navegación local estabilizada con hash para refresh, back/forward y reapertura sin perder el estado del SPA.
- Nuevo parámetro Control de Promedios Sí/No; al desactivarlo se ocultan entradas/promedios en captura y reportes principales.
- Planillas PDF: sizing reducido 10% para evitar que la primera planilla se divida en dos páginas.
- `package.json` actualizado a versión `6.3.0`.

### v6.2.0 — ProV, Doble Fase Grupos y ajustes de Face to Face

- Ajustes de tabs ProV, modo oscuro y links desde Grand Dashboard/Ranking.
- Tab Reportes agregado al panel ProV.
- Nueva funcionalidad Doble Fase Grupos con tab Grupos F2.
- Bloqueos de Setup al clasificar/cerrar campeonato.
- Llaves Face to Face con reposicionamiento de Final y Campeón.
- `package.json` actualizado a versión `6.2.0`.


### v6.1.0 — Ajustes ProV, Wizard overlay, Ranking Dashboard y Face to Face

- Interface ProV: Wizard de campeonatos convertido en pantalla sobrepuesta para mejorar foco y comprensión del usuario.
- Wizard: agregadas opciones de división **SELECTIVO** e **INTERNACIONAL**.
- Interface ProV: tabs del campeonato rediseñados como flechas de proceso y fijados como encabezado sticky durante el scroll.
- Dashboard de campeonato: gráfica de AVG acumulado por fase reducida 25% y movida después de agenda/lista operativa.
- Dashboard de campeonato: agregada lista de partidas pendientes de jugar.
- Grand Dashboard: gráfica de campeonatos con más jugadores inscritos usando el nombre real del campeonato, no C1/C2.
- Ranking: agregado dashboard con Top 10 de jugadores, participantes por campeonato asociado y AVG general por campeonato asociado.
- Campeonatos: botón Abrir habilitado incluso cuando el campeonato ya está activo para navegar siempre al Dashboard.
- Llaves Face to Face: margen superior compactado, conectores Semis→Final corregidos, PDF Todo 1 Página con mayor sizing y card de campeón más separado de la Final.
- `package.json` actualizado a versión `6.1.0`.

### v6.0.0 — Interface ProV

- Nueva **Interface ProV** como interface predeterminada de apertura.
- Se mantienen tres interfaces seleccionables: **Interface ProV**, **Interface IA** e **Interface Clásica**.
- El sistema recuerda la interface seleccionada por el usuario.
- Nuevo menú izquierdo para Interface ProV con:
  - Grand Dashboard.
  - Campeonatos.
  - Ranking.
  - Administración: Jugadores, Configuración, Perfil, Mantenimiento y Auditoría.
- Los módulos operativos del campeonato pasan a tabs dentro del panel derecho:
  - Dashboard.
  - Campeonato.
  - Grupos.
  - Calendario.
  - Partidas.
  - Llaves.
  - Cierre.
- Nuevo **Grand Dashboard** con datos acumulados de la plataforma:
  - Total de campeonatos normales.
  - Total de campeonatos ranking.
  - Jugadores únicos.
  - Inscripciones acumuladas.
  - Estados actuales de campeonatos.
  - AVG general por campeonato en gráfica de líneas.
  - Top 7 de jugadores con mayores AVG alcanzados.
  - Campeonatos con más jugadores inscritos en gráfica de barras.
  - Partidas completadas y lectura rápida para Dirección Técnica.
- Menú **Campeonatos** muestra solamente campeonatos tipo Normal.
- Menú **Ranking** muestra solamente campeonatos tipo Ranking.
- Al abrir un campeonato Normal desde Campeonatos, el sistema navega al tab **Dashboard** del campeonato seleccionado.
- Nuevo wizard guiado para crear campeonatos tipo Normal.
- Nuevo wizard guiado simplificado para crear campeonatos tipo Ranking.
- Campeonatos Ranking no requieren asociación manual de jugadores.
- Nuevo Dashboard de campeonato con gráfica de líneas del **AVG general acumulado por fase**.
- Llaves: agregado Zoom In / Zoom Out independiente para visualizaciones Continua y Face to Face, sin afectar menú ni resto de la aplicación.
- Face to Face: ajuste de margen superior y títulos de columnas para mantener mayor consistencia con la visualización Continua.
- README verificado y reestructurado con historial de versiones consolidado.
- `package.json` actualizado a versión `6.0.0`.

### v5.9.0 — Interface IA y fallback clásico

- Nueva **Interface IA** guiada por flujo de trabajo.
- Opción temporal para volver a la **Interface Clásica** sin eliminarla.
- Dashboard convertido en centro de control operativo.
- Siguiente acción recomendada según estado del campeonato.
- Alertas operativas por estado.
- Stepper de flujo de campeonato.
- Banner explicativo para campeonatos tipo Ranking.
- Catálogo de reportes.
- Checklist de cierre.
- Vista previa tipo tablero para agenda por mesa.
- Base reutilizable `DataTableCarom` para futuras tablas con búsqueda, ordenamiento, densidad y CSV.

### v5.8.0 — Ajustes Face to Face y Ranking PDF

- Llaves Face to Face: compactación vertical superior para acercar encabezados de columnas a la geometría de la visualización continua.
- Llaves Face to Face: conectores centrales visibles entre Semis y Final.
- Card de campeón bajado debajo de la Final.
- PDF Face to Face en modo Todo 1 Página: escala ampliada aproximadamente 20%.
- Ranking: celda de jugador reorganizada con nombre/historial y asociación en bloque izquierdo, bandera alineada a la derecha.
- Ranking PDF: columnas resumen de campeonatos referenciadas como C1, C2, etc.
- Ranking resumen por campeonato ajustado a PRG, CAR, ENT, AVG y Pos#.

### v5.7.0 — Separación de Final y mejoras de Ranking

- Face to Face: la Final baja de posición para separarse visualmente de Semis.
- Face to Face: card de Campeón/Ganador aparece debajo de la Final.
- PDF Face to Face: aumento de escala en modo Todo 1 Página.
- Ranking: columna Jugador incluye nombre con link de historial, asociación y bandera.
- Ranking: solo muestra jugadores que participaron en campeonatos normales asociados al ranking.
- Campeonatos tipo Ranking: no requieren selección/asociación de jugadores.

### v5.6.0 — Face to Face árbol y Ranking avanzado

- Visualización Face to Face reconstruida con geometría tipo árbol.
- Posiciones absolutas por ronda y conectores SVG basados en fuentes reales de partidas.
- R0 integrado como alimentador visual de la primera ronda principal.
- Ranking: puntos PRG en color rojo.
- Ranking: métricas acumuladas y por campeonato: PRG, PJ, PG, PP, PE, CAR, ENT y AVG.
- Nuevo reporte PDF de tabla de posiciones de Ranking.

### v5.5.0 — Ranking mode, menús y llaves

- Campeonatos tipo Ranking: se ocultan pasos operativos normales que no aplican.
- Menú lateral oculta módulos operativos en campeonatos Ranking.
- Redirección automática a Ranking si el usuario entra a una sección no válida para Ranking.
- Grupos: banderas alineadas en tablas de posiciones y tablas derivadas.
- Llaves: mensajes de confirmación después de generar estructura, resultados, siguiente ronda, PDF y regreso de fase.
- Face to Face: reconstrucción de ramas izquierda/derecha usando `source_match1_id` y `source_match2_id`.
- Inclusión de R0 cuando alimenta posiciones del bracket principal.
- Menú: scroll vertical para opciones finales al cambiar tamaño de pantalla.
- Ranking: tabla acumulada por jugador y matriz de puntos por campeonato jugado.

### v5.4.0 — Login premium, tema claro y Ranking inicial

- Pantalla de ingreso premium.
- Modo claro por defecto para nuevos usuarios/campeonatos.
- Menú lateral colapsable con iconos y accesos a Perfil/Cerrar sesión.
- Módulo de perfil con foto, país y teléfono validado.
- Clasificados en modo oscuro con fondo azul claro y texto azul.
- Eliminada restricción de clasificados pares; R0 resuelve cantidades no mágicas.
- División objetivo movida al Paso 1 del campeonato.
- Fechas localizadas por idioma: español, inglés y coreano.
- Botón Reabrir grupos bajo validaciones de seguridad.
- PDF continuo de llave con Dieciseisavos/R32 ampliado para hoja Legal.
- Primera funcionalidad Ranking: campeonatos tipo Ranking, reglas configurables y tabla acumulada.

### v5.2.0 — Plataforma multiusuario Supabase

- Login y registro con Supabase.
- Autenticación por correo/contraseña, Google y Facebook.
- Perfil de usuario con foto.
- Rol Admin para `vsolanos@gmail.com` definido por base de datos.
- Usuarios nuevos como `ORGANIZER`.
- Separación de datos por usuario.
- Sincronización en tabla `user_app_states`.
- Enlaces compartidos de campeonato en modo solo lectura.
- Vista compartida con grupos, llaves, partidas KO y ranking público.
- Documentación SQL y guía Supabase en `docs/`.

### v5.0.0 — Capa inicial Supabase

- Integración inicial de Supabase Auth.
- Formulario de registro con nombre, país, teléfono y foto opcional.
- Separación inicial de datos por usuario.
- Supabase Storage para fotos de perfil.
- `.env.example` y scripts SQL base.

### v4.14.0 — Rebranding CaromChamps

- Rebranding inicial a **CaromChamps** para repositorio oficial `vsolanos/caromchamps`.
- Título del navegador actualizado.
- Dashboard actualizado a CaromChamps.
- PDF tabular con Dieciseisavos/R32 optimizado.
- Intercambio de jugadores en Grupos activo por defecto.
- Alineación consistente de nombre del jugador con bandera en tablas de posiciones.
- `.gitignore` recomendado para GitHub.

### v4.13.0

- PDF Llave Continua: detección de brackets con Dieciseisavos/R32 o mayores.
- Uso automático de preset Legal Todo 1 Página.
- Clase `bracket-continuous-r32plus`.
- Escala especial para evitar división en varias páginas o primera hoja en blanco.
- Rediseño operativo de Intercambio/Sustitución en Grupos.

### v4.12.0

- Corrección crítica en Grupos: pantalla en blanco al seleccionar jugador para intercambio o sustitución.
- Se agregó `Select` al import de `Groups.js`.
- Se conserva lógica de intercambio, sustitución y bloqueos de seguridad.

### v4.11.0

- Grupos: bandera y nombre alineados en tablas de posiciones.
- Sustitución de jugador externo mientras grupos estén abiertos.
- Bloqueo de intercambio/sustitución si hay grupos cerrados, partidas finalizadas, clasificados o fases posteriores.
- Advertencia al regenerar grupos con datos existentes.
- Planillas firmadas con carga, visualización, eliminación y asociación automática por QR/nombre P-###.
- Historial de jugador con gráfico de promedio por partida y comparativa por campeonato.

### v4.10.0

- PDF Llave Continua: incremento del tamaño de cards de Octavos/R16.
- Misma geometría visual para Cuartos, Semifinal, Final, R0 y rondas mayores.
- Conectores reforzados entre cards y fases.

### v4.7.0

- Llave continua: se elimina renderizado especial de fase activa.
- Corrección de traslape del card Campeón/Ganador sobre la Final.
- Campeón/Ganador como nodo independiente a la derecha de la Final.
- Conector visual entre Final y Campeón.

### v4.6.0

- Llave continua: fase activa con misma estructura y alineación de fases anteriores.
- Placeholders de ganadores con códigos legibles tipo Ganador P-###.
- Planillas físicas basadas en límite de entradas del campeonato.
- Si límite de entradas es 0, se generan 60 líneas máximas.
- Mayor espacio para firmas y resumen inferior.

### v4.4.0

- Normalización de jugadores internacionales de Panamá y República Dominicana.
- Intercambio de jugadores entre grupos o dentro del mismo grupo.
- Limpieza de resultados afectados al intercambiar jugadores.
- Historial clicable desde jugadores, grupos, partidas y llaves.
- Corrección de visualización continua con R0/preclasificación.
- PDF Llave Continua con mayor escala.
- Planillas físicas en Carta vertical con QR, datos precargados y firmas.

### v4.3.0

- Regreso ordenado a fase anterior con motivo, confirmación y auditoría.
- Eliminación controlada solo de la fase activa más avanzada.
- Selección de jugadores reubicada como Paso 2.
- Normalización de códigos de asociación de carga Gran Prix.
- Planillas físicas imprimibles por fase, vista filtrada, pendientes o seleccionadas.
- Carga de planillas firmadas con asociación automática/manual.

### v4.2.0

- Agregados 43 jugadores nuevos desde lista Gran Prix Centroamericano Costa Rica Mayo 2026.
- Control de duplicados en maestro de jugadores.
- Trazabilidad de código fuente con notas y seed fuente.
- Asociaciones de prueba S.J., ALAJ, P y C.R.
- Fusión automática de jugadores nuevos con datos existentes en `localStorage`.

### v4.1.0

- PDF Llaves / Continua Vertical Carta Todo 1 Página con aumento aproximado de 35% en tamaño visual.
- Mejor aprovechamiento del espacio disponible para bracket.

## Configuración Supabase

Ejecutar en Supabase:

```text
docs/supabase_schema_v5.sql
```

Variables de entorno para despliegue:

```text
VITE_SUPABASE_URL=https://vmcbaexkbenbesygxccu.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key de Supabase>
```

Redirect URLs recomendadas:

```text
https://caromchamps.com/*
http://localhost:5173/*
```

## Instalación limpia recomendada en Windows

```powershell
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
npm.cmd config set registry https://registry.npmjs.org/
npm.cmd install --registry=https://registry.npmjs.org/
npm.cmd run check:syntax
npm.cmd run build
npm.cmd run dev
```

## Publicación GitHub sugerida

```powershell
git status
git add .
git commit -m "Release v6.1.0 - ProV wizard overlay, ranking dashboard and Face to Face refinements"
git push origin main
git tag -a v6.1.0 -m "CaromChamps v6.1.0"
git push origin v6.1.0
```



## v6.2.0

- Interface ProV: panel de tabs en modo oscuro con fondo azul claro, persistencia visual revisada y tab Reportes agregado.
- Grand Dashboard: enlaces desde gráficos hacia dashboards de campeonato e historial de jugadores.
- Dashboard de campeonato: gráfica AVG por fase restaurada a tamaño completo, incluye Grupos F2 y se eliminó el duplicado de Siguiente paso recomendado.
- Setup/Campeonato: bloqueo de selección de jugadores, reglas y mesas después de clasificar grupos o cerrar campeonato en ProV, IA y Clásico.
- Ranking: detalle por campeonato enlaza al tab Reportes del campeonato asociado.
- Llaves Face to Face: Final reposicionada hacia los conectores, campeón al lado de la Final y PDF reducido para una página.
- Nueva funcionalidad Doble Fase Grupos con tipo de campeonato, wizard y tab Grupos F2.
