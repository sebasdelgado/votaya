# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma
Responde siempre en español.
Comentarios en el código en español.

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

## Identidad visual

- **Tema:** Claro con acento cyan tecnológico
- **Color acento:** `#0369a1` / hover `#0284c7` / claro `#e0f2fe`
- **Fondo:** `#f8fafc`
- **Tipografía títulos:** Syne (Google Fonts)
- **Tipografía cuerpo:** DM Sans (Google Fonts)
- **Iconos:** Tabler Icons via CDN (`ti ti-*`), sin instalación local

---

## Layout

- **Votante:** topbar fija azul + contenido centrado `max-width: 960px`
- **Admin:** topbar fija azul + sidebar lateral fijo de `240px` + contenido `max-width: 1400px`
- **Login:** pantalla completamente centrada, tarjeta flotante
- **Responsive:** sidebar se oculta en pantallas menores a 768px

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

## Credenciales de prueba

- **Votante:** cualquier `numero_documento` de `datos/votantes.json` (ej: `1005234567`)
- **Admin:** correo `admin@colegio.edu.co` / contraseña `admin123` (definido en `js/admin-login.js`)

---

## Roles del sistema

### Votante
- No se registra por sí mismo — el admin carga el padrón
- Accede al sistema **solo con su número de documento** (sin contraseña)
- Puede ver encuestas activas, votar una sola vez por encuesta
- Puede ver resultados de encuestas cerradas o donde ya votó

### Admin
- Accede con **correo y contraseña**
- Carga el padrón de votantes desde CSV o manualmente
- Registra candidatos, crea encuestas, activa/cierra/elimina encuestas
- Ve estadísticas y resultados detallados con filtros

### Candidato
- **No es un usuario del sistema** — no inicia sesión
- Es un registro creado por el admin
- Campos: `nombre`, `apellido`, `foto`, `propuesta`, `numero_lista`
- Tiene **etiquetas de propuesta** asignadas por el admin (pendiente)

---

## Estructura de carpetas y arquitectura

```
votaciones/
├── index.html                     → ingreso votante por número de documento
├── pages/
│   ├── admin-login.html           → login exclusivo del admin
│   ├── encuestas.html             → lista de encuestas (votante)
│   ├── votar.html                 → pantalla de votación (votante) — ?id=N
│   ├── resultados.html            → resultados con gráfica — ?id=N
│   ├── admin-panel.html           → panel principal con stats y tabla
│   ├── admin-candidatos.html      → registrar y listar candidatos
│   ├── admin-votantes.html        → gestionar votantes + carga CSV
│   └── admin-encuesta-nueva.html  → crear nueva encuesta
├── css/
│   └── styles.css                 → estilos globales
├── js/
│   ├── app.js                     → funciones compartidas (ver abajo)
│   ├── login.js
│   ├── admin-login.js
│   ├── encuestas.js
│   ├── votar.js
│   ├── resultados.js
│   ├── admin-panel.js
│   ├── admin-candidatos.js
│   ├── admin-votantes.js
│   └── admin-encuesta-nueva.js
└── datos/
    ├── encuestas.json
    ├── candidatos.json
    ├── votantes.json
    ├── grupos.json
    └── votos.json
```

### Flujo de datos (modo simulado)

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

## Convenciones de código

- Cada página HTML tiene su propio archivo JS con su lógica
- `app.js` solo contiene funciones compartidas (sesión, fetch, utilidades)
- **Todo el JavaScript está desacoplado del HTML** — cero `onclick`, `oninput`, `onchange` en el HTML; todo se maneja con `addEventListener` desde el JS correspondiente
- Cada función que necesita backend tiene un comentario `// TODO:` explicando la consulta SQL que ejecutará PHP
- Al migrar a backend: cambiar `BASE_URL` en `app.js` de `'../datos'` a la ruta de la API PHP, y reemplazar `localStorage`/`sessionStorage` por sesiones PHP (`$_SESSION`)
- Las historias de usuario se generan al **final**, cuando el código esté completo

---

## Base de datos — 7 tablas

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
| nombre | VARCHAR | |
| apellido | VARCHAR | |
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
| nombre | VARCHAR | |
| apellido | VARCHAR | |
| foto | VARCHAR | URL opcional |
| propuesta | TEXT | |
| numero_lista | VARCHAR | |

### `etiquetas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| nombre | VARCHAR | Ej: "recreación", "deporte", "académico" |

Catálogo fijo predefinido. Ejemplos: `recreación`, `deporte`, `académico`, `ambiental`, `tecnología`, `cultural`, `bienestar`

