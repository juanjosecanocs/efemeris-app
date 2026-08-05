# CLAUDE_CONTEXT.md — Contexto del proyecto Efemeris

### Wikidata
- **Endpoint SPARQL:** `https://query.wikidata.org/sparql` — usado por
  `precalculate.js` (personajes, efemérides, hitos) y
  `scripts/precalculate-cronoteca.js` (obras día-exactas vía `P577`)
- **Endpoint REST (`w/api.php`, `action=wbgetentities`)** — usado por los
  scripts `scripts/add-wikipedia-*.js` para resolver el sitelink `eswiki` de
  QIDs ya conocidos. Rate limit más agresivo que el SPARQL endpoint: corta
  con "You are making too many requests" tras varios lotes seguidos, incluso
  con ~1s de espera — usar lotes de ~30 IDs con 2-3s de espera entre lotes
- **Rate limit SPARQL:** ~1 segundo entre consultas evita timeouts; consultas
  de un solo paso sobre clases amplias (todos los humanos, todas las
  películas) sí dan timeout — ver el patrón de dos pasos (candidatos baratos
  + ranking por `sitelinks`) usado en `precalculate.js` y
  `precalculate-cronoteca.js`
- **URLs capturadas:** `wikidataUrl` (siempre) y `wikipediaUrl` (cuando el
  QID tiene sitelink en español) en cada dato — ver `enlacePreferido()` en
  `App.jsx`

---

## 🎯 FUNCIONALIDADES COMPLETADAS

### ✅ Navegación
- [x] Navegación por días (flechas anterior/siguiente)
- [x] Navegación por meses (calendarios visuales)
- [x] Seleccionar cualquier día del mes
- [x] Mostrar semana del año

### ✅ Visualización de datos
- [x] CardClima con temperatura, viento, precipitación
- [x] CardAstros con orto/ocaso de sol y luna
- [x] CardDinamica con contenido dinámico
- [x] Menú lateral con 10 items (orden: Personaje, Efeméride, Cita
      motivacional, Santoral, Refrán, Hito científico, Curiosidad
      matemática, Waku-Waku, Cronoteca, Histoku)
- [x] Union visual item + card (borde continuo)

### ✅ Datos
- [x] Santoral (365 días + 29/02)
- [x] Personajes (Wikidata)
- [x] Efemérides históricas (Wikidata)
- [x] Hitos científicos (Wikidata)
- [x] Citas motivacionales (array local en `contenidoLocal.js`, sin API externa)
- [x] Refranes (array local en `contenidoLocal.js`, dichos auténticos verificados a mano)
- [x] Curiosidades matemáticas (generadas localmente)
- [x] Waku-Waku: curiosidad animal diaria (contenido local, ver sección propia)
- [x] Cronoteca: recomendación artística día-exacta (Wikidata, ver sección propia)

### ✅ Icono dinámico
- [x] SVG React con fecha dinámica
- [x] Sol se mueve según hora del día
- [x] Sol cambia color según clima
- [x] Luna de noche
- [x] Actualización cada minuto

### ✅ PWA
- [x] Service worker para offline
- [x] Manifest.json configurado
- [x] Icono favicon.ico
- [x] Iconos 192x192 y 512x512 para pantalla de inicio
- [x] Instalable en Android (Chrome) e iOS (Safari)

### ✅ Datos enriquecidos
- [x] URLs de Wikidata en JSON (wikidataUrl)
- [x] Enlaces clickeables en CardDinamica
- [x] Santoral con tipo de festividad + otros santos
- [x] Fusión de Excel Martirologio Romano con JSON actual
- [x] URLs de Wikipedia en español (wikipediaUrl) en Personaje, Efeméride,
      Hito científico, Waku-Waku y Cronoteca — preferidas sobre Wikidata
      cuando existen (ver `enlacePreferido()` en `App.jsx`)

---

## 🔄 SCRIPTS DE MANTENIMIENTO

### `precalculate.js`
**Propósito:** Generar `datos-365dias.json` consultando Wikidata

**Uso:**
```bash
node precalculate.js
```

**Tiempo:** ~6-7 horas (365 días × 3 consultas)
**Output:** `public/datos-365dias.json`

