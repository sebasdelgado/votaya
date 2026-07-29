// admin-candidatos.js — Gestión de candidatos

// TODO: En backend, los candidatos se guardarán con:
// INSERT INTO candidatos (nombre, apellido, numero_lista, propuesta, foto)
// Y se listarán con: SELECT * FROM candidatos ORDER BY numero_lista ASC

requiereAdmin();

// Candidatos en memoria para simulación
let candidatos = [];

async function cargarCandidatos() {
  const datos = await obtenerJSON('candidatos');
  candidatos  = datos || [];
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
    nodo.querySelector('.cand-av-grande').textContent = iniciales(c.nombre, c.apellido);
    nodo.querySelector('.campo-nombre').textContent    = `${c.nombre} ${c.apellido}`;
    nodo.querySelector('.campo-lista').textContent     = `Lista ${c.numero_lista}`;
    nodo.querySelector('.campo-propuesta').textContent = c.propuesta;
    nodo.querySelector('.btn-eliminar-candidato').addEventListener('click', () => eliminarCandidato(c.id));
    contenedor.appendChild(nodo);
  });
}

function registrarCandidato() {
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

  // TODO: En backend, enviar POST a 'api/candidatos.php' con los datos del formulario
  const nuevo = {
    id: Date.now(),
    nombre, apellido,
    numero_lista: lista,
    propuesta,
    foto
  };

  candidatos.push(nuevo);
  renderizarCandidatos();
  mostrarAlerta('alerta-candidato', `Candidato ${nombre} ${apellido} registrado correctamente.`, 'exito');

  // Limpiar formulario
  ['cand-nombre','cand-apellido','cand-lista','cand-propuesta','cand-foto']
    .forEach(id => document.getElementById(id).value = '');
}

function eliminarCandidato(id) {
  // TODO: En backend, hacer DELETE a 'api/candidatos.php' con el id
  if (!confirm('¿Eliminar este candidato?')) return;
  candidatos = candidatos.filter(c => c.id !== id);
  renderizarCandidatos();
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('btn-registrar-candidato').addEventListener('click', registrarCandidato);

cargarCandidatos();
