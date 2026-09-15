(() => {
  const $=id=>document.getElementById(id);
  let observer=null,observedHost=null,timer=null;

  function visible(){return !!$('institutional')?.classList.contains('active')}
  function host(){return $('v48InstitutionalContent')}

  function byHeading(pattern){
    const h=host();if(!h)return null;
    return [...h.querySelectorAll(':scope > section, :scope > .card')].find(section=>{
      const title=section.querySelector('h2')?.textContent||'';
      return pattern.test(title);
    })||null;
  }

  function targets(){
    return [
      {key:'excel',label:'Carga Excel',find:()=>$('v71SimpleAssignmentExcel')},
      {key:'docentes',label:'Docentes',find:()=>byHeading(/Docentes de toda la escuela/i)},
      {key:'asignaciones',label:'Asignaciones',find:()=>$('v48InstitutionalContent')?.querySelector('.v66-assignment-section')||byHeading(/Asignación docente/i)},
      {key:'equipos',label:'Equipos y carga',find:()=>byHeading(/equipo|planificaci[oó]n|carga docente/i)},
      {key:'disponibilidad',label:'Disponibilidad',find:()=>$('v60Availability')||byHeading(/Disponibilidad y preferencias/i)},
      {key:'horario',label:'Horario',find:()=>$('v68AnnualScheduler')||byHeading(/grilla|horario/i)},
      {key:'respaldo',label:'Respaldo',find:()=>$('v68InstitutionalExport')||byHeading(/Descargar e imprimir|respaldo/i)}
    ];
  }

  function go(find){
    const el=find?.();if(!el)return;
    const nav=$('v71ManagementNav');
    const offset=(nav?.offsetHeight||0)+12;
    const top=el.getBoundingClientRect().top+window.scrollY-offset;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    el.classList.add('v71k-target-flash');
    setTimeout(()=>el.classList.remove('v71k-target-flash'),900);
  }

  function resetManagement(){
    const hasData=state?.institutional&&Object.keys(state.institutional).length>0;
    const message=hasData
      ?'Esto borra SOLO Gestión Institucional: docentes, asignaciones, disponibilidad, equipos, horarios y respaldos internos. Fase 1 y Fase 2 no se modifican. ¿Querés reiniciar Gestión?'
      :'Gestión Institucional ya está vacía. ¿Querés recargarla desde cero?';
    if(!window.confirm(message))return;
    try{
      state.institutional={};
      save();
      try{sessionStorage.setItem('pci-v71k-management-reset-at',new Date().toISOString())}catch{}
      location.reload();
    }catch(e){
      console.error('V71k reset',e);
      toast('No se pudo reiniciar Gestión Institucional.',true);
    }
  }

  function renderNav(){
    if(!visible())return;
    const screen=$('institutional'),h=host();if(!screen||!h)return;
    let nav=$('v71ManagementNav');
    if(!nav){
      nav=document.createElement('nav');
      nav.id='v71ManagementNav';
      nav.className='v71k-management-nav';
      const hero=screen.querySelector('.hero');
      if(hero)hero.after(nav);else screen.prepend(nav);
    }
    const items=targets().filter(x=>x.find());
    nav.innerHTML=`<div class="v71k-nav-scroll">${items.map(x=>`<button type="button" data-v71k-go="${x.key}">${x.label}</button>`).join('')}</div><button type="button" class="v71k-reset" data-v71k-reset>Reiniciar Gestión</button>`;
    for(const item of items){
      nav.querySelector(`[data-v71k-go="${item.key}"]`)?.addEventListener('click',()=>go(item.find));
    }
    nav.querySelector('[data-v71k-reset]')?.addEventListener('click',resetManagement);
  }

  function refresh(){clearTimeout(timer);timer=setTimeout(renderNav,90)}
  function bind(){
    const h=host();if(!h||h===observedHost)return;
    observer?.disconnect();observedHost=h;
    observer=new MutationObserver(refresh);
    observer.observe(h,{childList:true,subtree:false});
  }
  function burst(){[0,180,500,1100,1800].forEach(ms=>setTimeout(()=>{bind();renderNav()},ms))}

  document.addEventListener('click',e=>{if(e.target.closest('#openInstitutionalGeneral,#openInstitutional,[data-v48-home],[data-v48-panel]'))burst()},true);
  window.addEventListener('pci-app-ready',burst);
  document.addEventListener('DOMContentLoaded',burst,{once:true});
  burst();

  const style=document.createElement('style');
  style.textContent=`
    .v71k-management-nav{position:sticky;top:0;z-index:80;display:flex;gap:8px;align-items:center;margin:10px 0 12px;padding:9px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.96);box-shadow:0 6px 18px rgba(18,57,92,.08);backdrop-filter:blur(8px)}
    .v71k-nav-scroll{display:flex;gap:6px;overflow-x:auto;flex:1 1 auto;scrollbar-width:thin;padding-bottom:1px}
    .v71k-management-nav button{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);padding:7px 10px;font-size:.58rem;font-weight:850;cursor:pointer;white-space:nowrap}
    .v71k-management-nav button:hover{border-color:#8fbfb8;background:#f4fbf9}
    .v71k-management-nav .v71k-reset{border-color:#d7a8b2;background:#fff5f6;color:var(--danger)}
    .v71k-target-flash{outline:3px solid rgba(70,160,145,.22);outline-offset:3px;transition:outline-color .9s ease}
    @media(max-width:780px){
      .v71k-management-nav{top:0;margin-left:-2px;margin-right:-2px;padding:7px;border-radius:11px;align-items:stretch;flex-direction:column}
      .v71k-nav-scroll{width:100%}
      .v71k-management-nav .v71k-reset{width:100%;text-align:center}
    }
  `;
  document.head.appendChild(style);

  window.PCIManagementNavResetV71={renderNav,resetManagement,go};
})();