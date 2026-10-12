// tailwind-config.js — Configuración compartida de Tailwind (Play CDN)
// Mapea los colores, tipografías, radios y espaciados del diseño de VotaYa
// al theme de Tailwind. Se carga en cada página justo después del script
// del CDN (https://cdn.tailwindcss.com), antes de cerrar el <head>.

tailwind.config = {
  theme: {
    extend: {
      colors: {
        acento:         '#0369a1',
        'acento-hover': '#0284c7',
        'acento-claro': '#e0f2fe',
        'acento-borde': '#7dd3fc',
        fondo:          '#f8fafc',
        'fondo-2':      '#f0f9ff',
        texto:          '#0c4a6e',
        'texto-suave':  '#475569',
        'texto-muted':  '#94a3b8',
        borde:          '#bae6fd',
        'borde-suave':  '#e0f2fe',
        'error-fondo':  '#fef2f2',
        'error-borde':  '#fecaca',
        'error-texto':  '#dc2626',
        'exito-fondo':  '#f0fdf4',
        'exito-borde':  '#86efac',
        'exito-texto':  '#16a34a',
        'alerta-fondo': '#fffbeb',
        'alerta-borde': '#fde68a',
        'alerta-texto': '#d97706',
      },
      fontFamily: {
        titulo: ['Syne', 'sans-serif'],
        cuerpo: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
      spacing: {
        'topbar-h':  '56px',
        'sidebar-w': '240px',
      },
    },
  },
};
