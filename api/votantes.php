<?php
// votantes.php — Padrón de votantes (solo admin)
// GET               → lista los votantes con el nombre de su grupo
// POST              → registra un votante
// DELETE ?id=5      → elimina un votante

require 'conexion.php';

requiereAdmin();

$metodo = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : 0;

// ── GET: listar ──────────────────────────────────────────────────────────────
if ($metodo === 'GET') {
  $sql = "SELECT u.id, u.numero_documento, u.nombre, u.apellido, u.fecha_nacimiento,
                 u.genero, u.jornada, u.grupo_id, g.nombre AS grupo
          FROM usuarios u
          LEFT JOIN grupos g ON g.id = u.grupo_id
          WHERE u.rol = 'votante'
          ORDER BY u.apellido, u.nombre";
  $votantes = $conexion->query($sql)->fetchAll();
  responder($votantes);
}

// ── POST: registrar ──────────────────────────────────────────────────────────
if ($metodo === 'POST') {
  $datos      = leerDatos();
  $documento  = trim($datos['numero_documento'] ?? '');
  $nombre     = trim($datos['nombre'] ?? '');
  $apellido   = trim($datos['apellido'] ?? '');
  $nacimiento = $datos['fecha_nacimiento'] ?? '';
  $genero     = $datos['genero'] ?? '';
  $jornada    = $datos['jornada'] ?? '';
  $grupoId    = (int) ($datos['grupo_id'] ?? 0);

  if ($documento === '' || $nombre === '' || $apellido === '' || $nacimiento === '' || $genero === '' || $jornada === '' || !$grupoId) {
    responder(['error' => 'Completa todos los campos del formulario.'], 400);
  }
  if (!ctype_digit($documento) || strlen($documento) < 6 || strlen($documento) > 15) {
    responder(['error' => 'El número de documento debe tener entre 6 y 15 dígitos.'], 400);
  }
  if (!esFechaValida($nacimiento) || $nacimiento > date('Y-m-d')) {
    responder(['error' => 'La fecha de nacimiento no es válida.'], 400);
  }
  // Solo se aceptan los mismos valores que permite el ENUM de la tabla usuarios
  if (!in_array($genero, ['masculino', 'femenino', 'otro'])) {
    responder(['error' => 'El género no es válido.'], 400);
  }
  if (!in_array($jornada, ['mañana', 'tarde'])) {
    responder(['error' => 'La jornada no es válida.'], 400);
  }

  // El grupo debe existir
  $consulta = $conexion->prepare("SELECT COUNT(*) FROM grupos WHERE id = ?");
  $consulta->execute([$grupoId]);
  if ($consulta->fetchColumn() == 0) {
    responder(['error' => 'El grupo seleccionado no existe.'], 400);
  }

  // El número de documento no se puede repetir
  $consulta = $conexion->prepare("SELECT COUNT(*) FROM usuarios WHERE numero_documento = ?");
  $consulta->execute([$documento]);
  if ($consulta->fetchColumn() > 0) {
    responder(['error' => 'Ya existe un votante con ese número de documento.'], 409);
  }

  $sql = "INSERT INTO usuarios (numero_documento, nombre, apellido, fecha_nacimiento, genero, jornada, grupo_id, rol)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'votante')";
  $consulta = $conexion->prepare($sql);
  $consulta->execute([$documento, $nombre, $apellido, $nacimiento, $genero, $jornada, $grupoId]);

  responder(['mensaje' => 'Votante registrado.', 'id' => (int) $conexion->lastInsertId()], 201);
}

// ── DELETE: eliminar ─────────────────────────────────────────────────────────
if ($metodo === 'DELETE') {
  // No se borra a un votante que ya votó, para no alterar los resultados
  $consulta = $conexion->prepare("SELECT COUNT(*) FROM votos WHERE usuario_id = ?");
  $consulta->execute([$id]);
  if ($consulta->fetchColumn() > 0) {
    responder(['error' => 'No se puede eliminar: el votante ya tiene votos registrados.'], 409);
  }

  // rol = 'votante' evita que por error se borre al administrador
  $consulta = $conexion->prepare("DELETE FROM usuarios WHERE id = ? AND rol = 'votante'");
  $consulta->execute([$id]);

  responder(['mensaje' => 'Votante eliminado.']);
}

responder(['error' => 'Método no permitido.'], 405);
