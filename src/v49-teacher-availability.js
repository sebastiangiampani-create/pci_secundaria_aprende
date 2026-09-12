(() => {
  const $id=id=>document.getElementById(id);
  const DAYS=[['mon','Lunes'],['tue','Martes'],['wed','Miércoles'],['thu','Jueves'],['fri','Viernes']];
  let selectedTeacher=null,observer=null,refreshTimer=null;
  const inst=()=>{state.institutional=state.institutional||{};state.institutional.availability=state.institutional.availability||{};state.institutional.scheduleConfig=state.institutional.scheduleConfig||{periodsPerDay:8};return state.institutional};
  const teachers=()=>Object.values(inst().teachers||{}).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es'));
  const cfg=()=>inst().scheduleConfig;
  const periods=()=>Math.max(1,Math.min(12,Number(cfg().periodsPerDay)||8));
  const key=(day,p)=>`${day}:${p}`;
  const available=(teacherId,day,p)=>inst().availability?.[teacherId]?.[key(day,p)]!==false;
  function setAvailable(teacherId,day,p,value){const root=inst();root.availability[teacherId]=root.availability[teacherId]||{};if(value)delete root.availability[teacherId][key(day,p)];else root.availability[teacherId][key(day,p)]=false;save()}

  const style=document.createElement('style');style.textContent=`
    .v49-controls{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:12px}.v49-controls label{display:grid;gap:4px;font-size:.62rem;font-weight:850}.v49-controls select,.v49-controls input{padding:8px 9px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink)}
    .v49-grid-wrap{overflow:auto;margin-top:12px;border:1px solid var(--line);border-radius:13px}.v49-grid{width:100%;min-width:700px;border-collapse:collapse;font-size:.66rem}.v49-grid th{padding:8px;background:var(--band);font-size:.58rem;text-transform:uppercase;letter-spacing:.04em}.v49-grid td{padding:5px;border-top:1px solid var(--line);text-align:center}.v49-period{font-weight:900;background:#fafcfd}.v49-slot{width:100%;min-height:34px;border:1px solid #b9d9d5;border-radius:8px;background:var(--mint-soft);color:var(--mint-dark);font-size:.6rem;font-weight:900}.v49-slot.off{border-color:#e0bdc5;background:var(--danger-soft);color:var(--danger)}
    .v49-legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:.61rem;color:var(--muted)}.v49-legend span{display:inline-flex;align-items:center;gap:5px}.v49-dot{width:9px;height:9px;border-radius:50%;background:var(--mint)}.v49-dot.off{background:#d57a8d}
    .v49-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v49-actions button{border:1px solid var(--line);border-radius:999px;background:#fff;padding:7px 10px;font-size:.62rem;font-weight:850;color:var(--ink)}
  `;document.head.appendChild(style);

  function renderGrid(section){
    const list=teachers();if(!list.length){section.querySelector('[data-v49-body]').innerHTML='<div class="v48-empty">Primero cargá docentes en la sección anterior.</div>';return}
    if(!selectedTeacher||!inst().teachers?.[selectedTeacher])selectedTeacher=list[0].id;
    const body=section.querySelector('[data-v49-body]'),n=periods();
    body.innerHTML=`<div class="v49-controls"><label>Docente<select id="v49Teacher">${list.map(t=>`<option value="${esc(t.id)}" ${t.id===selectedTeacher?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label>Módulos por día<input id="v49Periods" type="number" min="1" max="12" value="${n}"></label></div><div class="v49-grid-wrap"><table class="v49-grid"><thead><tr><th>Módulo</th>${DAYS.map(([,l])=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${Array.from({length:n},(_,i)=>{const p=i+1;return`<tr><td class="v49-period">${p}</td>${DAYS.map(([d])=>{const ok=available(selectedTeacher,d,p);return`<td><button type="button" class="v49-slot ${ok?'':'off'}" data-v49-slot="${d}" data-period="${p}">${ok?'Disponible':'No disponible'}</button></td>`}).join('')}</tr>`}).join('')}</tbody></table></div><div class="v49-legend"><span><i class="v49-dot"></i> Disponible para asignar</span><span><i class="v49-dot off"></i> Bloqueo declarado por el docente</span></div><div class="v49-actions"><button type="button" data-v49-all="on">Marcar todo disponible</button><button type="button" data-v49-all="off">Marcar todo no disponible</button></div>`;
    $id('v49Teacher').onchange=e=>{selectedTeacher=e.target.value;renderGrid(section)};
    $id('v49Periods').onchange=e=>{cfg().periodsPerDay=Math.max(1,Math.min(12,Number(e.target.value)||8));save();renderGrid(section)};
    body.querySelectorAll('[data-v49-slot]').forEach(b=>b.onclick=()=>{const d=b.dataset.v49Slot,p=Number(b.dataset.period),next=!available(selectedTeacher,d,p);setAvailable(selectedTeacher,d,p,next);renderGrid(section)});
    body.querySelectorAll('[data-v49-all]').forEach(b=>b.onclick=()=>{const value=b.dataset.v49All==='on';for(const[d]of DAYS)for(let p=1;p<=periods();p++)setAvailable(selectedTeacher,d,p,value);renderGrid(section)});
  }

  function ensureSection(){
    const host=$id('v48InstitutionalContent');if(!host||!$id('institutional')?.classList.contains('active'))return;
    let section=$id('v49Availability');if(!section){section=document.createElement('section');section.id='v49Availability';section.className='card v48-section';section.innerHTML='<div class="eyebrow">Disponibilidad docente</div><h2>Disponibilidad semanal para construir horarios</h2><p>Cada docente parte como disponible. Marcá únicamente los módulos en los que no puede trabajar. Esta información no modifica el PCI ni las asignaciones docentes.</p><div data-v49-body></div>';host.appendChild(section)}
    renderGrid(section);
  }
  function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(ensureSection,40)}
  function start(){
    scheduleRefresh();const host=$id('v48InstitutionalContent');if(host&&!observer){observer=new MutationObserver(scheduleRefresh);observer.observe(host,{childList:true,subtree:false})}
  }
  window.addEventListener('pci-app-ready',()=>setTimeout(start,80));
  document.addEventListener('click',e=>{if(e.target.closest('#openInstitutional,[data-v48-panel]'))setTimeout(start,80)},true);
  window.PCIAvailabilityV49={DAYS,periods,available,setAvailable,ensureSection,config:cfg};
})();
