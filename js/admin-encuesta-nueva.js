// admin-encuesta-nueva.js — Crear nueva encuesta

// La encuesta se envía a api/encuestas.php (POST), que la guarda junto con sus opciones

requiereAdmin();
renderizarLayoutAdmin('admin-encuesta-nueva.html');

let candidatos    = [];
let contadorOpciones = 0;

async function inicializar() {
  const datos = await llamarAPI('candidatos.php');
  candidatos  = datos.error ? [] : datos;
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
        <a href="admin-candidatos.html" class="hover:underline">Registrar candidatos</a>
      </div>`;
    return;
  }

  contenedor.innerHTML = '';
  const plantilla = document.getElementById('tpl-candidato-check');

  candidatos.forEach(c => {
    const nodo = plantilla.content.cloneNode(true);
    nodo.querySelector('.check-candidato').value       = c.id;
    renderizarAvatar(nodo.querySelector('.campo-iniciales'), c.nombre, c.apellido, c.foto);
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

async function crearEncuesta() {
  const titulo   = document.getElementById('enc-titulo').value.trim();
  const desc     = document.getElementById('enc-desc').value.trim();
  const tipo     = document.getElementById('enc-tipo').value;
  const fechaFin = document.getElementById('enc-fecha-fin').value;

  ocultarAlerta('alerta-encuesta');

  if (!titulo || !desc || !fechaFin) {
    mostrarAlerta('alerta-encuesta', 'Completa el título, descripción y fecha de cierre.', 'error');
    return;
  }

  if (!esFechaFutura(fechaFin)) {
    mostrarAlerta('alerta-encuesta', 'La fecha de cierre debe ser posterior a hoy.', 'error');
    return;
  }

  let opciones = [];

  if (tipo === 'candidatos') {
    const checks = document.querySelectorAll('#lista-candidatos-check input[type="checkbox"]:checked');
    if (checks.length < 2) {
      mostrarAlerta('alerta-encuesta', 'Selecciona al menos 2 candidatos.', 'error');
      return;
    }
    for (let i = 0; i < checks.length; i++) {
      opciones.push({ candidato_id: parseInt(checks[i].value), texto_opcion: null });
    }
  } else {
    const inputs = document.querySelectorAll('.opcion-texto');
    for (let i = 0; i < inputs.length; i++) {
      const texto = inputs[i].value.trim();
      if (texto) opciones.push({ candidato_id: null, texto_opcion: texto });
    }

    if (opciones.length < 2) {
      mostrarAlerta('alerta-encuesta', 'Agrega al menos 2 opciones de texto.', 'error');
      return;
    }
  }

  // El estado ('activa') y la fecha de inicio (hoy) los pone PHP
  const resultado = await llamarAPI('encuestas.php', 'POST', {
    titulo,
    descripcion: desc,
    tipo,
    fecha_fin: fechaFin,
    opciones
  });

  if (resultado.error) {
    mostrarAlerta('alerta-encuesta', resultado.error, 'error');
    return;
  }

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
