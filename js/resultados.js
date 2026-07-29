// resultados.js — Pantalla de resultados con gráfica de barras

// TODO: En backend, los votos se obtendrán de:
// SELECT opcion_id, COUNT(*) as total FROM votos WHERE encuesta_id=? GROUP BY opcion_id
// PHP devolverá el conteo real de votos desde MySQL

const sesion      = requiereVotante();
const params      = new URLSearchParams(window.location.search);
const encuestaId  = parseInt(params.get('id'));

renderizarTopbar(false);

async function cargarResultados() {
  const [encuestas, candidatos] = await Promise.all([
    obtenerJSON('encuestas'),
    obtenerJSON('candidatos')
  ]);

  const encuesta = encuestas.find(e => e.id === encuestaId);
  if (!encuesta) { window.location.href = 'encuestas.html'; return; }

  document.getElementById('enc-titulo').textContent = encuesta.titulo;
  document.getElementById('enc-desc').textContent   = encuesta.descripcion;

  // Contar votos locales
  const opcionesConVotos = contarVotosPorOpcion(encuesta.id, encuesta.opciones);
  const totalVotos       = opcionesConVotos.reduce((acc, op) => acc + op.votos, 0);
  const maxVotos         = Math.max(...opcionesConVotos.map(op => op.votos), 1);
  const ganadora         = opcionesConVotos.find(op => op.votos === maxVotos);

  // Stats
  document.getElementById('stats-resultados').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total votos</div>
      <div class="stat-valor">${totalVotos}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Opciones</div>
      <div class="stat-valor">${encuesta.opciones.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Estado</div>
      <div class="stat-valor" style="font-size:16px; margin-top:4px;">
        <span class="badge ${encuesta.estado === 'activa' ? 'badge-activa' : 'badge-cerrada'}">
          ${encuesta.estado === 'activa' ? '● Activa' : 'Cerrada'}
        </span>
      </div>
    </div>`;

  // Gráfica
  const grafica = document.getElementById('grafica-resultados');

  if (totalVotos === 0) {
    grafica.innerHTML = '<p class="vacio"><i class="ti ti-chart-bar"></i><br>Aún no hay votos registrados.</p>';
    return;
  }

  grafica.innerHTML = opcionesConVotos
    .sort((a, b) => b.votos - a.votos)
    .map(op => {
      const porcentaje = totalVotos > 0 ? Math.round((op.votos / totalVotos) * 100) : 0;
      const esGanadora = op.votos === maxVotos && totalVotos > 0;
      let etiqueta = op.texto_opcion;

      if (encuesta.tipo === 'candidatos') {
        const cand = candidatos.find(c => c.id === op.candidato_id);
        etiqueta = cand ? `${cand.nombre} ${cand.apellido} (Lista ${cand.numero_lista})` : 'Candidato';
      }

      return `
        <div class="barra-wrap">
          <div class="barra-label">
            <span>${etiqueta} ${esGanadora && encuesta.estado === 'cerrada' ? '🏆' : ''}</span>
            <span>${op.votos} votos — ${porcentaje}%</span>
          </div>
          <div class="barra-bg">
            <div class="barra-fill ${esGanadora ? 'ganador' : ''}" style="width: ${porcentaje}%"></div>
          </div>
        </div>`;
    }).join('');
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

cargarResultados();
