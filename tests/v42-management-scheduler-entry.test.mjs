import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const files=[
  '../src/v73-management-home.js',
  '../src/v71-management-nav-reset.js',
  '../src/v71-lean-management.js'
];

test('Gestión no referencia el scheduler V68 obsoleto',async()=>{
  for(const p of files){
    const source=await readFile(new URL(p,import.meta.url),'utf8');
    assert.doesNotMatch(source,/PCIAnnualSchedulerV68/);
  }
});

test('Gestión abre y renderiza el scheduler vigente V65 + V81',async()=>{
  const home=await readFile(new URL('../src/v73-management-home.js',import.meta.url),'utf8');
  const lean=await readFile(new URL('../src/v71-lean-management.js',import.meta.url),'utf8');
  assert.match(home,/PCIAnnualSchedulerV65\?\.render/);
  assert.match(home,/PCIScheduleStableV81\?\.decorate/);
  assert.match(home,/v65AnnualScheduler/);
  assert.match(lean,/PCIAnnualSchedulerV65\?\.render/);
  assert.match(lean,/PCIScheduleStableV81\?\.decorate/);
});

test('la navegación interna de Gestión busca el contenedor actual de Horarios',async()=>{
  const nav=await readFile(new URL('../src/v71-management-nav-reset.js',import.meta.url),'utf8');
  assert.match(nav,/\$\('v65AnnualScheduler'\)/);
  assert.doesNotMatch(nav,/v68AnnualScheduler/);
});

test('r42 renueva la versión de caché',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.equal(loaderVersion,'20260921-restore-horarios-r42');
  assert.equal(indexVersion,loaderVersion);
});
