import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

async function harness(){
  const source=await readFile(new URL('../src/v83-attendance-course-report.js',import.meta.url),'utf8');
  const defs=[
    {key:'eco|||1|||A',course:'1.º A',orientation:'Economía'},
    {key:'eco|||1|||B',course:'1.º B',orientation:'Economía'}
  ];
  const students={
    'eco|||1|||A':[
      {dni:'11111111',lastName:'Pérez',firstName:'Ana'},
      {dni:'22222222',lastName:'Gómez',firstName:'Luis'}
    ],
    'eco|||1|||B':[
      {dni:'11111111',lastName:'Pérez',firstName:'Ana'}
    ]
  };
  const records=[
    {dni:'11111111',commissionKey:'eco|||1|||A',date:'2026-03-10',type:'TARDE',value:0.5,justified:false},
    {dni:'11111111',commissionKey:'eco|||1|||A',date:'2026-03-11',type:'AUSENTE',value:1,justified:true},
    {dni:'11111111',commissionKey:'eco|||1|||B',date:'2026-03-12',type:'AUSENTE',value:1,justified:false},
    {dni:'22222222',commissionKey:'eco|||1|||A',date:'2026-03-13',type:'AUSENTE_EF',value:0.5,justified:false},
    {dni:'22222222',commissionKey:'eco|||1|||A',date:'2026-08-13',type:'AUSENTE',value:1,justified:false}
  ];
  const periods=[
    {key:'B1',label:'1.º bimestre',start:'2026-03-02',end:'2026-05-07'},
    {key:'B3',label:'3.º bimestre',start:'2026-08-03',end:'2026-10-02'}
  ];
  const window={
    addEventListener(){},
    scrollTo(){},
    PCIAttendanceV78:{
      defs(){return defs},
      records(){return records},
      studentReport(dni,year){
        const unjustified=records.filter(r=>r.dni===dni&&String(r.date).startsWith(String(year)+'-')&&!r.justified).reduce((n,r)=>n+Number(r.value||0),0);
        return{regular:unjustified<=20,status:unjustified<=20?'Regular':'No Regular'};
      }
    },
    PCIStudentsCommissionsV72:{
      studentsFor(key){return students[key]||[]}
    },
    PCIRegularityV79:{
      periodsFor(){return periods},
      statusForPeriod(dni,key){
        if(dni==='22222222'&&key==='B1')return{regular:false,status:'No Regular'};
        return{regular:true,status:'Regular'};
      }
    }
  };
  const document={
    head:{appendChild(){}},
    addEventListener(){},
    getElementById(){return null},
    createElement(){return {appendChild(){},classList:{},style:{}}}
  };
  const context={
    console,window,document,MutationObserver:class{observe(){}},
    requestAnimationFrame(fn){fn()},
    setTimeout(){return 0},clearTimeout(){},Date,Math
  };
  vm.runInNewContext(source,context,{filename:'src/v83-attendance-course-report.js'});
  return window.PCIAttendanceCourseReportV83;
}

test('reporte por curso no mezcla registros de otra comisión',async()=>{
  const api=await harness();
  const report=api.courseReport('eco|||1|||A',2026,'B1');
  const ana=report.rows.find(r=>r.dni==='11111111');
  assert.equal(ana.tardies,1);
  assert.equal(ana.absences,1);
  assert.equal(ana.justified,1);
  assert.equal(ana.unjustified,0.5);
  assert.equal(ana.records,2);
});

test('reporte por curso respeta el período seleccionado',async()=>{
  const api=await harness();
  const b1=api.courseReport('eco|||1|||A',2026,'B1');
  const b3=api.courseReport('eco|||1|||A',2026,'B3');
  const luisB1=b1.rows.find(r=>r.dni==='22222222');
  const luisB3=b3.rows.find(r=>r.dni==='22222222');
  assert.equal(luisB1.unjustified,0.5);
  assert.equal(luisB3.unjustified,1);
  assert.equal(luisB1.status,'No Regular');
  assert.equal(luisB3.status,'Regular');
});

test('reporte anual conserva todos los estudiantes de la comisión',async()=>{
  const api=await harness();
  const report=api.courseReport('eco|||1|||A',2026,'ANNUAL');
  assert.equal(report.students,2);
  assert.equal(report.rows.length,2);
  assert.equal(report.rows.find(r=>r.dni==='11111111').records,2);
  assert.equal(report.rows.find(r=>r.dni==='22222222').records,2);
});

test('r39 agrega la tercera pestaña y se carga después de regularidad',async()=>{
  const [moduleSource,loader]=await Promise.all([
    readFile(new URL('../src/v83-attendance-course-report.js',import.meta.url),'utf8'),
    readFile(new URL('../app-safe.html',import.meta.url),'utf8')
  ]);
  assert.match(moduleSource,/Reporte por curso/);
  assert.match(moduleSource,/Ciclo lectivo completo/);
  assert.match(moduleSource,/No Regulares/);
  const regularity=loader.indexOf("'src/v79-regularidad.js'");
  const report=loader.indexOf("'src/v83-attendance-course-report.js'");
  assert.ok(regularity>=0);
  assert.ok(report>regularity);
});
