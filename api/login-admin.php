<?php
// login-admin.php — El administrador inicia sesión con correo y contraseña
// POST { correo, contrasena }

require 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  responder(['error' => 'Método no permitido.'], 405);
}

$datos      = leerDatos();
$correo     = trim($datos['correo'] ?? '');
$contrasena = $datos['contrasena'] ?? '';

if ($correo === '' || $contrasena === '') {
  responder(['error' => 'Por favor completa todos los campos.'], 400);
}

$sql = "SELECT id, nombre, apellido, correo, contrasena, rol
        FROM usuarios
        WHERE correo = ? AND rol = 'admin'";
$consulta = $conexion->prepare($sql);
$consulta->execute([$correo]);
$admin = $consulta->fetch();

// password_verify compara la contraseña escrita con el hash guardado en la base de datos
if (!$admin || !password_verify($contrasena, $admin['contrasena'])) {
  responder(['error' => 'Correo o contraseña incorrectos.'], 401);
}

// El hash nunca se guarda en la sesión ni se envía al navegador
unset($admin['contrasena']);
$_SESSION['usuario'] = $admin;

responder($admin);
