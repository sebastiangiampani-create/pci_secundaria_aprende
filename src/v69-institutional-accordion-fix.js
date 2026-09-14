(() => {
  const $=id=>document.getElementById(id);
  let observer=null,observedHost=null,timer=null,rendering=false;

  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const schoolKey=()=>norm(window.state?.school||'escuela')||'escuela';

  function sectionTitle(section){
    return section.querySelector(':scope > h2')?.textContent?.trim()||section.querySelector(':scope > .eyebrow')?.textContent?.trim()||section.id||'Sección';
  }
  function sectionKey(section){
    if(section.id)return section.id;
    const eye=section.querySelector(':scope > .eyebrow')?.textContent||'';
    return norm(`${eye}-${sectionTitle(section)}`)||'seccion';
  }
  function storageKey(section){return `pci-v69d-accordion:${schoolKey()}:${sectionKey(section)}`}
  function saved(section){
    try{const v=localStorage.getItem(storageKey(section));return v===null?null:v==='1'}catch{return null}
  }
  function persist(section,collapsed){try{localStorage.setItem(storageKey(section),collapsed?'1':'0')}catch{}}
  function defaultCollapsed(section){
    const text=norm(`${section.querySelector(':scope > .eyebrow')?.textContent||''} ${sectionTitle(section)}`);
    if(text.includes('demanda-institucional')||text.includes('horas-catedra-reales'))return false;
    if(text.includes('carga-masiva')||text.includes('importar-docentes')||text.includes('excel'))return false;
    return true;
  }
  function setCollapsed(section,collapsed,remember=true){
    section.classList.toggle('v69d-collapsed',collapsed);
    const btn=section.querySelector(':scope > .v69d-accordion-toggle');
    if(btn){
      btn.textContent=collapsed?'▸ Abrir':'▾ Cerrar';
      btn.setAttribute('aria-expanded',String(!collapsed));
      btn.setAttribute('aria-label',`${collapsed?'Abrir':'Cerrar'} ${sectionTitle(section)}`);
    }
    if(remember)persist(section,collapsed);
  }
  function prepareSection(section){
    if(!section||section.dataset.v69dAccordion==='1')return;
    const h=section.querySelector(':scope > h2');if(!h)return;
    section.dataset.v69dAccordion='1';
    section.classList.add('v69d-accordion');

    // Neutraliza el acordeón anterior. Se conserva el flag v69Collapsible=1
    // para que el módulo anterior no vuelva a crear su propio botón.
    section.querySelectorAll(':scope > .v69-section-toggle').forEach(x=>x.remove());
    section.classList.remove('v69-collapsed','v69-collapsible');
    section.dataset.v69Collapsible='1';
    h.onclick=null;h.removeAttribute('title');

    const btn=document.createElement('button');
    btn.type='button';btn.className='v69d-accordion-toggle';
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();setCollapsed(section,!section.classList.contains('v69d-collapsed'))};
    section.insertBefore(btn,h.nextSibling);
    h.classList.add('v69d-accordion-title');
    h.onclick=()=>setCollapsed(section,!section.classList.contains('v69d-collapsed'));

    const prior=saved(section);
    setCollapsed(section,prior===null?defaultCollapsed(section):prior,false);
  }
  function sections(){
    const host=$('v48InstitutionalContent');if(!host)return[];
    return [...host.querySelectorAll(':scope > .v48-section')];
  }
  function ensureToolbar(){
    const host=$('v48InstitutionalContent');if(!host)return;
    // El toolbar viejo permanece oculto para que v69-ux no intente recrearlo.
    const old=$('v69AccordionToolbar');if(old)old.classList.add('v69d-superseded');
    let bar=$('v69dAccordionToolbar');
    if(!bar){
      bar=document.createElement('div');bar.id='v69dAccordionToolbar';bar.className='v69d-accordion-toolbar';
      bar.innerHTML='<div><strong>Implementación institucional por bloques</strong><span>Abrí solamente la parte que necesitás trabajar.</span></div><div class="v69d-toolbar-actions"><button type="button" class="btn small soft" data-v69d-open-all>Abrir todo</button><button type="button" class="btn small soft" data-v69d-close-all>Cerrar todo</button></div>';
    }
    if(bar.parentElement!==host)host.prepend(bar);
  }
  function dedupeImportActions(){
    document.querySelectorAll('#v69ImportHero').forEach(x=>x.remove());
    const pinned=[...document.querySelectorAll('#v69ExcelPinned')];
    pinned.slice(1).forEach(x=>x.remove());
  }
  function refresh(){
    if(rendering)return;
    const screen=$('institutional'),host=$('v48InstitutionalContent');
    if(!screen||!host||!screen.classList.contains('active'))return;
    rendering=true;
    try{
      ensureToolbar();
      dedupeImportActions();
      sections().forEach(prepareSection);
      const old=$('v69AccordionToolbar');if(old)old.classList.add('v69d-superseded');
    }finally{rendering=false}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,70)}
  function bind(){
    const host=$('v48InstitutionalContent');if(!host||host===observedHost)return;
    observer?.disconnect();observedHost=host;observer=new MutationObserver(schedule);observer.observe(host,{childList:true,subtree:false});
  }
  function burst(){[0,100,260,600,1200].forEach(ms=>setTimeout(()=>{bind();refresh()},ms))}

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-v69d-open-all]')){sections().forEach(s=>setCollapsed(s,false));return}
    if(e.target.closest('[data-v69d-close-all]')){sections().forEach(s=>setCollapsed(s,true));return}
    if(e.target.closest('#openInstitutionalGeneral,#openInstitutional,[data-v48-home],[data-v48-panel]'))burst();
  },true);
  window.addEventListener('pci-app-ready',burst);
  document.addEventListener('DOMContentLoaded',burst,{once:true});
  burst();

  const style=document.createElement('style');
  style.textContent=`
    #v69AccordionToolbar.v69d-superseded{display:none!important}
    .v69d-accordion-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;margin:12px 0;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#f6f9fc,#eef5f8);box-shadow:0 4px 14px rgba(18,57,92,.05)}
    .v69d-accordion-toolbar strong{display:block;font-size:.72rem;color:var(--ink)}
    .v69d-accordion-toolbar span{display:block;margin-top:2px;font-size:.56rem;color:var(--muted)}
    .v69d-toolbar-actions{display:flex;gap:7px;flex-wrap:wrap}
    .v69d-accordion{position:relative!important;padding-top:16px!important;transition:box-shadow .15s ease,border-color .15s ease}
    .v69d-accordion>.v69d-accordion-title{cursor:pointer!important;padding-right:92px!important;margin-bottom:8px!important}
    .v69d-accordion>.v69d-accordion-title:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
    .v69d-accordion-toggle{position:absolute;right:14px;top:13px;z-index:3;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);padding:5px 9px;font-size:.54rem;font-weight:900;cursor:pointer;box-shadow:0 2px 8px rgba(18,57,92,.05)}
    .v69d-accordion.v69d-collapsed{padding-bottom:12px!important;background:#fbfcfd}
    .v69d-accordion.v69d-collapsed>:not(.eyebrow):not(h2):not(.v69d-accordion-toggle){display:none!important}
    .v69d-accordion.v69d-collapsed>h2{margin-bottom:0!important}
    .v69d-accordion.v69d-collapsed:hover{border-color:#a9bdca;box-shadow:0 5px 14px rgba(18,57,92,.06)}
    #v64TeacherImport.v69d-accordion:not(.v69d-collapsed){border-color:#a9d6cf;background:#fbfffe}
    @media(max-width:720px){.v69d-accordion-toolbar{align-items:flex-start}.v69d-toolbar-actions{width:100%}.v69d-toolbar-actions .btn{flex:1}.v69d-accordion>.v69d-accordion-title{padding-right:78px!important}.v69d-accordion-toggle{right:10px}}
  `;
  document.head.appendChild(style);

  window.PCIInstitutionalAccordionV69={refresh,sections,setCollapsed,burst};
})();