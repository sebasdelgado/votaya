// admin-panel.js — Panel principal del administrador

// Las estadísticas vienen de api/estadisticas.php (consultas COUNT en MySQL)
// y la tabla de api/encuestas.php, que incluye el total de votos de cada encuesta

requiereAdmin();
renderizarLayoutAdmin('admin-panel.html');

async function cargarPanel() {
  const [stats, encuestas] = await Promise.all([
    llamarAPI('estadisticas.php'),
    llamarAPI('encuestas.php')
  ]);

  if (stats.error || encuestas.error) return;

  // Stats
  const contenedorStats = document.getElementById('stats-panel');
  const plantillaStat   = document.getElementById('tpl-stat-card');
  contenedorStats.innerHTML = '';

  [
    ['Encuestas activas', stats.encuestas_activas],
    ['Encuestas cerradas', stats.encuestas_cerradas],
    ['Votos registrados', stats.votos],
    ['Votantes', stats.votantes]
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
    const nodo = plantillaFila.content.cloneNode(true);

    nodo.querySelector('.campo-titulo').textContent = enc.titulo;
    nodo.querySelector('.campo-tipo').textContent    = enc.tipo === 'candidatos' ? 'Candidatos' : 'Texto';
    nodo.querySelector('.campo-estado').innerHTML    = !encuestaEstaCerrada(enc)
      ? `<span class="badge badge-activa">● Activa</span>`
      : `<span class="badge badge-cerrada">Cerrada</span>`;
    nodo.querySelector('.campo-votos').textContent  = enc.total_votos;
    nodo.querySelector('.campo-cierre').textContent = formatearFecha(enc.fecha_fin);
    nodo.querySelector('.enlace-resultados').href   = `resultados.html?id=${enc.id}`;

    const btnCerrar = nodo.querySelector('.btn-cerrar-encuesta');
    if (!encuestaEstaCerrada(enc)) {
      btnCerrar.addEventListener('click', () => cerrarEncuesta(enc.id));
    } else {
      btnCerrar.remove();
    }

    nodo.querySelector('.btn-eliminar-encuesta').addEventListener('click', () => eliminarEncuesta(enc.id));

    tbody.appendChild(nodo);
  });
}

async function cerrarEncuesta(id) {
  if (!confirm('¿Cerrar esta encuesta? Los votantes ya no podrán votar.')) return;

  const resultado = await llamarAPI(`encuestas.php?id=${id}`, 'PUT');
  if (resultado.error) {
    alert(resultado.error);
    return;
  }
  cargarPanel();
}

async function eliminarEncuesta(id) {
  if (!confirm('¿Eliminar esta encuesta? Se borrarán también todos sus votos. Esta acción no se puede deshacer.')) return;

  const resultado = await llamarAPI(`encuestas.php?id=${id}`, 'DELETE');
  if (resultado.error) {
    alert(resultado.error);
    return;
  }
  cargarPanel();
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

cargarPanel();
