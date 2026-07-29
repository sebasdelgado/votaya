// admin-encuesta-nueva.js — Crear nueva encuesta

// TODO: En backend, guardar con:
// INSERT INTO encuestas (titulo, descripcion, tipo, estado, fecha_inicio, fecha_fin)
// Luego INSERT INTO opciones (encuesta_id, candidato_id, texto_opcion) por cada opción

requiereAdmin();

let candidatos    = [];
let contadorOpciones = 0;

async function inicializar() {
  candidatos = await obtenerJSON('candidatos') || [];
  renderizarCandidatos();
  agregarOpcion();
  agregarOpcion();
}

function renderizarCandidatos() {
  const contenedor = document.getElementById('lista-candidatos-check');

  if (candidatos.length === 0) {
    contenedor.innerHTML = `
      <div class="alerta alerta-info">
        <i class="ti ti-info-circle"></i>
        No hay candidatos registrados.
        <a href="admin-candidatos.html">Registrar candidatos</a>
      </div>`;
    return;
  }

  contenedor.innerHTML = '';
  const plantilla = document.getElementById('tpl-candidato-check');

  candidatos.forEach(c => {
    const nodo = plantilla.content.cloneNode(true);
    nodo.querySelector('.check-candidato').value       = c.id;
    nodo.querySelector('.campo-iniciales').textContent = iniciales(c.nombre, c.apellido);
    nodo.querySelector('.campo-nombre').textContent     = `${c.nombre} ${c.apellido}`;
    nodo.querySelector('.campo-lista').textContent      = `Lista ${c.numero_lista}`;
    contenedor.appendChild(nodo);
  });
}

function agregarOpcion() {
  contadorOpciones++;
  const contenedor = document.getElementById('opciones-texto');
  const plantilla  = document.getElementById('tpl-opcion-texto-input');
  const nodo       = plantilla.content.cloneNode(true);

  const wrap  = nodo.querySelector('div');
  const input = nodo.querySelector('.opcion-texto');
  const btn   = nodo.querySelector('.btn-quitar-opcion');

  wrap.id = `opcion-wrap-${contadorOpciones}`;
  input.placeholder = `Opción ${contadorOpciones}`;
  input.style.flex  = '1';
  btn.addEventListener('click', () => quitarOpcion(wrap.id));

  contenedor.appendChild(nodo);
}

function quitarOpcion(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function cambiarTipo() {
  const tipo = document.getElementById('enc-tipo').value;
  document.getElementById('seccion-candidatos').style.display = tipo === 'candidatos' ? 'block' : 'none';
  document.getElementById('seccion-texto').style.display      = tipo === 'texto'      ? 'block' : 'none';
}

function crearEncuesta() {
  const titulo   = document.getElementById('enc-titulo').value.trim();
  const desc     = document.getElementById('enc-desc').value.trim();
  const tipo     = document.getElementById('enc-tipo').value;
  const fechaFin = document.getElementById('enc-fecha-fin').value;

  ocultarAlerta('alerta-encuesta');

  if (!titulo || !desc || !fechaFin) {
    mostrarAlerta('alerta-encuesta', 'Completa el título, descripción y fecha de cierre.', 'error');
    return;
  }

  let opciones = [];

  if (tipo === 'candidatos') {
    const checks = document.querySelectorAll('#lista-candidatos-check input[type="checkbox"]:checked');
    if (checks.length < 2) {
      mostrarAlerta('alerta-encuesta', 'Selecciona al menos 2 candidatos.', 'error');
      return;
    }
    opciones = Array.from(checks).map(ch => ({ candidato_id: parseInt(ch.value), texto_opcion: null }));
  } else {
    const inputs = document.querySelectorAll('.opcion-texto');
    opciones = Array.from(inputs)
      .map(i => i.value.trim())
      .filter(Boolean)
      .map(texto => ({ candidato_id: null, texto_opcion: texto }));

    if (opciones.length < 2) {
      mostrarAlerta('alerta-encuesta', 'Agrega al menos 2 opciones de texto.', 'error');
      return;
    }
  }

  // TODO: En backend, enviar POST a 'api/encuestas.php' con todos los datos
  // PHP insertará la encuesta y sus opciones en MySQL
  const nuevaEncuesta = {
    id: Date.now(),
    titulo, descripcion: desc, tipo,
    estado: 'activa',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: fechaFin,
    opciones: opciones.map((op, i) => ({ id: Date.now() + i, ...op }))
  };

  mostrarAlerta('alerta-encuesta', `Encuesta "${titulo}" creada correctamente.`, 'exito');

  setTimeout(() => {
    window.location.href = 'admin-panel.html';
  }, 1500);
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('enc-tipo').addEventListener('change', cambiarTipo);
document.getElementById('btn-agregar-opcion').addEventListener('click', agregarOpcion);
document.getElementById('btn-crear-encuesta').addEventListener('click', crearEncuesta);

inicializar();
