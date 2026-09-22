import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('r47 agrega la Tabla de control como módulo aislado',async()=>{
  const source=await readFile(new URL('../src/v84-content-control-table.js',import.meta.url),'utf8');
  assert.match(source,/Tabla de control de contenidos/);
  assert.match(source,/Desarrollo Curricular · control de contenidos/);
  assert.match(source,/Contenido priorizado/);
  assert.match(source,/Ubicado en/);
  assert.match(source,/C1–C10/);
  assert.match(source,/Descargar CSV/);
  assert.match(source,/Imprimir \/ PDF/);
  assert.match(source,/window\.PCIContentControlV84=/);
});

test('la Tabla de control es de solo lectura sobre Desarrollo Curricular',async()=>{
  const source=await readFile(new URL('../src/v84-content-control-table.js',import.meta.url),'utf8');
  assert.match(source,/Consulta de solo lectura/);
  assert.match(source,/phase\.groups\(\)/);
  assert.match(source,/phase\.findContent\?\.\(id\)/);
  assert.doesNotMatch(source,/localStorage\.setItem/);
  assert.doesNotMatch(source,/\bsave\s*\(/);
  assert.doesNotMatch(source,/\.contents\.push\s*\(/);
  assert.doesNotMatch(source,/\.contents\.splice\s*\(/);
});

test('r47 no modifica ni parchea el motor V47 de Desarrollo Curricular',async()=>{
  const [moduleSource,v47]=await Promise.all([
    readFile(new URL('../src/v84-content-control-table.js',import.meta.url),'utf8'),
    readFile(new URL('../src/v47-phase2-matrix.js',import.meta.url),'utf8')
  ]);
  assert.doesNotMatch(moduleSource,/PCIPhase2V28\s*=/);
  assert.doesNotMatch(v47,/PCIContentControlV84|v84ContentControl|data-v84-control/);
});

test('el loader productivo incorpora solamente el nuevo módulo de control',async()=>{
  const loader=await readFile(new URL('../app-safe.html',import.meta.url),'utf8');
  assert.match(loader,/src\/v84-content-control-table\.js/);
});

test('r47 publica una versión de caché propia y sincronizada',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.equal(loaderVersion,'20260922-content-control-r47');
  assert.equal(indexVersion,loaderVersion);
});