### `merge-santoral.js`
**Propósito:** Fusionar santoral de Excel Martirologio Romano con JSON actual

**Uso:**
```bash
node merge-santoral.js
```

**Tiempo:** ~10-15 minutos (solo consultas faltantes)
**Input:** `Santoral_Completo_Ano.xlsx` (desde `/mnt/user-data/uploads/`)
**Output:** `public/datos-365dias.json` (actualizado)
**Depende de:** `dias-qid.js` (mapa estático `MM-DD -> QID` de cada "día
calendario" en Wikidata, usado junto con `P841` para resolver santoral sin
escanear todo Wikidata por fecha — no es un script que se corra, es un dato
generado una sola vez que se importa)

### `update-urls.js`
**Propósito:** Agregar `wikidataUrl` a `personaje`/`efemeride`/al primer
`hitosCientificos` de `public/datos-365dias.json` sin regenerar todo el
archivo — busca por el nombre/título ya guardado (no por QID, porque
`precalculate.js` nunca lo guardó) contra Wikidata.

**Uso:**
```bash
node update-urls.js
```

**Cuándo usarlo:** si algún personaje/efeméride/hito quedó sin
`wikidataUrl` (y por lo tanto sin poder resolver `wikipediaUrl` con
`scripts/add-wikipedia-datos365.js`), este es el script que lo busca y lo
completa.

### `generate-histoku-365.js`
**Propósito:** Generar los 365 puzzles de Histoku (deducción histórica),
con temática distinta según el mes del año.

**Uso:**
```bash
node generate-histoku-365.js
```

**Output:** `public/histoku-365dias.json`

### `scripts/precalculate-cronoteca.js`
**Propósito:** Generar/ampliar `public/cronoteca-365dias.json` (recomendación
artística — película/libro/canción/álbum — con fecha de estreno/publicación
exacta, verificada vía SPARQL contra Wikidata `P577`)

**Uso:**
```bash
node scripts/precalculate-cronoteca.js              # solo el mes actual
node scripts/precalculate-cronoteca.js --mes=06     # un mes puntual
node scripts/precalculate-cronoteca.js --desde=02 --hasta=12
node scripts/precalculate-cronoteca.js --full       # los 12 meses
node scripts/precalculate-cronoteca.js --no-cache   # ignora scripts/.cache-cronoteca/
```
También hay alias en `package.json`: `npm run cronoteca:generate` (mes
actual) y `npm run cronoteca:generate:full` (los 12 meses).

**Tiempo:** ~25-30s por día (2 consultas × hasta 4 tipos de obra), ~2.5h para
11 meses. Guarda incrementalmente (merge con lo que ya haya en el JSON, no
lo pisa) y cachea cada día resuelto en `scripts/.cache-cronoteca/` para no
re-consultar si se corta a mitad de camino.

**Criterio de selección (importante):** prioriza libro/canción/álbum por
sobre película — la primera versión priorizaba película siempre que hubiera
alguna disponible, y como casi todos los días tienen al menos una película
con fecha exacta en Wikidata, terminaba siendo ~100% película (336/338).
Para inspeccionar el conteo actual por tipo:
```bash
node -e "const d=require('./public/cronoteca-365dias.json');console.log(Object.values(d).reduce((a,e)=>{a[e.tipo]=(a[e.tipo]||0)+1;return a},{}))"
```

**Output:** `public/cronoteca-365dias.json` — archivo independiente, separado
de `datos-365dias.json` a propósito (Cronoteca no debe interferir con
`precalculate.js`).

### `scripts/update-cronoteca-urls.js`
**Propósito:** Validar/normalizar las URLs de Wikidata en
`cronoteca-365dias.json` (mismo rol que tenía `update-urls.js` para el resto
de la app)

**Uso:**
```bash
node scripts/update-cronoteca-urls.js --validate   # solo reporta, no guarda
node scripts/update-cronoteca-urls.js               # corrige y guarda
```
Alias: `npm run cronoteca:validate` / `npm run cronoteca:fix`.

