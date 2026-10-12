// login.js — Lógica de ingreso del votante por número de documento

// api/login-votante.php busca el documento en la tabla usuarios y, si existe,
// guarda al votante en $_SESSION['usuario']

async function ingresar() {
  const documento = document.getElementById('numero-documento').value.trim();

  ocultarAlerta('alerta-login');

  if (!documento) {
    mostrarAlerta('alerta-login', 'Por favor ingresa tu número de documento.', 'error');
    return;
  }

  if (!esSoloNumeros(documento)) {
    mostrarAlerta('alerta-login', 'El número de documento solo debe contener números.', 'error');
    return;
  }

  if (!esLongitudDocumentoValida(documento)) {
    mostrarAlerta('alerta-login', 'El número de documento debe tener entre 6 y 15 dígitos.', 'error');
    return;
  }

  const votante = await llamarAPI('login-votante.php', 'POST', { numero_documento: documento });

  if (votante.error) {
    mostrarAlerta('alerta-login', votante.error, 'error');
    return;
  }

  // Guardar los datos del votante y redirigir
  guardarSesion(votante);
  window.location.href = 'pages/encuestas.html';
}

permitirSoloNumeros(document.getElementById('numero-documento'));

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
