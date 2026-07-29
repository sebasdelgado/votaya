# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responde siempre en español. Comentarios en el código en español.

---

## Contexto del proyecto

**VotaYa — Sistema de Votaciones y Encuestas Online**
Proyecto de grado del programa **Senatic — Técnico en Programación de Software**.
Estudiantes de 15 a 18 años, nivel básico en PHP y MySQL.

---

## Stack tecnológico

- **Frontend:** HTML, CSS, JavaScript (páginas separadas, sin frameworks ni bundlers — no hay `package.json`)
- **Backend (fase 2):** PHP
- **Base de datos (fase 2):** MySQL
- **Fase actual:** Frontend completo con datos simulados mediante `fetch` a archivos `.json`

---

## Cómo correr el proyecto

Abrir `index.html` directamente en el navegador **o** usar un servidor local para evitar errores de CORS al leer los `.json`:

```
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Luego navegar a `http://localhost:8080`.

**Credenciales de prueba:**
- **Votante:** cualquier `numero_documento` de `datos/votantes.json` (ej: `1005234567`)
- **Admin:** correo `admin@colegio.edu.co` / contraseña `admin123` (definido en `js/admin-login.js`)

---

## Identidad visual

- **Tema:** Claro con acento cyan tecnológico
- **Color acento:** `#0369a1` / hover `#0284c7` / claro `#e0f2fe`
- **Fondo:** `#f8fafc`
- **Tipografía títulos:** Syne (Google Fonts)
- **Tipografía cuerpo:** DM Sans (Google Fonts)
- **Iconos:** Tabler Icons via CDN (`ti ti-*`), sin instalación local

---

## Layouts

- **Votante:** topbar fija azul + contenido centrado `max-width: 960px`
- **Admin:** topbar fija azul + sidebar lateral fijo de `240px` + contenido `max-width: 1400px`
- **Login:** pantalla completamente centrada, tarjeta flotante
- **Responsive:** sidebar se oculta en pantallas menores a 768px

Cada layout tiene su propio archivo CSS (`layout-login.css`, `layout-votante.css`, `layout-admin.css`).

---

## Arquitectura y flujo de datos (modo simulado)

Todo el estado persiste en el navegador — no hay backend activo:

| Dato | Almacenamiento |
|------|---------------|
| Sesión del usuario | `sessionStorage` (`votaya_usuario`) |
| Votos emitidos | `localStorage` (`votaya_votos`) |
| Catálogos (votantes, candidatos, encuestas, grupos) | Archivos JSON en `datos/` (solo lectura) |

### Funciones globales en `app.js`

Todas las páginas cargan `app.js` primero. Expone:
- `obtenerJSON(archivo)` — fetch a `datos/{archivo}.json`
- `obtenerSesion()` / `guardarSesion()` / `cerrarSesion()` — manejo de sesión
- `requiereVotante()` / `requiereAdmin()` — guards de ruta (redirigen si no hay sesión válida)
- `registrarVotoLocal()` / `yaVoto()` / `contarVotosPorOpcion()` — lógica de votos en localStorage
- Utilidades: `mostrarAlerta()`, `mostrarCargando()`, `formatearFecha()`, `iniciales()`

---

## Roles del sistema

### Votante
- Accede **solo con su número de documento** (sin contraseña)
- Puede ver encuestas activas, votar una sola vez por encuesta
- Puede ver resultados de encuestas cerradas o donde ya votó
- **No se registra solo** — el admin carga el padrón

### Admin
- Accede con correo y contraseña
- Carga padrón de votantes desde CSV o manualmente
- Registra candidatos, crea y gestiona encuestas
- Ve estadísticas y resultados con filtros

### Candidato
- **No es un usuario del sistema** — no inicia sesión
- Es un registro creado por el admin (nombre, apellido, foto, propuesta, numero_lista)
- Tiene **etiquetas de propuesta** asignadas por el admin (**pendiente de implementar**)

---

## Tipos de encuesta

### Tipo `candidatos`
Para elecciones formales (personero, representante de grupo). Cada opción muestra foto, nombre, número de lista y propuesta del candidato.

### Tipo `texto`
Para preguntas con alternativas simples (actividad del día del estudiante, materia favorita). Cada opción es texto libre.

---

## Convenciones de código

- Cada página HTML tiene su propio archivo JS con su lógica; `app.js` solo contiene funciones compartidas
- **Todo el JS está desacoplado del HTML** — cero `onclick`/`oninput`/`onchange` en HTML; todo via `addEventListener`
- Cada función que necesita backend tiene un comentario `// TODO:` explicando la consulta SQL que ejecutará PHP
- Al migrar a backend: cambiar `BASE_URL` en `app.js` de `'../datos'` a la ruta de la API PHP, y reemplazar `localStorage`/`sessionStorage` por sesiones PHP (`$_SESSION`)

---

## Base de datos (fase 2) — 7 tablas

### `grupos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| nombre | VARCHAR | Ej: "Décimo A" |
| grado | VARCHAR | Ej: "Décimo" |

### `usuarios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| numero_documento | VARCHAR | Con lo que accede a votar |
| nombre, apellido | VARCHAR | |
| fecha_nacimiento | DATE | Para estadísticas de edad |
| genero | ENUM | masculino, femenino, otro |
| jornada | ENUM | mañana, tarde |
| grupo_id | INT FK | → grupos |
| rol | ENUM | votante, admin |
| contrasena | VARCHAR | NULL para votantes, hash para admin |

### `candidatos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| nombre, apellido | VARCHAR | |
| foto | VARCHAR | URL opcional |
| propuesta | TEXT | |
| numero_lista | VARCHAR | |

### `etiquetas`
Catálogo fijo. Valores: `recreación`, `deporte`, `académico`, `ambiental`, `tecnología`, `cultural`, `bienestar`

### `candidato_etiquetas`
Relación muchos a muchos entre `candidatos` y `etiquetas`.

### `encuestas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| titulo | VARCHAR | |
| descripcion | TEXT | |
| tipo | ENUM | candidatos, texto |
| estado | ENUM | activa, cerrada |
| fecha_inicio, fecha_fin | DATETIME | |

### `opciones`
`encuesta_id` FK, `candidato_id` FK (NULL si tipo=texto), `texto_opcion` (NULL si tipo=candidatos).

### `votos`
`usuario_id` FK, `encuesta_id` FK, `opcion_id` FK, `fecha_voto` DATETIME.
La combinación `usuario_id + encuesta_id` debe ser **UNIQUE** — impide votar dos veces.

---

## Estado actual y próximos pasos

**Completado:**
- [x] Frontend completo con todos los layouts y páginas
- [x] Sistema de CSS completo y responsivo
- [x] `app.js` con todas las funciones compartidas
- [x] Datos JSON simulados
- [x] Desacople completo JS/HTML

**Pendiente:**
- [ ] Etiquetas de propuesta (frontend + BD)
- [ ] Estadísticas completas con filtros y análisis por etiqueta
- [ ] Fase 2: Backend PHP + MySQL (archivos PHP que reemplacen los JSON simulados)
- [ ] Fase 2: Script SQL de la base de datos
- [ ] Generar historias de usuario al finalizar el código

### CSV de carga de votantes

Formato esperado para la carga masiva:
```
numero_documento,nombre,apellido,fecha_nacimiento,genero,jornada,grupo_id
1005234567,María,García,2008-03-15,femenino,mañana,1
```
