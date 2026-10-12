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

- **Frontend:** HTML, JavaScript (páginas separadas) + **Tailwind CSS vía CDN** para layout/spacing/responsive, combinado con un pequeño `css/componentes.css` de clases propias para lo que se repite mucho (botones, cards, badges, formularios) — sin bundlers ni paso de build, no hay `package.json`
- **Backend:** PHP plano en `api/` — un archivo por recurso, consultas SQL escritas como strings
  con parámetros `?` (PDO + `prepare`/`execute`). Sin frameworks, sin ORM, sin clases/entidades.
- **Base de datos:** MySQL (MariaDB de XAMPP), script en `database/votaya.sql`

---

## Cómo correr el proyecto

1. Iniciar **Apache** y **MySQL** desde el panel de XAMPP.
2. Crear la base de datos: en phpMyAdmin (`http://localhost/phpmyadmin`) → Importar → `database/votaya.sql`
   (o por consola: `C:\xampp\mysql\bin\mysql -u root < database/votaya.sql`). El script borra y recrea
   la base `votaya` con datos de prueba, así que también sirve para reiniciarla.
3. Abrir `http://localhost/votaya/`. Ya no sirve abrir `index.html` directo ni usar `python -m http.server`:
   se necesita Apache para ejecutar el PHP.

La conexión (`root` sin contraseña, base `votaya`) está en `api/conexion.php`.

**Credenciales de prueba:**
- **Votante:** cualquier `numero_documento` de la tabla `usuarios` (ej: `1005234567`)
- **Admin:** correo `admin@colegio.edu.co` / contraseña `admin123` (guardada como hash en `usuarios`)

---

## Identidad visual

- **Tema:** Claro con acento cyan tecnológico
- **Color acento:** `#0369a1` / hover `#0284c7` / claro `#e0f2fe`
- **Fondo:** `#f8fafc`
- **Tipografía títulos:** Syne (Google Fonts)
- **Tipografía cuerpo:** DM Sans (Google Fonts)
- **Iconos:** Tabler Icons via CDN (`ti ti-*`), sin instalación local

Estos colores/tipografías viven en dos lugares que deben mantenerse sincronizados:
`js/tailwind-config.js` (`theme.extend`, para las utilidades de Tailwind) y las variables
`:root` de `css/componentes.css` (para las clases de componente). Si cambia un color o radio,
actualízalo en ambos archivos.

---

## Layouts

- **Votante:** topbar fija azul + contenido centrado `max-width: 960px`
- **Admin:** topbar fija azul + sidebar lateral fijo de `240px` + contenido `max-width: 1400px`
- **Login:** pantalla completamente centrada, tarjeta flotante
- **Responsive:** sidebar se oculta en pantallas menores a 768px

Cada layout se construye con utilidades de Tailwind directamente en el HTML de
cada página — no hay archivos CSS por layout.

---

## Convenciones de estilos (Tailwind + componentes.css)

El proyecto usa un enfoque híbrido: **Tailwind para layout, componentes.css para lo repetido.**

- Tailwind se carga por CDN (`<script src="https://cdn.tailwindcss.com">`), sin paso de build.
  Cada página carga `js/tailwind-config.js` justo después del script del CDN, en el `<head>` —
  ahí están los colores, tipografías, radios y espaciados del diseño.
- `css/componentes.css` se enlaza con `<link rel="stylesheet">` en el `<head>` de cada página,
  después de los scripts de Tailwind. Contiene clases de componente (CSS plano, sin `@apply`
  porque este proyecto no tiene compilador de Tailwind): `.btn` + variantes (`.btn-primario`,
  `.btn-suave`, `.btn-peligro`, `.btn-alerta`, `.btn-salir`, `.btn-chico`), `.card` / `.card-chico`,
  `.badge` + variantes (`.badge-activa`, `.badge-cerrada`, `.badge-tipo`), `.label` / `.input`,
  `.alerta` + variantes, `.tabla-th` / `.tabla-td`, `.avatar`, `.stat-card`, `.opcion-voto`,
  `.link-volver`.
- **Regla para decidir dónde va cada clase:** si el patrón visual se repite en varios elementos
  o páginas (un botón, una card, un badge, un input), usa la clase de `componentes.css`. Si es
  layout específico de ese elemento en esa página (ancho, márgenes, grid, flex, responsive,
  orden), usa utilidades de Tailwind directamente en el HTML — se pueden combinar en el mismo
  elemento (ej. `class="btn btn-primario w-full justify-center"`).