### `scripts/add-wikipedia-cronoteca.js`
**Propósito:** Agregar `wikipediaUrl` (artículo real en Wikipedia en
español, tomado del sitelink `eswiki` de cada QID — no se reconstruye a
mano porque el título de la página puede diferir del label en Wikidata) a
cada entrada de `cronoteca-365dias.json`. Si un QID no tiene sitelink en
`eswiki`, la entrada se queda sin `wikipediaUrl` y la UI cae al enlace de
Wikidata (ver `App.jsx`, item `cronoteca` de `datosPorItem`).

**Uso:**
```bash
node scripts/add-wikipedia-cronoteca.js
```

**Cuándo correrlo de nuevo:** cada vez que se generen días nuevos con
`precalculate-cronoteca.js` (los días nuevos no traen `wikipediaUrl` hasta
que se corre este script sobre ellos).

### `scripts/add-wikipedia-datos365.js`
**Propósito:** mismo enfoque que `add-wikipedia-cronoteca.js` pero para
`public/datos-365dias.json` — agrega `wikipediaUrl` a `personaje`,
`efemeride` y cada elemento de `hitosCientificos`, resolviendo el sitelink
`eswiki` de los QIDs que ya están en `wikidataUrl`. **No corre SPARQL ni
toca `precalculate.js`**, solo `wbgetentities` sobre QIDs ya conocidos — por
eso no hace falta re-precalcular los 365 días para tener este enlace.

**Uso:**
```bash
node scripts/add-wikipedia-datos365.js
```

**Nota sobre rate limit:** la API de Wikidata (`wbgetentities`) corta con
"You are making too many requests" tras varios lotes seguidos incluso con
~1s de espera entre ellos — el script usa lotes de 30 QIDs con 3s de espera,
y aun así puede fallar algún lote puntual (quedan sin `wikipediaUrl`, no se
inventa nada). Si hace falta reintentar, correrlo de nuevo es seguro: solo
completa los campos que todavía no tengan `wikipediaUrl`, no vuelve a
consultar los que ya se resolvieron.

### `scripts/diversify-cronoteca.js`
**Propósito:** Script puntual (no forma parte del flujo normal) usado una
sola vez para rebalancear los 335 días Feb-Dic que se habían generado antes
de corregir el criterio de selección — reintentó un 50% al azar priorizando
libro/canción/álbum, dejando la película existente donde no encontró
alternativa día-exacta. No hace falta volver a correrlo salvo que se quiera
repetir ese rebalanceo sobre datos nuevos generados con el criterio viejo.

---

## 🦁 WAKU-WAKU (curiosidad animal diaria)

**Qué es:** un item más del menú (como Cita motivacional o Refrán): una
curiosidad sobre animales, elegida de forma determinística por día del año.

**Dónde vive:** `CURIOSIDADES_ANIMALES` en `src/data/contenidoLocal.js` — un
array plano de `{ titulo, descripcion, wikidataUrl, wikipediaUrl }`, sin
archivo JSON propio ni script de generación. Se elige con `elegirPorDia()`,
igual que `CITAS_MOTIVACIONALES`/`REFRANES`. Se renderiza con el
`CardDinamica` genérico (no tiene componente propio).

**Por qué es contenido local y no un `precalculate-waku-waku.js` con
Wikidata en vivo:** se probó — las fechas de "descripción de especie" en
Wikidata (`P574`) casi nunca tienen precisión de día (año solamente), así
que no hay forma real de tener "un animal distinto verificado por cada día
del calendario". Cada `wikidataId` de la lista actual se verificó a mano
contra la API de Wikidata antes de agregarse (78 entradas al cierre de esta
sesión — 78/365 ≈ 21%, cada una con `wikipediaUrl` también verificado. La
verificación por QID es el cuello de botella real para seguir creciendo:
llegar a 365 supondría verificar ~290 más contra la API, con el mismo riesgo
de rate-limit ya documentado en Cronoteca).

**Para agregar más curiosidades:** sumar objetos al array
`CURIOSIDADES_ANIMALES`, verificando el QID contra Wikidata (no confiar en
IDs "recordados" — ver el issue resuelto en Cronoteca más abajo, mismo tipo
de error).

---

## 🎬 CRONOTECA (recomendación artística día-exacta)

