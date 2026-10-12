<?php
// conexion.php — Conexión a MySQL y funciones compartidas de la API.
// Todos los archivos de la API empiezan con: require 'conexion.php';

// ── Datos de conexión (los de XAMPP por defecto) ─────────────────────────────
$servidor   = 'localhost';
$baseDatos  = 'votaya';
$usuarioBD  = 'root';
$claveBD    = '';

// Todas las respuestas de la API son JSON
header('Content-Type: application/json; charset=utf-8');

// La sesión de PHP guarda quién inició sesión ($_SESSION['usuario'])
session_start();

// Zona horaria de Colombia, para que "hoy" sea el mismo en PHP y en MySQL
date_default_timezone_set('America/Bogota');

// Si ocurre un error no controlado, se responde con un JSON de error en vez de una página HTML
set_exception_handler(function ($error) {
  http_response_code(500);
  echo json_encode(['error' => 'Error del servidor: ' . $error->getMessage()]);
});

$conexion = new PDO("mysql:host=$servidor;dbname=$baseDatos;charset=utf8mb4", $usuarioBD, $claveBD, [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // los errores de SQL lanzan excepción
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // las filas llegan como arreglos ['campo' => valor]
  PDO::ATTR_EMULATE_PREPARES   => false,                  // así los números llegan como números y no como texto
]);
$conexion->exec("SET time_zone = '-05:00'");

// ── Funciones de ayuda ───────────────────────────────────────────────────────

// Envía los datos como JSON con el código HTTP indicado y termina el script
function responder($datos, $codigo = 200) {
  http_response_code($codigo);
  echo json_encode($datos);
  exit;
}

// Lee el cuerpo JSON que envía el fetch del frontend y lo devuelve como arreglo
function leerDatos() {
  $datos = json_decode(file_get_contents('php://input'), true);
  return $datos ? $datos : [];
}

// Verifica que haya un votante con sesión iniciada y lo devuelve
function requiereVotante() {
  if (!isset($_SESSION['usuario']) || $_SESSION['usuario']['rol'] !== 'votante') {
    responder(['error' => 'Debes iniciar sesión como votante.'], 401);
  }
  return $_SESSION['usuario'];
}

// Verifica que haya un administrador con sesión iniciada y lo devuelve
function requiereAdmin() {
  if (!isset($_SESSION['usuario']) || $_SESSION['usuario']['rol'] !== 'admin') {
    responder(['error' => 'Debes iniciar sesión como administrador.'], 401);
  }
  return $_SESSION['usuario'];
}

// Verifica que haya cualquier usuario (votante o admin) con sesión iniciada
function requiereSesion() {
  if (!isset($_SESSION['usuario'])) {
    responder(['error' => 'Debes iniciar sesión.'], 401);
  }
  return $_SESSION['usuario'];
}

// Revisa que el texto sea una fecha real con formato AAAA-MM-DD (ej: "2009-05-31").
// Se crea la fecha y se vuelve a convertir a texto: si no queda igual, no era válida (ej: "2009-02-31")
function esFechaValida($fecha) {
  $convertida = DateTime::createFromFormat('Y-m-d', (string) $fecha);
  return $convertida && $convertida->format('Y-m-d') === $fecha;
}

// Una encuesta está cerrada si el admin la cerró o si ya pasó su fecha de cierre
function encuestaEstaCerrada($encuesta) {
  return $encuesta['estado'] === 'cerrada' || $encuesta['fecha_fin'] < date('Y-m-d');
}
