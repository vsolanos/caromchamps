# CaromChamps v7.1.1
## v7.1.1

Hotfix de la funcionalidad de inscripción pública. La publicación ahora actualiza inmediatamente el estado visual del tab Inscripciones, el enlace público se resuelve de forma más robusta y la página pública puede recuperar la publicación desde el registro público o desde el estado local del campeonato cuando la publicación esté marcada como activa. También se redujo el payload guardado para prevenir errores de cuota de almacenamiento local.

### Validación

```bash
npm run check:syntax
```

### Prueba recomendada

1. Abrir un campeonato.
2. Ir al tab Inscripciones.
3. Presionar Publicar inscripción.
4. Confirmar que cambia a Página publicada.
5. Abrir el enlace `/#register=ID` en la misma instancia/origen del navegador.
6. Enviar una solicitud y sincronizarla desde el tab Inscripciones.


## CaromChamps v7.1.1

Hotfix de legibilidad para modo oscuro en el Tab Partidas. Los campos críticos de captura quedan forzados en azul oscuro `#0F2A5F`: Carambolas, Entradas, SM1, SM2, Tipo de resultado y Ganador manual. Se mantiene fondo gris claro `#E5E7EB` y se refuerza el estilo desde `Capture.js` y `styles.css` para evitar sobrescrituras por estilos globales.


## v6.9.4 - Hotfix de legibilidad en Partidas modo oscuro

- Se refuerza el color **azul oscuro** `#0F2A5F` en los campos críticos del tab **Partidas** cuando la plataforma está en modo oscuro.
- El ajuste aplica directamente a **Carambolas**, **Entradas**, **SM1**, **SM2**, **Tipo de resultado** y **Ganador manual**.
- Se mantiene el fondo gris claro `#E5E7EB` para asegurar contraste y lectura clara.
- Se agrega estilo directo en `Capture.js` y reglas CSS de respaldo de alta especificidad para evitar que reglas globales vuelvan a pintar los textos en celeste.



## v6.8.0

Ajustes funcionales y visuales para incorporar el nuevo tipo de campeonato **Eliminación Simple** y refinar la captura en modo oscuro:

- Modo oscuro / Tab Partidas: los campos de carambolas, SM1, SM2, tipo de resultado y ganador manual se muestran con texto negro y fondo claro para mejorar legibilidad operativa.
- Nuevo tipo de campeonato **Eliminación Simple** disponible en Wizard ProV y en el tab Campeonato.
- Eliminación Simple no utiliza fase de grupos; por lo tanto, el tab **Grupos** se oculta automáticamente en ProV, IA y Clásica cuando el campeonato activo usa este tipo.
- En Eliminación Simple todos los jugadores seleccionados se consideran clasificados directamente a llaves.
- Llaves / Bracket: para Eliminación Simple se puede generar una estructura aleatoria inicial usando la lógica actual de bracket, números mágicos y R0 cuando aplique.
- Llaves / Bracket: se agrega botón **Regenerar estructura** para campeonatos de Eliminación Simple. Si ya existen partidas realizadas, el sistema muestra advertencia antes de reemplazar la llave.
- Si un jugador tiene número de cabeza de serie definido en el campeonato, se respeta su posición de siembra; los jugadores sin cabeza se asignan aleatoriamente.
- Campeonatos tipo **Doble Fase Grupos** muestran automáticamente el tab **Grupos F2** desde el inicio, aunque todavía no se hayan generado los grupos de segunda fase.
- Setup muestra una tarjeta informativa específica para Eliminación Simple explicando que no usa grupos y que los jugadores pasan directo a llaves.
- `package.json` actualizado a `6.8.0`.

Archivos impactados:

- `src/App.js`
- `src/modules/Setup.js`
- `src/modules/Bracket.js`
- `src/lib/tournament.js`
- `src/styles.css`
- `package.json`
- `README.md`
- `CHANGELOG.md`

## v6.7.2

Ajuste específico del reporte PDF de Grupos y de la consistencia visual de títulos internos:

