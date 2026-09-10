(() => {
  const $id = id => document.getElementById(id);
  const current = () => ensure(state.active);

  const style = document.createElement('style');
  style.textContent = `
    .social-mode-badge{display:block;margin:5px 0 6px;padding:6px 7px;border-radius:8px;background:var(--mint-soft);border:1px dashed var(--mint-dark);color:var(--mint-dark);font-size:.49rem;font-weight:900;line-height:1.25}
    .social-mode-badge small{display:block;margin-top:2px;color:var(--muted);font-size:.45rem;font-weight:700}
    .social-mode-badge.ready{outline:2px solid var(--mint-dark)}
    .custom-articulation-note{width:100%;font-size:.58rem;line-height:1.3;color:var(--muted);font-weight:700;margin-top:4px}
  `;
  document.head.appendChild(style);

  function block(message,resolution=''){
    const box=$id('validation');
    if(box){
      box.className='validation rule-block';
      box.innerHTML='<strong>Acción no permitida</strong>'+esc(message)+(resolution?'<br><span>'+esc(resolution)+'</span>':'');
    }
    toast(message,true);
  }

  function socialOption(){
    const m=current();
    if(!['A','B'].includes(m.socialOption))m.socialOption='A';
    return m.socialOption;
  }

  function socialOccupied(){
    return ['socialA-c5','socialA-c6','socialB-c5','socialB-c6'].some(slot=>(current().placements[slot]||[]).length>0);
  }

  function chooseSocial(option){
    if(!['A','B'].includes(option))return;
    if(option===socialOption())return;
    if(socialOccupied()){
      block('No se puede cambiar la organización de Ciencias Sociales de 3.º con materias ya ubicadas.','Retirá primero las materias de los laboratorios de Sociales de Nivel 3 y luego cambiá la opción.');
      return;
    }
    current().socialOption=option;
    current().valid=false;
    save();
    renderOffer();
    toast(option==='A'?'Sociales Nivel 3: un laboratorio por cuatrimestre con las 4 materias.':'Sociales Nivel 3: dos laboratorios 2+2 por cuatrimestre.');
  }

  // Las materias agregadas por la escuela no constituyen un formato separado obligatorio:
  // pueden articular con cualquier espacio existente del mismo año.
  const previousValidTarget=validTarget;
  validTarget=function(slot,s){
    if(s && s.origin==='CUSTOM'){
      let m=slot.match(/-n(\d+)$/);
      if(m){
        const year=Number(m[1]);
        if(s.year!==year)return[false,`No se puede articular ${s.name} de ${s.year}.º con un espacio de ${year}.º.`];
        return[true,''];
      }
      m=slot.match(/-c(\d+)$/);
      if(m){
        const term=Number(m[1]),year=Math.ceil(term/2);
        if(s.year!==year)return[false,`No se puede articular ${s.name} de ${s.year}.º con C${term}, que corresponde a ${year}.º.`];
        const key=slot.replace(/-c\d+$/,'');
        const row=rowDefs().find(r=>r.k===key);
        if(!row || (row.a && !row.a(term)))return[false,'Ese espacio no está habilitado en este cuatrimestre.'];
        return[true,''];
      }
    }
    return previousValidTarget(slot,s);
  };

  // Sacamos la fila artificial de “Definición” de Sociales. La elección queda dentro
  // de los propios laboratorios de C5/C6 y el segundo laboratorio aparece solo en Opción B.
  const previousRowDefs=rowDefs;
  rowDefs=function(){
    return previousRowDefs().filter(r=>r.k!=='socialConfig').map(r=>{
      if(r.k==='socialA')return {...r,l:'Laboratorios · Ciencias Sociales'};
      if(r.k==='socialB')return {...r,l:'↳ Segundo laboratorio · Sociales Nivel 3'};
      return r;
    });
  };

  function parseSocialPayload(raw){
    if(!raw || !raw.startsWith('social-option:'))return null;
    return raw.slice('social-option:'.length);
  }

  function touchSocialChip(el,option){
    el.onpointerdown=e=>{
      if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
      e.preventDefault();
      const ghost=document.createElement('div');
      ghost.className='drag-ghost';
      ghost.textContent=option==='A'?'Sociales N3 · 4 juntas':'Sociales N3 · 2 + 2';
      document.body.appendChild(ghost);
      const move=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px'};
      const cleanup=()=>{ghost.remove();el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',cancel)};
      const up=ev=>{
        const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-slot]');
        cleanup();
        if(target && ['socialA-c5','socialA-c6'].includes(target.dataset.slot))chooseSocial(option);
        else block('La definición de Ciencias Sociales de 3.º debe soltarse sobre el laboratorio de Sociales de C5 o C6.');
      };
      const cancel=()=>cleanup();
      move(e);
      el.setPointerCapture?.(e.pointerId);
      el.addEventListener('pointermove',move);
      el.addEventListener('pointerup',up);
      el.addEventListener('pointercancel',cancel);
    };
  }

  function decorateSocial(){
    const matrix=$id('matrix');
    if(!matrix)return;
    const opt=socialOption();
    for(const slot of ['socialA-c5','socialA-c6']){
      const drop=matrix.querySelector('[data-slot="'+slot+'"]');
      if(!drop)continue;
      let badge=drop.querySelector('.social-mode-badge');
      if(!badge){
        badge=document.createElement('div');
        badge.className='social-mode-badge';
        const strong=drop.querySelector('strong');
        if(strong)strong.insertAdjacentElement('afterend',badge);else drop.prepend(badge);
      }
      badge.innerHTML=opt==='A'
        ?'<strong>Opción A · 4 juntas</strong><small>1 laboratorio en C5 + 1 en C6 · misma composición</small>'
        :'<strong>Opción B · 2 + 2</strong><small>2 laboratorios en C5 + 2 en C6 · mismas parejas</small>';
    }

    if(matrix.__v21SocialDrop)matrix.removeEventListener('drop',matrix.__v21SocialDrop,true);
    const capture=e=>{
      const option=parseSocialPayload(e.dataTransfer?.getData('text/plain')||'');
      if(!option)return;
      const target=e.target.closest('[data-slot]');
      if(!target || !['socialA-c5','socialA-c6'].includes(target.dataset.slot))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      chooseSocial(option);
    };
    matrix.__v21SocialDrop=capture;
    matrix.addEventListener('drop',capture,true);
  }

  function decoratePalette(){
    const box=$id('compositionPalette');
    if(!box)return;
    const hint=box.querySelector('.hint');
    if(hint)hint.textContent='Ciencias Sociales de 3.º · arrastrá una opción sobre C5 o C6:';
    box.querySelectorAll('[data-social-option]').forEach(el=>touchSocialChip(el,el.dataset.socialOption));
    let note=box.querySelector('.custom-articulation-note');
    if(!note){note=document.createElement('div');note.className='custom-articulation-note';box.appendChild(note)}
    note.textContent='Las materias agregadas por la escuela pueden articular con cualquier espacio del mismo año; no quedan reservadas a “Otros formatos pedagógicos”.';
  }

  const previousRenderMatrix=renderMatrix;
  renderMatrix=function(){
    previousRenderMatrix();
    decorateSocial();
  };

  const previousRenderOffer=renderOffer;
  renderOffer=function(){
    previousRenderOffer();
    decoratePalette();
  };

  const modal=$id('rulesModal');
  if(modal){
    const rules=[...modal.querySelectorAll('.rule')];
    const socialRule=rules.find(r=>r.textContent.includes('Ciencias Sociales de 3.º:'));
    if(socialRule)socialRule.innerHTML='<strong>Ciencias Sociales de 3.º:</strong> la matriz muestra por defecto la Opción A: un laboratorio en C5 y otro en C6, ambos con las cuatro materias y la misma composición anual. La Opción B se activa arrastrando “2 + 2” sobre C5 o C6; recién entonces aparece el segundo laboratorio de Sociales en ambos cuatrimestres. Para volver a la Opción A se arrastra “4 juntas”.';
    const customRule=document.createElement('div');
    customRule.className='rule';
    customRule.innerHTML='<strong>Materias agregadas por la escuela:</strong> pueden articular con cualquier espacio curricular del mismo año —troncal, laboratorio, taller, Formación Orientada, Proyecto u Otros formatos— siempre respetando las reglas y mínimos prescriptos del espacio de destino.';
    modal.querySelector('.modal-box')?.appendChild(customRule);
  }
})();