### `candidato_etiquetas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| candidato_id | INT FK | → candidatos |
| etiqueta_id | INT FK | → etiquetas |

Relación muchos a muchos. Un candidato puede tener varias etiquetas.

### `encuestas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| titulo | VARCHAR | |
| descripcion | TEXT | |
| tipo | ENUM | candidatos, texto |
| estado | ENUM | activa, cerrada |
| fecha_inicio | DATETIME | |
| fecha_fin | DATETIME | |

### `opciones`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| encuesta_id | INT FK | → encuestas |
| candidato_id | INT FK | → candidatos (NULL si tipo=texto) |
| texto_opcion | VARCHAR | NULL si tipo=candidatos |

### `votos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| usuario_id | INT FK | → usuarios |
| encuesta_id | INT FK | → encuestas |
| opcion_id | INT FK | → opciones |
| fecha_voto | DATETIME | |

La combinación `usuario_id + encuesta_id` debe ser **UNIQUE** — impide votar dos veces.

---

## Tipos de encuesta

### Tipo `candidatos`
Para elecciones formales donde hay personas compitiendo (personero, representante de grupo, rey/reina).
Cada opción muestra: foto, nombre, número de lista y propuesta del candidato.

### Tipo `texto`
Para preguntas con alternativas simples (actividad del día del estudiante, materia favorita, mejora a la cafetería).
Cada opción es solo texto libre.

---

## Flujo de votación

1. El admin carga el padrón de estudiantes desde CSV o manualmente
2. El día de la votación, un operador en la mesa verifica físicamente la identidad del estudiante
3. El operador le permite acceder al dispositivo
4. El estudiante digita su número de documento en `index.html`
5. El sistema valida que el documento existe en la BD
6. El estudiante ve las encuestas activas y vota
7. El sistema registra el voto e impide votar dos veces

**No hay aprobación digital de votantes** — el control es humano y físico, igual que en elecciones reales.

---

## CSV de votantes

Formato esperado:
```
numero_documento,nombre,apellido,fecha_nacimiento,genero,jornada,grupo_id
1005234567,María,García,2008-03-15,femenino,mañana,1
1005234568,Juan,Pérez,2007-11-22,masculino,tarde,2
```

---

## Estadísticas del sistema

### Pantalla de resultados (votante y admin)
1. **Porcentaje de participación general** — votantes que votaron vs total registrados
2. **Votos por opción con porcentaje** — gráfica de barras, ganador destacado
3. **Participación por grupo** — qué grupo participó más
4. **Participación por género** — masculino vs femenino vs otro
5. **Participación por jornada** — mañana vs tarde

### Análisis por etiqueta (solo encuestas tipo `candidatos`)
El sistema cruza los votos recibidos con las etiquetas de cada candidato y suma automáticamente:

- Juan Pérez (etiquetas: `recreación`, `deporte`) → 40 votos
- Carlos Ruiz (etiquetas: `recreación`, `ambiental`) → 35 votos
- Ana López (etiquetas: `académico`, `tecnología`) → 25 votos

Resultado: `recreación` → 75 votos, `deporte` → 40, `ambiental` → 35, `académico` → 25...

**Conclusión automática:** las propuestas con enfoque recreativo generaron más votación.

### Filtros en resultados (admin)
El admin puede filtrar por jornada, género y grupo para responder preguntas como:
- ¿Cómo votaron solo los estudiantes de jornada mañana?
- ¿Hubo diferencia de preferencias entre géneros?

### Panel del admin
- Total encuestas activas y cerradas
- Total votos registrados en el sistema
- Total votantes registrados

---

## Estado actual del proyecto

- [x] Estructura de carpetas definida
- [x] Identidad visual definida
- [x] Base de datos modelada (7 tablas)
- [x] Datos JSON simulados creados
- [x] `styles.css` completo
- [x] `app.js` con funciones compartidas
- [x] Todas las páginas HTML creadas con layouts correctos
- [x] Todos los archivos JS creados con lógica simulada y TODOs de backend
- [x] Desacople completo JS/HTML (`addEventListener` — sin `onclick` en HTML)
- [ ] Etiquetas de propuesta (pendiente en frontend y BD)
- [ ] Estadísticas completas con filtros (pendiente)
- [ ] Fase 2: Backend PHP + MySQL

## Próximos pasos

1. ~~Desacoplar completamente JS del HTML~~ ✓ completado
2. Agregar etiquetas al formulario de registro de candidatos
3. Implementar pantalla de estadísticas completa con filtros y análisis por etiqueta
4. Fase 2: crear archivos PHP que reemplacen los JSON simulados
5. Fase 2: crear script SQL de la base de datos
6. Generar historias de usuario al finalizar el código
