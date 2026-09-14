(() => {
  const $=id=>document.getElementById(id);
  const importer=()=>window.PCITeacherImportV64||null;
  let screenObserver=null,contentObserver=null,observedContent=null,timer=null;

  function visibleInstitutional(){
    return !!$('institutional')?.classList.contains('active');
  }

  function showSection(){
    const section=$('v64TeacherImport');
    if(!section)return false;
    section.classList.remove('v69-collapsed');
    const toggle=section.querySelector(':scope > .v69-section-toggle');
    if(toggle){
      toggle.textContent='▾ Ocultar';
      toggle.setAttribute('aria-expanded','true');
    }
    return true;
  }

  function ensureHeroActions(){
    const screen=$('institutional');
    if(!screen)return;
    const hero=screen.querySelector('.hero');
    if(!hero)return;
    let actions=hero.querySelector('.v48-hero-actions');
    if(!actions){
      actions=document.createElement('div');
      actions.className='v48-hero-actions';
      hero.appendChild(actions);
    }
    if($('v69ExcelPinned'))return;
    const box=document.createElement('div');
    box.id='v69ExcelPinned';
    box.className='v69-excel-pinned';
    box.innerHTML=`<div><strong>Carga masiva por Excel</strong><small>Descargá el modelo con las materias y cursos de Fase 1, completá Docente / Email y volvé a importarlo.</small></div><div class="v69-excel-pinned-actions"><button type="button" class="btn soft" id="v69PinnedTemplate">Descargar modelo Excel</button><button type="button" class="btn primary" id="v69PinnedImport">Importar Excel / CSV</button></div>`;
    actions.appendChild(box);
    $('v69PinnedTemplate').onclick=()=>{
      const api=importer();
      if(api?.downloadTemplate)return api.downloadTemplate();
      toast('La plantilla todavía se está cargando. Volvé a intentar en un instante.',true);
    };
    $('v69PinnedImport').onclick=()=>openImport();
  }

  function ensureImportSection(){
    if(!visibleInstitutional())return;
    try{importer()?.decorate?.()}catch(e){console.warn('V69 Excel import decorate',e)}
    if(showSection())return;
    setTimeout(()=>{try{importer()?.decorate?.()}catch{};showSection()},120);
  }

  function openImport(){
    ensureImportSection();
    const attempts=[0,120,320,700];
    for(const delay of attempts)setTimeout(()=>{
      ensureImportSection();
      const section=$('v64TeacherImport'),input=$('v64TeacherFile');
      if(section){
        showSection();
        if(delay===320)section.scrollIntoView({behavior:'smooth',block:'start'});
      }
      if(input&&delay===700)input.click();
    },delay);
  }

  function bindObservers(){
    const screen=$('institutional');
    if(screen&&!screenObserver){
      screenObserver=new MutationObserver(()=>schedule());
      screenObserver.observe(screen,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
    }
    const host=$('v48InstitutionalContent');
    if(host&&host!==observedContent){
      contentObserver?.disconnect();
      observedContent=host;
      contentObserver=new MutationObserver(()=>schedule());
      contentObserver.observe(host,{childList:true,subtree:false});
    }
  }

  function refresh(){
    bindObservers();
    ensureHeroActions();
    if(visibleInstitutional())ensureImportSection();
  }
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(refresh,80);
  }
  function burst(){
    [0,100,260,650,1200].forEach(ms=>setTimeout(refresh,ms));
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#openInstitutionalGeneral,#openInstitutional,[data-v48-home],[data-v48-panel]'))burst();
  },true);
  window.addEventListener('pci-app-ready',burst);
  document.addEventListener('DOMContentLoaded',burst,{once:true});
  burst();

  const style=document.createElement('style');
  style.textContent=`
    .v69-excel-pinned{display:flex;align-items:center;justify-content:space-between;gap:14px;flex:1 1 100%;padding:12px 14px;border:1px solid #a9d6cf;border-radius:13px;background:linear-gradient(135deg,#f7fffd,#edf8f7)}
    .v69-excel-pinned strong{display:block;font-size:.72rem;color:var(--ink)}
    .v69-excel-pinned small{display:block;margin-top:3px;max-width:760px;font-size:.56rem;line-height:1.4;color:var(--muted)}
    .v69-excel-pinned-actions{display:flex;gap:7px;flex-wrap:wrap;flex:0 0 auto}
    @media(max-width:820px){.v69-excel-pinned{align-items:flex-start;flex-direction:column}.v69-excel-pinned-actions{width:100%}.v69-excel-pinned-actions .btn{flex:1 1 180px}}
  `;
  document.head.appendChild(style);

  window.PCIVisibilityHotfixV69={refresh,openImport,ensureImportSection,ensureHeroActions};
})();