// resultados.js — Pantalla de resultados con gráfica de barras

// api/resultados.php devuelve la encuesta con sus opciones y el conteo de votos de cada una,
// ya ordenadas de mayor a menor. El admin puede ver cualquier encuesta; el votante solo
// si la encuesta está cerrada o si ya votó.

const sesion      = requiereSesion();
const esAdmin     = sesion && sesion.rol === 'admin';
const params      = new URLSearchParams(window.location.search);
const encuestaId  = parseInt(params.get('id'));

renderizarTopbarVotante();

// El admin vuelve a su panel en vez de a la lista de encuestas del votante
if (esAdmin) {
  document.getElementById('link-volver').href = 'admin-panel.html';
  document.getElementById('texto-volver').textContent = 'Volver al panel';
}

async function cargarResultados() {
  const encuesta = await llamarAPI(`resultados.php?id=${encuestaId}`);

  if (encuesta.error) {
    // Si el votante todavía no puede ver los resultados (no ha votado), se le manda a votar
    window.location.href = esAdmin ? 'admin-panel.html' : `votar.html?id=${encuestaId}`;
    return;
  }

  document.getElementById('enc-titulo').textContent = encuesta.titulo;
  document.getElementById('enc-desc').textContent   = encuesta.descripcion;

  const opcionesConVotos = encuesta.opciones;

  let totalVotos = 0;
  let maxVotos    = 1;
  for (let i = 0; i < opcionesConVotos.length; i++) {
    totalVotos += opcionesConVotos[i].votos;
    if (opcionesConVotos[i].votos > maxVotos) maxVotos = opcionesConVotos[i].votos;
  }

  // Stats
  const cerrada = encuestaEstaCerrada(encuesta);

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
      <div class="font-titulo font-bold text-acento text-base mt-1">
        <span class="badge ${!cerrada ? 'badge-activa' : 'badge-cerrada'}">
          ${!cerrada ? '● Activa' : 'Cerrada'}
        </span>
      </div>
    </div>`;

  // Gráfica
  const grafica = document.getElementById('grafica-resultados');

  if (totalVotos === 0) {
    grafica.innerHTML = '<p class="vacio"><i class="ti ti-chart-bar"></i><br>Aún no hay votos registrados.</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < opcionesConVotos.length; i++) {
    const op = opcionesConVotos[i];
    const porcentaje = totalVotos > 0 ? Math.round((op.votos / totalVotos) * 100) : 0;
    const esGanadora = op.votos === maxVotos && totalVotos > 0;
    let etiqueta = escaparHTML(op.texto_opcion);

    if (encuesta.tipo === 'candidatos') {
      // Foto del candidato, o sus iniciales si no tiene foto
      const avatar = op.foto
        ? `<span class="avatar w-7 h-7 text-[10px]" style="background-image:url('${rutaFotoCandidato(op.foto)}');background-size:cover;background-position:center"></span>`
        : `<span class="avatar w-7 h-7 text-[10px]">${escaparHTML(iniciales(op.nombre, op.apellido))}</span>`;
      etiqueta = `<span class="inline-flex items-center gap-2">${avatar} ${escaparHTML(op.nombre)} ${escaparHTML(op.apellido)} (Lista ${escaparHTML(op.numero_lista)})</span>`;
    }

    // El color de la barra ganadora se fuerza con "!" para que gane sin depender del orden de generación de Tailwind
    const claseFill = esGanadora ? '!bg-acento-hover' : '';

    html += `
        <div class="mb-3.5">
          <div class="flex justify-between text-sm mb-1.5">
            <span class="font-medium text-texto">${etiqueta} ${esGanadora && cerrada ? '🏆' : ''}</span>
            <span class="text-texto-muted">${op.votos} votos — ${porcentaje}%</span>
          </div>
          <div class="bg-fondo rounded-full h-3 overflow-hidden">
            <div class="h-full bg-acento rounded-full transition-[width] duration-500 ${claseFill}" style="width: ${porcentaje}%"></div>
          </div>
        </div>`;
  }

  grafica.innerHTML = html;
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

cargarResultados();
