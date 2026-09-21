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
  '_offline/cc-badge.svg',
  '_offline/brand-escuela-maestros.svg',
  '_offline/brand-ministerio.svg',
  '_offline/splash.html',
  '_offline/branding-runtime.js',
  'src/v82-attendance-reports.js'
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

const branding=fs.readFileSync(path.join(root,'_offline','branding-runtime.js'),'utf8');
if(!branding.includes('installHeaderLogo')||!branding.includes('pciOfflineInstitutionalFooter')){
  console.error('El branding offline no inserta encabezado y pie institucional.');
  process.exit(1);
}


const bundledCore=fs.readFileSync(path.join(root,'app-core.html'),'utf8');
if(!bundledCore.includes('<script src="_offline/branding-runtime.js"></script>')){
  console.error('El app-core offline no carga branding-runtime.js en el documento final.');
  process.exit(1);
}