- Si necesitas una clase de componente nueva, agrégala a `css/componentes.css` (no crees otro
  archivo `.css`) y reutilízala; no repitas la misma cadena larga de utilidades en varios lugares.
- `hidden` (utilidad de Tailwind) es la clase estándar para ocultar elementos; combínala con
  `classList.add('hidden')` / `classList.remove('hidden')` en JS cuando el estado cambie dinámicamente.
- Nunca construyas nombres de clase por concatenación (ej. `` `bg-${tipo}-fondo` `` o `` `badge-${estado}` ``)
  — ni Tailwind ni `componentes.css` reconocen clases armadas por concatenación; usa siempre
  strings completos y estáticos (con un objeto `{ activa: 'badge-activa', cerrada: 'badge-cerrada' }` si el valor es dinámico).
- El CDN de Tailwind y las fuentes de Google requieren conexión a internet; `componentes.css` es
  un archivo local y sigue aplicando aunque no haya internet, pero sin Tailwind se pierde el layout.

---

## Arquitectura y flujo de datos

El frontend (HTML + JS) llama con `fetch` a los archivos PHP de `api/`, que consultan MySQL
y responden JSON. Todos los datos viven en MySQL.

| Dato | Dónde vive |
|------|-----------|
| Sesión (quién inició sesión) | `$_SESSION['usuario']` en PHP — es lo que protege la API |
| Copia del usuario para la topbar | `sessionStorage` (`votaya_usuario`), solo para mostrar el nombre y redirigir rápido |
| Votantes, candidatos, encuestas, opciones, votos, grupos | MySQL |

La carpeta `datos/` (JSON del modo simulado) ya no la usa ninguna página.

### API (`api/`)

Cada archivo empieza con `require 'conexion.php';`, que abre la conexión PDO (`$conexion`),
inicia la sesión y define: `responder($datos, $codigo)`, `leerDatos()` (lee el JSON del body),
`requiereVotante()` / `requiereAdmin()` / `requiereSesion()` (responden 401 si no hay sesión)
y `encuestaEstaCerrada($encuesta)`.

Patrón de consulta (siempre con `?`, nunca concatenando valores del usuario en el SQL):
```php
$consulta = $conexion->prepare("SELECT * FROM encuestas WHERE id = ?");
$consulta->execute([$id]);
$encuesta = $consulta->fetch();      // una fila · fetchAll() varias · fetchColumn() un COUNT
```

| Archivo | Métodos | Quién |
|---------|---------|-------|
| `login-votante.php` | POST `{numero_documento}` | público |
| `login-admin.php` | POST `{correo, contrasena}` | público |
| `logout.php` | POST | cualquiera |
| `encuestas.php` | GET (lista, o `?id=` una) · POST crear · PUT `?id=` cerrar · DELETE `?id=` | GET votante/admin, resto admin |
| `votar.php` | POST `{encuesta_id, opcion_id}` — el usuario sale de la sesión | votante |
| `resultados.php` | GET `?id=` | admin, o votante si la encuesta está cerrada o ya votó (la página `resultados.html` la usan ambos roles) |
| `candidatos.php` | GET · POST · DELETE `?id=` | admin |
| `votantes.php` | GET · POST · DELETE `?id=` | admin |
| `grupos.php` | GET | admin |
| `estadisticas.php` | GET | admin |

Los GET de `encuestas.php` devuelven cada encuesta con `total_votos`, `ya_voto` (del usuario de
la sesión) y `opciones[]`, donde cada opción trae ya los datos del candidato (nombre, apellido,
foto, numero_lista, propuesta). Los errores se responden como `{ "error": "mensaje" }` con su
código HTTP (400, 401, 403, 404, 409).

### Funciones globales en `app.js`

Todas las páginas cargan `app.js` primero. Expone:
- `llamarAPI(ruta, metodo, datos)` — fetch a `api/{ruta}`; devuelve el JSON, o `{ error }` si algo falla.
  Si la API responde 401 y había sesión guardada, la sesión de PHP expiró y redirige al login.
- `obtenerSesion()` / `guardarSesion()` / `cerrarSesion()` — copia del usuario en sessionStorage (`cerrarSesion` también llama a `logout.php`)
- `requiereVotante()` / `requiereAdmin()` / `requiereSesion()` (cualquier rol) — guards de ruta en el navegador (la protección real está en PHP)
- `encuestaEstaCerrada(encuesta)` — cerrada por el admin o con `fecha_fin` vencida (misma regla que en PHP)
- Utilidades: `mostrarAlerta()`, `mostrarCargando()`, `formatearFecha()`, `iniciales()`,
  `rutaFotoCandidato()`, `escaparHTML()` (usar siempre que un dato de la base vaya dentro de `innerHTML`;
  con `textContent` no hace falta)