- Reporte PDF de Grupos: corregida la visibilidad del nombre de jugadores clasificados en la tabla de posiciones.
- Reporte PDF de Grupos: las filas de jugadores ganadores en la agenda muestran todo el texto en color azul.
- Reporte PDF/UI de Grupos: títulos de sección como Grupo, Tabla de posiciones y Agenda del grupo quedan centrados de forma consistente.
- Se agrega texto plano de respaldo para nombres de jugadores en impresión, evitando problemas de renderizado con botones/enlaces de historial dentro del PDF.
- `package.json` actualizado a `6.7.2`.

Archivos impactados:

- `src/modules/Groups.js`
- `src/styles.css`
- `package.json`
- `README.md`
- `CHANGELOG.md`


## v6.7.1

Corrección crítica de estabilidad posterior a v6.7.0. Esta versión soluciona el error `Field is not defined` que impedía cargar la aplicación cuando se renderizaba el módulo de Grupos con la nueva sección de filtros. La causa fue una importación incompleta en `src/modules/Groups.js` después de agregar los campos de filtro por grupo y jugador.

Archivos impactados:

- `src/modules/Groups.js`
- `package.json`
- `README.md`
- `CHANGELOG.md`



Plataforma web para gestión integral de campeonatos de billar carambola a 3 bandas FECOBI / ASOBIGRIE: jugadores, campeonatos normales, campeonatos ranking, doble fase de grupos, calendario, captura de partidas, planillas físicas, llaves/brackets, reportes PDF/Excel, ranking, cierre y auditoría.

## Release v6.7.0

Esta versión incorpora ajustes de UX/UI y operación solicitados para mejorar la claridad de navegación y la captura en vivo:

- Campeonato activo en modo claro con texto azul en listas de campeonatos.
- Tab Partidas con colores diferenciados para nombres, ganador, carambolas, SM1, SM2 y promedio según modo claro/oscuro.
- Código de partida y grupo/ronda centrado y aumentado 50%.
- Sección Grupos con título de grupo centrado y aumentado 50%.
- Agenda de grupo convertida a registro por jugador: cada partida se muestra en dos líneas e incluye SM1, SM2 y puntos ganados.
- Filtros en Grupos por grupo y por jugador; la búsqueda por jugador muestra el grupo completo correspondiente.
- Botón flotante de Feedback para comentarios de mejora o bugs, con ubicación editable por interface, menú, tab y sección.
- Orden oficial de enfrentamientos actualizado para grupos de 3, 4, 5 y 6 jugadores.
- Soporte genérico para orden de enfrentamientos en grupos de 7 o más jugadores.
- `package.json` actualizado a `6.7.0`.

### Orden oficial de enfrentamientos aplicado

**Grupo de 3**: 2 vs 3, 1 vs 3, 1 vs 2.

**Grupo de 4**: 1 vs 4, 2 vs 3, 1 vs 3, 2 vs 4, 1 vs 2, 3 vs 4.

**Grupo de 5**: 2 vs 5, 3 vs 4, 1 vs 5, 2 vs 3, 1 vs 4, 5 vs 3, 1 vs 3, 2 vs 4, 1 vs 2, 4 vs 5.

**Grupo de 6**: 1 vs 6, 2 vs 5, 3 vs 4, 1 vs 5, 4 vs 6, 2 vs 3, 1 vs 4, 3 vs 5, 2 vs 6, 1 vs 3, 2 vs 4, 5 vs 6, 1 vs 2, 3 vs 6, 4 vs 5.

## Versión activa

**CaromChamps v7.0.0** mantiene la **Interface ProV** como experiencia predeterminada y conserva disponibles las interfaces **IA** y **Clásica** para transición controlada. La selección de interface se guarda en `localStorage`.

### Cambios principales v6.6.0

- Llaves Face to Face: estandarización visual de los cards con la visualización Continua, usando tamaños, tipografía, colores, espaciado y estructura de información equivalentes.
- Llaves Continua y Face to Face: el label **Ganador** y el nombre del jugador ganador se muestran en color azul claro en todos los cards.
- Llaves Face to Face: el card de Campeón/Ganador queda debajo del card de la Final con separación aproximada de 3 cm y con conector vertical.
- PDF Face to Face: reducción adicional del sizing del modo Todo 1 Página en aproximadamente 12% para mejorar la probabilidad de salida en una sola página.
- Grand Dashboard: agregado card informativo con la versión actual de la plataforma en ejecución, igual al criterio usado en dashboards de campeonato.
- Planillas PDF: la primera planilla base del torneo conserva el nombre del campeonato en el encabezado y se identifica como **Planilla Base del Torneo**.
- Planillas PDF: renglones superiores de información y jugadores ampliados aproximadamente 50% para mayor legibilidad.
- README reestructurado y verificado con historial consolidado de versiones y comandos actualizados.

