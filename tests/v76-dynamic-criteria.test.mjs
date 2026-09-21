import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

async function harness(){
  const source=await readFile(new URL('../src/v76-calificaciones.js',import.meta.url),'utf8');
  const state={institutional:{grading:{plans:{}}},selected:[],active:null};
  const document={
    head:{appendChild(){}},
    addEventListener(){},
    getElementById(){return null},
    querySelector(){return null},
    querySelectorAll(){return[]},
    createElement(){return {textContent:'',dataset:{},classList:{add(){},remove(){}}}}
  };
  const window={addEventListener(){},scrollTo(){}};
  const context={
    console,document,window,state,Date,Math,
    save(){},toast(){},
    setTimeout(){return 0},clearTimeout(){},
    fetch(){throw new Error('no fetch')}
  };
  vm.runInNewContext(source,context,{filename:'src/v76-calificaciones.js'});
  return window.PCIGradingV76;
}

test('migra el antiguo quinto criterio vacío al mínimo real de cuatro',async()=>{
  const api=await harness();
  const e={criteria:['A','B','C','D',''],rows:{'1':{criteria:['1','2','3','4','']}}};
  api.normalizeCriteriaModel(e);
  assert.equal(e.criteria.length,4);
  assert.equal(e.rows['1'].criteria.length,4);
  assert.equal(e.criteriaDynamicVersion,2);
});

test('conserva un quinto criterio antiguo cuando ya tenía contenido',async()=>{
  const api=await harness();
  const e={criteria:['A','B','C','D','E'],rows:{'1':{criteria:['1','2','3','4','5']}}};
  api.normalizeCriteriaModel(e);
  assert.equal(e.criteria.length,5);
  assert.equal(e.criteria[4],'E');
  assert.equal(e.rows['1'].criteria[4],'5');
});

test('permite agregar más de cinco criterios sin límite fijo',async()=>{
  const api=await harness();
  const e={criteria:['A','B','C','D'],criteriaDynamicVersion:2,rows:{'1':{criteria:['1','2','3','4']}}};
  api.addCriterion(e);
  api.addCriterion(e);
  api.addCriterion(e);
  assert.equal(e.criteria.length,7);
  assert.equal(e.rows['1'].criteria.length,7);
});

test('no permite eliminar los cuatro criterios mínimos',async()=>{
  const api=await harness();
  const e={criteria:['A','B','C','D','E'],criteriaDynamicVersion:2,rows:{'1':{criteria:['1','2','3','4','5']}}};
  assert.equal(api.removeCriterion(e,3),false);
  assert.equal(e.criteria.length,5);
  assert.equal(api.removeCriterion(e,4),true);
  assert.equal(e.criteria.length,4);
  assert.equal(e.rows['1'].criteria.length,4);
});

test('la interfaz usa botón Agregar criterio y no un quinto criterio fijo',async()=>{
  const source=await readFile(new URL('../src/v76-calificaciones.js',import.meta.url),'utf8');
  assert.match(source,/\+ Agregar criterio/);
  assert.match(source,/Mínimo obligatorio: 4 criterios/);
  assert.match(source,/data-v76-remove-criterion/);
  assert.doesNotMatch(source,/un 5\.º opcional/);
  assert.doesNotMatch(source,/slice\(0,5\)/);
  assert.doesNotMatch(source,/length<5/);
});

test('index y loader mantienen sincronizada la versión de caché de la aplicación',async()=>{
  const [loader,index]=await Promise.all([
    readFile(new URL('../app-safe.html',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  const loaderVersion=loader.match(/app\.html\?v=([^'"]+)/)?.[1]||'';
  const indexVersion=index.match(/app-safe\.html\?v=([^'"]+)/)?.[1]||'';
  assert.ok(loaderVersion,'app-safe debe declarar una versión de caché');
  assert.equal(indexVersion,loaderVersion);
});