---

## Roles del sistema

### Votante
- Accede **solo con su número de documento** (sin contraseña)
- Puede ver encuestas activas, votar una sola vez por encuesta
- Puede ver resultados de encuestas cerradas o donde ya votó
- **No se registra solo** — el admin carga el padrón

### Admin
- Accede con correo y contraseña
- Carga el padrón de votantes registrándolos uno por uno (formulario manual)
- Registra candidatos (nombre, apellido, propuesta, numero_lista, foto opcional como **nombre de archivo** de la carpeta `img/candidatos/`, no archivo subido), crea y gestiona encuestas
- Ve estadísticas y resultados con filtros

### Candidato
- **No es un usuario del sistema** — no inicia sesión
- Es un registro creado por el admin (nombre, apellido, foto, propuesta, numero_lista)

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
- PHP lo más simple posible: SQL en strings con parámetros `?`, un `if ($metodo === 'GET')` por
  método dentro de cada archivo, sin clases, sin ORM, sin frameworks. Toda validación importante
  (un voto por encuesta, encuesta abierta, permisos) se hace en PHP, aunque el JS también valide.

---

## Base de datos — 6 tablas (`database/votaya.sql`)

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
| numero_documento | VARCHAR UNIQUE | Con lo que accede a votar |
| nombre, apellido | VARCHAR | |
| fecha_nacimiento | DATE | Para estadísticas de edad |
| genero | ENUM | masculino, femenino, otro |
| jornada | ENUM | mañana, tarde |
| grupo_id | INT FK | → grupos |
| rol | ENUM | votante, admin |
| correo | VARCHAR UNIQUE | NULL para votantes; el admin inicia sesión con él |
| contrasena | VARCHAR | NULL para votantes, hash (`password_hash`) para admin |

### `candidatos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| nombre, apellido | VARCHAR | |
| foto | VARCHAR | Nombre del archivo en `img/candidatos/` (opcional) |
| propuesta | TEXT | |
| numero_lista | VARCHAR | |

### `encuestas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT PK | |
| titulo | VARCHAR | |
| descripcion | TEXT | |
| tipo | ENUM | candidatos, texto |
| estado | ENUM | activa, cerrada |
| fecha_inicio, fecha_fin | DATE | Solo día, sin hora (el frontend solo maneja días) |

### `opciones`
`encuesta_id` FK (ON DELETE CASCADE), `candidato_id` FK (NULL si tipo=texto), `texto_opcion` (NULL si tipo=candidatos).
Un candidato que ya es opción de una encuesta no se puede eliminar.

### `votos`
`usuario_id` FK, `encuesta_id` FK, `opcion_id` FK, `fecha_voto` DATETIME.
La combinación `usuario_id + encuesta_id` es **UNIQUE** — impide votar dos veces.
Al eliminar una encuesta se borran sus opciones y votos (CASCADE). Un votante con votos no se puede eliminar.

---

## Estado actual y próximos pasos

**Completado:**
- [x] Frontend completo con todos los layouts y páginas
- [x] Migración a Tailwind CSS (CDN) — diseño responsivo conservado
- [x] Sistema híbrido: Tailwind para layout + `css/componentes.css` para botones/cards/badges/formularios
- [x] `app.js` con todas las funciones compartidas
- [x] Backend PHP (`api/`) + MySQL (`database/votaya.sql`), frontend conectado a la API
- [x] Desacople completo JS/HTML

**Pendiente:**
- [ ] Estadísticas completas con filtros
- [ ] Generar historias de usuario al finalizar el código

**Fuera de alcance a propósito** (simplificado para el nivel del curso):
- Carga masiva de votantes por CSV — se descartó por el uso de `FileReader` + parseo manual de
  CSV, muy por encima del nivel de JS de los estudiantes. Solo existe registro manual.
- Subida de archivo para la foto del candidato — el admin copia la imagen a mano en `img/candidatos/`
  y escribe el nombre del archivo (el navegador no puede leer rutas como `C:\...` del computador),
  evitando `FileReader.readAsDataURL()` y la validación de tipo/tamaño de archivo. En JS la ruta
  se arma con `rutaFotoCandidato(foto)` de `app.js`.
- Etiquetas de propuesta de los candidatos (tablas `etiquetas` / `candidato_etiquetas`) — se
  eliminaron por completo del diseño, la base de datos y el código.