## Interfaces disponibles

1. **Interface ProV** — predeterminada, con Grand Dashboard, menú izquierdo simplificado y tabs internos por campeonato.
2. **Interface IA** — interface guiada introducida en v5.9.0.
3. **Interface Clásica** — experiencia base utilizada hasta v5.8 y versiones anteriores.

## Instalación y validación local

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

## Ejecución recomendada en Windows

```powershell
cd C:\proyectos\caromchamps
.\START_CAROMCHAMPS.bat
```

Alternativa con PowerShell:

```powershell
cd C:\proyectos\caromchamps
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\START_CAROMCHAMPS.ps1
```

## Historial de versiones consolidadas



### v6.9.3 — Feedback operativo y refinamientos de Eliminación Simple

- Modo oscuro / Tab Partidas: carambolas, SM1, SM2, tipo de resultado y ganador manual se muestran en azul oscuro.
- Nuevo menú **Feedback** en el panel izquierdo para seguimiento de comentarios, mejoras y bugs.
- Los feedbacks pueden cambiarse manualmente entre Recibido, En revisión, Priorizado, En desarrollo, Resuelto, Cerrado y Rechazado.
- El tab Campeonato oculta campos de grupos/F2 que no aplican cuando el tipo es **Eliminación Simple**.
- En Eliminación Simple se muestran cards propios de jugadores a llaves y tipo de llave aleatoria con respeto de cabezas de serie.

### v6.8.0 — Eliminación Simple y ajustes de captura

- Nuevo tipo de campeonato Eliminación Simple, sin fase de grupos.
- Ocultamiento automático del tab Grupos para campeonatos de Eliminación Simple.
- Generación y regeneración aleatoria de llaves con respeto de cabezas de serie.
- Advertencia cuando se intenta regenerar una estructura con partidas ya realizadas.
- Grupos F2 visible automáticamente para campeonatos de Doble Fase Grupos.
- Modo oscuro en Partidas con campos críticos en texto negro para legibilidad.

### v6.6.0 — UI consistente en llaves, PDF Face to Face y planillas base

- Face to Face toma el diseño visual de cards de la visualización Continua.
- Ganador y nombre del ganador en azul claro en todos los cards de llaves.
- Campeón/Ganador debajo de la Final con separación aproximada de 3 cm.
- PDF Face to Face con sizing reducido 12%.
- Grand Dashboard muestra versión actual de plataforma.
- Planilla base incluye nombre del campeonato y encabezado de plantilla base.
- Renglones superiores de planillas ampliados para legibilidad.

### v6.5.0 — Planillas aisladas y corrección Face to Face

- Restaurada primera planilla en blanco como plantilla base del torneo.
- Aislamiento total del área imprimible para que ProV, tabs o menús no aparezcan en el PDF.
- Corrección del salto de la primera planilla a dos páginas.
- Face to Face: corrección del posicionamiento de Final y Campeón hacia el centro superior solicitado.
- Conectores centrales recalculados desde Semis hacia Final.

### v6.4.0 — Launcher local, planillas y Face to Face

- Scripts `START_CAROMCHAMPS.bat`, `START_CAROMCHAMPS.ps1`, `INSTALL_CAROMCHAMPS_AUTOSTART.ps1` y `REMOVE_CAROMCHAMPS_AUTOSTART.ps1` para operar localmente.
- Mejora operativa para evitar confusión con `localhost refused to connect` cuando el servidor local no está corriendo.
- Planillas PDF centradas horizontal y verticalmente.
- Ajuste para una planilla por página en tamaño Carta.
- Face to Face: Final y Campeón movidos hacia zona superior con conectores desde Semis.
- Control de Promedios desactivado: cierre, acta y ranking evitan mostrar AVG/entradas cuando no aplica.

### v6.3.0 — ProV, Control de Promedios y estabilidad SPA