**Qué es:** película, libro, canción o álbum cuya fecha real de
estreno/publicación (verificada en Wikidata, propiedad `P577`) coincide con
el día del calendario que se está viendo. Item de menú entre Waku-Waku e
Histoku, renderizado con `CardDinamica` genérico (sin componente propio).

**Dónde vive:** `public/cronoteca-365dias.json` — **archivo independiente**,
NO dentro de `datos-365dias.json` ni tocado por `precalculate.js` (decisión
explícita: Cronoteca no debe interferir con el resto del pipeline). Se
fetchea aparte en `App.jsx` (`CRONOTECA_URL`, hook `useDatosPrecalculados`
reutilizado con URL parametrizable) y se busca por clave `MM-DD`, igual que
`datos-365dias.json`.

**Estado al cierre de esta sesión:** 338/366 días con obra real
día-exacta. Los ~28 días restantes (enero, mayormente) muestran una
sugerencia genérica de `CRONOTECA_SUGERENCIAS` (10 obras sin precisión de
día en Wikidata — ver más abajo) en vez de "Sin registros", marcada
explícitamente con el sufijo " · sugerencia" en el tipo para no aparentar
precisión que no existe.

**Enlace:** prioriza el artículo en Wikipedia en español (`wikipediaUrl`,
sitelink `eswiki` real de cada QID) sobre la ficha de Wikidata; si el QID no
tiene `eswiki`, cae a `wikidataUrl`. Este mismo criterio se extendió después
a Personaje, Efeméride, Hito científico y Waku-Waku (helper `enlacePreferido()`
en `App.jsx`, compartido por las 5 secciones) — **no hizo falta volver a
correr `precalculate.js`**: los QIDs ya estaban en `wikidataUrl` desde antes,
así que alcanzó con un script de enriquecimiento aparte
(`scripts/add-wikipedia-datos365.js`) que solo resuelve el sitelink de cada
QID ya existente. Cobertura: 967/1051 campos con Wikipedia en `datos-365dias.json`
(el resto son QIDs sin artículo en español real, no fallos), 19/19 en
Waku-Waku, 348/348 en Cronoteca.

### Decisiones/errores importantes de esta sesión (leer antes de tocar Cronoteca)

1. **El primer dataset "beta" (31 días de enero, pegado por el usuario) tenía
   los 31 `wikidataId` fabricados/incorrectos** — apuntaban a entidades
   aleatorias sin relación (una comuna francesa, "rock", arácnidos...). Se
   verificaron y corrigieron los 31 a mano contra la API real de Wikidata
   antes de usarlos. **Lección: nunca confiar en un QID sin verificarlo con
   `wbgetentities`/SPARQL, ni siquiera si "se ve bien".**

2. **Ninguna de esas 31 fechas asignadas coincidía con la fecha real de
   estreno/publicación de la obra** (ej. "1984" en 01-03, estrenada en
   realidad en 1949 sin precisión de día). Era contenido curado a mano
   ("una obra por día"), no día-exacto real. Se resolvió: de esas 31, solo
   3 tenían precisión de día real en Wikidata y se reubicaron a su día
   correcto dentro de enero (10, 20 y 28 de enero); las otras 28 se
   sacaron (10 no tienen precisión de día en ningún lado de Wikidata — esas
   pasaron a ser las `CRONOTECA_SUGERENCIAS`; las otras 18 tenían un día
   real que cae en Feb-Dic, pero esos días ya estaban cubiertos por el
   generador algorítmico, así que no se movieron).

3. **El criterio de selección original priorizaba película por sobre
   libro/canción/álbum** cuando había varios tipos disponibles el mismo
   día. Como casi todos los días tienen alguna película con fecha exacta,
   terminaba siendo ~100% película (336/338 al principio). Se cambió el
   criterio en `precalculate-cronoteca.js` (ahora prioriza no-película,
   compite por sitelinks) y se corrió `diversify-cronoteca.js` una vez
   sobre datos viejos para rebalancear. Resultado final: 169 película, 122
   álbum, 46 canción, 1 libro. **El tipo libro sigue casi vacío porque
   Wikidata rara vez registra el día exacto de publicación de un libro**
   (no es un bug del criterio, es escasez real de datos).

