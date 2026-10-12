// app.js — Funciones compartidas del sistema VotaYa

// Ruta de la API PHP: index.html está en la raíz y las demás páginas dentro de pages/
const API_URL = window.location.pathname.includes('/pages/') ? '../api' : 'api';

// Los botones, badges, cards, etc. usan las clases de componente definidas en
// css/componentes.css (.btn, .badge, .card...); acá en JS solo se arma el HTML.

// ── Sesión ────────────────────────────────────────────────────────────────────

// La sesión real vive en PHP ($_SESSION) y es la que protege la API.
// En sessionStorage solo se guarda una copia de los datos del usuario para mostrar
// su nombre en la topbar y redirigir rápido si no ha iniciado sesión.

function obtenerSesion() {
  const datos = sessionStorage.getItem('votaya_usuario');
  return datos ? JSON.parse(datos) : null;
}

function guardarSesion(usuario) {
  sessionStorage.setItem('votaya_usuario', JSON.stringify(usuario));
}

async function cerrarSesion() {
  await llamarAPI('logout.php', 'POST');
  sessionStorage.removeItem('votaya_usuario');
  window.location.href = '../index.html';
}

function requiereVotante() {
  const sesion = obtenerSesion();
  if (!sesion || sesion.rol !== 'votante') {
    window.location.href = '../index.html';
  }
  return sesion;
}

// Para páginas que pueden ver tanto el votante como el admin (ej: resultados)
function requiereSesion() {
  const sesion = obtenerSesion();
  if (!sesion) {
    window.location.href = '../index.html';
  }
  return sesion;
}

function requiereAdmin() {
  const sesion = obtenerSesion();
  if (!sesion || sesion.rol !== 'admin') {
    window.location.href = '../pages/admin-login.html';
  }
  return sesion;
}

// ── Llamadas a la API PHP ─────────────────────────────────────────────────────

// Hace una petición a un archivo de la API y devuelve la respuesta ya convertida desde JSON.
// Ejemplos:
//   llamarAPI('encuestas.php')                                  → GET
//   llamarAPI('votar.php', 'POST', { encuesta_id: 1, opcion_id: 2 })
//   llamarAPI('candidatos.php?id=3', 'DELETE')
// Si algo sale mal, devuelve un objeto { error: 'mensaje' } para mostrarlo en pantalla.
async function llamarAPI(ruta, metodo = 'GET', datos = null) {
  const opciones = { method: metodo, headers: {} };
  if (datos) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  try {
    const respuesta = await fetch(`${API_URL}/${ruta}`, opciones);
    const resultado = await respuesta.json();

    // 401 con una sesión guardada = la sesión de PHP expiró: se vuelve al login
    const sesion = obtenerSesion();
    if (respuesta.status === 401 && sesion) {
      sessionStorage.removeItem('votaya_usuario');
      window.location.href = sesion.rol === 'admin' ? 'admin-login.html' : '../index.html';
    }

    if (!respuesta.ok) {
      return { error: resultado.error || 'Ocurrió un error inesperado.' };
    }
    return resultado;
  } catch (error) {
    console.error(error);
    return { error: 'Error al conectar con el servidor. Intenta de nuevo.' };
  }
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function iniciales(nombre, apellido) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

// Valida que un valor contenga solo dígitos (usado en documento, número de lista, etc.)
function esSoloNumeros(valor) {
  return /^\d+$/.test(valor);
}

// Filtra en tiempo real los caracteres no numéricos mientras el usuario escribe
function permitirSoloNumeros(input) {
  input.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
  });
}

// Valida que un valor tenga formato de correo electrónico (usuario@dominio.tld)
function esCorreoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

// Valida que una fecha (YYYY-MM-DD) sea posterior a hoy
function esFechaFutura(fechaStr) {
  if (!fechaStr) return false;
  const fecha = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fecha.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha > hoy;
}

// Valida que una fecha (YYYY-MM-DD) sea real y no futura (ej: fecha de nacimiento)
function esFechaPasadaValida(fechaStr) {
  if (!fechaStr) return false;
  const fecha = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fecha.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha <= hoy;
}

// Valida que el número de documento tenga una longitud razonable (igual criterio que el login)
function esLongitudDocumentoValida(documento) {
  return documento.length >= 6 && documento.length <= 15;
}

// Una encuesta está cerrada si el admin la cerró manualmente o si ya venció su fecha_fin,
// sin depender de un proceso de backend que actualice el campo `estado` automáticamente
function encuestaEstaCerrada(encuesta) {
  if (encuesta.estado === 'cerrada') return true;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(encuesta.fecha_fin + 'T00:00:00');
  return fin < hoy;
}

// ── Foto de candidato ─────────────────────────────────────────────────────────

// Las fotos viven en la carpeta img/candidatos/ y en la base solo se guarda el nombre del archivo.
// Todas las páginas están dentro de pages/, por eso la ruta sube un nivel con "../"
function rutaFotoCandidato(foto) {
  return '../img/candidatos/' + encodeURIComponent(foto);
}