- Rollback del fondo azul claro completo del panel de tabs ProV en modo oscuro.
- Flechas del proceso en modo oscuro con fondo azul.
- Grand Dashboard: gráficos enlazados al tab Reportes del campeonato y Top de jugadores con historial.
- Dashboard del campeonato: AVG final integrado a gráfica por fase y Top 7 de AVG del torneo.
- Navegación local estabilizada con hash para refresh, back/forward y reapertura.
- Nuevo parámetro Control de Promedios Sí/No.
- Si Control de Promedios = No, se ocultan entradas/promedios y se ajustan desempates.
- Planillas PDF con sizing reducido 10%.

### v6.2.0 — ProV, Doble Fase Grupos y ajustes operativos

- Tab Reportes agregado al panel ProV.
- Nueva funcionalidad Doble Fase Grupos con tipo de campeonato y tab Grupos F2.
- Wizard permite crear campeonatos Normal o Doble Fase Grupos.
- Grupos F2 se alimenta de clasificados de la primera fase.
- Bloqueos de Setup al clasificar/cerrar campeonato en ProV, IA y Clásico.
- Ranking: detalle por campeonato enlaza al tab Reportes del campeonato asociado.

### v6.1.0 — Wizard overlay y Ranking Dashboard

- Wizard de campeonatos convertido en pantalla sobrepuesta.
- Wizard incluye divisiones Selectivo e Internacional.
- Tabs ProV rediseñados como flechas de proceso y sticky al hacer scroll.
- Dashboard de campeonato con lista de partidas pendientes.
- Ranking Dashboard con Top 10, participantes por campeonato y AVG por campeonato asociado.
- Botón Abrir habilitado para campeonatos activos.

### v6.0.0 — Interface ProV

- Nueva Interface ProV como experiencia predeterminada.
- Grand Dashboard acumulado de plataforma.
- Menú izquierdo: Grand Dashboard, Campeonatos, Ranking y Administración.
- Menú Campeonatos muestra campeonatos normales.
- Menú Ranking muestra campeonatos tipo Ranking.
- Tabs internos: Dashboard, Campeonato, Grupos, Calendario, Partidas, Llaves, Cierre y Reportes.
- Wizard para campeonatos normales y rankings.
- Zoom In/Out independiente para llaves Continua y Face to Face.

### v5.9.0 — Interface IA y fallback clásico

- Nueva Interface IA guiada por flujo.
- Opción para volver a Interface Clásica.
- Dashboard como centro de control operativo.
- Siguiente acción recomendada, alertas operativas y checklist de cierre.
- Catálogo de reportes y vista previa tipo tablero para agenda.
- Base `DataTableCarom` para tablas futuras.

### v5.8.0 — Face to Face y Ranking PDF

- Compactación vertical superior del Face to Face.
- Conectores centrales entre Semis y Final.
- Ranking PDF con C1, C2, etc. y detalle por campeonato.
- Ranking resumen por campeonato con PRG, CAR, ENT, AVG y Pos#.

### v5.7.0 — Final, campeón y ranking

- Separación visual de Final y Semis.
- Campeón/Ganador debajo de la Final en Face to Face.
- Ranking con jugador, historial, asociación y bandera.
- Ranking filtra solo jugadores participantes.
- Rankings no requieren selección directa de jugadores.

### v5.6.0 — Face to Face árbol y Ranking avanzado

- Face to Face reconstruido con geometría tipo árbol.
- Conectores SVG basados en fuentes reales de partidas.
- R0 integrado como alimentador visual.
- Ranking con PRG en rojo.
- Métricas PRG, PJ, PG, PP, PE, CAR, ENT y AVG.
- PDF de ranking.

### v5.5.0 — Ranking mode, menús y llaves

- Campeonatos Ranking ocultan pasos operativos normales.
- Grupos: banderas alineadas.
- Llaves: mensajes de confirmación en acciones principales.
- Face to Face usa `source_match1_id` y `source_match2_id`.
- Menú con scroll vertical.
- Ranking acumulado por jugador y matriz por campeonato.

### v5.4.0 — Login premium y Ranking inicial

- Login premium y modo claro por defecto.
- Menú lateral colapsable.
- Perfil de usuario con foto, país y teléfono.
- División objetivo en Paso 1.
- R0 para cantidades no mágicas.
- Reabrir grupos con validaciones.
- PDF continuo con Dieciseisavos/R32 optimizado.
- Primera funcionalidad Ranking.

