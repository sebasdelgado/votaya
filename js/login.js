// login.js — Lógica de ingreso del votante por número de documento

// TODO: En backend, esta función hará fetch a 'api/login-votante.php'
// que ejecutará: SELECT * FROM usuarios WHERE numero_documento = ? AND rol = 'votante'
// Si existe, PHP iniciará la sesión con session_start() y $_SESSION['usuario']

async function ingresar() {
  const documento = document.getElementById('numero-documento').value.trim();

  ocultarAlerta('alerta-login');

  if (!documento) {
    mostrarAlerta('alerta-login', 'Por favor ingresa tu número de documento.', 'error');
    return;
  }

  if (documento.length < 6) {
    mostrarAlerta('alerta-login', 'El número de documento debe tener al menos 6 caracteres.', 'error');
    return;
  }

  // TODO: En backend reemplazar por: fetch('api/login-votante.php', { method:'POST', body: formData })
  const votantes = await obtenerJSON('votantes');

  if (!votantes) {
    mostrarAlerta('alerta-login', 'Error al conectar con el servidor. Intenta de nuevo.', 'error');
    return;
  }

  const votante = votantes.find(v => v.numero_documento === documento);

  if (!votante) {
    mostrarAlerta('alerta-login', 'Documento no encontrado. Verifica el número e intenta de nuevo.', 'error');
    return;
  }

  // Guardar sesión y redirigir
  guardarSesion({ ...votante, rol: 'votante' });
  window.location.href = 'pages/encuestas.html';
}

document.getElementById('btn-ingresar').addEventListener('click', ingresar);

document.getElementById('numero-documento').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') ingresar();
});

// Si ya hay sesión activa, redirigir según rol
const sesionActiva = obtenerSesion();
if (sesionActiva) {
  if (sesionActiva.rol === 'admin') {
    window.location.href = 'pages/admin-panel.html';
  } else {
    window.location.href = 'pages/encuestas.html';
  }
}
