<?php
// grupos.php — Lista de grupos, para el select del formulario de votantes (solo admin)
// GET

require 'conexion.php';

requiereAdmin();

$grupos = $conexion->query("SELECT * FROM grupos ORDER BY id ASC")->fetchAll();

responder($grupos);
