// votar.js — Lógica de la pantalla de votación

// El voto se envía a api/votar.php, que verifica que la encuesta siga abierta,
// que la opción sea de esa encuesta y que el votante no haya votado antes

const sesion    = requiereVotante();
const params    = new URLSearchParams(window.location.search);
const encuestaId = parseInt(params.get('id'));
let opcionSeleccionada = null;
let encuestaActual     = null;

renderizarTopbarVotante();

async function cargarEncuesta() {
  if (!encuestaId) {
    window.location.href = 'encuestas.html';
    return;
  }

  encuestaActual = await llamarAPI(`encuestas.php?id=${encuestaId}`);

  if (encuestaActual.error) {
    window.location.href = 'encuestas.html';
    return;
  }

  document.getElementById('enc-titulo').textContent = encuestaActual.titulo;
  document.getElementById('enc-desc').textContent   = encuestaActual.descripcion;

  // Verificar si ya votó
  if (encuestaActual.ya_voto > 0) {
    mostrarAlerta('alerta-voto', 'Ya emitiste tu voto en esta encuesta.', 'info');
    document.getElementById('opciones-voto').style.display = 'none';
    document.getElementById('btn-ver-resultados').href = `resultados.html?id=${encuestaId}`;
    document.getElementById('confirmacion').style.display = 'block';
    return;
  }

  if (encuestaEstaCerrada(encuestaActual)) {
    window.location.href = `resultados.html?id=${encuestaId}`;
    return;
  }

  document.getElementById('btn-ver-resultados').href = `resultados.html?id=${encuestaId}`;

  const contenedor = document.getElementById('opciones-voto');
  contenedor.innerHTML = '';

  if (encuestaActual.tipo === 'candidatos') {
    // Cada opción ya trae los datos del candidato (nombre, apellido, foto, propuesta...)
    const plantilla = document.getElementById('tpl-opcion-candidato');

    encuestaActual.opciones.forEach(c => {
      const nodo      = plantilla.content.cloneNode(true);
      const opcionDiv = nodo.querySelector('.opcion-voto');
      const radio     = nodo.querySelector('.opcion-radio');

      opcionDiv.id = `opcion-${c.id}`;
      radio.id     = `radio-${c.id}`;
      radio.value  = c.id;
      renderizarAvatar(nodo.querySelector('.campo-iniciales'), c.nombre, c.apellido, c.foto);
      nodo.querySelector('.campo-nombre').textContent     = `${c.nombre} ${c.apellido}`;
      nodo.querySelector('.campo-lista').textContent      = `Lista ${c.numero_lista}`;
      nodo.querySelector('.campo-propuesta').textContent  = c.propuesta;
      opcionDiv.addEventListener('click', () => seleccionar(c.id));

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

async function confirmarVoto() {
  if (!opcionSeleccionada) {
    mostrarAlerta('alerta-voto', 'Debes seleccionar una opción antes de votar.', 'error');
    return;
  }

  // No se envía el id del votante: PHP lo toma de la sesión
  const resultado = await llamarAPI('votar.php', 'POST', {
    encuesta_id: encuestaId,
    opcion_id: opcionSeleccionada
  });

  if (resultado.error) {
    mostrarAlerta('alerta-voto', resultado.error, 'error');
    return;
  }

  document.getElementById('opciones-voto').style.display  = 'none';
  document.getElementById('panel-votar').style.display    = 'none';
  document.getElementById('confirmacion').style.display   = 'block';
  ocultarAlerta('alerta-voto');
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('btn-confirmar-voto').addEventListener('click', confirmarVoto);

cargarEncuesta();
