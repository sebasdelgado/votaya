<?php
// logout.php — Cierra la sesión de PHP (votante o admin)
// POST

require 'conexion.php';

session_destroy();

responder(['mensaje' => 'Sesión cerrada.']);
