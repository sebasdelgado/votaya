<?php
// encuestas.php — Encuestas y sus opciones
// GET               → lista todas las encuestas (votante o admin)
// GET    ?id=5      → una sola encuesta (votante o admin)
// POST              → crea una encuesta con sus opciones (admin)
// PUT    ?id=5      → cierra la encuesta (admin)
// DELETE ?id=5      → elimina la encuesta, sus opciones y sus votos (admin)

require 'conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : 0;

// Busca las opciones de cada encuesta (con los datos del candidato si es de tipo candidatos)
// y las agrega en $encuesta['opciones']
function agregarOpciones($conexion, $encuestas) {
  $sql = "SELECT o.id, o.encuesta_id, o.candidato_id, o.texto_opcion,
                 c.nombre, c.apellido, c.numero_lista, c.propuesta, c.foto
          FROM opciones o
          LEFT JOIN candidatos c ON c.id = o.candidato_id
          ORDER BY o.id ASC";
  $opciones = $conexion->query($sql)->fetchAll();

  for ($i = 0; $i < count($encuestas); $i++) {
    $encuestas[$i]['opciones'] = [];
    foreach ($opciones as $opcion) {
      if ($opcion['encuesta_id'] === $encuestas[$i]['id']) {
        $encuestas[$i]['opciones'][] = $opcion;
      }
    }
  }
  return $encuestas;
}

// ── GET: listar encuestas o ver una ──────────────────────────────────────────
if ($metodo === 'GET') {
  $usuario = requiereSesion();

  // total_votos: cuántos votos tiene la encuesta
  // ya_voto: 1 si el usuario de la sesión ya votó en ella, 0 si no
  $sql = "SELECT e.*,
                 (SELECT COUNT(*) FROM votos v WHERE v.encuesta_id = e.id) AS total_votos,
                 (SELECT COUNT(*) FROM votos v WHERE v.encuesta_id = e.id AND v.usuario_id = ?) AS ya_voto
          FROM encuestas e";

  if ($id) {
    $consulta = $conexion->prepare($sql . " WHERE e.id = ?");
    $consulta->execute([$usuario['id'], $id]);
  } else {
    $consulta = $conexion->prepare($sql . " ORDER BY e.fecha_fin ASC");
    $consulta->execute([$usuario['id']]);
  }
  $encuestas = agregarOpciones($conexion, $consulta->fetchAll());

  if ($id) {
    if (count($encuestas) === 0) {
      responder(['error' => 'La encuesta no existe.'], 404);
    }
    responder($encuestas[0]);
  }
  responder($encuestas);
}

// ── POST: crear encuesta ─────────────────────────────────────────────────────
if ($metodo === 'POST') {
  requiereAdmin();

  $datos       = leerDatos();
  $titulo      = trim($datos['titulo'] ?? '');
  $descripcion = trim($datos['descripcion'] ?? '');
  $tipo        = $datos['tipo'] ?? '';
  $fechaFin    = $datos['fecha_fin'] ?? '';
  $opciones    = $datos['opciones'] ?? [];

  if ($titulo === '' || $descripcion === '' || $fechaFin === '') {
    responder(['error' => 'Completa el título, descripción y fecha de cierre.'], 400);
  }
  if ($tipo !== 'candidatos' && $tipo !== 'texto') {
    responder(['error' => 'El tipo de encuesta no es válido.'], 400);
  }
  if (!esFechaValida($fechaFin)) {
    responder(['error' => 'La fecha de cierre no es válida.'], 400);
  }
  if ($fechaFin <= date('Y-m-d')) {
    responder(['error' => 'La fecha de cierre debe ser posterior a hoy.'], 400);
  }
  if (!is_array($opciones) || count($opciones) < 2) {
    responder(['error' => 'La encuesta necesita al menos 2 opciones.'], 400);
  }

  // Revisar cada opción antes de guardar nada
  $yaUsadas = [];   // para detectar opciones repetidas
  foreach ($opciones as $opcion) {
    if ($tipo === 'candidatos') {
      $candidatoId = (int) ($opcion['candidato_id'] ?? 0);

      $consulta = $conexion->prepare("SELECT COUNT(*) FROM candidatos WHERE id = ?");
      $consulta->execute([$candidatoId]);
      if ($consulta->fetchColumn() == 0) {
        responder(['error' => 'Uno de los candidatos elegidos no existe.'], 400);
      }
      $valor = $candidatoId;
    } else {
      $valor = trim($opcion['texto_opcion'] ?? '');
      if ($valor === '') {
        responder(['error' => 'Las opciones de texto no pueden estar vacías.'], 400);
      }
    }

    if (in_array($valor, $yaUsadas)) {
      responder(['error' => 'La encuesta tiene opciones repetidas.'], 400);
    }
    $yaUsadas[] = $valor;
  }

  // Transacción: se guarda la encuesta con todas sus opciones, o no se guarda nada
  $conexion->beginTransaction();

  $sql = "INSERT INTO encuestas (titulo, descripcion, tipo, estado, fecha_inicio, fecha_fin)
          VALUES (?, ?, ?, 'activa', CURDATE(), ?)";
  $consulta = $conexion->prepare($sql);
  $consulta->execute([$titulo, $descripcion, $tipo, $fechaFin]);
  $encuestaId = $conexion->lastInsertId();

  $sql = "INSERT INTO opciones (encuesta_id, candidato_id, texto_opcion) VALUES (?, ?, ?)";
  $consulta = $conexion->prepare($sql);
  foreach ($opciones as $opcion) {
    if ($tipo === 'candidatos') {
      $consulta->execute([$encuestaId, (int) $opcion['candidato_id'], null]);
    } else {
      $consulta->execute([$encuestaId, null, trim($opcion['texto_opcion'])]);
    }
  }

  $conexion->commit();

  responder(['mensaje' => 'Encuesta creada correctamente.', 'id' => (int) $encuestaId], 201);
}

// ── PUT: cerrar encuesta ─────────────────────────────────────────────────────
if ($metodo === 'PUT') {
  requiereAdmin();

  $consulta = $conexion->prepare("UPDATE encuestas SET estado = 'cerrada' WHERE id = ?");
  $consulta->execute([$id]);

  // rowCount() dice cuántas filas se modificaron: 0 si la encuesta no existe o ya estaba cerrada
  if ($consulta->rowCount() === 0) {
    $consulta = $conexion->prepare("SELECT COUNT(*) FROM encuestas WHERE id = ?");
    $consulta->execute([$id]);
    if ($consulta->fetchColumn() == 0) {
      responder(['error' => 'La encuesta no existe.'], 404);
    }
  }

  responder(['mensaje' => 'Encuesta cerrada.']);
}

// ── DELETE: eliminar encuesta ────────────────────────────────────────────────
if ($metodo === 'DELETE') {
  requiereAdmin();

  // Las opciones y los votos se borran solos gracias a ON DELETE CASCADE en la base de datos
  $consulta = $conexion->prepare("DELETE FROM encuestas WHERE id = ?");
  $consulta->execute([$id]);

  if ($consulta->rowCount() === 0) {
    responder(['error' => 'La encuesta no existe.'], 404);
  }

  responder(['mensaje' => 'Encuesta eliminada.']);
}

responder(['error' => 'Método no permitido.'], 405);
