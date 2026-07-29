// admin-login.js — Lógica de login del administrador

// TODO: En backend, hacer fetch a 'api/login-admin.php'
// PHP verificará: SELECT * FROM usuarios WHERE correo=? AND rol='admin'
// y comparará la contraseña con password_verify($contrasena, $hash)

// Credenciales de prueba para el frontend simulado
const ADMIN_SIMULADO = {
  id: 99,
  nombre: 'Admin',
  apellido: 'Sistema',
  correo: 'admin@colegio.edu.co',
  contrasena: 'admin123',
  rol: 'admin'
};

async function loginAdmin() {
  const correo     = document.getElementById('correo').value.trim();
  const contrasena = document.getElementById('contrasena').value.trim();

  ocultarAlerta('alerta-admin');

  if (!correo || !contrasena) {
    mostrarAlerta('alerta-admin', 'Por favor completa todos los campos.', 'error');
    return;
  }

  // TODO: En backend reemplazar esta validación por una llamada a la API PHP
  if (correo === ADMIN_SIMULADO.correo && contrasena === ADMIN_SIMULADO.contrasena) {
    guardarSesion(ADMIN_SIMULADO);
    window.location.href = 'admin-panel.html';
  } else {
    mostrarAlerta('alerta-admin', 'Correo o contraseña incorrectos.', 'error');
  }
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