// Muestra la foto del candidato en el elemento avatar, o sus iniciales si no tiene foto
function renderizarAvatar(elemento, nombre, apellido, foto) {
  if (!elemento) return;
  if (foto) {
    elemento.style.backgroundImage    = `url('${rutaFotoCandidato(foto)}')`;
    elemento.style.backgroundSize     = 'cover';
    elemento.style.backgroundPosition = 'center';
    elemento.textContent = '';
  } else {
    elemento.style.backgroundImage = '';
    elemento.textContent = iniciales(nombre, apellido);
  }
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  // Una fecha sola (YYYY-MM-DD) se lee como hora local; si no, JS la toma en UTC y muestra el día anterior
  const fecha = new Date(fechaStr.length === 10 ? fechaStr + 'T00:00:00' : fechaStr);
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

function mostrarAlerta(elementoId, mensaje, tipo = 'error') {
  const el = document.getElementById(elementoId);
  if (!el) return;
  // Variante con strings completos y estáticos: ni Tailwind ni componentes.css
  // reconocen clases armadas por concatenación
  const variantes = {
    error:  'alerta-error',
    exito:  'alerta-exito',
    info:   'alerta-info',
    alerta: 'alerta-alerta',
  };
  const icono = tipo === 'error' ? 'alert-circle' : tipo === 'exito' ? 'circle-check' : 'info-circle';
  el.className = `alerta ${variantes[tipo] || variantes.error}`;
  el.innerHTML = `<i class="ti ti-${icono}"></i> ${mensaje}`;
}

function ocultarAlerta(elementoId) {
  const el = document.getElementById(elementoId);
  if (el) el.classList.add('hidden');
}

function mostrarCargando(contenedorId, mensaje = 'Cargando...') {
  const el = document.getElementById(contenedorId);
  if (el) el.innerHTML = `<div class="cargando"><i class="ti ti-loader"></i> ${mensaje}</div>`;
}

// Convierte los caracteres especiales (<, >, &, ", ') en texto normal antes de meterlo en innerHTML.
// Así, si un nombre o título trae algo como "<script>", se muestra tal cual y no se ejecuta.
// (Con textContent no hace falta: textContent nunca interpreta HTML)
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function mostrarVacio(contenedorId, mensaje = 'No hay datos disponibles.') {
  const el = document.getElementById(contenedorId);
  if (el) el.innerHTML = `<div class="vacio"><i class="ti ti-inbox"></i><br>${mensaje}</div>`;
}

// ── Topbar y sidebar (armados una sola vez aquí, en vez de repetir el mismo
//    bloque de nav/aside en cada página) ────────────────────────────────────

function renderizarTopbarVotante() {
  const sesion = obtenerSesion();
  if (!sesion) return;
  const contenedor = document.getElementById('topbar');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <nav class="h-topbar-h bg-acento flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
      <span class="font-titulo text-xl font-bold text-white">Vota<span class="text-sky-300">Ya</span></span>
      <div class="flex items-center gap-3">
        <div class="avatar w-8 h-8 text-xs bg-sky-500">${iniciales(sesion.nombre, sesion.apellido)}</div>
        <span class="text-sm text-borde">${sesion.nombre} ${sesion.apellido}</span>
        <button id="btn-cerrar-sesion" class="btn-salir">
          <i class="ti ti-logout"></i> Salir
        </button>
      </div>
    </nav>`;
}

const NAV_ADMIN = [
  { grupo: 'Principal', href: 'admin-panel.html', icon: 'layout-dashboard', texto: 'Panel' },
  { grupo: 'Gestión',   href: 'admin-encuesta-nueva.html', icon: 'plus', texto: 'Nueva encuesta' },
  { href: 'admin-candidatos.html', icon: 'user-star', texto: 'Candidatos' },
  { href: 'admin-votantes.html', icon: 'id-badge', texto: 'Votantes' },
];

function renderizarLayoutAdmin(paginaActiva) {
  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.innerHTML = `
      <nav class="h-topbar-h bg-acento flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-40">
        <div class="flex items-center gap-3.5">
          <span class="font-titulo text-xl font-bold text-white">Vota<span class="text-sky-300">Ya</span></span>
          <span class="badge text-xs bg-white/15 text-white border-white/30">Administrador</span>
        </div>
      </nav>`;
  }

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let enlaces = '';
  for (let i = 0; i < NAV_ADMIN.length; i++) {
    const item = NAV_ADMIN[i];
    const activo = item.href === paginaActiva;
    const clases = activo
      ? 'flex items-center gap-2.5 px-3.5 py-2 mx-2 my-px rounded-md text-sm no-underline bg-acento-claro text-acento font-medium'
      : 'flex items-center gap-2.5 px-3.5 py-2 mx-2 my-px rounded-md text-sm text-texto-suave no-underline hover:bg-fondo-2 hover:text-texto';
    const grupo = item.grupo
      ? `<p class="pt-5 px-3 pb-2 text-[10px] font-medium text-texto-muted uppercase tracking-wide">${item.grupo}</p>`
      : '';
    enlaces += `${grupo}<a href="${item.href}" class="${clases}"><i class="ti ti-${item.icon} text-[17px] shrink-0"></i> ${item.texto}</a>`;
  }

  sidebar.innerHTML = `
    <aside class="w-sidebar-w bg-white border-r border-borde fixed top-topbar-h left-0 bottom-0 flex flex-col overflow-y-auto z-30 max-md:hidden">
      ${enlaces}
      <div class="mt-auto p-3 border-t border-borde-suave">
        <button id="btn-cerrar-sesion" class="btn btn-chico btn-peligro w-full justify-center">
          <i class="ti ti-logout"></i> Cerrar sesión
        </button>
      </div>
    </aside>`;
}
