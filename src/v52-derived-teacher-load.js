(() => {
  const $id=id=>document.getElementById(id);
  const api=()=>window.PCIInstitutionalV48||null;
  let observer=null,refreshTimer=null,decorating=false;

  const inst=()=>{
    state.institutional=state.institutional||{};
    state.institutional.teachers=state.institutional.teachers||{};
    state.institutional.assignments=state.institutional.assignments||{};
    return state.institutional;
  };

  function teacherLoads(){
    const result={};
    for(const id of Object.keys(inst().teachers))result[id]={known:0,pending:0};
    for(const row of api()?.allImplementationRows?.()||[]){
      const tid=inst().assignments[row.instanceId];
      if(!tid)continue;
      result[tid]=result[tid]||{known:0,pending:0};
      if(row.hours==null||Number(row.hours)<=0)result[tid].pending++;
      else result[tid].known+=Number(row.hours);
    }
    return result;
  }

  function syncDerivedBaseHours(){
    const loads=teacherLoads();let changed=false;
    for(const teacher of Object.values(inst().teachers)){
      const derived=Number(loads[teacher.id]?.known||0);
      if(Number(teacher.baseHours)!==derived){teacher.baseHours=derived;changed=true}
      if(teacher.baseHoursSource!=='assignments'){teacher.baseHoursSource='assignments';changed=true}
      if(!Number.isFinite(Number(teacher.extraPct))){teacher.extraPct=50;changed=true}
    }
    return changed;
  }

  function addTeacher(name,extraPct){
    const clean=String(name||'').trim(),pct=Number(extraPct);
    if(!clean)return toast('Escribí el nombre del docente.',true);
    if(!Number.isFinite(pct)||pct<0)return toast('Indicá un porcentaje adicional válido.',true);
    const id=`doc-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    inst().teachers[id]={id,name:clean,extraPct:pct,baseHours:0,baseHoursSource:'assignments'};
    save();api()?.renderInstitutional?.();
  }

  function editTeacher(id){
    const teacher=inst().teachers[id];if(!teacher)return;
    const name=prompt('Nombre y apellido:',teacher.name);if(name===null)return;
    const pct=prompt('Porcentaje adicional máximo:',teacher.extraPct??50);if(pct===null)return;
    const p=Number(pct);if(!String(name).trim()||!Number.isFinite(p)||p<0)return toast('Datos docentes inválidos.',true);
    teacher.name=String(name).trim();teacher.extraPct=p;syncDerivedBaseHours();save();api()?.renderInstitutional?.();
  }

  function decorate(){
    if(decorating)return;decorating=true;
    try{
      const host=$id('v48InstitutionalContent');
      if(!host||!$id('institutional')?.classList.contains('active'))return;
      if(syncDerivedBaseHours())save();
      const form=host.querySelector('.v48-teacher-form');if(!form)return;
      const section=form.closest('.v48-section');
      const title=section?.querySelector('h2');if(title)title.textContent='Plantel y carga asignada';
      const intro=section?.querySelector('h2 + p');
      if(intro)intro.textContent='Las horas base no se cargan manualmente: se calculan a medida que asignás materias y cursos. El porcentaje adicional sirve para calcular el máximo de ofrecimiento posterior.';
      if(form.dataset.v52!=='derived-load'){
        form.dataset.v52='derived-load';
        form.innerHTML='<label>Nombre y apellido<input id="v48TeacherName" autocomplete="off"></label><label>Adicional máximo %<input id="v48TeacherExtra" type="number" min="0" step="5" value="50"></label><button id="v48AddTeacher" class="btn primary">Agregar docente</button>';
      }
      const loads=teacherLoads();
      host.querySelectorAll('.v48-teacher-card').forEach(card=>{
        const edit=card.querySelector('[data-v48-edit-teacher]'),teacher=edit?inst().teachers[edit.dataset.v48EditTeacher]:null;if(!teacher)return;
        const load=loads[teacher.id]||{known:0,pending:0},base=Number(load.known||0),pct=Number(teacher.extraPct??50),max=base*(1+pct/100);
        const firstSmall=card.querySelector('.v48-teacher-head small');
        if(firstSmall)firstSmall.textContent=base>0?`Carga base asignada: ${base} h · máximo ofrecible posterior: ${max.toFixed(1).replace('.0','')} h (+${pct}%)`:`Sin carga asignada todavía · adicional máximo configurado: +${pct}%`;
        const bar=card.querySelector('.v48-load');if(bar)bar.style.display='none';
        const summary=[...card.querySelectorAll(':scope > small')].at(-1);
        if(summary)summary.innerHTML=`<strong>${base} h asignadas</strong>${load.pending?` · ${load.pending} carga${load.pending===1?'':'s'} pendiente${load.pending===1?'':'s'}`:''}`;
      });
    }finally{decorating=false}
  }

  function scheduleDecorate(){clearTimeout(refreshTimer);refreshTimer=setTimeout(decorate,20)}
  function start(){
    scheduleDecorate();
    const host=$id('v48InstitutionalContent');
    if(host&&!observer){observer=new MutationObserver(scheduleDecorate);observer.observe(host,{childList:true,subtree:false})}
  }

  document.addEventListener('click',e=>{
    const add=e.target.closest('#v48AddTeacher');
    if(add){e.preventDefault();e.stopImmediatePropagation();addTeacher($id('v48TeacherName')?.value,$id('v48TeacherExtra')?.value);return}
    const edit=e.target.closest('[data-v48-edit-teacher]');
    if(edit){e.preventDefault();e.stopImmediatePropagation();editTeacher(edit.dataset.v48EditTeacher)}
  },true);

  document.addEventListener('change',e=>{
    const sel=e.target.closest('[data-v48-assignment]');if(!sel)return;
    e.stopImmediatePropagation();
    const id=sel.dataset.v48Assignment,next=sel.value;
    if(next)inst().assignments[id]=next;else delete inst().assignments[id];
    syncDerivedBaseHours();save();api()?.renderInstitutional?.();
  },true);

  window.addEventListener('pci-app-ready',()=>setTimeout(start,120));
  document.addEventListener('click',e=>{if(e.target.closest('#openInstitutional'))setTimeout(start,100)},true);
  window.PCIDerivedTeacherLoadV52={teacherLoads,syncDerivedBaseHours,decorate};
})();
