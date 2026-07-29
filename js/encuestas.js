// encuestas.js — Lista de encuestas disponibles para el votante

// TODO: En backend, obtenerJSON('encuestas') será reemplazado por
// fetch('../api/encuestas.php') que ejecutará:
// SELECT * FROM encuestas WHERE estado='activa' ORDER BY fecha_fin ASC

const sesion = requiereVotante();
renderizarTopbar(false);

async function cargarEncuestas() {
  const [encuestas, candidatos] = await Promise.all([
    obtenerJSON('encuestas'),
    obtenerJSON('candidatos')
  ]);

  const contenedor = document.getElementById('lista-encuestas');

  if (!encuestas || encuestas.length === 0) {
    mostrarVacio('lista-encuestas', 'No hay encuestas disponibles por el momento.');
    return;
  }

  contenedor.innerHTML = encuestas.map(enc => renderEncuesta(enc, candidatos)).join('');
}

function renderEncuesta(enc, candidatos) {
  const votado    = yaVoto(sesion.id, enc.id);
  const esCerrada = enc.estado === 'cerrada';
  const badge     = esCerrada
    ? '<span class="badge badge-cerrada">Cerrada</span>'
    : '<span class="badge badge-activa">● Activa</span>';
  const tipoBadge = `<span class="badge badge-tipo">${enc.tipo === 'candidatos' ? 'Candidatos' : 'Encuesta'}</span>`;

  let contenidoOpciones = '';

  if (enc.tipo === 'candidatos') {
    const cands = enc.opciones
      .map(op => candidatos.find(c => c.id === op.candidato_id))
      .filter(Boolean);

    contenidoOpciones = `
      <div class="cands-row">
        ${cands.map(c => `
          <div class="cand-mini">
            <div class="cand-av">${iniciales(c.nombre, c.apellido)}</div>
            <div>
              <div class="cand-nom">${c.nombre} ${c.apellido}</div>
              <div class="cand-lst">Lista ${c.numero_lista}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  } else {
    contenidoOpciones = `
      <div class="opciones-row">
        ${enc.opciones.map(op => `<span class="opcion-pill">${op.texto_opcion}</span>`).join('')}
      </div>`;
  }

  let botonAccion = '';
  if (esCerrada || votado) {
    botonAccion = `
      <a href="resultados.html?id=${enc.id}" class="btn btn-secundario btn-sm">
        <i class="ti ti-chart-bar"></i>
        Ver resultados
      </a>`;
  } else {
    botonAccion = `
      <a href="votar.html?id=${enc.id}" class="btn btn-primario btn-sm">
        <i class="ti ti-check"></i>
        Votar ahora
      </a>`;
  }

  const etiquetaVotado = votado && !esCerrada
    ? '<span class="badge badge-activa"><i class="ti ti-check"></i> Ya votaste</span>'
    : '';

  return `
    <div class="enc-card">
      <div class="enc-head">
        <div class="enc-tags">${tipoBadge} ${etiquetaVotado}</div>
        ${badge}
      </div>
      <h3 class="enc-titulo">${enc.titulo}</h3>
      <p class="enc-desc">${enc.descripcion}</p>
      ${contenidoOpciones}
      <div class="enc-footer">
        <span class="enc-fecha">
          <i class="ti ti-calendar"></i>
          ${esCerrada ? 'Cerró el' : 'Cierra el'} ${formatearFecha(enc.fecha_fin)}
        </span>
        ${botonAccion}
      </div>
    </div>`;
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

cargarEncuestas();
