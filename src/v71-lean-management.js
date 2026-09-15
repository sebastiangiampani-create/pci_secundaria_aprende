(() => {
  const $=id=>document.getElementById(id);
  let rendering=false,entryObserver=null,selectedCourseKey='';

  function root(){
    state.institutional=state.institutional||{};
    const r=state.institutional;
    r.teachers=r.teachers||{};
    r.assignments=r.assignments||{};
    return r;
  }
  const teachers=()=>Object.values(root().teachers).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es'));
  const api=()=>window.PCIInstitutionalV48||null;
  const rows=()=>api()?.allImplementationRows?.()||[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>`doc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

  function assignmentCount(tid){return Object.values(root().assignments).filter(id=>id===tid).length}

  function deleteTeacher(tid){
    const r=root(),t=r.teachers[tid];if(!t)return;
    const count=assignmentCount(tid);
    if(!confirm(`Eliminar a ${t.name}?${count?` También se liberarán ${count} asignaciones.`:''}`))return;
    delete r.teachers[tid];
    for(const [instanceId,id] of Object.entries(r.assignments))if(id===tid)delete r.assignments[instanceId];
    if(r.teacherProfiles)delete r.teacherProfiles[tid];
    if(r.availability)delete r.availability[tid];
    if(r.availabilityPreferences)delete r.availabilityPreferences[tid];
    if(r.planningOverrides)delete r.planningOverrides[tid];
    if(r.outsideWork)for(const [id,x] of Object.entries(r.outsideWork))if(x?.teacherId===tid)delete r.outsideWork[id];
    r.annualScheduleVersions=[];
    save();render();ensureEntryButtons();toast(`${t.name} fue eliminado de Gestión Institucional.`);
  }

  function addTeacher(){
    const name=$('v71LeanTeacherName')?.value.trim()||'';
    const email=$('v71LeanTeacherEmail')?.value.trim()||'';
    if(!name)return toast('Escribí el nombre del docente.',true);
    const exists=teachers().find(t=>String(t.name).trim().toLowerCase()===name.toLowerCase()||(email&&String(t.email||'').trim().toLowerCase()===email.toLowerCase()));
    if(exists)return toast('Ese docente ya está cargado.',true);
    const id=uid();root().teachers[id]={id,name,email};save();render();ensureEntryButtons();toast('Docente agregado.');
  }

  function teacherHtml(){
    const list=teachers();
    if(!list.length)return '<div class="v71m-empty">Todavía no hay docentes cargados.</div>';
    return `<div class="v71m-teachers">${list.map(t=>`<div class="v71m-teacher"><div><strong>${esc(t.name)}</strong>${t.email?`<small>${esc(t.email)}</small>`:''}<small>${assignmentCount(t.id)} asignaciones</small></div><button type="button" data-v71m-delete="${esc(t.id)}" title="Eliminar docente" aria-label="Eliminar ${esc(t.name)}">×</button></div>`).join('')}</div>`;
  }

  function courseGroups(){
    const map=new Map();
    for(const row of rows()){
      const key=`${row.orientation}|||${row.course}`;
      if(!map.has(key))map.set(key,{key,orientation:row.orientation,course:row.course,rows:[]});
      map.get(key).rows.push(row);
    }
    return [...map.values()].sort((a,b)=>String(a.orientation).localeCompare(String(b.orientation),'es')||String(a.course).localeCompare(String(b.course),'es'));
  }

  function assignmentSectionHtml(){
    const groups=courseGroups();
    if(!groups.length)return `<section class="card v48-section v71o-assignment"><div class="eyebrow">Asignación por materia</div><h2>Materias del plan</h2><div class="v71m-empty">Todavía no hay materias disponibles desde Fase 1.</div></section>`;
    if(!selectedCourseKey||!groups.some(g=>g.key===selectedCourseKey))selectedCourseKey=groups[0].key;
    const group=groups.find(g=>g.key===selectedCourseKey)||groups[0];
    const list=teachers();
    return `<section class="card v48-section v71o-assignment">
      <div class="eyebrow">Asignación por materia</div>
      <h2>Asignar docentes</h2>
      <p>Elegí un curso. Solo se cargan sus materias para mantener Gestión ágil.</p>
      <label class="v71o-course-label">Curso<select id="v71oCourseSelect">${groups.map(g=>`<option value="${esc(g.key)}" ${g.key===selectedCourseKey?'selected':''}>${esc(g.orientation)} · ${esc(g.course)}</option>`).join('')}</select></label>
      <div class="v71o-subject-list">${group.rows.map(row=>{
        const current=root().assignments[row.instanceId]||'';
        return `<div class="v71o-subject-row"><div><strong>${esc(row.name)}</strong><small>${row.hours==null?'HC pendiente':`${esc(row.hours)} HC`} · ${esc((row.locations||[]).join(' · ')||'Plan')}</small></div><select data-v71o-assignment="${esc(row.instanceId)}"><option value="">Sin asignar</option>${list.map(t=>`<option value="${esc(t.id)}" ${current===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>`;
      }).join('')}</div>
    </section>`;
  }

  function setAssignment(instanceId,teacherId){
    const r=root();
    if(teacherId)r.assignments[instanceId]=teacherId;else delete r.assignments[instanceId];
    r.annualScheduleVersions=[];
    save();
    try{window.PCIAutoAreaCoincidenceV54?.deriveTeams?.()}catch{}
    const all=rows(),assigned=all.filter(x=>r.assignments[x.instanceId]).length;
    const summary=$('v71mAssignedSummary');if(summary)summary.innerHTML=`<strong>${assigned}</strong>/${all.length} materias asignadas`;
    ensureEntryButtons();
  }

  function bindAssignments(host){
    $('v71oCourseSelect')?.addEventListener('change',e=>{selectedCourseKey=e.target.value;render()});
    host.querySelectorAll('[data-v71o-assignment]').forEach(sel=>sel.addEventListener('change',()=>setAssignment(sel.dataset.v71oAssignment,sel.value)));
  }

  function render(){
    if(rendering)return;
    const screen=$('institutional'),host=$('v48InstitutionalContent');
    if(!screen||!host||!screen.classList.contains('active'))return;
    rendering=true;
    try{
      const all=rows(),assigned=all.filter(r=>root().assignments[r.instanceId]).length;
      const title=$('v48InstitutionalTitle');if(title)title.textContent=`${state.school||'Escuela'} · Gestión institucional`;
      const hero=screen.querySelector('.hero p');if(hero)hero.textContent='Gestión liviana: asignación por materia, disponibilidad y horario. Fase 1 y Fase 2 permanecen intactas.';
      host.innerHTML=`
        <div class="v71m-summary"><span><strong>${teachers().length}</strong> docentes</span><span id="v71mAssignedSummary"><strong>${assigned}</strong>/${all.length} materias asignadas</span></div>
        <section class="card v48-section v66-source-section v71m-source"><div class="eyebrow">Carga docente</div><h2>Asignación rápida</h2><p>Podés usar el Excel simple o asignar manualmente materia por materia en el bloque siguiente.</p></section>
        <section class="card v48-section v71m-teacher-section"><div class="eyebrow">Plantel</div><h2>Docentes</h2><div class="v71m-add"><input id="v71LeanTeacherName" placeholder="Nombre y apellido"><input id="v71LeanTeacherEmail" placeholder="Email (opcional)"><button id="v71LeanAddTeacher" class="btn primary" type="button">Agregar</button></div>${teacherHtml()}</section>
        ${assignmentSectionHtml()}
        <div id="v71mDynamic"></div>`;
      $('v71LeanAddTeacher')?.addEventListener('click',addTeacher);
      host.querySelectorAll('[data-v71m-delete]').forEach(b=>b.addEventListener('click',()=>deleteTeacher(b.dataset.v71mDelete)));
      bindAssignments(host);
      setTimeout(()=>{
        try{window.PCISimpleAssignmentExcelV71?.render?.()}catch(e){console.warn('V71O excel',e)}
        try{window.PCIAvailabilityPreferencesV60?.render?.()}catch(e){console.warn('V71O availability',e)}
        try{window.PCIAnnualSchedulerV68?.render?.()}catch(e){console.warn('V71O scheduler',e)}
        try{window.PCIManagementNavResetV71?.renderNav?.()}catch{}
      },80);
    }finally{rendering=false}
  }

  function openManagement(){window.screen?.('institutional');setTimeout(render,15)}

  function ensureEntryButtons(){
    const list=$('pciList');
    if(list){
      let card=$('v71LeanHomeEntry');if(!card){card=document.createElement('section');card.id='v71LeanHomeEntry';card.className='card v71n-entry-card';list.after(card)}
      const all=rows(),assigned=all.filter(r=>root().assignments[r.instanceId]).length;
      card.innerHTML=`<div><div class="eyebrow">Nivel escuela</div><h2>Gestión institucional</h2><p>Docentes, asignación por materia, disponibilidad y horario.</p><small>${teachers().length} docentes · ${assigned}/${all.length} materias asignadas</small></div><button type="button" class="btn primary" data-v71n-open>Abrir Gestión</button>`;
      card.querySelector('[data-v71n-open]').onclick=openManagement;
    }
    const grid=document.querySelector('#panel .phase-grid');
    if(grid){
      let card=$('v71LeanPanelEntry');if(!card){card=document.createElement('article');card.id='v71LeanPanelEntry';card.className='card phase v71n-panel-entry';grid.appendChild(card)}
      card.innerHTML='<div class="eyebrow">Gestión</div><h2>Gestión institucional</h2><p>Planta docente, asignación por materia, disponibilidad y horario.</p><button type="button" class="btn primary" data-v71n-open>Entrar</button>';
      card.querySelector('[data-v71n-open]').onclick=openManagement;
    }
  }

  function install(){
    const a=api();if(a)a.renderInstitutional=render;
    ensureEntryButtons();
    const list=$('pciList');if(list&&!entryObserver){entryObserver=new MutationObserver(()=>setTimeout(ensureEntryButtons,50));entryObserver.observe(list,{childList:true})}
    if($('institutional')?.classList.contains('active'))render();
  }

  document.addEventListener('click',e=>{const btn=e.target.closest('#openInstitutional,#openInstitutionalGeneral,[data-v71n-open]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();openManagement()},true);
  window.addEventListener('pci-app-ready',()=>setTimeout(install,80));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,250),{once:true});
  setTimeout(install,700);

  const style=document.createElement('style');
  style.textContent=`
    .v71m-summary{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.v71m-summary span{padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:.6rem;color:var(--muted)}.v71m-summary strong{color:var(--ink)}
    .v71m-source{padding:14px!important}.v71m-source h2,.v71m-teacher-section h2,.v71o-assignment h2{margin:3px 0 4px!important}
    .v71m-add{display:grid;grid-template-columns:minmax(160px,1fr) minmax(170px,1fr) auto;gap:7px;margin-top:10px}.v71m-add input{min-width:0;padding:9px;border:1px solid var(--line);border-radius:9px}
    .v71m-teachers{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:7px;margin-top:10px}.v71m-teacher{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--band)}.v71m-teacher strong{display:block;font-size:.7rem}.v71m-teacher small{display:block;margin-top:2px;font-size:.52rem;color:var(--muted)}.v71m-teacher button{flex:0 0 30px;width:30px;height:30px;border:1px solid #ddb7bf;border-radius:50%;background:#fff5f6;color:var(--danger);font-size:1.05rem;font-weight:900;line-height:1;cursor:pointer}.v71m-empty{padding:12px;border:1px dashed var(--line);border-radius:10px;margin-top:10px;color:var(--muted);font-size:.62rem}
    .v71o-course-label{display:grid;gap:5px;margin-top:10px;max-width:420px;font-size:.6rem;font-weight:850}.v71o-course-label select{padding:9px;border:1px solid var(--line);border-radius:9px;background:#fff}.v71o-subject-list{display:grid;gap:7px;margin-top:10px}.v71o-subject-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,260px);gap:10px;align-items:center;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--band)}.v71o-subject-row strong{display:block;font-size:.68rem}.v71o-subject-row small{display:block;margin-top:2px;font-size:.52rem;color:var(--muted)}.v71o-subject-row select{width:100%;min-width:0;padding:8px;border:1px solid var(--line);border-radius:8px;background:#fff}
    .v66-assignment-section,.v48-table-wrap{display:none!important}
    .v71n-entry-card{margin-top:16px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:center;border-color:#9edfd7;background:linear-gradient(135deg,#f7fffd,#edf8f7)}.v71n-entry-card h2{margin:4px 0}.v71n-entry-card p{margin:0;color:var(--muted);font-size:.72rem}.v71n-entry-card small{display:block;margin-top:7px;color:var(--muted);font-size:.58rem}.v71n-entry-card>.btn{flex:0 0 auto}
    @media(max-width:780px){.v71m-add{grid-template-columns:1fr}.v71m-add .btn{width:100%}.v71m-teachers{grid-template-columns:1fr}.v71o-subject-row{grid-template-columns:1fr}.v71n-entry-card{align-items:stretch;flex-direction:column}.v71n-entry-card>.btn{width:100%}}
  `;
  document.head.appendChild(style);

  window.PCILeanManagementV71={render,deleteTeacher,addTeacher,ensureEntryButtons,openManagement,setAssignment};
})();