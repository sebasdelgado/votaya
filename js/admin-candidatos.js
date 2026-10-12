// admin-candidatos.js — Gestión de candidatos

// Los candidatos se listan, registran y eliminan con api/candidatos.php (GET, POST y DELETE)

requiereAdmin();
renderizarLayoutAdmin('admin-candidatos.html');

let candidatos = [];

async function cargarCandidatos() {
  const datos = await llamarAPI('candidatos.php');
  candidatos  = datos.error ? [] : datos;
  renderizarCandidatos();
}

function renderizarCandidatos() {
  const contenedor = document.getElementById('lista-candidatos');

  if (candidatos.length === 0) {
    mostrarVacio('lista-candidatos', 'No hay candidatos registrados aún.');
    return;
  }

  const plantilla = document.getElementById('tpl-candidato-card');
  contenedor.innerHTML = '';

  candidatos.forEach(c => {
    const nodo = plantilla.content.cloneNode(true);
    renderizarAvatar(nodo.querySelector('.cand-av-grande'), c.nombre, c.apellido, c.foto);
    nodo.querySelector('.campo-nombre').textContent    = `${c.nombre} ${c.apellido}`;
    nodo.querySelector('.campo-lista').textContent     = `Lista ${c.numero_lista}`;
    nodo.querySelector('.campo-propuesta').textContent = c.propuesta;
    nodo.querySelector('.btn-eliminar-candidato').addEventListener('click', () => eliminarCandidato(c.id));
    contenedor.appendChild(nodo);
  });
}

async function registrarCandidato() {
  const nombre    = document.getElementById('cand-nombre').value.trim();
  const apellido  = document.getElementById('cand-apellido').value.trim();
  const lista     = document.getElementById('cand-lista').value.trim();
  const propuesta = document.getElementById('cand-propuesta').value.trim();
  const foto      = document.getElementById('cand-foto').value.trim();

  ocultarAlerta('alerta-candidato');

  if (!nombre || !apellido || !lista || !propuesta) {
    mostrarAlerta('alerta-candidato', 'Completa todos los campos obligatorios.', 'error');
    return;
  }

  if (!esSoloNumeros(lista)) {
    mostrarAlerta('alerta-candidato', 'El número de lista solo debe contener números.', 'error');
    return;
  }

  // `foto` es solo el nombre del archivo; PHP revisa que exista en img/candidatos/
  const resultado = await llamarAPI('candidatos.php', 'POST', {
    nombre, apellido,
    numero_lista: lista,
    propuesta,
    foto
  });

  if (resultado.error) {
    mostrarAlerta('alerta-candidato', resultado.error, 'error');
    return;
  }

  await cargarCandidatos();
  mostrarAlerta('alerta-candidato', `Candidato ${nombre} ${apellido} registrado correctamente.`, 'exito');

  // Limpiar formulario
  ['cand-nombre','cand-apellido','cand-lista','cand-propuesta','cand-foto']
    .forEach(id => document.getElementById(id).value = '');
  ocultarPreviewFoto();
}

function previsualizarFoto() {
  const foto    = document.getElementById('cand-foto').value.trim();
  const preview = document.getElementById('cand-foto-preview');

  if (!foto) {
    ocultarPreviewFoto();
    return;
  }

  preview.src = rutaFotoCandidato(foto);
  preview.classList.remove('hidden');
}

// Si el nombre escrito no corresponde a ninguna imagen de la carpeta, se oculta la vista previa
function fotoNoEncontrada() {
  if (document.getElementById('cand-foto').value.trim()) {
    document.getElementById('cand-foto-preview').classList.add('hidden');
  }
}

function ocultarPreviewFoto() {
  const preview = document.getElementById('cand-foto-preview');
  preview.src = '';
  preview.classList.add('hidden');
}

async function eliminarCandidato(id) {
  if (!confirm('¿Eliminar este candidato?')) return;

  const resultado = await llamarAPI(`candidatos.php?id=${id}`, 'DELETE');
  if (resultado.error) {
    mostrarAlerta('alerta-candidato', resultado.error, 'error');
    return;
  }

  cargarCandidatos();
}

permitirSoloNumeros(document.getElementById('cand-lista'));

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('btn-registrar-candidato').addEventListener('click', registrarCandidato);
document.getElementById('cand-foto').addEventListener('input', previsualizarFoto);
document.getElementById('cand-foto-preview').addEventListener('error', fotoNoEncontrada);

cargarCandidatos();
