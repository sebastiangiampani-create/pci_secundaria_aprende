(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const typeLabel=t=>({TARDE:'Tarde',AUSENTE:'Ausente',AUSENTE_PRESENCIA:'Ausente con presencia',AUSENTE_EF:'Ausente a EF'}[t]||t);
  let mode='daily',reportDni='',timer=null,observer=null;

  const attendance=()=>window.PCIAttendanceV78||null;
  const studentsApi=()=>window.PCIStudentsCommissionsV72||null;
  const defs=()=>attendance()?.defs?.()||[];

  function studentsFor(key){return studentsApi()?.studentsFor?.(key)||[]}
  function formatDate(iso){
    const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?m[3]+'/'+m[2]+'/'+m[1]:String(iso||'');
  }
  function commissionLabel(key){
    const d=(studentsApi()?.commissionDefs?.()||[]).find(x=>x.key===key);
    return d?d.course+' · '+d.orientation:String(key||'');
  }
  function scopedStudents(){
    const map=new Map();
    for(const d of defs()){
      for(const s of studentsFor(d.key)){
        const dni=String(s.dni||'');
        if(!dni)continue;
        const item=map.get(dni)||Object.assign({},s,{dni,commissions:[]});
        if(!item.commissions.some(x=>x.key===d.key))item.commissions.push({key:d.key,course:d.course,orientation:d.orientation});
        map.set(dni,item);
      }
    }
    return [...map.values()].sort((a,b)=>String(a.lastName||'').localeCompare(String(b.lastName||''),'es')||String(a.firstName||'').localeCompare(String(b.firstName||''),'es'));
  }
  function reportFor(dni){
    const records=(attendance()?.records?.()||[]).filter(r=>String(r.dni)===String(dni)).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const unjustified=records.filter(r=>!r.justified).reduce((n,r)=>n+Number(r.value||0),0);
    const justified=records.filter(r=>r.justified).reduce((n,r)=>n+Number(r.value||0),0);
    return{dni,records,unjustified,justified,total:unjustified+justified,regular:unjustified<=20};
  }

  function ensureTabs(root){
    let nav=root.querySelector('.v82-attendance-tabs');
    if(!nav){
      nav=document.createElement('div');
      nav.className='v82-attendance-tabs';
      nav.innerHTML='<button type="button" data-v82-mode="daily">Registro diario</button><button type="button" data-v82-mode="student">Reporte por estudiante</button>';
      root.querySelector('.v78-hero')?.after(nav);
    }
    nav.querySelectorAll('[data-v82-mode]').forEach(b=>b.classList.toggle('active',b.dataset.v82Mode===mode));
    return nav;
  }

  function installationWarning(root,ds){
    let box=root.querySelector('.v82-installation-warning');
    const total=ds.reduce((n,d)=>n+studentsFor(d.key).length,0);
    if(total||!ds.length){box?.remove();return}
    if(!box){
      box=document.createElement('div');
      box.className='v82-installation-warning';
      const nav=root.querySelector('.v82-attendance-tabs');
      nav?.after(box);
    }
    box.innerHTML='<strong>No hay estudiantes cargados en esta copia de la aplicación.</strong><span>Los datos de otro navegador, localhost, versión online o instalación Windows no se transfieren automáticamente. Cargá los listados desde Gestión → Comisiones y estudiantes.</span>';
  }

  function enhanceDaily(root,ds){
    const filters=root.querySelector('.v78-filters');
    const list=root.querySelector('.v78-list');
    if(filters)filters.hidden=mode!=='daily';
    if(list)list.hidden=mode!=='daily';
    if(mode!=='daily')return;

    const select=root.querySelector('[data-c]');
    if(select){
      const selected=select.value;
      const signature=ds.map(d=>d.key+':'+studentsFor(d.key).length).join('|');
      if(select.dataset.v82Signature!==signature){
        select.innerHTML=ds.map(d=>{
          const count=studentsFor(d.key).length;
          const suffix=count?(count+' estudiante'+(count===1?'':'s')):'sin estudiantes';
          return '<option value="'+esc(d.key)+'" '+(d.key===selected?'selected':'')+'>'+esc(d.course)+' · '+esc(d.orientation)+' — '+suffix+'</option>';
        }).join('');
        if(ds.some(d=>d.key===selected))select.value=selected;
        select.dataset.v82Signature=signature;
      }
    }

    const key=root.querySelector('[data-c]')?.value||'';
    const def=ds.find(d=>d.key===key);
    const count=key?studentsFor(key).length:0;
    let status=root.querySelector('.v82-commission-status');
    if(def){
      if(!status){
        status=document.createElement('div');
        status.className='v82-commission-status';
        filters?.after(status);
      }
      status.classList.toggle('empty',!count);
      const html='<strong>'+esc(def.course)+' · '+esc(def.orientation)+'</strong><span>'+(count?(count+' estudiante'+(count===1?'':'s')+' cargado'+(count===1?'':'s')):'Esta comisión no tiene estudiantes cargados en esta instalación.')+'</span>';
      if(status.innerHTML!==html)status.innerHTML=html;
    }else status?.remove();

    const empty=root.querySelector('.v78-empty');
    if(empty){
      empty.className='v82-empty-commission';
      empty.innerHTML='<strong>Esta comisión no tiene estudiantes cargados.</strong><span>Cargá o importá el listado desde Gestión → Comisiones y estudiantes. Si los alumnos están en otro localhost, navegador o instalación, primero trasladá esos datos a esta copia.</span>';
    }
  }

  function reportHtml(){
    const all=scopedStudents();
    if(!all.some(x=>x.dni===reportDni))reportDni=all[0]?.dni||'';
    const s=all.find(x=>x.dni===reportDni);
    if(!s)return '<div class="v82-report-empty"><strong>No hay estudiantes disponibles para reportar.</strong><span>Cargá estudiantes en Gestión o elegí una comisión a la que tengas acceso.</span></div>';
    const rep=reportFor(s.dni);
    const options=all.map(x=>'<option value="'+esc(x.dni)+'" '+(x.dni===reportDni?'selected':'')+'>'+esc(x.lastName||'')+' '+esc(x.firstName||'')+' · DNI '+esc(x.dni)+'</option>').join('');
    const commissions=s.commissions.map(c=>esc(c.course)+' · '+esc(c.orientation)).join(' / ');
    const rows=rep.records.map(r=>'<div class="v82-history-row"><span>'+formatDate(r.date)+'</span><span>'+esc(typeLabel(r.type))+'</span><span>+'+Number(r.value||0)+'</span><span>'+(r.justified?'Justificada':'Injustificada')+'</span><span>'+esc(commissionLabel(r.commissionKey))+'</span><span>'+esc(r.reason||'—')+'</span></div>').join('');
    return '<div class="v82-report-filter"><label>Estudiante<select data-v82-student>'+options+'</select></label></div>'+
      '<section class="v82-student-head"><div><div class="eyebrow">Estudiante</div><h3>'+esc(s.lastName||'')+' '+esc(s.firstName||'')+'</h3><p>DNI '+esc(s.dni)+' · '+commissions+'</p></div><span class="v82-regularity '+(rep.regular?'regular':'nonregular')+'">'+(rep.regular?'REGULAR':'NO REGULAR')+'</span></section>'+
      '<div class="v82-metrics"><article><span>Injustificadas</span><strong>'+rep.unjustified+'</strong></article><article><span>Justificadas</span><strong>'+rep.justified+'</strong></article><article><span>Cómputo total</span><strong>'+rep.total+'</strong></article><article><span>Registros</span><strong>'+rep.records.length+'</strong></article></div>'+
      '<section class="v82-history"><div class="v82-history-head"><div><div class="eyebrow">Historial</div><h3>Registros de asistencia</h3></div><span>'+rep.records.length+' registro'+(rep.records.length===1?'':'s')+'</span></div>'+
      (rep.records.length?'<div class="v82-history-table"><div class="v82-history-row header"><span>Fecha</span><span>Tipo</span><span>Cómputo</span><span>Estado</span><span>Comisión</span><span>Motivo</span></div>'+rows+'</div>':'<div class="v82-report-empty compact"><strong>Sin inasistencias registradas.</strong><span>El estudiante todavía no tiene registros de asistencia.</span></div>')+'</section>';
  }

  function renderReport(root){
    let report=root.querySelector('.v82-student-report');
    if(mode!=='student'){if(report)report.hidden=true;return}
    if(!report){
      report=document.createElement('div');
      report.className='v82-student-report';
      root.appendChild(report);
    }
    report.hidden=false;
    const html=reportHtml();
    if(report.innerHTML!==html)report.innerHTML=html;
    const h2=root.querySelector('.v78-hero h2');if(h2)h2.textContent='Reporte por estudiante';
    const p=root.querySelector('.v78-hero p');if(p)p.textContent='Consulta la trayectoria completa de asistencia de cada estudiante.';
  }

  function restoreDailyHero(root){
    if(mode!=='daily')return;
    const h2=root.querySelector('.v78-hero h2');if(h2)h2.textContent='Registro diario';
    const p=root.querySelector('.v78-hero p');if(p)p.textContent='Levanta los estudiantes ya cargados en Gestión y calcula el cómputo diario.';
  }

  function decorate(){
    const root=$('v78AttendanceRoot');
    if(!root||!$('v78Attendance')?.classList.contains('active'))return;
    const ds=defs();
    ensureTabs(root);
    installationWarning(root,ds);
    enhanceDaily(root,ds);
    renderReport(root);
    restoreDailyHero(root);
  }
  function refresh(){clearTimeout(timer);timer=setTimeout(decorate,50)}
  function start(){
    const root=$('v78AttendanceRoot');
    if(root&&!observer){observer=new MutationObserver(refresh);observer.observe(root,{childList:true,subtree:true})}
    decorate();
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-v82-mode]');
    if(!b)return;
    mode=b.dataset.v82Mode;
    refresh();
    setTimeout(()=>window.scrollTo(0,0),0);
  },true);
  document.addEventListener('change',e=>{
    if(e.target.matches?.('[data-v82-student]')){reportDni=e.target.value;refresh()}
  },true);
  window.addEventListener('pci-app-ready',()=>setTimeout(start,1500));
  setTimeout(start,2300);

  const style=document.createElement('style');
  style.textContent='.v82-attendance-tabs{display:flex;gap:7px;flex-wrap:wrap}.v82-attendance-tabs button{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);padding:9px 13px;font-weight:850}.v82-attendance-tabs button.active{background:var(--ink);color:#fff;border-color:var(--ink)}.v82-installation-warning{padding:12px 14px;border-radius:13px;border:1px solid #e3c86f;background:#fff9df}.v82-installation-warning strong,.v82-installation-warning span{display:block}.v82-installation-warning span{margin-top:4px;color:#6f5a1d;font-size:.62rem;line-height:1.45}.v82-commission-status{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 13px;border-radius:13px;border:1px solid var(--line);background:var(--ok-soft)}.v82-commission-status strong,.v82-commission-status span{display:block}.v82-commission-status span{font-size:.6rem;color:var(--muted)}.v82-commission-status.empty{background:#fff9df;border-color:#e3c86f}.v82-empty-commission,.v82-report-empty{padding:22px;border:1px dashed var(--line);border-radius:16px;background:#fbfcfd}.v82-empty-commission strong,.v82-empty-commission span,.v82-report-empty strong,.v82-report-empty span{display:block}.v82-empty-commission span,.v82-report-empty span{margin-top:5px;color:var(--muted);font-size:.64rem;line-height:1.5}.v82-student-report{display:grid;gap:10px}.v82-report-filter,.v82-student-head,.v82-history{border:1px solid var(--line);border-radius:18px;background:#fff;padding:16px}.v82-report-filter label{display:grid;gap:5px;font-weight:800}.v82-report-filter select{padding:9px;border:1px solid var(--line);border-radius:10px;background:#fff}.v82-student-head{display:flex;align-items:center;justify-content:space-between;gap:14px}.v82-student-head h3{margin:4px 0 3px}.v82-student-head p{margin:0;color:var(--muted);font-size:.65rem}.v82-regularity{padding:7px 10px;border-radius:999px;font-size:.57rem;font-weight:900}.v82-regularity.regular{background:var(--ok-soft);color:var(--ok)}.v82-regularity.nonregular{background:var(--danger-soft);color:var(--danger)}.v82-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.v82-metrics article{padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--band)}.v82-metrics span{display:block;color:var(--muted);font-size:.56rem}.v82-metrics strong{display:block;margin-top:5px;font-size:1.05rem}.v82-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.v82-history-head h3{margin:3px 0}.v82-history-head>span{font-size:.58rem;color:var(--muted)}.v82-history-table{overflow:auto;border:1px solid var(--line);border-radius:12px}.v82-history-row{display:grid;grid-template-columns:90px 150px 80px 120px minmax(180px,1fr) minmax(140px,1fr);min-width:800px;border-top:1px solid var(--line)}.v82-history-row:first-child{border-top:0}.v82-history-row span{padding:9px;font-size:.57rem}.v82-history-row.header{background:var(--band);font-weight:900}.v82-report-empty.compact{padding:14px}@media(max-width:850px){.v82-commission-status,.v82-student-head{align-items:flex-start;flex-direction:column}.v82-metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.v82-metrics{grid-template-columns:1fr}}';
  document.head.appendChild(style);

  window.PCIAttendanceReportsV82={decorate,scopedStudents,reportFor,getMode:()=>mode,setMode:v=>{mode=v==='student'?'student':'daily';decorate()}};
})();