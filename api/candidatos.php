<?php
// candidatos.php — Gestión de candidatos (solo admin)
// GET               → lista los candidatos
// POST              → registra un candidato { nombre, apellido, numero_lista, propuesta, foto }
//                     (foto = nombre de un archivo de img/candidatos/, ej: "juan-perez.jpg")
// DELETE ?id=5      → elimina un candidato

require 'conexion.php';

requiereAdmin();

$metodo = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : 0;

// ── GET: listar ──────────────────────────────────────────────────────────────
if ($metodo === 'GET') {
  $candidatos = $conexion->query("SELECT * FROM candidatos ORDER BY CAST(numero_lista AS UNSIGNED) ASC")->fetchAll();
  responder($candidatos);
}

// ── POST: registrar ──────────────────────────────────────────────────────────
if ($metodo === 'POST') {
  $datos     = leerDatos();
  $nombre    = trim($datos['nombre'] ?? '');
  $apellido  = trim($datos['apellido'] ?? '');
  $lista     = trim($datos['numero_lista'] ?? '');
  $propuesta = trim($datos['propuesta'] ?? '');
  $foto      = trim($datos['foto'] ?? '');

  if ($nombre === '' || $apellido === '' || $lista === '' || $propuesta === '') {
    responder(['error' => 'Completa todos los campos obligatorios.'], 400);
  }
  if (!ctype_digit($lista)) {
    responder(['error' => 'El número de lista solo debe contener números.'], 400);
  }

  // Dos candidatos no pueden tener el mismo número de lista
  $consulta = $conexion->prepare("SELECT COUNT(*) FROM candidatos WHERE numero_lista = ?");
  $consulta->execute([$lista]);
  if ($consulta->fetchColumn() > 0) {
    responder(['error' => "Ya existe un candidato con el número de lista $lista."], 409);
  }

  // La foto es opcional. Si viene, es solo el nombre de un archivo que está en img/candidatos/
  if ($foto !== '') {
    // basename() quita cualquier carpeta: así nadie puede pedir archivos fuera de img/candidatos/
    if ($foto !== basename($foto)) {
      responder(['error' => 'Escribe solo el nombre del archivo de la foto, sin carpetas (ej: juan-perez.jpg).'], 400);
    }
    $extension = strtolower(pathinfo($foto, PATHINFO_EXTENSION));
    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
      responder(['error' => 'La foto debe ser una imagen .jpg, .jpeg, .png, .gif o .webp.'], 400);
    }
    if (!is_file(__DIR__ . '/../img/candidatos/' . $foto)) {
      responder(['error' => "No se encontró el archivo \"$foto\" en la carpeta img/candidatos/."], 400);
    }
  }

  // Si la foto viene vacía se guarda NULL
  $sql = "INSERT INTO candidatos (nombre, apellido, numero_lista, propuesta, foto) VALUES (?, ?, ?, ?, ?)";
  $consulta = $conexion->prepare($sql);
  $consulta->execute([$nombre, $apellido, $lista, $propuesta, $foto === '' ? null : $foto]);

  responder(['mensaje' => 'Candidato registrado.', 'id' => (int) $conexion->lastInsertId()], 201);
}

// ── DELETE: eliminar ─────────────────────────────────────────────────────────
if ($metodo === 'DELETE') {
  // No se puede borrar un candidato que ya es opción de alguna encuesta
  $consulta = $conexion->prepare("SELECT COUNT(*) FROM opciones WHERE candidato_id = ?");
  $consulta->execute([$id]);
  if ($consulta->fetchColumn() > 0) {
    responder(['error' => 'No se puede eliminar: el candidato participa en una encuesta.'], 409);
  }

  $consulta = $conexion->prepare("DELETE FROM candidatos WHERE id = ?");
  $consulta->execute([$id]);

  responder(['mensaje' => 'Candidato eliminado.']);
}

responder(['error' => 'Método no permitido.'], 405);
