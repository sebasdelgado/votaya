// admin-panel.js — Panel principal del administrador

// TODO: En backend, las estadísticas se obtendrán con consultas SQL como:
// SELECT COUNT(*) FROM encuestas WHERE estado='activa'
// SELECT COUNT(*) FROM votos
// SELECT COUNT(*) FROM usuarios WHERE rol='votante'

requiereAdmin();

async function cargarPanel() {
  const encuestas = await obtenerJSON('encuestas');
  const votantes  = await obtenerJSON('votantes');
  const votos     = obtenerVotosLocales();

  if (!encuestas) return;

  const activas = encuestas.filter(e => e.estado === 'activa').length;
  const cerradas = encuestas.filter(e => e.estado === 'cerrada').length;

  // Stats
  const contenedorStats = document.getElementById('stats-panel');
  const plantillaStat   = document.getElementById('tpl-stat-card');
  contenedorStats.innerHTML = '';

  [
    ['Encuestas activas', activas],
    ['Encuestas cerradas', cerradas],
    ['Votos registrados', votos.length],
    ['Votantes', votantes ? votantes.length : 0]
  ].forEach(([label, valor]) => {
    const nodo = plantillaStat.content.cloneNode(true);
    nodo.querySelector('.campo-label').textContent = label;
    nodo.querySelector('.campo-valor').textContent = valor;
    contenedorStats.appendChild(nodo);
  });

  // Tabla
  const tbody = document.getElementById('tabla-encuestas');
  tbody.innerHTML = '';

  if (encuestas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="vacio">No hay encuestas creadas.</td></tr>';
    return;
  }

  const plantillaFila = document.getElementById('tpl-fila-encuesta');

  encuestas.forEach(enc => {
    const votosEnc = obtenerVotosLocales().filter(v => v.encuesta_id === enc.id).length;
    const nodo     = plantillaFila.content.cloneNode(true);

    nodo.querySelector('.campo-titulo').textContent = enc.titulo;
    nodo.querySelector('.campo-tipo').textContent    = enc.tipo === 'candidatos' ? 'Candidatos' : 'Texto';
    nodo.querySelector('.campo-estado').innerHTML    = enc.estado === 'activa'
      ? '<span class="badge badge-activa">● Activa</span>'
      : '<span class="badge badge-cerrada">Cerrada</span>';
    nodo.querySelector('.campo-votos').textContent  = votosEnc;
    nodo.querySelector('.campo-cierre').textContent = formatearFecha(enc.fecha_fin);
    nodo.querySelector('.enlace-resultados').href   = `resultados.html?id=${enc.id}`;

    const btnCerrar = nodo.querySelector('.btn-cerrar-encuesta');
    if (enc.estado === 'activa') {
      btnCerrar.addEventListener('click', () => cerrarEncuesta(enc.id));
    } else {
      btnCerrar.remove();
    }

    nodo.querySelector('.btn-eliminar-encuesta').addEventListener('click', () => eliminarEncuesta(enc.id));

    tbody.appendChild(nodo);
  });
}

function cerrarEncuesta(id) {
  // TODO: En backend, hacer fetch a 'api/encuestas.php' con método PUT
  // PHP ejecutará: UPDATE encuestas SET estado='cerrada' WHERE id=?
  if (!confirm('¿Cerrar esta encuesta? Los votantes ya no podrán votar.')) return;
  alert('Encuesta cerrada. (Simulado — en backend se actualizará en MySQL)');
  cargarPanel();
}

function eliminarEncuesta(id) {
  // TODO: En backend, hacer fetch a 'api/encuestas.php' con método DELETE
  // PHP ejecutará: DELETE FROM encuestas WHERE id=? y DELETE FROM opciones WHERE encuesta_id=?
  if (!confirm('¿Eliminar esta encuesta? Esta acción no se puede deshacer.')) return;
  alert('Encuesta eliminada. (Simulado — en backend se eliminará de MySQL)');
  cargarPanel();
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

cargarPanel();
