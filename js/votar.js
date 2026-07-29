// votar.js — Lógica de la pantalla de votación

// TODO: En backend, el voto se enviará a 'api/votar.php' con método POST
// PHP verificará que no haya votado antes con:
// SELECT COUNT(*) FROM votos WHERE usuario_id=? AND encuesta_id=?
// Si no existe, insertará: INSERT INTO votos (usuario_id, encuesta_id, opcion_id, fecha_voto)

const sesion    = requiereVotante();
const params    = new URLSearchParams(window.location.search);
const encuestaId = parseInt(params.get('id'));
let opcionSeleccionada = null;
let encuestaActual     = null;

renderizarTopbar(false);

async function cargarEncuesta() {
  if (!encuestaId) {
    window.location.href = 'encuestas.html';
    return;
  }

  // Verificar si ya votó
  if (yaVoto(sesion.id, encuestaId)) {
    mostrarAlerta('alerta-voto', 'Ya emitiste tu voto en esta encuesta.', 'info');
    document.getElementById('opciones-voto').style.display = 'none';
    document.getElementById('btn-ver-resultados').href = `resultados.html?id=${encuestaId}`;
    document.getElementById('confirmacion').style.display = 'block';
    return;
  }

  const [encuestas, candidatos] = await Promise.all([
    obtenerJSON('encuestas'),
    obtenerJSON('candidatos')
  ]);

  encuestaActual = encuestas.find(e => e.id === encuestaId);

  if (!encuestaActual) {
    window.location.href = 'encuestas.html';
    return;
  }

  if (encuestaActual.estado === 'cerrada') {
    window.location.href = `resultados.html?id=${encuestaId}`;
    return;
  }

  document.getElementById('enc-titulo').textContent = encuestaActual.titulo;
  document.getElementById('enc-desc').textContent   = encuestaActual.descripcion;
  document.getElementById('btn-ver-resultados').href = `resultados.html?id=${encuestaId}`;

  const contenedor = document.getElementById('opciones-voto');
  contenedor.innerHTML = '';

  if (encuestaActual.tipo === 'candidatos') {
    const cands = encuestaActual.opciones
      .map(op => ({ ...candidatos.find(c => c.id === op.candidato_id), opcion_id: op.id }))
      .filter(c => c.id);

    const plantilla = document.getElementById('tpl-opcion-candidato');

    cands.forEach(c => {
      const nodo      = plantilla.content.cloneNode(true);
      const opcionDiv = nodo.querySelector('.opcion-voto');
      const radio     = nodo.querySelector('.opcion-radio');

      opcionDiv.id = `opcion-${c.opcion_id}`;
      radio.id     = `radio-${c.opcion_id}`;
      radio.value  = c.opcion_id;
      nodo.querySelector('.campo-iniciales').textContent = iniciales(c.nombre, c.apellido);
      nodo.querySelector('.campo-nombre').textContent     = `${c.nombre} ${c.apellido}`;
      nodo.querySelector('.campo-lista').textContent      = `Lista ${c.numero_lista}`;
      nodo.querySelector('.campo-propuesta').textContent  = c.propuesta;
      opcionDiv.addEventListener('click', () => seleccionar(c.opcion_id));

      contenedor.appendChild(nodo);
    });
  } else {
    const plantilla = document.getElementById('tpl-opcion-texto');

    encuestaActual.opciones.forEach(op => {
      const nodo      = plantilla.content.cloneNode(true);
      const opcionDiv = nodo.querySelector('.opcion-voto');
      const radio     = nodo.querySelector('.opcion-radio');

      opcionDiv.id = `opcion-${op.id}`;
      radio.id     = `radio-${op.id}`;
      radio.value  = op.id;
      nodo.querySelector('.campo-nombre').textContent = op.texto_opcion;
      opcionDiv.addEventListener('click', () => seleccionar(op.id));

      contenedor.appendChild(nodo);
    });
  }

  document.getElementById('panel-votar').style.display = 'block';
}

function seleccionar(opcionId) {
  document.querySelectorAll('.opcion-voto').forEach(el => el.classList.remove('seleccionada'));
  const el    = document.getElementById(`opcion-${opcionId}`);
  const radio = document.getElementById(`radio-${opcionId}`);
  if (el)    el.classList.add('seleccionada');
  if (radio) radio.checked = true;
  opcionSeleccionada = opcionId;
  ocultarAlerta('alerta-voto');
}

function confirmarVoto() {
  if (!opcionSeleccionada) {
    mostrarAlerta('alerta-voto', 'Debes seleccionar una opción antes de votar.', 'error');
    return;
  }

  // TODO: En backend, enviar POST a 'api/votar.php' con usuario_id, encuesta_id, opcion_id
  // PHP registrará el voto en MySQL y devolverá { success: true } o { error: 'mensaje' }
  registrarVotoLocal(sesion.id, encuestaId, opcionSeleccionada);

  document.getElementById('opciones-voto').style.display  = 'none';
  document.getElementById('panel-votar').style.display    = 'none';
  document.getElementById('confirmacion').style.display   = 'block';
  ocultarAlerta('alerta-voto');
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('btn-confirmar-voto').addEventListener('click', confirmarVoto);

cargarEncuesta();
