<?php
// resultados.php — Conteo de votos por opción de una encuesta
// GET ?id=5
// El admin puede ver cualquier resultado. El votante solo si la encuesta está cerrada o si ya votó.

require 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  responder(['error' => 'Método no permitido.'], 405);
}

$usuario    = requiereSesion();
$encuestaId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

$consulta = $conexion->prepare("SELECT * FROM encuestas WHERE id = ?");
$consulta->execute([$encuestaId]);
$encuesta = $consulta->fetch();

if (!$encuesta) {
  responder(['error' => 'La encuesta no existe.'], 404);
}

if ($usuario['rol'] === 'votante' && !encuestaEstaCerrada($encuesta)) {
  $consulta = $conexion->prepare("SELECT COUNT(*) FROM votos WHERE usuario_id = ? AND encuesta_id = ?");
  $consulta->execute([$usuario['id'], $encuestaId]);
  if ($consulta->fetchColumn() == 0) {
    responder(['error' => 'Debes votar antes de ver los resultados.'], 403);
  }
}

// La subconsulta cuenta los votos de cada opción (las opciones sin votos quedan en 0)
$sql = "SELECT o.id, o.candidato_id, o.texto_opcion,
               c.nombre, c.apellido, c.numero_lista, c.foto,
               (SELECT COUNT(*) FROM votos v WHERE v.opcion_id = o.id) AS votos
        FROM opciones o
        LEFT JOIN candidatos c ON c.id = o.candidato_id
        WHERE o.encuesta_id = ?
        ORDER BY votos DESC";
$consulta = $conexion->prepare($sql);
$consulta->execute([$encuestaId]);

$encuesta['opciones'] = $consulta->fetchAll();

responder($encuesta);
