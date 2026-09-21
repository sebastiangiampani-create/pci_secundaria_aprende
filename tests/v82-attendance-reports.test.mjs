import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('la mejora de asistencia agrega selector con cantidad por comisión',async()=>{
  const source=await readFile(new URL('../src/v82-attendance-reports.js',import.meta.url),'utf8');
  assert.match(source,/sin estudiantes/);
  assert.match(source,/estudiante.*cargado/s);
  assert.match(source,/No hay estudiantes cargados en esta copia de la aplicación/);
});

test('la mejora de asistencia agrega reporte individual con historial',async()=>{
  const source=await readFile(new URL('../src/v82-attendance-reports.js',import.meta.url),'utf8');
  assert.match(source,/Reporte por estudiante/);
  assert.match(source,/Registros de asistencia/);
  assert.match(source,/Injustificadas/);
  assert.match(source,/Justificadas/);
  assert.match(source,/REGULAR/);
  assert.match(source,/NO REGULAR/);
});

test('app-safe carga la mejora después del módulo base de asistencia',async()=>{
  const source=await readFile(new URL('../app-safe.html',import.meta.url),'utf8');
  const base=source.indexOf("'src/v78-asistencia.js'");
  const report=source.indexOf("'src/v82-attendance-reports.js'");
  assert.ok(base>=0);
  assert.ok(report>base);
});