4. **La consulta SPARQL original de un solo paso (`FILTER(MONTH()=...&&
   DAY()=...)` combinada con el ranking en la misma consulta) daba timeout**
   contra el endpoint público — mismo problema que ya documentaba
   `precalculate.js` para personajes. La solución (heredada de
   `precalculate.js`) es el patrón de dos pasos: candidatos baratos primero
   (sin joins), ranking por `sitelinks` después sobre un `VALUES` acotado.

---

## 🐛 ISSUES CONOCIDOS / PENDIENTES

### Resueltos ✅
- [x] Clima "No disponible" — API key válida configurada
- [x] Luna mostraba solo fase — Agregado getMoonTimes()
- [x] Service worker zombie — Resuelto en build
- [x] QIDs fabricados en el dataset beta de Cronoteca — verificados y corregidos
- [x] Criterio de Cronoteca daba ~100% película — cambiado a priorizar no-película
- [x] Enlaces a Wikipedia (en vez de Wikidata) extendidos a las 5 secciones
      con QID, sin re-correr `precalculate.js`

### Pendientes de validar 🔄
- [ ] Performance en móviles lentos
- [ ] Compatibilidad con navegadores antiguos
- [ ] Pruebas en dispositivos reales (Android 8+, iOS 13+)

### Pendientes de Cronoteca 🔄
- [ ] Enero: solo 3/31 días tienen obra real (el resto cae a sugerencia
      genérica) — se podría correr el generador algorítmico también sobre
      enero para ver si sube la cobertura real
- [ ] Campo `artista` vacío en las 335 entradas generadas algorítmicamente
      (no se implementó resolución de P57/P50/P86 director/autor/intérprete
      según tipo de obra — sí está completo en los 3 días curados a mano y
      en las 10 `CRONOTECA_SUGERENCIAS`)
- [ ] Tipo `libro` casi sin representación (1/338) por escasez real de
      fechas día-exactas en Wikidata para libros, no por el criterio

---

## 📋 PRÓXIMAS MEJORAS SUGERIDAS

### Prioridad ALTA
1. **Búsqueda de fechas** — Buscar por santoral, personaje o efeméride
2. **Compartir información** — Botón para compartir datos en redes sociales
3. **Notificaciones** — Recordatorio diario con santoral del día
4. **Múltiples ubicaciones** — Seleccionar ciudad para clima local

### Prioridad MEDIA
5. **Modo oscuro** — Toggle light/dark
6. **Idiomas** — Español (actual) + Inglés + Catalán
7. **Historial** — Guardar días visitados
8. **Favoritos** — Marcar santorales o efemérides favoritas

### Prioridad BAJA
9. **Widgets** — Widget de pantalla de inicio (Android)
10. **Desktop** — Versión de escritorio con más funcionalidades
11. **Analytics** — Rastrear uso (sin datos personales)
12. **API pública** — Endpoint para desarrolladores

### Cronoteca (surgidas durante su desarrollo)
13. **Resolver `artista`** — completar director/autor/intérprete (P57/P50/P86
    según tipo) en las 335 entradas generadas algorítmicamente, que hoy lo
    tienen vacío
14. **Ampliar enero** — correr el generador algorítmico también sobre enero
    para subir del 3/31 actual (el resto son sugerencias genéricas)

### Contenido local (Waku-Waku / Citas / Refranes)
15. **Seguir ampliando Waku-Waku** hacia 365 — quedó en 78/365 (21%) por el
    costo de verificar cada QID uno por uno contra Wikidata; agregar más en
    tandas, siempre verificando (no confiar en QIDs de memoria)
16. **Seguir ampliando Refranes** — quedó en 144/365 (39.5%) porque el corpus
    de refranes españoles genuinos y bien conocidos que se puede recordar
    con confianza tiene un techo real; sumar más implica investigar fuentes
    en vez de solo generar contenido, para no inventar "refranes" falsos
17. **Citas motivacionales** ya está en 349/365 (95.6%) — es la más barata
    de ampliar (no depende de verificación externa), se podría cerrar el
    resto si hace falta

---

## 🚀 PROCEDIMIENTO DE DEPLOY

