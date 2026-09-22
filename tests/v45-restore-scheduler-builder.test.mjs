import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('V65 monta el constructor sin depender de la UI de ofrecimiento',async()=>{
  const source=await readFile(new URL('../src/v65-annual-scheduler.js',import.meta.url),'utf8');
  const renderStart=source.indexOf('function render(){');
  const scheduleStart=source.indexOf('function schedule()',renderStart);
  assert.ok(renderStart>=0&&scheduleStart>renderStart,'debe existir el render del constructor V65');
  const renderBody=source.slice(renderStart,scheduleStart);
  assert.match(renderBody,/v48InstitutionalContent/);
  assert.match(renderBody,/v65AnnualScheduler/);
  assert.match(renderBody,/document\.createElement\('section'\)/);
  assert.doesNotMatch(renderBody,/v56OfferModel|v65AnnualOffer/);
});

test('Gestión vuelve a montar V65 V81 y Vistas después de activar Horarios',async()=>{
  const source=await readFile(new URL('../src/v73-management-home.js',import.meta.url),'utf8');
  const openStart=source.indexOf('function openModule(key)');
  const applyStart=source.indexOf('function applyView()',openStart);
  assert.ok(openStart>=0&&applyStart>openStart);
  const body=source.slice(openStart,applyStart);
  assert.match(body,/applyView\(\);\s*if\(key==='horarios'\)\{/);
  assert.match(body,/PCIAnnualSchedulerV65\?\.render\?\.\(\)/);
  assert.match(body,/PCIScheduleStableV81\?\.decorate\?\.\(\)/);
  assert.match(body,/PCIScheduleViews\?\.render\?\.\(\)/);
  assert.match(body,/PCIScheduleViews\?\.render\?\.\(\);\s*applyView\(\);/);
});

test('Vistas del horario se anclan primero al constructor V65 y respetan su visibilidad',async()=>{
  const source=await readFile(new URL('../src/schedule-views.js',import.meta.url),'utf8');
  assert.match(source,/document\.body\.classList\.contains\('v73-management-home-active'\)/);
  assert.match(source,/const sched=\$\('v65AnnualScheduler'\)\|\|\$\('v68AnnualScheduler'\)\|\|\$\('v53Scheduler'\)/);
  assert.match(source,/sched\.classList\.contains\('v73-hidden'\)/);
  assert.match(source,/sched\.after\(box\)/);
  assert.match(source,/Generá primero el horario anual\./);
});

test('r45 no reintroduce la interfaz visual de ofrecimiento docente',async()=>{
  const files=[
    '../src/v73-management-home.js',
    '../src/schedule-views.js',
    '../src/v65-annual-scheduler.js'
  ];
  for(const p of files){
    const source=await readFile(new URL(p,import.meta.url),'utf8');
    assert.doesNotMatch(source,/Carga y ofrecimiento docente|Oferta mínima y porcentaje variable|Usar mínimo/);
  }
});


test('r45 publica una versión de caché propia y sincronizada',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.equal(loaderVersion,'20260921-restore-scheduler-builder-r45');
  assert.equal(indexVersion,loaderVersion);
});
