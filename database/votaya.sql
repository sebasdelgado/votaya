-- votaya.sql — Script de la base de datos de VotaYa
-- Cómo usarlo: abrir phpMyAdmin (http://localhost/phpmyadmin) → pestaña "Importar"
-- → seleccionar este archivo → "Continuar".
-- OJO: borra la base de datos si ya existe y la vuelve a crear desde cero.

DROP DATABASE IF EXISTS votaya;
CREATE DATABASE votaya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE votaya;

-- ── Tablas ───────────────────────────────────────────────────────────────────

CREATE TABLE grupos (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  grado  VARCHAR(30) NOT NULL
);

-- Votantes y administradores viven en la misma tabla; los distingue el campo `rol`
CREATE TABLE usuarios (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  numero_documento VARCHAR(15)  NOT NULL UNIQUE,
  nombre           VARCHAR(60)  NOT NULL,
  apellido         VARCHAR(60)  NOT NULL,
  fecha_nacimiento DATE         NULL,
  genero           ENUM('masculino', 'femenino', 'otro') NULL,
  jornada          ENUM('mañana', 'tarde') NULL,
  grupo_id         INT          NULL,
  rol              ENUM('votante', 'admin') NOT NULL DEFAULT 'votante',
  correo           VARCHAR(100) NULL UNIQUE,  -- solo lo usa el admin para iniciar sesión
  contrasena       VARCHAR(255) NULL,         -- NULL para votantes, hash para el admin
  FOREIGN KEY (grupo_id) REFERENCES grupos(id)
);

CREATE TABLE candidatos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(60)  NOT NULL,
  apellido     VARCHAR(60)  NOT NULL,
  foto         VARCHAR(500) NULL,  -- Nombre del archivo en img/candidatos/ (opcional)
  propuesta    TEXT         NOT NULL,
  numero_lista VARCHAR(10)  NOT NULL
);

-- Las fechas son DATE (sin hora) porque el frontend solo maneja días
CREATE TABLE encuestas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(150) NOT NULL,
  descripcion  TEXT         NOT NULL,
  tipo         ENUM('candidatos', 'texto') NOT NULL,
  estado       ENUM('activa', 'cerrada')   NOT NULL DEFAULT 'activa',
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL
);

-- Si la encuesta es de candidatos se llena candidato_id; si es de texto, texto_opcion
CREATE TABLE opciones (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  encuesta_id  INT          NOT NULL,
  candidato_id INT          NULL,
  texto_opcion VARCHAR(150) NULL,
  FOREIGN KEY (encuesta_id)  REFERENCES encuestas(id) ON DELETE CASCADE,
  FOREIGN KEY (candidato_id) REFERENCES candidatos(id)
);

CREATE TABLE votos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT      NOT NULL,
  encuesta_id INT      NOT NULL,
  opcion_id   INT      NOT NULL,
  fecha_voto  DATETIME NOT NULL,
  -- Un usuario solo puede votar una vez por encuesta
  UNIQUE (usuario_id, encuesta_id),
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
  FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE,
  FOREIGN KEY (opcion_id)   REFERENCES opciones(id)  ON DELETE CASCADE
);

-- ── Datos de prueba ──────────────────────────────────────────────────────────

INSERT INTO grupos (id, nombre, grado) VALUES
  (1, 'Décimo A',  'Décimo'),
  (2, 'Décimo B',  'Décimo'),
  (3, 'Once A',    'Once'),
  (4, 'Once B',    'Once'),
  (5, 'Noveno A',  'Noveno'),
  (6, 'Noveno B',  'Noveno'),
  (7, 'Octavo A',  'Octavo'),
  (8, 'Séptimo A', 'Séptimo'),
  (9, 'Sexto A',   'Sexto');

INSERT INTO usuarios (id, numero_documento, nombre, apellido, fecha_nacimiento, genero, jornada, grupo_id, rol) VALUES
  (1, '1005234567', 'María',  'García',   '2008-03-15', 'femenino',  'mañana', 1, 'votante'),
  (2, '1005234568', 'Juan',   'Pérez',    '2007-11-22', 'masculino', 'tarde',  2, 'votante'),
  (3, '1005234569', 'Ana',    'López',    '2008-06-10', 'femenino',  'mañana', 1, 'votante'),
  (4, '1005234570', 'Carlos', 'Ruiz',     '2007-09-05', 'masculino', 'mañana', 3, 'votante'),
  (5, '1005234571', 'Laura',  'Martínez', '2009-01-30', 'femenino',  'tarde',  4, 'votante');

-- Admin: admin@colegio.edu.co / admin123
-- El hash se generó con: php -r "echo password_hash('admin123', PASSWORD_DEFAULT);"
INSERT INTO usuarios (numero_documento, nombre, apellido, rol, correo, contrasena) VALUES
  ('0000000000', 'Admin', 'Sistema', 'admin', 'admin@colegio.edu.co',
   '$2y$10$HbZ0IIk/xNN/zMIgISiM0ea4K3difuquhgz3UK3mXzNlkpBcWJ2OW');

INSERT INTO candidatos (id, nombre, apellido, numero_lista, propuesta, foto) VALUES
  (1, 'Juan',   'Pérez', '1', 'Mejorar los espacios deportivos y promover torneos inter-clases cada mes.', NULL),
  (2, 'Ana',    'López', '2', 'Crear una biblioteca digital con recursos para todas las materias.', NULL),
  (3, 'Carlos', 'Ruiz',  '3', 'Implementar jornadas de reciclaje y huerta escolar para toda la comunidad.', NULL);

INSERT INTO encuestas (id, titulo, descripcion, tipo, estado, fecha_inicio, fecha_fin) VALUES
  (1, 'Elección de personero estudiantil 2026', 'Elige al representante estudiantil para el año lectivo 2026.',
      'candidatos', 'activa', '2026-09-01', '2026-12-15'),
  (2, '¿Qué actividad prefieres para el día del estudiante?', 'Cuéntanos qué actividad te gustaría que organizara el colegio.',
      'texto', 'activa', '2026-09-01', '2026-12-01'),
  (3, 'Representante de grado décimo', 'Votación para elegir el representante del grado décimo.',
      'candidatos', 'cerrada', '2025-04-01', '2025-04-20');

INSERT INTO opciones (id, encuesta_id, candidato_id, texto_opcion) VALUES
  (1, 1, 1, NULL),
  (2, 1, 2, NULL),
  (3, 1, 3, NULL),
  (4, 2, NULL, 'Paseo ecológico'),
  (5, 2, NULL, 'Torneo deportivo'),
  (6, 2, NULL, 'Fiesta en el colegio'),
  (7, 2, NULL, 'Día de juegos'),
  (8, 3, 1, NULL),
  (9, 3, 2, NULL);

INSERT INTO votos (usuario_id, encuesta_id, opcion_id, fecha_voto) VALUES
  (1, 3, 8, '2025-04-10 09:15:00'),
  (2, 3, 9, '2025-04-10 10:02:00'),
  (3, 3, 8, '2025-04-11 08:45:00'),
  (4, 3, 8, '2025-04-11 11:30:00'),
  (5, 3, 9, '2025-04-12 14:00:00');
