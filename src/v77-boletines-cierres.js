(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STATUSES=[
    ['carga','En carga'],
    ['revision','En revisión'],
    ['validado','Validado'],
    ['publicado','Publicado']
  ];
  let selectedKey='';
  let homeFilters={orientation:'',year:'',course:'',search:''};

  function root(){
    state.institutional=state.institutional||{};
    state.institutional.grading=state.institutional.grading||{plans:{}};
    state.institutional.grading.plans=state.institutional.grading.plans||{};
    state.institutional.grading.closures=state.institutional.grading.closures||{};
    state.institutional.grading.settings=state.institutional.grading.settings||{showCriteriaToFamilies:false};
    return state.institutional;
  }

  const commissions=()=>window.PCIStudentsCommissionsV72?.commissionDefs?.()||[];
  const studentsFor=key=>window.PCIStudentsCommissionsV72?.studentsFor?.(key)||[];

  function planEntries(){
    return Object.values(root().grading.plans||{}).filter(Boolean);
  }

  function closureGroups(){
    const map=new Map();
    for(const p of planEntries()){
      const key=[p.orientation,p.groupId,p.commissionKey].join('|||');
      if(!map.has(key))map.set(key,{
        key,
        orientation:p.orientation||'',
        groupId:p.groupId||'',
        groupName:p.groupName||'Agrupamiento',
        groupType:p.groupType||'',
        year:p.year||'',
        commissionKey:p.commissionKey||'',
        course:p.course||'',
        plans:[]
      });
      map.get(key).plans.push(p);
    }
    for(const g of map.values())g.plans.sort((a,b)=>Number(a.planNumber)-Number(b.planNumber));
    return [...map.values()].sort((a,b)=>String(a.orientation).localeCompare(String(b.orientation),'es')||String(a.course).localeCompare(String(b.course),'es')||String(a.groupName).localeCompare(String(b.groupName),'es'));
  }

  function closureType(g){
    return g.plans.length>=4?'Cierre anual':'Cierre cuatrimestral';
  }

  function teachersFor(g){
    try{
      const all=window.PCIGradingV76?.allContexts?.()||[];
      const ctx=all.find(x=>x.orientation===g.orientation&&x.group?.id===g.groupId&&x.commission?.key===g.commissionKey);
      if(!ctx)return[];
      const api=window.PCIInstitutionalV48;
      const r=root(),ids=new Set();
      for(const row of (api?.implementationRows?.(g.orientation)||[])){
        if(row.course!==g.course)continue;
        if(!(ctx.group.subjectIds||[]).includes(row.subjectId))continue;
        const tid=r.assignments?.[row.instanceId];
        if(tid)ids.add(tid);
      }
      return [...ids].map(id=>r.teachers?.[id]).filter(Boolean);
    }catch{return[]}
  }

  function ensureClosure(g){
    const store=root().grading.closures;
    if(!store[g.key])store[g.key]={
      key:g.key,
      orientation:g.orientation,
      groupId:g.groupId,
      groupName:g.groupName,
      commissionKey:g.commissionKey,
      course:g.course,
      year:g.year,
      type:closureType(g),
      status:'carga',
      validatorTeacherId:'',
      rows:{},
      validatedAt:'',
      publishedAt:''
    };
    const c=store[g.key];
    c.rows=c.rows||{};
    c.type=closureType(g);
    return c;
  }

  function rowFor(c,s){
    if(!c.rows[s.dni])c.rows[s.dni]={dni:s.dni,final:'',observation:''};
    return c.rows[s.dni];
  }

  function planGrade(p,dni){
    const r=p.rows?.[dni];
    return r?.weighted!==''&&r?.weighted!=null ? r.weighted : (r?.final??'');
  }

  function hasMissing(g,c){
    const students=studentsFor(g.commissionKey);
    return students.some(s=>String(rowFor(c,s).final||'').trim()==='');
  }

  function canValidate(g,c){
    return !hasMissing(g,c);
  }

  function ensureScreen(){
    let s=$('bulletins');
    if(s)return s;
    const main=document.querySelector('main.wrap');if(!main)return null;
    s=document.createElement('section');s.id='bulletins';s.className='screen';
    s.innerHTML='<div id="v77Root"></div>';main.appendChild(s);return s;
  }

  function showScreen(){
    const s=ensureScreen();if(!s)return;
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
    s.classList.add('active');window.scrollTo(0,0);
  }

  function goHome(){
    const h=$('home');if(!h)return;
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
    h.classList.add('active');
    window.PCIHomeRedesignV74?.refresh?.();
    window.scrollTo(0,0);
  }

  function patchHome(){
    const home=$('home'), grading=$('v75Grading');if(!home||!grading)return;
    let card=$('v77BulletinsEntry');
    if(!card){
      card=document.createElement('article');
      card.id='v77BulletinsEntry';card.className='card v75-grading v77-home-entry';
      grading.after(card);
    }
    card.innerHTML='<div><div class="eyebrow">4 · Boletines</div><h2>Boletines y cierres</h2><p>Valida el cierre común de cada agrupamiento y genera la vista institucional del boletín.</p><small>Un único cierre oficial por agrupamiento, comisión y período.</small></div><button type="button" class="btn primary" data-v77-open>Abrir Boletines</button>';
    card.querySelector('[data-v77-open]').onclick=open;
  }

  function open(){
    showScreen();
    selectedKey='';
    renderHome();
  }

  function statusLabel(s){return STATUSES.find(x=>x[0]===s)?.[1]||s}

  function renderHome(){
    const host=$('v77Root');if(!host)return;
    const groups=closureGroups();
    const settings=root().grading.settings;

    const orientations=[...new Set(groups.map(g=>g.orientation))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
    const years=[...new Set(groups.map(g=>Number(g.year)))].filter(Boolean).sort((a,b)=>a-b);
    const courses=[...new Set(groups.map(g=>g.course))].sort((a,b)=>String(a).localeCompare(String(b),'es'));

    const filtered=groups.filter(g=>
      (!homeFilters.orientation||g.orientation===homeFilters.orientation)&&
      (!homeFilters.year||String(g.year)===String(homeFilters.year))&&
      (!homeFilters.course||g.course===homeFilters.course)&&
      (!homeFilters.search||[g.orientation,g.course,g.groupName,g.year].join(' ').toLocaleLowerCase('es').includes(homeFilters.search.toLocaleLowerCase('es')))
    );

    const byCourse=new Map();
    for(const g of filtered){
      const key=[g.orientation,g.course].join('|||');
      if(!byCourse.has(key))byCourse.set(key,{orientation:g.orientation,course:g.course,year:g.year,groups:[]});
      byCourse.get(key).groups.push(g);
    }

    const published=filtered.filter(g=>ensureClosure(g).status==='publicado').length;
    const validated=filtered.filter(g=>['validado','publicado'].includes(ensureClosure(g).status)).length;

    host.innerHTML=`
      <div class="v77-topbar"><button class="btn soft" type="button" data-v77-home>← Inicio</button></div>
      <div class="v77-hero">
        <div class="eyebrow">Boletines</div>
        <h1>Cierres y publicación</h1>
        <p>El cierre es único para todo el agrupamiento. Los docentes cargan; el equipo revisa; un responsable valida; recién después puede publicarse.</p>
      </div>

      <section class="v77-browser">
        <div class="v77-browser-head">
          <div><div class="eyebrow">Navegación</div><h2>Buscar qué querés cerrar o publicar</h2></div>
          <button type="button" class="btn soft" data-v77-clear>Limpiar filtros</button>
        </div>
        <div class="v77-search"><label><span>Buscar</span><input type="search" data-v77-search placeholder="Agrupamiento, comisión, orientación..." value="${esc(homeFilters.search)}"></label></div>
        <div class="v77-filters">
          <label><span>Orientación</span><select data-v77-filter="orientation"><option value="">Todas</option>${orientations.map(v=>`<option value="${esc(v)}" ${homeFilters.orientation===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
          <label><span>Nivel</span><select data-v77-filter="year"><option value="">Todos</option>${years.map(v=>`<option value="${v}" ${String(homeFilters.year)===String(v)?'selected':''}>Nivel ${v}</option>`).join('')}</select></label>
          <label><span>Comisión</span><select data-v77-filter="course"><option value="">Todas</option>${courses.map(v=>`<option value="${esc(v)}" ${homeFilters.course===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
        </div>
        <div class="v77-summary">
          <span><strong>${filtered.length}</strong> cierres</span>
          <span><strong>${validated}</strong> validados</span>
          <span><strong>${published}</strong> publicados</span>
          <span><strong>${byCourse.size}</strong> comisiones visibles</span>
        </div>
      </section>

      <section class="card v77-settings">
        <div><div class="eyebrow">Familias y estudiantes</div><h2>Visibilidad</h2><p>Por defecto los criterios no son visibles.</p></div>
        <label><input type="checkbox" data-v77-criteria ${settings.showCriteriaToFamilies?'checked':''}> Mostrar criterios a familias y estudiantes</label>
      </section>

      <div class="v77-course-stack">${byCourse.size?[...byCourse.values()].map(block=>`
        <section class="v77-course-block">
          <header class="v77-course-head">
            <div><small>${esc(block.orientation)}</small><h2>${esc(block.course)}</h2></div>
            <span>Nivel ${esc(block.year)}</span>
          </header>
          <div class="v77-grid">${block.groups.map(g=>{
            const c=ensureClosure(g),students=studentsFor(g.commissionKey),missing=students.filter(s=>!String(rowFor(c,s).final||'').trim()).length;
            return `<article class="v77-card">
              <div class="v77-card-head"><span>${esc(closureType(g))}</span><b>${g.plans.length} planes</b></div>
              <h3>${esc(g.groupName)}</h3>
              <div class="v77-tags"><span class="status ${esc(c.status)}">${esc(statusLabel(c.status))}</span><span>${students.length-missing}/${students.length} cierres cargados</span></div>
              <button type="button" class="btn primary" data-v77-open-closure="${esc(g.key)}">Abrir cierre</button>
            </article>`;
          }).join('')}</div>
        </section>`).join(''):'<div class="v77-empty"><strong>No hay resultados con estos filtros.</strong><span>Cambiá orientación, nivel o comisión para volver a ver los cierres disponibles.</span></div>'}</div>`;

    host.querySelector('[data-v77-home]').onclick=goHome;
    host.querySelector('[data-v77-clear]').onclick=()=>{homeFilters={orientation:'',year:'',course:'',search:''};renderHome()};
    host.querySelector('[data-v77-search]').oninput=e=>{homeFilters.search=e.target.value;renderHome()};
    host.querySelectorAll('[data-v77-filter]').forEach(s=>s.onchange=()=>{homeFilters[s.dataset.v77Filter]=s.value;renderHome()});
    host.querySelector('[data-v77-criteria]').onchange=e=>{settings.showCriteriaToFamilies=!!e.target.checked;save();toast('Configuración de visibilidad guardada.')};
    host.querySelectorAll('[data-v77-open-closure]').forEach(b=>b.onclick=()=>{selectedKey=b.dataset.v77OpenClosure;renderClosure()});
  }

  function renderClosure(){
    const host=$('v77Root');if(!host)return;
    const g=closureGroups().find(x=>x.key===selectedKey);if(!g)return renderHome();
    const c=ensureClosure(g),students=studentsFor(g.commissionKey),teachers=teachersFor(g);
    const ready=canValidate(g,c);
    host.innerHTML=`
      <div class="v77-topbar"><button class="btn soft" type="button" data-v77-back>← Boletines</button></div>
      <div class="v77-hero">
        <div class="eyebrow">${esc(g.orientation)} · ${esc(g.course)}</div>
        <h1>${esc(g.groupName)}</h1>
        <p>${esc(c.type)} · ${g.plans.length} planes · ${students.length} estudiantes</p>
      </div>
      <section class="card v77-workflow">
        <div><div class="eyebrow">Flujo de cierre</div><h2>${esc(statusLabel(c.status))}</h2></div>
        <label>Responsable de validación
          <select data-v77-validator>
            <option value="">Seleccionar</option>
            ${teachers.map(t=>`<option value="${esc(t.id)}" ${String(c.validatorTeacherId)===String(t.id)?'selected':''}>${esc(t.name)}</option>`).join('')}
          </select>
        </label>
        <div class="v77-actions">
          <button class="btn soft" type="button" data-v77-review>Enviar a revisión</button>
          <button class="btn primary" type="button" data-v77-validate ${ready?'':'disabled'}>Validar cierre</button>
          <button class="btn primary" type="button" data-v77-publish ${c.status==='validado'?'':'disabled'}>Publicar</button>
        </div>
      </section>
      ${!ready?'<div class="v77-warning">Faltan calificaciones de cierre. No se puede validar todavía.</div>':''}
      <section class="card v77-table-card">
        <div class="eyebrow">Cierre común del agrupamiento</div>
        <h2>Planilla de cierre</h2>
        <div class="v77-table-wrap"><table class="v77-table"><thead><tr>
          <th>DNI</th><th>Estudiante</th>
          ${g.plans.map(p=>`<th>Plan ${esc(p.planNumber)}<small>${esc(p.planName||'')}</small></th>`).join('')}
          <th>Calificación de cierre</th><th>Observación</th>
        </tr></thead><tbody>
          ${students.map(s=>{const r=rowFor(c,s);return `<tr data-dni="${esc(s.dni)}">
            <td>${esc(s.dni)}</td><td><strong>${esc((s.lastName||'')+' '+(s.firstName||''))}</strong></td>
            ${g.plans.map(p=>`<td>${esc(planGrade(p,s.dni)||'—')}</td>`).join('')}
            <td><input data-v77-final value="${esc(r.final)}" ${c.status==='publicado'?'readonly':''}></td>
            <td><input data-v77-obs value="${esc(r.observation)}" ${c.status==='publicado'?'readonly':''}></td>
          </tr>`}).join('')}
        </tbody></table></div>
      </section>
      <section class="card v77-preview">
        <div class="eyebrow">Vista de boletín</div><h2>Vista previa</h2>
        <p>El boletín toma el nombre del agrupamiento y el cierre oficial validado. Los criterios solo se muestran si la escuela habilita esa opción.</p>
        <button type="button" class="btn soft" data-v77-print>Imprimir vista previa</button>
      </section>`;

    host.querySelector('[data-v77-back]').onclick=renderHome;
    host.querySelector('[data-v77-validator]').onchange=e=>{c.validatorTeacherId=e.target.value;save()};
    host.querySelectorAll('tbody tr').forEach(tr=>{
      const r=c.rows[tr.dataset.dni];
      tr.querySelector('[data-v77-final]').onchange=e=>{r.final=e.target.value;save();renderClosure()};
      tr.querySelector('[data-v77-obs]').onchange=e=>{r.observation=e.target.value;save()};
    });
    host.querySelector('[data-v77-review]').onclick=()=>{c.status='revision';save();renderClosure();toast('Cierre enviado a revisión.')};
    host.querySelector('[data-v77-validate]').onclick=()=>{
      if(!c.validatorTeacherId)return toast('Seleccioná un responsable de validación.',true);
      if(!canValidate(g,c))return toast('Faltan calificaciones de cierre.',true);
      c.status='validado';c.validatedAt=new Date().toISOString();save();renderClosure();toast('Cierre validado.');
    };
    host.querySelector('[data-v77-publish]').onclick=()=>{
      c.status='publicado';c.publishedAt=new Date().toISOString();save();renderClosure();toast('Cierre publicado para boletines.');
    };
    host.querySelector('[data-v77-print]').onclick=()=>printPreview(g,c,students);
  }

  function printPreview(g,c,students){
    const content=$('printContent'),modal=$('printModal');
    if(!content||!modal)return toast('No está disponible la vista de impresión.',true);
    const criteriaVisible=!!root().grading.settings.showCriteriaToFamilies;
    content.className='print-preview-wrap';
    content.innerHTML=`<article class="pci-print-sheet"><div class="pci-print-kicker">Boletín · ${esc(state.school||'Escuela')}</div><h1>${esc(g.course)} · ${esc(g.groupName)}</h1><p><strong>${esc(c.type)}</strong> · Estado: ${esc(statusLabel(c.status))}</p>
      <table style="width:100%;border-collapse:collapse"><thead><tr><th style="border:1px solid #bbb;padding:6px">Estudiante</th><th style="border:1px solid #bbb;padding:6px">Calificación</th><th style="border:1px solid #bbb;padding:6px">Observación</th></tr></thead><tbody>
      ${students.map(s=>{const r=rowFor(c,s);return `<tr><td style="border:1px solid #bbb;padding:6px">${esc((s.lastName||'')+' '+(s.firstName||''))}</td><td style="border:1px solid #bbb;padding:6px">${esc(r.final||'—')}</td><td style="border:1px solid #bbb;padding:6px">${esc(r.observation||'')}</td></tr>`}).join('')}</tbody></table>
      <p style="margin-top:12px;font-size:.8rem">Criterios visibles para familias: <strong>${criteriaVisible?'Sí':'No'}</strong></p></article>`;
    modal.classList.add('open');
  }

  function start(){ensureScreen();patchHome()}
  window.addEventListener('pci-app-ready',()=>setTimeout(start,1200));
  setTimeout(start,1800);

  const style=document.createElement('style');style.textContent=`
    .v77-home-entry{margin-top:12px!important}.v77-topbar{margin-bottom:12px}.v77-hero{padding:24px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,#f6fafc,#eef6f4)}.v77-hero h1{margin:4px 0 5px}.v77-hero p{margin:0;color:var(--muted);font-size:.7rem}
    .v77-browser{margin:14px 0;padding:16px;border:1px solid var(--line);border-radius:18px;background:#fff}.v77-browser-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.v77-browser-head h2{margin:4px 0 0}.v77-search{margin-top:12px}.v77-search label{display:grid;gap:5px}.v77-search span{font-size:.56rem;font-weight:900;color:var(--muted)}.v77-search input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}.v77-filters{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-top:10px}.v77-filters label{display:grid;gap:5px}.v77-filters span{font-size:.56rem;font-weight:900;color:var(--muted)}.v77-filters select{width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}.v77-summary{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.v77-summary span{padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:var(--band);font-size:.6rem}.v77-course-stack{display:grid;gap:18px;margin-top:14px}.v77-course-block{padding:16px;border:1px solid var(--line);border-radius:20px;background:#f9fbfc}.v77-course-head{display:flex;justify-content:space-between;align-items:end;gap:10px;margin-bottom:12px}.v77-course-head small{display:block;color:var(--muted);font-size:.55rem}.v77-course-head h2{margin:3px 0 0}.v77-course-head>span{padding:6px 9px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:.54rem;font-weight:900}
    .v77-settings,.v77-workflow,.v77-table-card,.v77-preview{margin-top:14px;padding:17px}.v77-settings{display:flex;justify-content:space-between;align-items:center;gap:14px}.v77-settings h2,.v77-workflow h2,.v77-table-card h2,.v77-preview h2{margin:4px 0}.v77-settings p,.v77-preview p{margin:0;color:var(--muted);font-size:.64rem}
    .v77-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.v77-card{padding:15px;border:1px solid var(--line);border-radius:17px;background:#fff}.v77-card-head{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:.55rem}.v77-card h3{margin:8px 0 4px}.v77-card p{margin:0;color:var(--muted);font-size:.6rem}.v77-tags{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.v77-tags span{padding:5px 7px;border-radius:999px;background:var(--band);font-size:.52rem}.v77-tags .publicado{background:var(--ok-soft);color:var(--ok)}.v77-tags .validado{background:var(--mint-soft);color:var(--mint-dark)}.v77-empty,.v77-warning{margin-top:14px;padding:14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}.v77-warning{border-color:#dfc476;background:#fff8df;color:#775b0c}
    .v77-workflow{display:grid;grid-template-columns:1fr minmax(220px,320px) auto;gap:12px;align-items:end}.v77-workflow label{display:grid;gap:5px;font-size:.58rem;font-weight:900}.v77-workflow select{padding:9px;border:1px solid var(--line);border-radius:9px;background:#fff}.v77-actions{display:flex;gap:6px;flex-wrap:wrap}
    .v77-table-wrap{overflow:auto;margin-top:10px;border:1px solid var(--line);border-radius:12px}.v77-table{width:100%;min-width:1100px;border-collapse:collapse;font-size:.58rem}.v77-table th,.v77-table td{padding:7px;border-bottom:1px solid var(--line);vertical-align:middle}.v77-table th{background:var(--band);text-align:left}.v77-table th small{display:block;margin-top:2px;color:var(--muted);font-weight:500}.v77-table input{width:100%;padding:7px;border:1px solid var(--line);border-radius:8px}
    @media(max-width:980px){.v77-grid{grid-template-columns:1fr}.v77-filters{grid-template-columns:1fr 1fr}}@media(max-width:760px){.v77-browser-head,.v77-course-head{align-items:flex-start;flex-direction:column}.v77-filters{grid-template-columns:1fr}.v77-settings,.v77-workflow{grid-template-columns:1fr;align-items:stretch;flex-direction:column}.v77-actions{display:grid;grid-template-columns:1fr}.v77-actions .btn{width:100%}}
  `;document.head.appendChild(style);

  window.PCIBulletinsV77={open,renderHome,renderClosure,closureGroups};
})();