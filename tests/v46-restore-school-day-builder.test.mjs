import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('Jornada escolar sigue existiendo como módulo V51 independiente',async()=>{
  const source=await readFile(new URL('../src/v51-school-timetable-config.js',import.meta.url),'utf8');
  assert.match(source,/id='v51ScheduleConfig'/);
  assert.match(source,/Jornada escolar/);
  assert.match(source,/Configuración horaria de la escuela/);
  assert.match(source,/Generar grilla/);
  assert.match(source,/Agregar hora manual/);
  assert.match(source,/PCIScheduleConfigV51=\{[^}]*ensureSection/);
});

test('Gestión → Horarios incluye Jornada escolar junto al constructor anual',async()=>{
  const source=await readFile(new URL('../src/v73-management-home.js',import.meta.url),'utf8');
  assert.match(source,/find:\(\)=>\[\$\('v51ScheduleConfig'\),\$\('v65AnnualScheduler'\)\]/);
  assert.match(source,/PCIScheduleConfigV51\?\.ensureSection\?\.\(\)/);
  assert.match(source,/PCIAnnualSchedulerV65\?\.render\?\.\(\)/);
  assert.match(source,/PCIScheduleStableV81\?\.decorate\?\.\(\)/);
  assert.match(source,/PCIScheduleViews\?\.render\?\.\(\)/);
});

test('r46 mantiene Ofrecimiento fuera de Horarios',async()=>{
  const source=await readFile(new URL('../src/v73-management-home.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/Carga y ofrecimiento docente|Oferta mínima y porcentaje variable|Usar mínimo/);
});

test('r46 publica una versión de caché propia y sincronizada',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.ok(loaderVersion,'app-safe debe declarar una versión de caché');
  assert.equal(indexVersion,loaderVersion);
});
