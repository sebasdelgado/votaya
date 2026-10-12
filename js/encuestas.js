// encuestas.js — Lista de encuestas disponibles para el votante

// api/encuestas.php devuelve cada encuesta con sus opciones (y los datos del candidato
// en cada opción) y el campo ya_voto, que indica si este votante ya votó en ella

const sesion = requiereVotante();
renderizarTopbarVotante();

async function cargarEncuestas() {
  const encuestas  = await llamarAPI('encuestas.php');
  const contenedor = document.getElementById('lista-encuestas');

  if (encuestas.error) {
    mostrarAlerta('lista-encuestas', encuestas.error, 'error');
    return;
  }

  if (encuestas.length === 0) {
    mostrarVacio('lista-encuestas', 'No hay encuestas disponibles por el momento.');
    return;
  }

  let html = '';
  for (let i = 0; i < encuestas.length; i++) {
    html += renderEncuesta(encuestas[i]);
  }
  contenedor.innerHTML = html;
}

function renderEncuesta(enc) {
  const votado    = enc.ya_voto > 0;
  const esCerrada = encuestaEstaCerrada(enc);
  const badge     = esCerrada
    ? `<span class="badge badge-cerrada">Cerrada</span>`
    : `<span class="badge badge-activa">● Activa</span>`;
  const tipoBadge = `<span class="badge badge-tipo">${enc.tipo === 'candidatos' ? 'Candidatos' : 'Encuesta'}</span>`;

  let contenidoOpciones = '';

  if (enc.tipo === 'candidatos') {
    let tarjetas = '';
    for (let i = 0; i < enc.opciones.length; i++) {
      const c = enc.opciones[i];
      tarjetas += `
          <div class="bg-fondo border border-borde rounded-md px-3 py-2.5 flex items-center gap-2 flex-1 min-w-[120px]">
            ${c.foto
              ? `<div class="avatar w-9 h-9 text-xs" style="background-image:url('${rutaFotoCandidato(c.foto)}');background-size:cover;background-position:center"></div>`
              : `<div class="avatar w-9 h-9 text-xs">${escaparHTML(iniciales(c.nombre, c.apellido))}</div>`}
            <div>
              <div class="text-sm font-medium text-texto">${escaparHTML(c.nombre)} ${escaparHTML(c.apellido)}</div>
              <div class="text-xs text-texto-muted">Lista ${escaparHTML(c.numero_lista)}</div>
            </div>
          </div>`;
    }

    contenidoOpciones = `<div class="flex gap-2 flex-wrap mb-1">${tarjetas}</div>`;
  } else {
    let pastillas = '';
    for (let i = 0; i < enc.opciones.length; i++) {
      pastillas += `<span class="bg-fondo border border-borde rounded-sm px-3 py-1.5 text-xs text-texto-suave">${escaparHTML(enc.opciones[i].texto_opcion)}</span>`;
    }
    contenidoOpciones = `<div class="flex gap-1.5 flex-wrap mb-1">${pastillas}</div>`;
  }

  let botonAccion = '';
  if (esCerrada || votado) {
    botonAccion = `
      <a href="resultados.html?id=${enc.id}" class="btn btn-suave">
        <i class="ti ti-chart-bar"></i>
        Ver resultados
      </a>`;
  } else {
    botonAccion = `
      <a href="votar.html?id=${enc.id}" class="btn btn-primario">
        <i class="ti ti-check"></i>
        Votar ahora
      </a>`;
  }

  const etiquetaVotado = votado && !esCerrada
    ? `<span class="badge badge-activa"><i class="ti ti-check"></i> Ya votaste</span>`
    : '';

  return `
    <div class="card p-5 mb-3.5 hover:border-acento-borde">
      <div class="flex justify-between items-start gap-2.5 mb-2.5">
        <div class="flex gap-1.5 flex-wrap">${tipoBadge} ${etiquetaVotado}</div>
        ${badge}
      </div>
      <h3 class="font-titulo text-[17px] font-bold text-texto mb-1">${escaparHTML(enc.titulo)}</h3>
      <p class="text-sm text-texto-muted mb-3.5">${escaparHTML(enc.descripcion)}</p>
      ${contenidoOpciones}
      <div class="flex items-center justify-between mt-3.5 pt-3 border-t border-borde-suave">
        <span class="text-sm text-texto-muted flex items-center gap-1.5">
          <i class="ti ti-calendar"></i>
          ${esCerrada ? 'Cerró el' : 'Cierra el'} ${formatearFecha(enc.fecha_fin)}
        </span>
        ${botonAccion}
      </div>
    </div>`;
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

cargarEncuestas();
