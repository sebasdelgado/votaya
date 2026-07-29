// admin-votantes.js — Gestión de votantes y carga de CSV

// TODO: En backend:
// - Carga CSV: leer archivo con PHP, parsear línea por línea e INSERT INTO usuarios
// - Registro manual: INSERT INTO usuarios (numero_documento, nombre, apellido, ...)
// - Listado: SELECT u.*, g.nombre as grupo FROM usuarios u JOIN grupos g ON u.grupo_id=g.id

requiereAdmin();

let votantes = [];
let grupos   = [];
let votantesFiltrados = [];

async function inicializar() {
  const [datosVotantes, datosGrupos] = await Promise.all([
    obtenerJSON('votantes'),
    obtenerJSON('grupos')
  ]);

  votantes = datosVotantes || [];
  grupos   = datosGrupos   || [];

  // Llenar select de grupos
  const selectGrupo = document.getElementById('v-grupo');
  grupos.forEach(g => {
    const op = document.createElement('option');
    op.value       = g.id;
    op.textContent = g.nombre;
    selectGrupo.appendChild(op);
  });

  renderizarVotantes(votantes);
}

function renderizarVotantes(lista) {
  document.getElementById('total-votantes').textContent = lista.length;
  const tbody = document.getElementById('tabla-votantes');

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="vacio">No hay votantes registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  const plantilla = document.getElementById('tpl-fila-votante');

  lista.forEach(v => {
    const grupo = grupos.find(g => g.id === v.grupo_id);
    const nodo  = plantilla.content.cloneNode(true);

    nodo.querySelector('.campo-documento').textContent = v.numero_documento;
    nodo.querySelector('.campo-nombre').textContent     = `${v.nombre} ${v.apellido}`;
    nodo.querySelector('.campo-grupo').textContent      = grupo ? grupo.nombre : '—';
    nodo.querySelector('.campo-jornada').textContent    = v.jornada || '—';
    nodo.querySelector('.campo-genero').textContent     = v.genero || '—';
    nodo.querySelector('.btn-eliminar-votante').addEventListener('click', () => eliminarVotante(v.id));

    tbody.appendChild(nodo);
  });
}

function filtrarVotantes() {
  const busqueda = document.getElementById('buscador').value.toLowerCase();
  const filtrados = votantes.filter(v =>
    v.nombre.toLowerCase().includes(busqueda) ||
    v.apellido.toLowerCase().includes(busqueda) ||
    v.numero_documento.includes(busqueda)
  );
  renderizarVotantes(filtrados);
}

function registrarVotante() {
  const documento  = document.getElementById('v-documento').value.trim();
  const nombre     = document.getElementById('v-nombre').value.trim();
  const apellido   = document.getElementById('v-apellido').value.trim();
  const nacimiento = document.getElementById('v-nacimiento').value;
  const genero     = document.getElementById('v-genero').value;
  const jornada    = document.getElementById('v-jornada').value;
  const grupoId    = parseInt(document.getElementById('v-grupo').value);

  ocultarAlerta('alerta-votantes');

  if (!documento || !nombre || !apellido || !nacimiento || !genero || !jornada || !grupoId) {
    mostrarAlerta('alerta-votantes', 'Completa todos los campos del formulario.', 'error');
    return;
  }

  if (votantes.find(v => v.numero_documento === documento)) {
    mostrarAlerta('alerta-votantes', 'Ya existe un votante con ese número de documento.', 'error');
    return;
  }

  // TODO: En backend, enviar POST a 'api/votantes.php'
  votantes.push({
    id: Date.now(),
    numero_documento: documento,
    nombre, apellido,
    fecha_nacimiento: nacimiento,
    genero, jornada,
    grupo_id: grupoId
  });

  renderizarVotantes(votantes);
  mostrarAlerta('alerta-votantes', `Votante ${nombre} ${apellido} registrado correctamente.`, 'exito');

  ['v-documento','v-nombre','v-apellido','v-nacimiento'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('v-genero').value  = '';
  document.getElementById('v-jornada').value = '';
  document.getElementById('v-grupo').value   = '';
}

function eliminarVotante(id) {
  // TODO: En backend, DELETE FROM usuarios WHERE id=?
  if (!confirm('¿Eliminar este votante?')) return;
  votantes = votantes.filter(v => v.id !== id);
  renderizarVotantes(votantes);
}

function cargarCSV() {
  const archivo = document.getElementById('archivo-csv').files[0];

  if (!archivo) {
    mostrarAlerta('alerta-votantes', 'Selecciona un archivo CSV primero.', 'error');
    return;
  }

  // TODO: En backend, enviar el archivo a 'api/importar-csv.php' con FormData
  // PHP usará fgetcsv() para leer cada línea e insertar en la tabla usuarios

  const reader = new FileReader();
  reader.onload = function (e) {
    const lineas = e.target.result.trim().split('\n');
    let importados = 0;
    let errores    = 0;

    // Saltar encabezado
    lineas.slice(1).forEach((linea, idx) => {
      const cols = linea.split(',').map(c => c.trim().replace(/"/g,''));
      if (cols.length < 7) { errores++; return; }

      const [documento, nombre, apellido, nacimiento, genero, jornada, grupoId] = cols;

      if (!documento || !nombre || !apellido) { errores++; return; }
      if (votantes.find(v => v.numero_documento === documento)) { errores++; return; }

      votantes.push({
        id: Date.now() + idx,
        numero_documento: documento,
        nombre, apellido,
        fecha_nacimiento: nacimiento,
        genero, jornada,
        grupo_id: parseInt(grupoId)
      });
      importados++;
    });

    renderizarVotantes(votantes);
    mostrarAlerta(
      'alerta-votantes',
      `CSV procesado: ${importados} votantes importados, ${errores} líneas con errores.`,
      importados > 0 ? 'exito' : 'error'
    );
  };

  reader.readAsText(archivo);
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('btn-cargar-csv').addEventListener('click', cargarCSV);
document.getElementById('btn-registrar-votante').addEventListener('click', registrarVotante);
document.getElementById('buscador').addEventListener('input', filtrarVotantes);

inicializar();
