import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('v56 y v63 ya no construyen la interfaz visual de ofrecimiento',async()=>{
  for(const p of ['../src/v56-offer-model.js','../src/v63-offer-model.js']){
    const source=await readFile(new URL(p,import.meta.url),'utf8');
    const renderStart=source.indexOf('function render(){');
    const exportStart=source.indexOf('window.PCIOfferModelV56=',renderStart);
    assert.ok(renderStart>=0&&exportStart>renderStart);
    const renderBody=source.slice(renderStart,exportStart);
    assert.match(renderBody,/v56OfferModel/);
    assert.match(renderBody,/section\.remove\(\)/);
    assert.doesNotMatch(renderBody,/createElement\('section'\)/);
    assert.doesNotMatch(renderBody,/innerHTML=.*Carga y ofrecimiento docente/s);
  }
});

test('los módulos legacy ya no observan el DOM para reconstruir ofrecimiento',async()=>{
  for(const p of ['../src/v56-offer-model.js','../src/v63-offer-model.js']){
    const source=await readFile(new URL(p,import.meta.url),'utf8');
    assert.doesNotMatch(source,/new MutationObserver/);
  }
});

test('v65 elimina cualquier resto visual y registra su API al cargar',async()=>{
  const source=await readFile(new URL('../src/v65-annual-offer.js',import.meta.url),'utf8');
  assert.match(source,/\$id\('v56OfferModel'\)\?\.remove\(\)/);
  assert.match(source,/\$id\('v65AnnualOffer'\)\?\.remove\(\)/);
  assert.match(source,/window\.PCIOfferModelV56=.*__derivedFromManagement:true/);
  assert.match(source,/function start\(\)\{render\(\)\}\s*render\(\);/);
});

test('el runtime v63 ya no genera mensajes visuales del antiguo 50 por ciento',async()=>{
  const source=await readFile(new URL('../src/v63-offer-runtime-fix.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/La oferta obligatoria supera el máximo permitido/);
  assert.doesNotMatch(source,/50 % de la carga total/);
  assert.match(source,/v58-offer-conflict/);
  assert.match(source,/box=>box\.remove\(\)/);
});

test('r44 mantiene sincronizada la versión de caché',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.equal(loaderVersion,'20260921-ofrecimiento-legacy-off-r44');
  assert.equal(indexVersion,loaderVersion);
});
