(() => {
  const $=id=>document.getElementById(id);
  const pci=()=>window.PCIInstitutionalV48||null;
  let timer=null,observer=null,observedHost=null;

  function root(){
    state.institutional=state.institutional||{};
    const r=state.institutional;
    r.teachers=r.teachers||{};
    r.assignments=r.assignments||{};
    return r;
  }
  const rows=()=>pci()?.allImplementationRows?.()||[];
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const slug=v=>norm(v).replace(/\s+/g,'-');
  const uid=()=>`doc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

  function loadXLSX(){
    if(window.XLSX)return Promise.resolve(window.XLSX);
    return new Promise((resolve,reject)=>{
      const prior=document.querySelector('script[data-pci-xlsx]');
      if(prior){
        if(window.XLSX)return resolve(window.XLSX);
        prior.addEventListener('load',()=>resolve(window.XLSX),{once:true});
        prior.addEventListener('error',()=>reject(new Error('No se pudo cargar el lector de Excel.')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.async=true;s.dataset.pciXlsx='1';
      s.onload=()=>resolve(window.XLSX);
      s.onerror=()=>reject(new Error('No se pudo cargar el lector de Excel.'));
      document.head.appendChild(s);
    });
  }

  function teacherForAssignment(instanceId){
    const r=root(),tid=r.assignments[instanceId]||'';
    return r.teachers[tid]||null;
  }

  async function downloadSimpleWorkbook(){
    try{
      const XLSX=await loadXLSX();
      const data=rows().map(row=>{
        const t=teacherForAssignment(row.instanceId);
        return {
          'Orientación':row.orientation||'',
          'Curso':row.course||'',
          'Materia / espacio':row.name||'',
          'HC':row.hours??'',
          'Docente':t?.name||'',
          'Email':t?.email||'',
          '__ID':row.instanceId
        };
      });
      const ws=XLSX.utils.json_to_sheet(data,{header:['Orientación','Curso','Materia / espacio','HC','Docente','Email','__ID']});
      ws['!cols']=[{wch:28},{wch:14},{wch:36},{wch:8},{wch:30},{wch:34},{wch:12,hidden:true}];
      ws['!autofilter']={ref:`A1:F${Math.max(2,data.length+1)}`};
      const wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws,'ASIGNACION DOCENTE');
      XLSX.writeFile(wb,`asignacion-docente-${slug(state.school||'escuela')||'escuela'}.xlsx`);
    }catch(e){toast(e.message||String(e),true)}
  }

  function findTeacher(name,email){
    const list=Object.values(root().teachers||{});
    if(email){const hit=list.find(t=>norm(t.email)===norm(email));if(hit)return hit}
    if(name){const hit=list.find(t=>norm(t.name)===norm(name));if(hit)return hit}
    return null;
  }
  function ensureTeacher(name,email){
    let t=findTeacher(name,email);
    if(t){if(email&&!t.email)t.email=email;if(name&&!t.name)t.name=name;return t}
    if(!name&&!email)return null;
    t={id:uid(),name:name||email,email:email||'',baseHours:0,baseHoursSource:'assignments'};
    root().teachers[t.id]=t;
    return t;
  }

  function findRow(raw){
    const id=String(raw.__ID||'').trim();
    if(id){const exact=rows().find(r=>String(r.instanceId)===id);if(exact)return exact}
    const o=norm(raw['Orientación']),c=norm(raw['Curso']),m=norm(raw['Materia / espacio']);
    const hits=rows().filter(r=>(!o||norm(r.orientation)===o)&&(!c||norm(r.course)===c)&&(!m||norm(r.name)===m));
    return hits.length===1?hits[0]:null;
  }

  async function importSimpleWorkbook(file){
    const result=$('v71SimpleExcelResult');
    if(result)result.innerHTML='<div class="v71-simple-note">Leyendo Excel…</div>';
    try{
      const XLSX=await loadXLSX(),buf=await file.arrayBuffer(),wb=XLSX.read(buf,{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(sheet,{defval:''});
      let assigned=0,created=0,skipped=0;
      const r=root();
      for(const raw of data){
        const row=findRow(raw);if(!row){skipped++;continue}
        const name=String(raw['Docente']||'').trim(),email=String(raw['Email']||'').trim();
        if(!name&&!email)continue;
        const before=findTeacher(name,email),t=ensureTeacher(name,email);if(!t){skipped++;continue}
        if(!before)created++;
        r.assignments[row.instanceId]=t.id;assigned++;
      }
      save();
      window.PCIAutoAreaCoincidenceV54?.deriveTeams?.();
      pci()?.renderInstitutional?.();
      setTimeout(()=>{decorate();window.PCIStaffPlanningV68?.decorate?.();window.PCIAnnualSchedulerV68?.render?.()},250);
      if(result)result.innerHTML=`<div class="v71-simple-ok"><strong>${assigned}</strong> asignaciones cargadas · <strong>${created}</strong> docentes nuevos${skipped?` · ${skipped} filas no identificadas`:''}.</div>`;
      toast(`Asignación docente importada: ${assigned} materias actualizadas.`);
    }catch(e){if(result)result.innerHTML=`<div class="v71-simple-error">${String(e.message||e)}</div>`;toast(e.message||String(e),true)}
  }

  function render(){
    const host=$('v48InstitutionalContent');
    if(!host||!$('institutional')?.classList.contains('active'))return;
    const old=$('v70StaffWorkbook');if(old)old.style.setProperty('display','none','important');
    const optimizer=$('v70Optimizer');if(optimizer)optimizer.style.setProperty('display','none','important');
    let section=$('v71SimpleAssignmentExcel');
    if(!section){
      section=document.createElement('section');section.id='v71SimpleAssignmentExcel';section.className='card v48-section v71-simple-excel';
      const source=host.querySelector('.v66-source-section');if(source)source.after(section);else host.prepend(section);
    }
    if(section.dataset.ready==='1')return;
    section.dataset.ready='1';
    section.innerHTML=`
      <div class="eyebrow">Carga masiva simple</div>
      <h2>Asignar docentes a las materias</h2>
      <p>El Excel ya trae todo el plan cargado. Solo completá <strong>Docente</strong> y <strong>Email</strong>. No tenés que tocar cursos, materias ni cargas horarias.</p>
      <div class="v71-simple-actions">
        <button type="button" class="btn soft" data-v71-simple-download>Descargar Excel</button>
        <label class="btn primary v71-simple-file">Importar Excel<input type="file" accept=".xlsx,.xls" hidden data-v71-simple-file></label>
      </div>
      <div class="v71-simple-example"><strong>Así de simple:</strong><span>Matemática · 1.º A → Juan Pérez · juan@escuela.edu.ar</span></div>
      <div id="v71SimpleExcelResult"></div>`;
    section.querySelector('[data-v71-simple-download]').onclick=downloadSimpleWorkbook;
    section.querySelector('input[data-v71-simple-file]').onchange=e=>{const f=e.target.files?.[0];if(f)importSimpleWorkbook(f)};
  }

  function decorate(){render()}
  function refresh(){clearTimeout(timer);timer=setTimeout(decorate,70)}
  function bind(){
    const host=$('v48InstitutionalContent');if(!host||host===observedHost)return;
    observer?.disconnect();observedHost=host;observer=new MutationObserver(refresh);observer.observe(host,{childList:true,subtree:false});
  }
  function burst(){[0,120,350,800].forEach(ms=>setTimeout(()=>{bind();decorate()},ms))}
  document.addEventListener('click',e=>{if(e.target.closest('#openInstitutionalGeneral,#openInstitutional,[data-v48-home]'))burst()},true);
  window.addEventListener('pci-app-ready',burst);burst();

  const style=document.createElement('style');style.textContent=`
    #v70StaffWorkbook,#v70Optimizer{display:none!important}
    .v71-simple-excel{border-color:#a8d4ce;background:#fbfffe}
    .v71-simple-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .v71-simple-file{cursor:pointer}
    .v71-simple-example{margin-top:10px;padding:9px 10px;border-radius:10px;background:var(--band);font-size:.58rem;line-height:1.45}.v71-simple-example strong{display:block}.v71-simple-example span{color:var(--muted)}
    .v71-simple-note,.v71-simple-ok,.v71-simple-error{margin-top:10px;padding:9px 10px;border-radius:10px;font-size:.58rem}.v71-simple-ok{background:var(--ok-soft);color:var(--ok)}.v71-simple-error{background:var(--danger-soft);color:var(--danger)}
    @media(max-width:780px){.v71-simple-actions{flex-direction:column}.v71-simple-actions>.btn,.v71-simple-actions>.v71-simple-file{width:100%;box-sizing:border-box;justify-content:center;text-align:center}}
  `;document.head.appendChild(style);
  window.PCISimpleAssignmentExcelV71={downloadSimpleWorkbook,importSimpleWorkbook,render};
})();