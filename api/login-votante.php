<?php
// login-votante.php — El votante inicia sesión solo con su número de documento
// POST { numero_documento }

require 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  responder(['error' => 'Método no permitido.'], 405);
}

$datos     = leerDatos();
$documento = trim($datos['numero_documento'] ?? '');

if ($documento === '') {
  responder(['error' => 'Por favor ingresa tu número de documento.'], 400);
}

$sql = "SELECT id, numero_documento, nombre, apellido, fecha_nacimiento, genero, jornada, grupo_id, rol
        FROM usuarios
        WHERE numero_documento = ? AND rol = 'votante'";
$consulta = $conexion->prepare($sql);
$consulta->execute([$documento]);
$votante = $consulta->fetch();

if (!$votante) {
  responder(['error' => 'Documento no encontrado. Verifica el número e intenta de nuevo.'], 404);
}

// Guardar el votante en la sesión de PHP
$_SESSION['usuario'] = $votante;

responder($votante);
