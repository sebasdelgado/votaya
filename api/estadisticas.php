<?php
// estadisticas.php — Números del panel del administrador
// GET

require 'conexion.php';

requiereAdmin();

// Una encuesta cuenta como cerrada si el admin la cerró o si ya pasó su fecha de cierre
$activas  = $conexion->query("SELECT COUNT(*) FROM encuestas WHERE estado = 'activa' AND fecha_fin >= CURDATE()")->fetchColumn();
$cerradas = $conexion->query("SELECT COUNT(*) FROM encuestas WHERE estado = 'cerrada' OR fecha_fin < CURDATE()")->fetchColumn();
$votos    = $conexion->query("SELECT COUNT(*) FROM votos")->fetchColumn();
$votantes = $conexion->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'votante'")->fetchColumn();

responder([
  'encuestas_activas'  => $activas,
  'encuestas_cerradas' => $cerradas,
  'votos'              => $votos,
  'votantes'           => $votantes,
]);
