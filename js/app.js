// app.js — Funciones compartidas del sistema VotaYa

// TODO: En la fase de backend, reemplazar BASE_URL por la ruta real del servidor PHP
const BASE_URL = '../datos';

// ── Sesión ────────────────────────────────────────────────────────────────────

// TODO: En backend, la sesión se manejará con $_SESSION en PHP
// Por ahora se simula con sessionStorage del navegador

function obtenerSesion() {
  const datos = sessionStorage.getItem('votaya_usuario');
  return datos ? JSON.parse(datos) : null;
}

function guardarSesion(usuario) {
  sessionStorage.setItem('votaya_usuario', JSON.stringify(usuario));
}

function cerrarSesion() {
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

function requiereAdmin() {
  const sesion = obtenerSesion();
  if (!sesion || sesion.rol !== 'admin') {
    window.location.href = '../pages/admin-login.html';
  }
  return sesion;
}

// ── Fetch simulado ────────────────────────────────────────────────────────────

// TODO: En backend, estas funciones harán fetch a archivos .php en lugar de .json
// Ejemplo: fetch('../api/encuestas.php') en vez de fetch('../datos/encuestas.json')

async function obtenerJSON(archivo) {
  try {
    const respuesta = await fetch(`${BASE_URL}/${archivo}.json`);
    if (!respuesta.ok) throw new Error(`Error al cargar ${archivo}`);
    return await respuesta.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function iniciales(nombre, apellido) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
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
  el.className = `alerta alerta-${tipo}`;
  el.innerHTML = `<i class="ti ti-${tipo === 'error' ? 'alert-circle' : tipo === 'exito' ? 'circle-check' : 'info-circle'}"></i> ${mensaje}`;
  el.style.display = 'flex';
}

function ocultarAlerta(elementoId) {
  const el = document.getElementById(elementoId);
  if (el) el.style.display = 'none';
}

function mostrarCargando(contenedorId, mensaje = 'Cargando...') {
  const el = document.getElementById(contenedorId);
  if (el) el.innerHTML = `<div class="cargando"><i class="ti ti-loader"></i> ${mensaje}</div>`;
}

function mostrarVacio(contenedorId, mensaje = 'No hay datos disponibles.') {
  const el = document.getElementById(contenedorId);
  if (el) el.innerHTML = `<div class="vacio"><i class="ti ti-inbox"></i><br>${mensaje}</div>`;
}

// ── Topbar ────────────────────────────────────────────────────────────────────

function renderizarTopbar(esAdmin = false) {
  const sesion = obtenerSesion();
  if (!sesion) return;

  const topbarUsuario = document.getElementById('topbar-usuario');
  const topbarAvatar  = document.getElementById('topbar-avatar');

  if (topbarUsuario) {
    topbarUsuario.textContent = esAdmin
      ? 'Administrador'
      : `${sesion.nombre} ${sesion.apellido}`;
  }
  if (topbarAvatar) {
    topbarAvatar.textContent = esAdmin
      ? 'AD'
      : iniciales(sesion.nombre, sesion.apellido);
  }
}

// ── Votos (simulado en localStorage) ─────────────────────────────────────────

// TODO: En backend, los votos se guardarán en MySQL con INSERT INTO votos
// y la verificación se hará con SELECT COUNT(*) FROM votos WHERE usuario_id=? AND encuesta_id=?

function obtenerVotosLocales() {
  const datos = localStorage.getItem('votaya_votos');
  return datos ? JSON.parse(datos) : [];
}

function yaVoto(usuarioId, encuestaId) {
  const votos = obtenerVotosLocales();
  return votos.some(v => v.usuario_id === usuarioId && v.encuesta_id === encuestaId);
}

function registrarVotoLocal(usuarioId, encuestaId, opcionId) {
  const votos = obtenerVotosLocales();
  votos.push({
    id: Date.now(),
    usuario_id: usuarioId,
    encuesta_id: encuestaId,
    opcion_id: opcionId,
    fecha_voto: new Date().toISOString()
  });
  localStorage.setItem('votaya_votos', JSON.stringify(votos));
}

function contarVotosPorOpcion(encuestaId, opciones) {
  const votos = obtenerVotosLocales();
  const votosFiltrados = votos.filter(v => v.encuesta_id === encuestaId);
  return opciones.map(op => ({
    ...op,
    votos: votosFiltrados.filter(v => v.opcion_id === op.id).length
  }));
}
