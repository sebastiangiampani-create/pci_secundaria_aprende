(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const STAGES=[['punto_partida','Punto de partida'],['indagacion','Indagación'],['produccion','Producción'],['evaluacion','Evaluación']];
  let selectedContext=null;

  function root(){
    state.institutional=state.institutional||{};
    state.institutional.grading=state.institutional.grading||{plans:{}};
    state.institutional.grading.plans=state.institutional.grading.plans||{};
    return state.institutional;
  }

  function withOrientation(orientation,fn){
    const prev=state.active; state.active=orientation;
    try{return fn()}finally{state.active=prev}
  }

  function curricularGroups(orientation){
    return withOrientation(orientation,()=>window.PCIPhase2V28?.groups?.()||[]);
  }

  function commissionDefs(){
    return window.PCIStudentsCommissionsV72?.commissionDefs?.()||[];
  }

  function studentsFor(key){
    return window.PCIStudentsCommissionsV72?.studentsFor?.(key)||[];
  }

  function expectedPlanCount(g){
    return String(g.term||'').includes('-')?4:2;
  }

  function allContexts(){
    const out=[];
    for(const orientation of (state.selected||[])){
      const groups=curricularGroups(orientation);
      const commissions=commissionDefs().filter(c=>c.orientation===orientation);
      for(const g of groups){
        const comms=commissions.filter(c=>Number(c.year)===Number(g.year));
        const plans=Array.from({length:expectedPlanCount(g)},(_,i)=>g.data?.plansBimestrales?.[i]||null);
        for(const c of comms){
          plans.forEach((p,i)=>out.push({
            orientation,group:g,commission:c,plan:p,planNumber:i+1,
            key:[orientation,g.id,i+1,c.key].join('|||')
          }));
        }
      }
    }
    return out;
  }

  function teachersFor(ctx){
    const api=window.PCIInstitutionalV48;
    const assignments=root().assignments||{};
    const teachers=root().teachers||{};
    if(!api?.implementationRows)return[];
    const ids=new Set();
    const rows=api.implementationRows(ctx.orientation)||[];
    for(const row of rows){
      if(row.course!==ctx.commission.course)continue;
      if(!(ctx.group.subjectIds||[]).includes(row.subjectId))continue;
      const tid=assignments[row.instanceId];
      if(tid)ids.add(tid);
    }
    return [...ids].map(id=>teachers[id]).filter(Boolean);
  }

  function ensureEval(ctx){
    const plans=root().grading.plans;
    let e=plans[ctx.key];
    if(!e){
      e=plans[ctx.key]={
        key:ctx.key,
        orientation:ctx.orientation,
        groupId:ctx.group.id,
        groupName:ctx.group.data?.name||ctx.group.name,
        groupType:ctx.group.type,
        year:ctx.group.year,
        commissionKey:ctx.commission.key,
        course:ctx.commission.course,
        planNumber:ctx.planNumber,
        planName:ctx.plan?.name||'',
        criteria:['','','',''],
        rows:{}
      };
    }
    e.planName=ctx.plan?.name||e.planName||'';
    e.criteria=Array.isArray(e.criteria)?e.criteria.slice(0,4):['','','',''];
    while(e.criteria.length<4)e.criteria.push('');
    e.rows=e.rows||{};
    return e;
  }

  function criteriaReady(e){return e.criteria.every(x=>String(x||'').trim())}

  function rowFor(e,s){
    if(!e.rows[s.dni])e.rows[s.dni]={dni:s.dni,stage:'',criteria:['','','',''],final:'',weight:'',weighted:''};
    const r=e.rows[s.dni];
    r.criteria=Array.isArray(r.criteria)?r.criteria.slice(0,4):['','','',''];while(r.criteria.length<4)r.criteria.push('');
    return r;
  }

  function calcWeighted(r){
    const f=Number(String(r.final).replace(',','.')),w=Number(String(r.weight).replace(',','.'));
    r.weighted=(Number.isFinite(f)&&Number.isFinite(w)&&String(r.final)!==''&&String(r.weight)!=='')?String(Math.round((f*w/100)*100)/100):'';
  }

  function saveAll(){save()}

  function ensureScreen(){
    if($('grading'))return $('grading');
    const main=document.querySelector('main.wrap');if(!main)return null;
    const section=document.createElement('section');
    section.id='grading';section.className='screen';
    section.innerHTML='<div id="v76GradingRoot"></div>';
    main.appendChild(section);
    return section;
  }

  function patchHomeEntry(){
    const card=$('v75Grading');if(!card)return;
    const btn=card.querySelector('button');
    if(btn){
      btn.disabled=false;btn.className='btn primary';btn.textContent='Abrir Calificaciones';
      btn.onclick=()=>openGrading();
    }
    const small=card.querySelector('small');if(small)small.textContent='Plan piloto habilitado para prueba.';
  }

  function showGradingScreen(){
    const section=ensureScreen();if(!section)return;
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
    section.classList.add('active');
    window.scrollTo(0,0);
  }

  function goHome(){
    const home=$('home');if(!home)return;
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
    home.classList.add('active');
    window.PCIHomeRedesignV74?.refresh?.();
    window.PCINavigation?.refresh?.();
    window.scrollTo(0,0);
  }

  function openGrading(){
    showGradingScreen();
    renderHome();
  }

  function renderHome(){
    const host=$('v76GradingRoot');if(!host)return;
    selectedContext=null;
    let contexts=[];
    try{contexts=allContexts()}catch(error){
      console.error('V76 contexts',error);
      host.innerHTML='<div class="v76-topbar"><button type="button" class="btn soft" data-v76-home>← Inicio</button></div><div class="v76-hero"><div class="eyebrow">Calificaciones</div><h1>Evaluación de planes</h1><p>No se pudo reconstruir todavía la relación entre planes y comisiones.</p></div><div class="v76-empty-state"><strong>Calificaciones todavía no pudo leer la estructura curricular.</strong><span>Volvé a Inicio y comprobá que existan planes en Desarrollo Curricular y comisiones en Gestión.</span></div>';
      host.querySelector('[data-v76-home]').onclick=goHome;
      return;
    }
    const grouped=new Map();
    for(const ctx of contexts){
      const k=[ctx.orientation,ctx.commission.key,ctx.group.id].join('|||');
      if(!grouped.has(k))grouped.set(k,{ctx,plans:[]});
      grouped.get(k).plans.push(ctx);
    }
    host.innerHTML=`
      <div class="v76-topbar"><button type="button" class="btn soft" data-v76-home>← Inicio</button></div>
      <div class="v76-hero">
        <div class="eyebrow">Calificaciones</div>
        <h1>Evaluación de planes</h1>
        <p>Los planes provienen del Desarrollo Curricular; las comisiones, estudiantes y docentes provienen de Gestión.</p>
      </div>
      <div class="v76-summary">
        <span><strong>${grouped.size}</strong> agrupamientos/comisiones</span>
        <span><strong>${contexts.length}</strong> planes para evaluar</span>
      </div>
      <div class="v76-grid">${grouped.size?[...grouped.values()].map(({ctx,plans})=>{
        const teachers=teachersFor(ctx);
        const ready=plans.filter(p=>criteriaReady(ensureEval(p))).length;
        return `<article class="v76-card">
          <div class="v76-card-head"><span>${esc(ctx.orientation)}</span><b>${esc(ctx.commission.course)}</b></div>
          <h3>${esc(ctx.group.data?.name||ctx.group.name)}</h3>
          <p>${esc(window.PCIPhase2V28?.typeLabel?.(ctx.group.type)||ctx.group.type)} · Nivel ${esc(ctx.group.year)}</p>
          <small>${teachers.length?teachers.map(t=>esc(t.name)).join(' · '):'Sin docentes asignados todavía'}</small>
          <div class="v76-plan-buttons">${plans.map(p=>`<button type="button" data-v76-open="${esc(p.key)}"><span>Plan ${p.planNumber}</span><strong>${esc(p.plan?.name||'Sin nombre')}</strong><small>${criteriaReady(ensureEval(p))?'Criterios listos':'Definir criterios'}</small></button>`).join('')}</div>
          <div class="v76-ready">${ready}/${plans.length} planes con criterios completos</div>
        </article>`;
      }).join(''):'<div class="v76-empty-state"><strong>No hay planes disponibles para calificar todavía.</strong><span>Calificaciones se habilita cuando Desarrollo Curricular tiene planes y Gestión tiene comisiones del mismo nivel y orientación.</span></div>'}</div>`;
    host.querySelector('[data-v76-home]').onclick=goHome;
    host.querySelectorAll('[data-v76-open]').forEach(b=>b.onclick=()=>openPlan(b.dataset.v76Open));
  }

  function openPlan(key){
    const ctx=allContexts().find(x=>x.key===key);if(!ctx)return;
    selectedContext=ctx;
    renderPlan();
  }

  function dashboardHtml(e,students){
    const counts=Object.fromEntries(STAGES.map(([k])=>[k,[]]));
    for(const s of students){const r=rowFor(e,s);if(counts[r.stage])counts[r.stage].push(s)}
    return `<div class="v76-dashboard">${STAGES.map(([k,l])=>{
      const names=counts[k].map(s=>`${s.lastName||''} ${s.firstName||''}`.trim()).join('\n')||'Sin estudiantes';
      return `<button type="button" title="${esc(names)}"><strong>${counts[k].length}</strong><span>${esc(l)}</span><small>Pasá o tocá para ver quiénes</small></button>`;
    }).join('')}</div>`;
  }

  function renderPlan(){
    const ctx=selectedContext;if(!ctx)return;
    const host=$('v76GradingRoot'),e=ensureEval(ctx),students=studentsFor(ctx.commission.key),teachers=teachersFor(ctx);
    const ready=criteriaReady(e);
    host.innerHTML=`
      <div class="v76-plan-top">
        <button type="button" class="btn soft" data-v76-back>← Calificaciones</button>
        <div>
          <div class="eyebrow">${esc(ctx.orientation)} · ${esc(ctx.commission.course)}</div>
          <h1>${esc(e.groupName)} · Plan ${ctx.planNumber}</h1>
          <h2 class="v76-plan-name">${esc(ctx.plan?.name||e.planName||'Plan sin nombre')}</h2>
          <p>${esc(window.PCIPhase2V28?.typeLabel?.(ctx.group.type)||ctx.group.type)} · Equipo: ${teachers.length?teachers.map(t=>esc(t.name)).join(' · '):'sin docentes asignados'}</p>
        </div>
      </div>

      <section class="card v76-criteria">
        <div class="eyebrow">Criterios colegiados</div>
        <h2>Definir los 4 criterios antes de calificar</h2>
        <p>Los criterios pertenecen a este plan y a esta comisión. Todo el equipo docente trabaja sobre los mismos cuatro criterios.</p>
        <div class="v76-criteria-grid">${e.criteria.map((c,i)=>`<label><span>Criterio ${i+1}</span><textarea data-v76-criterion="${i}" placeholder="Escribí el criterio acordado por el equipo docente">${esc(c)}</textarea></label>`).join('')}</div>
        <div class="v76-criteria-actions"><button type="button" class="btn primary" data-v76-save-criteria>Guardar criterios</button><span class="${ready?'ok':'pending'}">${ready?'Criterios completos':'Faltan criterios'}</span></div>
      </section>

      ${dashboardHtml(e,students)}

      <section class="card v76-sheet-section">
        <div class="v76-sheet-head">
          <div><div class="eyebrow">Carga de calificaciones</div><h2>Planilla de ${students.length} estudiantes</h2><p>Carga manual y Excel trabajan sobre la misma información.</p></div>
          <div class="v76-excel-actions">
            <button type="button" class="btn soft" data-v76-download>Descargar Excel</button>
            <label class="btn primary">Importar Excel<input type="file" accept=".xlsx" hidden data-v76-import></label>
          </div>
        </div>
        ${ready?sheetHtml(e,students):'<div class="v76-lock">Primero completá y guardá los cuatro criterios colegiados.</div>'}
      </section>`;
    host.querySelector('[data-v76-back]').onclick=renderHome;
    host.querySelector('[data-v76-save-criteria]').onclick=()=>{
      host.querySelectorAll('[data-v76-criterion]').forEach(x=>e.criteria[Number(x.dataset.v76Criterion)]=x.value.trim());
      saveAll();renderPlan();toast(criteriaReady(e)?'Criterios guardados. Ya podés calificar.':'Guardado. Todavía faltan criterios.',!criteriaReady(e));
    };
    host.querySelector('[data-v76-download]').onclick=()=>downloadExcel(ctx,e,students);
    host.querySelector('[data-v76-import]').onchange=ev=>{const f=ev.target.files?.[0];if(f)importExcel(ctx,e,students,f);ev.target.value=''};
    bindSheet(e,students);
  }

  function sheetHtml(e,students){
    return `<div class="v76-sheet-wrap"><table class="v76-sheet"><thead><tr>
      <th>DNI</th><th>Estudiante</th><th>Etapa alcanzada</th>
      ${e.criteria.map(c=>`<th title="${esc(c)}">${esc(c)}</th>`).join('')}
      <th>Calificación final</th><th>Ponderación %</th><th>Calificación ponderada</th>
    </tr></thead><tbody>${students.map(s=>{const r=rowFor(e,s);calcWeighted(r);return`<tr data-dni="${esc(s.dni)}">
      <td>${esc(s.dni)}</td><td><strong>${esc(s.lastName||'')} ${esc(s.firstName||'')}</strong></td>
      <td><select data-v76-field="stage"><option value="">—</option>${STAGES.map(([k,l])=>`<option value="${k}" ${r.stage===k?'selected':''}>${l}</option>`).join('')}</select></td>
      ${r.criteria.map((v,i)=>`<td><input data-v76-score="${i}" value="${esc(v)}"></td>`).join('')}
      <td><input data-v76-field="final" value="${esc(r.final)}"></td>
      <td><input data-v76-field="weight" value="${esc(r.weight)}"></td>
      <td><input data-v76-field="weighted" readonly value="${esc(r.weighted)}"></td>
    </tr>`}).join('')}</tbody></table></div>`;
  }

  function bindSheet(e,students){
    const table=$('v76GradingRoot')?.querySelector('.v76-sheet');if(!table)return;
    table.querySelectorAll('tbody tr').forEach(tr=>{
      const dni=tr.dataset.dni,s=students.find(x=>x.dni===dni),r=rowFor(e,s);
      tr.querySelectorAll('[data-v76-score]').forEach(x=>x.onchange=()=>{r.criteria[Number(x.dataset.v76Score)]=x.value;saveAll()});
      tr.querySelectorAll('[data-v76-field]').forEach(x=>x.onchange=()=>{
        if(x.dataset.v76Field==='weighted')return;
        r[x.dataset.v76Field]=x.value;
        calcWeighted(r);saveAll();
        const w=tr.querySelector('[data-v76-field="weighted"]');if(w)w.value=r.weighted;
        if(x.dataset.v76Field==='stage')renderPlan();
      });
    });
  }

  function loadXLSX(){
    if(window.XLSX)return Promise.resolve(window.XLSX);
    return new Promise((resolve,reject)=>{
      const old=document.querySelector('script[data-pci-xlsx]');
      if(old){old.addEventListener('load',()=>resolve(window.XLSX),{once:true});if(window.XLSX)resolve(window.XLSX);return}
      const s=document.createElement('script');s.dataset.pciXlsx='1';s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=()=>resolve(window.XLSX);s.onerror=()=>reject(new Error('No se pudo cargar Excel.'));document.head.appendChild(s);
    });
  }

  async function downloadExcel(ctx,e,students){
    if(!criteriaReady(e))return toast('Primero completá los cuatro criterios.',true);
    try{
      const XLSX=await loadXLSX();
      const rows=students.map(s=>{const r=rowFor(e,s);calcWeighted(r);const o={DNI:s.dni,Apellido:s.lastName||'',Nombre:s.firstName||'','Etapa alcanzada':STAGES.find(x=>x[0]===r.stage)?.[1]||''};
        e.criteria.forEach((c,i)=>o[c]=r.criteria[i]||'');
        o['Calificación final']=r.final||'';o['Ponderación %']=r.weight||'';o['Calificación ponderada']=r.weighted||'';return o;
      });
      const ws=XLSX.utils.json_to_sheet(rows);
      const meta=XLSX.utils.aoa_to_sheet([
        ['__PLAN_KEY',ctx.key],['Orientación',ctx.orientation],['Agrupamiento',e.groupName],['Plan',ctx.planNumber],['Comisión',ctx.commission.course],
        ['IMPORTANTE','No modificar DNI ni encabezados. La calificación ponderada se recalcula al importar.']
      ]);
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'CALIFICACIONES');XLSX.utils.book_append_sheet(wb,meta,'PLAN');
      XLSX.writeFile(wb,`calificaciones-${slug(e.groupName)}-plan-${ctx.planNumber}-${slug(ctx.commission.course)}.xlsx`);
    }catch(err){toast(err.message||String(err),true)}
  }

  async function importExcel(ctx,e,students,file){
    try{
      const XLSX=await loadXLSX(),buf=await file.arrayBuffer(),wb=XLSX.read(buf,{type:'array'});
      const meta=wb.Sheets.PLAN?XLSX.utils.sheet_to_json(wb.Sheets.PLAN,{header:1,defval:''}):[];
      const fileKey=String(meta.find(r=>r[0]==='__PLAN_KEY')?.[1]||'');
      if(fileKey&&fileKey!==ctx.key)throw new Error('El Excel pertenece a otro plan o comisión.');
      const sheet=wb.Sheets.CALIFICACIONES||wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(sheet,{defval:''}),studentMap=new Map(students.map(s=>[String(s.dni),s]));
      let updated=0,unknown=0;
      for(const raw of data){
        const dni=String(raw.DNI||'').replace(/\D/g,'');const s=studentMap.get(dni);if(!s){if(dni)unknown++;continue}
        const r=rowFor(e,s);
        const stageLabel=String(raw['Etapa alcanzada']||'').trim();
        r.stage=STAGES.find(x=>x[1].toLowerCase()===stageLabel.toLowerCase())?.[0]||r.stage||'';
        e.criteria.forEach((c,i)=>{if(Object.prototype.hasOwnProperty.call(raw,c))r.criteria[i]=String(raw[c]??'')});
        r.final=String(raw['Calificación final']??r.final??'');
        r.weight=String(raw['Ponderación %']??r.weight??'');
        calcWeighted(r);updated++;
      }
      saveAll();renderPlan();toast(`${updated} estudiantes actualizados${unknown?` · ${unknown} DNI no encontrados`:''}.`,unknown>0);
    }catch(err){toast(err.message||String(err),true)}
  }

  const prevScreen=window.screen;
  if(typeof prevScreen==='function'&&!prevScreen.__v76){
    const wrapped=function(id){const out=prevScreen(id);if(id==='grading')setTimeout(renderHome,0);return out};Object.assign(wrapped,prevScreen);wrapped.__v76=true;window.screen=wrapped;
  }

  function start(){ensureScreen();patchHomeEntry()}
  window.addEventListener('pci-app-ready',()=>setTimeout(start,900));
  setTimeout(start,1600);

  const style=document.createElement('style');style.textContent=`
    .v76-topbar{display:flex;justify-content:flex-start;margin:0 0 12px}.v76-empty-state{display:grid;gap:5px;margin-top:14px;padding:22px;border:1px dashed var(--line);border-radius:16px;background:#fff;color:var(--muted)}.v76-empty-state strong{color:var(--ink)}
    #grading .v76-hero{margin:-22px -24px 16px;padding:28px 24px;border-radius:0 0 28px 28px;background:linear-gradient(135deg,#edf3f8,#f7fbfa)}#grading .v76-hero h1{margin:4px 0 6px;font-size:clamp(1.8rem,3vw,3rem)}#grading .v76-hero p{margin:0;color:var(--muted)}
    .v76-summary{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.v76-summary span{padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:.6rem}.v76-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.v76-card{padding:16px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.v76-card-head{display:flex;justify-content:space-between;gap:8px;font-size:.56rem;color:var(--muted)}.v76-card h3{margin:8px 0 4px}.v76-card p,.v76-card>small{color:var(--muted);font-size:.62rem;line-height:1.4}.v76-plan-buttons{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:12px}.v76-plan-buttons button{padding:9px;border:1px solid var(--line);border-radius:12px;background:var(--band);text-align:left;color:var(--ink)}.v76-plan-buttons span{display:block;font-weight:900}.v76-plan-buttons small{font-size:.5rem;color:var(--muted)}.v76-ready{margin-top:9px;font-size:.55rem;color:var(--muted)}
    .v76-plan-top{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}.v76-plan-top h1{margin:4px 0}.v76-plan-name{margin:2px 0 5px;font-size:1rem;color:var(--mint-dark)}.v76-plan-top p{margin:0;color:var(--muted);font-size:.68rem}.v76-criteria,.v76-sheet-section{padding:18px;margin-top:14px}.v76-criteria h2,.v76-sheet-section h2{margin:4px 0}.v76-criteria>p,.v76-sheet-section p{margin:0;color:var(--muted);font-size:.68rem}.v76-criteria-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.v76-criteria-grid label{display:grid;gap:4px}.v76-criteria-grid span{font-size:.6rem;font-weight:900}.v76-criteria-grid textarea{min-height:82px;padding:9px;border:1px solid var(--line);border-radius:10px}.v76-criteria-actions{display:flex;align-items:center;gap:8px;margin-top:10px}.v76-criteria-actions .ok{color:var(--ok);font-size:.58rem;font-weight:900}.v76-criteria-actions .pending{color:#8a6414;font-size:.58rem;font-weight:900}
    .v76-dashboard{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.v76-dashboard button{padding:13px;border:1px solid var(--line);border-radius:16px;background:#fff;text-align:left;color:var(--ink)}.v76-dashboard strong{display:block;font-size:1.35rem}.v76-dashboard span{display:block;font-weight:900;font-size:.62rem}.v76-dashboard small{display:block;margin-top:3px;color:var(--muted);font-size:.48rem}
    .v76-sheet-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v76-excel-actions{display:flex;gap:7px;flex-wrap:wrap}.v76-excel-actions label{cursor:pointer}.v76-lock{margin-top:12px;padding:18px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);text-align:center}.v76-sheet-wrap{overflow:auto;margin-top:12px;border:1px solid var(--line);border-radius:14px}.v76-sheet{width:100%;min-width:1400px;border-collapse:collapse;font-size:.6rem}.v76-sheet th{position:sticky;top:0;background:var(--band);z-index:2;text-align:left;max-width:220px}.v76-sheet th,.v76-sheet td{padding:7px;border-bottom:1px solid var(--line);vertical-align:middle}.v76-sheet input,.v76-sheet select{width:100%;min-width:88px;padding:7px;border:1px solid var(--line);border-radius:8px;background:#fff}.v76-sheet td:nth-child(2){min-width:190px}
    @media(max-width:760px){#grading .v76-hero{margin:-18px -12px 14px;padding:20px 14px}.v76-plan-top{flex-direction:column}.v76-criteria-grid{grid-template-columns:1fr}.v76-dashboard{grid-template-columns:1fr 1fr}.v76-sheet-head{flex-direction:column}.v76-excel-actions{width:100%}.v76-excel-actions .btn{flex:1;text-align:center}}
  `;document.head.appendChild(style);

  window.PCIGradingV76={openGrading,renderHome,openPlan,allContexts};
})();