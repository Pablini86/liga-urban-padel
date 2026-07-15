# Urban Padel Life — Liga Urban Padel

Sitio y panel de administración de la Liga Americana de Pádel de Urban Padel Life (Las Rosas, Guadalajara).

- **Sitio público:** tabla general, jornadas, horarios y patrocinadores — [`index.html`](index.html)
- **Panel admin:** gestión de ligas, jugadores, horarios, captura de resultados, promociones e imprimibles — [`admin.html`](admin.html)

## Stack

HTML/CSS/JS puro, sin build step — los módulos de JS se cargan de forma nativa con `<script type="module">`. Los datos viven en **Firebase**:

- **Firestore** — datos de ligas, jugadores, partidos, jornadas, promociones, restricciones y patrocinadores.
- **Authentication** — acceso al panel admin restringido a los correos en `ADMIN_EMAILS` (ver [`js/admin/state.js`](js/admin/state.js)).
- **Storage** — imágenes de patrocinadores subidas desde el admin.

## Estructura

```
index.html              Sitio público
admin.html               Panel de administración
manifest.json / sw.js    PWA (instalable, cache offline) — deben quedarse en la raíz

css/
  index.css              Estilos del sitio público
  admin.css               Estilos del admin

js/
  index/                 Módulos ES del sitio público (state, navegación, cada sección de la UI)
  admin/                  Módulos ES del admin (uno por sección: ligas, jugadores, horarios, captura, etc.)

img/                     Logos, favicons, texturas
templates/                Plantilla de Excel para importar jugadores

firebase.json / .firebaserc     Config del proyecto de Firebase
firestore.rules / storage.rules  Reglas de seguridad (ver despliegue abajo)
```

Cada archivo en `js/admin/` y `js/index/` corresponde a una sección de la interfaz (por ejemplo `captura.js` = captura de resultados, `jornada-schedule.js` = asignación de horarios). `dispatch.js` (admin) y `main.js` (ambos) son los puntos de entrada que conectan todo.

## Desarrollo local

No requiere instalar dependencias ni compilar nada. Basta con servir los archivos estáticos:

```bash
python3 -m http.server 8000
# o: npx serve
```

Y abrir `http://localhost:8000/index.html` o `http://localhost:8000/admin.html`.

## Despliegue

- **Sitio (GitHub Pages + Vercel):** se despliega automáticamente al hacer `git push` a `main`.
- **Reglas de Firestore/Storage:** no se despliegan solas, hay que correrlo manualmente después de cambiar `firestore.rules` o `storage.rules`:

  ```bash
  npx firebase-tools login          # una sola vez
  npx firebase-tools deploy --only firestore:rules,storage
  ```

## Notas

- Los correos con acceso al admin están hardcodeados en `js/admin/state.js` (`ADMIN_EMAILS`) y replicados en `firestore.rules`/`storage.rules` — si cambian, hay que actualizar los tres lugares.
- `plantilla-jugadores.xlsx` es la plantilla que se descarga desde el admin (pestaña Jugadores) para importar jugadores en lote; columnas requeridas: `Nombre` y `Grupo` (grupos de 4 jugadores).
