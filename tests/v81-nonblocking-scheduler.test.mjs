import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source=await readFile(new URL('../src/v81-stable-scheduler.js',import.meta.url),'utf8');

test('el solver V81 conserva la versión síncrona para pruebas y agrega ejecución cooperativa',()=>{
  assert.match(source,/function solve\(report,maxAttempts=1400\)/);
  assert.match(source,/async function solveAsync\(report,maxAttempts=1400/);
  assert.match(source,/await yieldToUi\(\)/);
  assert.match(source,/const chunkSize=\d+/);
});

test('generar horario usa solveAsync y no solve bloqueante',()=>{
  const start=source.indexOf('async function generate(){');
  const end=source.indexOf('\n  function isStale',start);
  assert.ok(start>=0&&end>start);
  const body=source.slice(start,end);
  assert.match(body,/await solveAsync\(report,1400/);
  assert.doesNotMatch(body,/const solved=solve\(report\)/);
});

test('los botones solo cambian texto cuando realmente cambia',()=>{
  assert.match(source,/function setText\(el,value\)\{if\(el&&el\.textContent!==value\)el\.textContent=value\}/);
  assert.match(source,/setText\(gen,/);
  assert.match(source,/setText\(check,/);
  assert.match(source,/setText\(accept,/);
});

test('preflight V81 delega la derivación de equipos al preflight base una sola vez',()=>{
  const start=source.indexOf('function preflight(){');
  const end=source.indexOf('\n  function teamChoices',start);
  assert.ok(start>=0&&end>start);
  const body=source.slice(start,end);
  assert.doesNotMatch(body,/teamsApi\(\)\?\.deriveTeams/);
  assert.match(body,/base\(\)\?\.preflight/);
});

test('status calcula stale una sola vez por actualización',()=>{
  const start=source.indexOf('function status(){');
  const end=source.indexOf('\n  function reportHtml',start);
  const body=source.slice(start,end);
  assert.match(body,/const stale=isStale\(a\)/);
  assert.equal((body.match(/isStale\(a\)/g)||[]).length,1);
});

test('la continuidad anual estricta sigue siendo requisito del generador',()=>{
  assert.match(source,/continuity:'teacher-slots-identical'/);
  assert.match(source,/const c=continuity\(ctx\.entries\)/);
  assert.match(source,/ok:c\.ok/);
});
