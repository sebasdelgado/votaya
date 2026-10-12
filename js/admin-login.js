// admin-login.js — Lógica de login del administrador

// api/login-admin.php busca el correo en la tabla usuarios y compara la contraseña
// con password_verify($contrasena, $hash)

async function loginAdmin() {
  const correo     = document.getElementById('correo').value.trim();
  const contrasena = document.getElementById('contrasena').value.trim();

  ocultarAlerta('alerta-admin');

  if (!correo || !contrasena) {
    mostrarAlerta('alerta-admin', 'Por favor completa todos los campos.', 'error');
    return;
  }

  if (!esCorreoValido(correo)) {
    mostrarAlerta('alerta-admin', 'Ingresa un correo electrónico válido.', 'error');
    return;
  }

  const admin = await llamarAPI('login-admin.php', 'POST', { correo, contrasena });

  if (admin.error) {
    mostrarAlerta('alerta-admin', admin.error, 'error');
    return;
  }

  guardarSesion(admin);
  window.location.href = 'admin-panel.html';
}

document.getElementById('btn-login-admin').addEventListener('click', loginAdmin);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') loginAdmin();
});

// Si ya es admin, redirigir
const sesion = obtenerSesion();
if (sesion && sesion.rol === 'admin') {
  window.location.href = 'admin-panel.html';
}