### Local
```bash
npm run dev      # Servidor desarrollo (localhost:5173)
npm run build    # Compilar para producción
npm run preview  # Preview del build
```

### GitHub
```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

### Netlify (automático)
1. Detecta push a `main`
2. Ejecuta `npm run build` (usa NODE_VERSION=20)
3. Publica `dist/`
4. Disponible en 2-5 minutos en https://efemeris.netlify.app/

---

## 📚 FUENTES DE DATOS

| Fuente | Tipo | Actualización | Cobertura |
|--------|------|---------------|-----------|
| Wikidata SPARQL | Personajes, efemérides, hitos | Según Wikidata | Completa |
| OpenWeatherMap | Clima en tiempo real | Cada 3 horas | Almería (configurable) |
| suncalc | Astrología (sol/luna) | Cálculo local | Preciso |
| Martirologio Romano | Santoral | Fijo anual | 366 días |
| Local (`contenidoLocal.js`) | Citas motivacionales | Manual | 349/365 (95.6%) |
| Local (`contenidoLocal.js`) | Refranes (auténticos, no inventados) | Manual | 144/365 (39.5%) |
| Local | Curiosidades matemáticas | Generado | Aleatorio |
| Local (verificado a mano) | Waku-Waku (curiosidad animal) | Manual | 78/365 (21.4%), rotan por día del año |
| Wikidata SPARQL (`P577`) | Cronoteca (película/libro/canción/álbum) | Manual (`precalculate-cronoteca.js`) | 338/366 días día-exacto + 10 sugerencias de respaldo |

---

## 🔐 VARIABLES DE ENTORNO

Se configuran en `.env` (no versionado; copiar desde `.env.example`). Todas
son `VITE_*` porque el proyecto es una PWA sin backend — quedan visibles en
el bundle del cliente, así que la API key de OpenWeatherMap no debe
considerarse secreta.

| Variable | Requerida | Default si falta | Uso |
|---|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | Sí, para clima real | — (cae a datos de fallback con warning en consola) | Clima actual y pronóstico (`src/services/apiService.js`) |
| `VITE_API_URL` | No | `https://api.openweathermap.org` | Solo si se necesita apuntar a otra URL base |
| `VITE_LATITUDE` | No | `36.8` (Almería) | Ubicación por defecto para el clima |
| `VITE_LONGITUDE` | No | `-2.4` (Almería) | Ubicación por defecto para el clima |

Los scripts de precálculo (`precalculate.js`, `precalculate-cronoteca.js`,
etc.) no usan variables de entorno: consultan Wikidata de forma anónima, sin
API key.

## 👥 CONTRIBUCIONES FUTURAS

Si otro desarrollador o Claude quiere mejorar el proyecto:

1. **Leer este archivo primero** — Entender contexto
2. **Leer el transcript de desarrollo** — Entender decisiones pasadas
3. **Revisar issues** — Ver qué está pendiente
4. **Seguir convenciones** — React Hooks, CSS Modules, camelCase
5. **Probar localmente** — `npm run dev` + navegador
6. **Hacer commit descriptivo** — `git commit -m "descriptivo"`
7. **Esperar deploy** — Netlify auto-redespliega

---

## 📞 REFERENCIAS RÁPIDAS

- **Repo:** https://github.com/juanjosecanocs/efemeris-app
- **Live:** https://efemeris.netlify.app/
- **Netlify:** https://app.netlify.com/sites/efemeris/
- **Wikidata:** https://query.wikidata.org/
- **OpenWeatherMap:** https://openweathermap.org/api

---

**Última revisión:** Agosto 5, 2026  
**Revisor:** Claude (sesión Waku-Waku + Cronoteca + enlaces Wikipedia +
ampliación de contenido local; incluye auditoría completa del documento,
no solo lo agregado en la sesión — se corrigieron referencias desactualizadas
a Quotable.io/CSV que ya no existían en el código, se documentaron
`update-urls.js`/`generate-histoku-365.js`/`dias-qid.js` que faltaban, y se
completó la sección de variables de entorno que había quedado vacía)  
**Siguiente revisión:** Cuando se agreguen nuevas features significativas