### v5.2.0 — Plataforma multiusuario Supabase

- Supabase Auth con correo, Google y Facebook.
- Perfil de usuario y roles.
- Separación de datos por usuario.
- Sincronización en `user_app_states`.
- Enlaces compartidos de campeonato en solo lectura.
- Vista compartida con grupos, llaves, KO y ranking público.

### v5.0.0 — Capa inicial Supabase

- Integración inicial de Supabase Auth.
- Formulario de registro.
- Supabase Storage para fotos de perfil.
- `.env.example` y scripts SQL base.

### v4.14.0 — Rebranding CaromChamps

- Rebranding a CaromChamps.
- Repositorio oficial `vsolanos/caromchamps`.
- Dashboard actualizado.
- PDF tabular R32 optimizado.
- Intercambio de jugadores en grupos.

### v4.13.0 a v4.1.0 — Base funcional histórica

- Llave Continua con R0/preclasificación.
- Planillas físicas imprimibles con QR y firmas.
- Carga de planillas firmadas.
- Intercambio y sustitución de jugadores.
- Regreso ordenado de fase con auditoría.
- Historial de jugador con gráfico de promedio.
- Exportaciones institucionales PDF/CSV.

## Configuración Supabase

Ejecutar en Supabase:

```text
docs/supabase_schema_v5.sql
```

Variables de entorno:

```text
VITE_SUPABASE_URL=https://vmcbaexkbenbesygxccu.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key de Supabase>
```

Redirect URLs recomendadas:

```text
https://caromchamps.com/*
http://localhost:5173/*
```

## Publicación GitHub sugerida

```powershell
git status
git add .
git commit -m "Release v6.6.0 - Bracket UI standardization, Face to Face PDF sizing and score sheet refinements"
git push origin main
git tag -a v6.6.0 -m "CaromChamps v6.6.0"
git push origin v6.6.0
```

## v6.9.3 - Ajuste visual modo oscuro / Partidas

- Los fondos de los campos Carambolas, SM1, SM2, Tipo de resultado y Ganador manual en modo oscuro se ajustan a gris claro.
- Se mantiene el texto café claro solicitado en v6.9.1 para asegurar contraste y continuidad visual.



### v6.9.3 - Hotfix de legibilidad en Partidas / modo oscuro

- Corrección reforzada para que los campos Carambolas, SM1, SM2, Tipo de resultado y Ganador manual muestren texto oscuro real en modo oscuro.
- Se aplican clases específicas e inline-style desde `Capture.js`, evitando que reglas globales de `.input`, `.completed-row-card` o estilos anteriores vuelvan a pintar los valores en celeste.
- `Select` acepta ahora `className`, `style` y props adicionales.


## v7.0.0 · Planillas IA

Esta versión introduce la funcionalidad **Planillas IA**, orientada a leer planillas firmadas y trasladar resultados a las partidas oficiales mediante revisión humana.

### Capacidades principales

- Carga masiva de archivos PDF, PNG, JPG, JPEG, WEBP y otros formatos de imagen.
- Identificación de partida por QR, código de partida en nombre de archivo, nombres de jugadores o respuesta de un endpoint IA/OCR.
- Bandeja de revisión con semáforo de confianza: Alta, Media y Baja.
- Asociación automática de cada archivo procesado a la partida correspondiente como evidencia.
- Soporte de arquitectura para PDF multipágina: si un PDF contiene varias planillas, el endpoint IA/OCR puede retornar cada página como imagen asociada a su partida.
- Guardado de resultados desde la bandeja de revisión y aprobación masiva de lecturas de alta confianza.
- Auditoría de importaciones, correcciones, partidas finalizadas y errores de lectura.

### Contrato sugerido para endpoint IA/OCR

El tab **Planillas IA** puede trabajar con lectura local limitada o con un backend seguro, por ejemplo Cloudflare Worker. El endpoint debe recibir `files` y `context` por `FormData`, y devolver JSON con una colección `results`.

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

Cuando `average_control_enabled` es `false`, CaromChamps ignora entradas al aplicar resultados importados, pero mantiene carambolas, SM1, SM2, ganador y tipo de resultado.
