import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('la interfaz de ofrecimiento docente anual ya no se renderiza',async()=>{
  const source=await readFile(new URL('../src/v65-annual-offer.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/Carga y ofrecimiento docente · anual/);
  assert.doesNotMatch(source,/data-v65-pct/);
  assert.doesNotMatch(source,/Usar mínimo/);
  assert.match(source,/if\(section\)section\.remove\(\)/);
});

test('el API interno para Horarios se conserva',async()=>{
  const source=await readFile(new URL('../src/v65-annual-offer.js',import.meta.url),'utf8');
  assert.match(source,/function syntheticOutsideRows\(\)/);
  assert.match(source,/window\.PCIAnnualOfferV65=\{offer,front,semesterLoads,teamHours,syntheticOutsideRows,render\}/);
  assert.match(source,/planningResidualRows/);
  assert.match(source,/outsideWork/);
});

test('el validador de Horarios ya no exige porcentaje ni regla del 50 por ciento',async()=>{
  const source=await readFile(new URL('../src/v65-annual-scheduler.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/falta elegir el porcentaje anual/);
  assert.doesNotMatch(source,/Usar mínimo/);
  assert.doesNotMatch(source,/superan el 50 % permitido/);
  assert.doesNotMatch(source,/data-v65-pct/);
});

test('r43 mantiene sincronizada la versión de caché',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.equal(loaderVersion,'20260921-carga-docente-unificada-r43');
  assert.equal(indexVersion,loaderVersion);
});
