<?php
// votar.php — Registra el voto del votante que tiene la sesión iniciada
// POST { encuesta_id, opcion_id }

require 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  responder(['error' => 'Método no permitido.'], 405);
}

// El id del votante sale de la sesión, nunca de lo que envía el navegador
$votante = requiereVotante();

$datos      = leerDatos();
$encuestaId = (int) ($datos['encuesta_id'] ?? 0);
$opcionId   = (int) ($datos['opcion_id'] ?? 0);

// 1. La encuesta debe existir y seguir abierta
$consulta = $conexion->prepare("SELECT * FROM encuestas WHERE id = ?");
$consulta->execute([$encuestaId]);
$encuesta = $consulta->fetch();

if (!$encuesta) {
  responder(['error' => 'La encuesta no existe.'], 404);
}
if (encuestaEstaCerrada($encuesta)) {
  responder(['error' => 'Esta encuesta ya está cerrada.'], 400);
}

// 2. La opción elegida debe pertenecer a esa encuesta
$consulta = $conexion->prepare("SELECT COUNT(*) FROM opciones WHERE id = ? AND encuesta_id = ?");
$consulta->execute([$opcionId, $encuestaId]);
if ($consulta->fetchColumn() == 0) {
  responder(['error' => 'La opción elegida no es válida.'], 400);
}

// 3. El votante no puede haber votado antes en esta encuesta
$consulta = $conexion->prepare("SELECT COUNT(*) FROM votos WHERE usuario_id = ? AND encuesta_id = ?");
$consulta->execute([$votante['id'], $encuestaId]);
if ($consulta->fetchColumn() > 0) {
  responder(['error' => 'Ya emitiste tu voto en esta encuesta.'], 409);
}

// 4. Guardar el voto
$sql = "INSERT INTO votos (usuario_id, encuesta_id, opcion_id, fecha_voto) VALUES (?, ?, ?, NOW())";
$consulta = $conexion->prepare($sql);
$consulta->execute([$votante['id'], $encuestaId, $opcionId]);

responder(['mensaje' => 'Voto registrado correctamente.'], 201);
