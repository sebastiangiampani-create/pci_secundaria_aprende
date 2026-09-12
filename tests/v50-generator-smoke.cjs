const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

global.window=global;
global.document={
  createElement(){return {textContent:'',className:'',id:'',innerHTML:'',appendChild(){},querySelector(){return null},querySelectorAll(){return []}}},
  head:{appendChild(){}},
  getElementById(){return null},
  addEventListener(){}
};
global.MutationObserver=class{observe(){}};
global.save=()=>{};
global.toast=()=>{};
global.state={
  institutional:{
    teachers:{
      t1:{id:'t1',name:'Docente Uno',baseHours:10,extraPct:50},
      t2:{id:'t2',name:'Docente Dos',baseHours:10,extraPct:50}
    },
    assignments:{i1:'t1',i2:'t1',i3:'t2'},
    scheduleVersions:{S1:[],S2:[]},
    activeSchedule:{}
  },
  selected:['Orientacion']
};

global.PCIInstitutionalV48={
  allImplementationRows(){return [
    {instanceId:'i1',orientation:'Orientacion',course:'3.º A',year:3,locations:['C5'],hours:2,subjectId:'s1',name:'Materia 1'},
    {instanceId:'i2',orientation:'Orientacion',course:'3.º B',year:3,locations:['C5'],hours:2,subjectId:'s2',name:'Materia 2'},
    {instanceId:'i3',orientation:'Orientacion',course:'3.º A',year:3,locations:['C5'],hours:2,subjectId:'s3',name:'Materia 3'}
  ]}
};
const blocked=new Set(['t1|mon:1','t1|mon:2']);
global.PCIAvailabilityV49={
  DAYS:[['mon','Lunes'],['tue','Martes'],['wed','Miércoles'],['thu','Jueves'],['fri','Viernes']],
  periods:()=>4,
  available:(tid,day,p)=>!blocked.has(`${tid}|${day}:${p}`)
};

const source=fs.readFileSync('src/v50-schedule-generator.js','utf8');
vm.runInThisContext(source,{filename:'v50-schedule-generator.js'});

const pre=global.PCISchedulerV50.preflight();
assert.equal(pre.ok,true,'La configuración de prueba debe ser viable');
global.PCISchedulerV50.generate();
const versions=state.institutional.scheduleVersions.S1;
assert.equal(versions.length,1,'Debe generar una versión de horario');
const schedule=versions[0];
assert.equal(schedule.entries.length,6,'Debe ubicar los seis módulos requeridos');

const courseSlots=new Set();
const teacherSlots=new Set();
for(const e of schedule.entries){
  const c=`${e.courseKey}|${e.slot}`;
  const t=`${e.teacherId}|${e.slot}`;
  assert(!courseSlots.has(c),`Curso duplicado en ${c}`);
  assert(!teacherSlots.has(t),`Docente duplicado en ${t}`);
  assert(global.PCIAvailabilityV49.available(e.teacherId,e.day,e.period),`Se usó un módulo no disponible: ${t}`);
  courseSlots.add(c);teacherSlots.add(t);
}

const originalAvailable=global.PCIAvailabilityV49.available;
global.PCIAvailabilityV49.available=(tid,day,p)=>tid==='t1' ? (day==='fri'&&p===4) : originalAvailable(tid,day,p);
const impossible=global.PCISchedulerV50.preflight();
assert.equal(impossible.ok,false,'Debe detectar disponibilidad insuficiente');
assert(impossible.issues.some(x=>x.includes('declaró solo')),'Debe explicar la falta de disponibilidad');

console.log('V50 generator smoke test OK');
