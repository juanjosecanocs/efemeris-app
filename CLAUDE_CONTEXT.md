# CLAUDE_CONTEXT.md — Contexto del proyecto Efemeris

### Wikidata SPARQL
- **Endpoint:** `https://query.wikidata.org/sparql`
- **Consultado por:** `precalculate.js` (genera datos-365dias.json)
- **Datos obtenidos:** personajes nacidos, efemérides históricas, hitos científicos
- **Rate limit:** 1 segundo entre consultas
- **URLs capturadas:** wikidataUrl en JSON para cada dato

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
- [x] Menú lateral con 7 items
- [x] Union visual item + card (borde continuo)

### ✅ Datos
- [x] Santoral (365 días + 29/02)
- [x] Personajes (Wikidata)
- [x] Efemérides históricas (Wikidata)
- [x] Hitos científicos (Wikidata)
- [x] Citas motivacionales (Quotable.io + dataset español)
- [x] Refranes (dataset CSV)
- [x] Curiosidades matemáticas (generadas localmente)

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

---

## 🐛 ISSUES CONOCIDOS / PENDIENTES

### Resueltos ✅
- [x] Clima "No disponible" — API key válida configurada
- [x] Luna mostraba solo fase — Agregado getMoonTimes()
- [x] Service worker zombie — Resuelto en build

### Pendientes de validar 🔄
- [ ] Performance en móviles lentos
- [ ] Compatibilidad con navegadores antiguos
- [ ] Pruebas en dispositivos reales (Android 8+, iOS 13+)

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
| Dataset CSV | Refranes, citas | Manual | ~365 |
| Local | Curiosidades matemáticas | Generado | Aleatorio |

---

## 🔐 VARIABLES DE ENTORNO ---

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

**Última revisión:** Agosto 4, 2026  
**Revisor:** Claude (sesión PWA Development)  
**Siguiente revisión:** Cuando se agreguen nuevas features significativas
