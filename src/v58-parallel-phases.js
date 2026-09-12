(() => {
  const $id=id=>document.getElementById(id);
  const institutionalApi=()=>window.PCIInstitutionalV48||null;
  const offerApi=()=>window.PCIOfferModelV56||null;
  let renderingInstitutional=false;

  const style=document.createElement('style');
  style.textContent=`
    .v58-partial-note{margin:0 0 14px;padding:11px 13px;border:1px solid #d8c68e;border-radius:12px;background:#fff9e8;color:#675317;font-size:.66rem;line-height:1.45}
    .v58-partial-note strong{font-weight:900}.v58-ready-note{margin:0 0 14px;padding:10px 12px;border-radius:11px;background:var(--mint-soft);color:var(--mint-dark);font-size:.64rem;line-height:1.4}
  `;
  document.head.appendChild(style);

  function currentMap(){
    if(!state?.active||typeof ensure!=='function')return null;
    return ensure(state.active);
  }
  function isValidated(){return !!currentMap()?.valid}

  function panelText(){
    const p=$id('panel')?.querySelector('.hero p');
    if(p)p.textContent='Fase 1, Fase 2 e Implementación institucional pueden trabajarse sin esperar el cierre definitivo del Mapa de la Oferta. Mientras Fase 1 esté en construcción, las otras capas utilizan su estado actual.';
  }

  function unlockPanel(){
    panelText();
    const proposalCard=$id('proposalCard'),proposalButton=$id('openProposal');
    proposalCard?.classList.remove('locked');
    if(proposalButton){proposalButton.disabled=false;proposalButton.textContent='Entrar';}
    const institutionalCard=$id('institutionalCard'),institutionalButton=$id('openInstitutional');
    institutionalCard?.classList.remove('locked');
    if(institutionalButton){
      institutionalButton.disabled=false;
      institutionalButton.textContent='Entrar';
      institutionalButton.onclick=()=>{
        if(typeof window.screen==='function')window.screen('institutional');
        setTimeout(renderInstitutionalPartial,0);
      };
    }
  }

  function proposalNote(){
    const proposal=$id('proposal');if(!proposal)return;
    $id('v58ProposalNote')?.remove();
    if(isValidated())return;
    const note=document.createElement('div');note.id='v58ProposalNote';note.className='v58-partial-note';
    note.innerHTML='<strong>Fase 1 en construcción.</strong> Podés desarrollar la Fase 2 normalmente con los espacios que ya están definidos. Si después modificás el Mapa de la Oferta, la Fase 2 conservará lo ya cargado y reflejará la estructura vigente para continuar el desarrollo curricular.';
    const hero=proposal.querySelector('.hero');
    if(hero)hero.after(note);else proposal.prepend(note);
  }

  function institutionalNote(wasValidated){
    const host=$id('v48InstitutionalContent');if(!host)return;
    $id('v58InstitutionalNote')?.remove();
    const note=document.createElement('div');note.id='v58InstitutionalNote';
    if(wasValidated){note.className='v58-ready-note';note.innerHTML='<strong>Fuente:</strong> Implementación institucional lee la estructura actual de Fase 1 y mantiene separada la Fase 2 curricular.';}
    else{note.className='v58-partial-note';note.innerHTML='<strong>Fase 1 en construcción.</strong> La implementación institucional queda habilitada con la información disponible hasta este momento. Podés configurar divisiones, docentes, carga y jornada; los controles de horario avisarán qué datos faltan antes de generar una propuesta completa.';}
    host.prepend(note);
  }

  async function renderInstitutionalPartial(){
    if(renderingInstitutional)return;
    const api=institutionalApi(),map=currentMap();if(!api?.renderInstitutional||!map)return;
    renderingInstitutional=true;
    const wasValidated=!!map.valid;
    if(!wasValidated)map.valid=true;
    try{
      await api.renderInstitutional();
    }catch(error){
      console.error('V58 institutional render',error);
    }finally{
      map.valid=wasValidated;
      renderingInstitutional=false;
    }
    institutionalNote(wasValidated);
  }

  function selectedSemester(){return Number($id('v53Semester')?.value)||1}
  function offerConflicts(){
    const api=offerApi(),teachers=Object.values(state?.institutional?.teachers||{}),sem=selectedSemester();
    if(!api?.offer)return[];
    return teachers.map(t=>({teacher:t,offer:api.offer(t.id,sem)})).filter(x=>x.offer?.conflict);
  }
  function renderOfferConflictReport(conflicts){
    const section=$id('v53Scheduler');if(!section)return;
    section.querySelector('.v58-offer-conflict')?.remove();
    const box=document.createElement('div');box.className='v53-report bad v58-offer-conflict';
    box.innerHTML=`<h3>La oferta obligatoria supera el máximo permitido</h3><ul>${conflicts.map(({teacher,offer})=>`<li>${teacher.name}: ${offer.front} HC frente a curso, ${offer.minimumOutside} HC obligatorias fuera de curso. El máximo permitido fuera de curso es ${offer.maxOutside} HC (50 %).</li>`).join('')}</ul>`;
    section.querySelector('.v53-actions')?.after(box);
  }

  // Este listener se registra antes que V55. Si el piso obligatorio supera el
  // 50 %, el horario no puede generarse: se informa el conflicto sin ampliar
  // artificialmente el máximo.
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-v53-generate],[data-v53-check]');if(!trigger)return;
    const conflicts=offerConflicts();if(!conflicts.length)return;
    e.preventDefault();e.stopImmediatePropagation();renderOfferConflictReport(conflicts);
    toast('Hay docentes cuya planificación obligatoria supera el máximo del 50 %.',true);
  },true);

  const previousRenderPanel=renderPanel;
  renderPanel=function(){previousRenderPanel();setTimeout(unlockPanel,0)};

  const previousScreen=window.screen;
  if(typeof previousScreen==='function'){
    const wrapped=function(id){
      const result=previousScreen(id);
      if(id==='proposal')setTimeout(proposalNote,20);
      if(id==='institutional')setTimeout(renderInstitutionalPartial,20);
      if(id==='panel')setTimeout(unlockPanel,20);
      return result;
    };
    Object.assign(wrapped,previousScreen);window.screen=wrapped;
  }

  window.addEventListener('pci-app-ready',()=>setTimeout(()=>{unlockPanel();proposalNote()},180));
  document.addEventListener('click',e=>{
    if(e.target.closest('#openProposal'))setTimeout(proposalNote,80);
    if(e.target.closest('#openInstitutional'))setTimeout(renderInstitutionalPartial,80);
  },true);

  window.PCIParallelPhasesV58={unlockPanel,proposalNote,renderInstitutionalPartial,offerConflicts};
})();
