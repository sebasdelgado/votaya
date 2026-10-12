// admin-votantes.js — Gestión de votantes

// El padrón se maneja con api/votantes.php (GET, POST y DELETE)
// y los grupos del select vienen de api/grupos.php

requiereAdmin();
renderizarLayoutAdmin('admin-votantes.html');

let votantes = [];

async function inicializar() {
  const grupos = await llamarAPI('grupos.php');

  // Llenar select de grupos
  if (!grupos.error) {
    const selectGrupo = document.getElementById('v-grupo');
    grupos.forEach(g => {
      const op = document.createElement('option');
      op.value       = g.id;
      op.textContent = g.nombre;
      selectGrupo.appendChild(op);
    });
  }

  await cargarVotantes();
}

async function cargarVotantes() {
  const datos = await llamarAPI('votantes.php');
  votantes    = datos.error ? [] : datos;
  document.getElementById('buscador').value = '';
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
    const nodo = plantilla.content.cloneNode(true);

    nodo.querySelector('.campo-documento').textContent = v.numero_documento;
    nodo.querySelector('.campo-nombre').textContent     = `${v.nombre} ${v.apellido}`;
    nodo.querySelector('.campo-grupo').textContent      = v.grupo || '—';
    nodo.querySelector('.campo-jornada').textContent    = v.jornada || '—';
    nodo.querySelector('.campo-genero').textContent     = v.genero || '—';
    nodo.querySelector('.btn-eliminar-votante').addEventListener('click', () => eliminarVotante(v.id));

    tbody.appendChild(nodo);
  });
}

function filtrarVotantes() {
  const busqueda = document.getElementById('buscador').value.toLowerCase();

  const filtrados = [];
  for (let i = 0; i < votantes.length; i++) {
    const v = votantes[i];
    if (
      v.nombre.toLowerCase().includes(busqueda) ||
      v.apellido.toLowerCase().includes(busqueda) ||
      v.numero_documento.includes(busqueda)
    ) {
      filtrados.push(v);
    }
  }

  renderizarVotantes(filtrados);
}

async function registrarVotante() {
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

  if (!esSoloNumeros(documento)) {
    mostrarAlerta('alerta-votantes', 'El número de documento solo debe contener números.', 'error');
    return;
  }

  if (!esLongitudDocumentoValida(documento)) {
    mostrarAlerta('alerta-votantes', 'El número de documento debe tener entre 6 y 15 dígitos.', 'error');
    return;
  }

  if (!esFechaPasadaValida(nacimiento)) {
    mostrarAlerta('alerta-votantes', 'La fecha de nacimiento no es válida.', 'error');
    return;
  }

  // PHP revisa que el documento no esté repetido antes de guardarlo
  const resultado = await llamarAPI('votantes.php', 'POST', {
    numero_documento: documento,
    nombre, apellido,
    fecha_nacimiento: nacimiento,
    genero, jornada,
    grupo_id: grupoId
  });

  if (resultado.error) {
    mostrarAlerta('alerta-votantes', resultado.error, 'error');
    return;
  }

  await cargarVotantes();
  mostrarAlerta('alerta-votantes', `Votante ${nombre} ${apellido} registrado correctamente.`, 'exito');

  ['v-documento','v-nombre','v-apellido','v-nacimiento'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('v-genero').value  = '';
  document.getElementById('v-jornada').value = '';
  document.getElementById('v-grupo').value   = '';
}

async function eliminarVotante(id) {
  if (!confirm('¿Eliminar este votante?')) return;

  const resultado = await llamarAPI(`votantes.php?id=${id}`, 'DELETE');
  if (resultado.error) {
    mostrarAlerta('alerta-votantes', resultado.error, 'error');
    return;
  }

  cargarVotantes();
}

permitirSoloNumeros(document.getElementById('v-documento'));

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('btn-registrar-votante').addEventListener('click', registrarVotante);
document.getElementById('buscador').addEventListener('input', filtrarVotantes);

inicializar();
