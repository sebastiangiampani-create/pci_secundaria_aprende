const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, 'app-bundle');
if (!fs.existsSync(root)) {
  console.error('Falta app-bundle. Ejecutar primero la preparación del bundle.');
  process.exit(1);
}

const required = [
  'index.html',
  'app-safe.html',
  'app.html',
  'app-core.html',
  'src/v81-stable-scheduler.js',
  'src/v80-access-control.js',
  'src/v78-asistencia.js',
  'src/v76-calificaciones.js',
  '_offline/vendor/xlsx.full.min.js',
  '_offline/vendor/exceljs.min.js',
  '_offline/google-fonts.css',
  '_offline/cc-badge.svg'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error('Falta archivo requerido:', file);
    process.exit(1);
  }
}

const safe = fs.readFileSync(path.join(root, 'app-safe.html'), 'utf8');
if (!safe.includes('20260920-horarios-estables-r37')) {
  console.error('El bundle no corresponde a r37 estable.');
  process.exit(1);
}

console.log('Bundle offline r37 verificado.');
