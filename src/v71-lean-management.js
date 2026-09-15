(() => {
  const $=id=>document.getElementById(id);
  let rendering=false;

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

  function assignmentCount(tid){
    return Object.values(root().assignments).filter(id=>id===tid).length;
  }

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
    // Un horario armado con un docente eliminado ya no es confiable.
    r.annualScheduleVersions=[];
    save();
    try{window.PCIAutoAreaCoincidenceV54?.deriveTeams?.()}catch{}
    render();
    toast(`${t.name} fue eliminado de Gestión Institucional.`);
  }

  function addTeacher(){
    const name=$('v71LeanTeacherName')?.value.trim()||'';
    const email=$('v71LeanTeacherEmail')?.value.trim()||'';
    if(!name)return toast('Escribí el nombre del docente.',true);
    const exists=teachers().find(t=>String(t.name).trim().toLowerCase()===name.toLowerCase()||(email&&String(t.email||'').trim().toLowerCase()===email.toLowerCase()));
    if(exists)return toast('Ese docente ya está cargado.',true);
    const id=uid();root().teachers[id]={id,name,email};save();render();toast('Docente agregado.');
  }

  function teacherHtml(){
    const list=teachers();
    if(!list.length)return '<div class="v71m-empty">Todavía no hay docentes cargados.</div>';
    return `<div class="v71m-teachers">${list.map(t=>`<div class="v71m-teacher"><div><strong>${esc(t.name)}</strong>${t.email?`<small>${esc(t.email)}</small>`:''}<small>${assignmentCount(t.id)} asignaciones</small></div><button type="button" data-v71m-delete="${esc(t.id)}" title="Eliminar docente" aria-label="Eliminar ${esc(t.name)}">×</button></div>`).join('')}</div>`;
  }

  function render(){
    if(rendering)return;
    const screen=$('institutional'),host=$('v48InstitutionalContent');
    if(!screen||!host||!screen.classList.contains('active'))return;
    rendering=true;
    try{
      const all=rows(),assigned=all.filter(r=>root().assignments[r.instanceId]).length;
      const title=$('v48InstitutionalTitle');if(title)title.textContent=`${state.school||'Escuela'} · Gestión institucional`;
      const hero=screen.querySelector('.hero p');if(hero)hero.textContent='Modo estable: carga docente, disponibilidad y horario. La estructura curricular de Fase 1 y Fase 2 permanece intacta.';
      host.innerHTML=`
        <div class="v71m-summary">
          <span><strong>${teachers().length}</strong> docentes</span>
          <span><strong>${assigned}</strong>/${all.length} materias asignadas</span>
        </div>
        <section class="card v48-section v66-source-section v71m-source">
          <div class="eyebrow">Carga docente</div>
          <h2>Asignación rápida</h2>
          <p>Usá el Excel simple para asignar docentes. La tabla completa no se carga en esta vista para mantener Gestión ágil.</p>
        </section>
        <section class="card v48-section v71m-teacher-section">
          <div class="eyebrow">Plantel</div>
          <h2>Docentes</h2>
          <div class="v71m-add"><input id="v71LeanTeacherName" placeholder="Nombre y apellido"><input id="v71LeanTeacherEmail" placeholder="Email (opcional)"><button id="v71LeanAddTeacher" class="btn primary" type="button">Agregar</button></div>
          ${teacherHtml()}
        </section>
        <div id="v71mDynamic"></div>`;

      $('v71LeanAddTeacher')?.addEventListener('click',addTeacher);
      host.querySelectorAll('[data-v71m-delete]').forEach(b=>b.addEventListener('click',()=>deleteTeacher(b.dataset.v71mDelete)));

      // Insertar únicamente los módulos operativos necesarios.
      setTimeout(()=>{
        try{window.PCISimpleAssignmentExcelV71?.render?.()}catch(e){console.warn('V71M excel',e)}
        try{window.PCIAvailabilityPreferencesV60?.render?.()}catch(e){console.warn('V71M availability',e)}
        try{window.PCIAnnualSchedulerV68?.render?.()}catch(e){console.warn('V71M scheduler',e)}
        try{window.PCISimpleScheduleTrialV71?.renderTrial?.()}catch{}
        try{window.PCIManagementNavResetV71?.renderNav?.()}catch{}
      },80);
    }finally{rendering=false}
  }

  function openLean(e){
    const btn=e.target.closest('#openInstitutional,#openInstitutionalGeneral');if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    window.screen?.('institutional');
    setTimeout(render,10);
  }
  document.addEventListener('click',openLean,true);

  function install(){
    const a=api();if(a)a.renderInstitutional=render;
    // Si ya estamos adentro, reemplazar inmediatamente la vista pesada.
    if($('institutional')?.classList.contains('active'))render();
  }
  window.addEventListener('pci-app-ready',()=>setTimeout(install,50));
  setTimeout(install,500);

  const style=document.createElement('style');
  style.textContent=`
    .v71m-summary{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.v71m-summary span{padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:.6rem;color:var(--muted)}.v71m-summary strong{color:var(--ink)}
    .v71m-source{padding:14px!important}.v71m-source h2,.v71m-teacher-section h2{margin:3px 0 4px!important}
    .v71m-add{display:grid;grid-template-columns:minmax(160px,1fr) minmax(170px,1fr) auto;gap:7px;margin-top:10px}.v71m-add input{min-width:0;padding:9px;border:1px solid var(--line);border-radius:9px}
    .v71m-teachers{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:7px;margin-top:10px}.v71m-teacher{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--band)}.v71m-teacher strong{display:block;font-size:.7rem}.v71m-teacher small{display:block;margin-top:2px;font-size:.52rem;color:var(--muted)}.v71m-teacher button{flex:0 0 30px;width:30px;height:30px;border:1px solid #ddb7bf;border-radius:50%;background:#fff5f6;color:var(--danger);font-size:1.05rem;font-weight:900;line-height:1;cursor:pointer}.v71m-empty{padding:12px;border:1px dashed var(--line);border-radius:10px;margin-top:10px;color:var(--muted);font-size:.62rem}
    .v66-assignment-section,.v48-table-wrap{display:none!important}
    @media(max-width:780px){.v71m-add{grid-template-columns:1fr}.v71m-add .btn{width:100%}.v71m-teachers{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  window.PCILeanManagementV71={render,deleteTeacher,addTeacher};
})();