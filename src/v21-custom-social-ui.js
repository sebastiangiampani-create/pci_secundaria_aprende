(() => {
  const $id=id=>document.getElementById(id);
  const current=()=>ensure(state.active);

  const style=document.createElement('style');
  style.textContent=`
    #compositionPalette{display:none!important}
    .social-choice{margin-top:7px;padding-top:7px;border-top:1px solid rgba(18,57,92,.15)}
    .social-choice-title{font-size:.48rem;line-height:1.25;color:var(--muted);margin-bottom:5px}
    .social-choice-chip{display:block;width:100%;margin:4px 0;padding:6px;border:1px dashed var(--mint-dark);border-radius:8px;background:#fff;color:var(--ink);font-size:.48rem;font-weight:900;line-height:1.2;cursor:grab;touch-action:none;user-select:none}
    .social-choice-chip.active{background:var(--mint-soft);border-style:solid;color:var(--mint-dark)}
    .social-cell-note{display:block;margin:5px 0 4px;padding:5px 6px;border-radius:7px;background:var(--mint-soft);color:var(--mint-dark);font-size:.46rem;font-weight:900;line-height:1.2}
    .social-cell-note small{display:block;color:var(--muted);font-size:.43rem;font-weight:700;margin-top:2px}
  `;
  document.head.appendChild(style);

  function block(message,resolution=''){
    const box=$id('validation');
    if(box){box.className='validation rule-block';box.innerHTML='<strong>Acción no permitida</strong>'+esc(message)+(resolution?'<br><span>'+esc(resolution)+'</span>':'')}
    toast(message,true);
  }

  function socialOption(){const m=current();if(!['A','B'].includes(m.socialOption))m.socialOption='A';return m.socialOption}
  function socialOccupied(){return ['socialA-c5','socialA-c6','socialB-c5','socialB-c6'].some(slot=>(current().placements[slot]||[]).length>0)}

  function chooseSocial(option){
    if(!['A','B'].includes(option)||option===socialOption())return;
    if(socialOccupied()){
      block('No se puede cambiar la organización de Ciencias Sociales de 3.º con materias ya ubicadas.','Retirá primero las materias de los laboratorios de Sociales de Nivel 3 y luego cambiá la opción.');
      return;
    }
    current().socialOption=option;current().valid=false;save();renderOffer();
    toast(option==='A'?'Sociales Nivel 3: 1 laboratorio por cuatrimestre con las 4 materias.':'Sociales Nivel 3: 2 laboratorios por cuatrimestre, agrupados 2 + 2.');
  }

  // Una materia agregada por la escuela puede articular con cualquier espacio curricular
  // del mismo año. No queda reservada a “Otros formatos pedagógicos”.
  const previousValidTarget=validTarget;
  validTarget=function(slot,s){
    if(s&&s.origin==='CUSTOM'){
      let m=slot.match(/-n(\d+)$/);
      if(m){const year=Number(m[1]);return s.year===year?[true,'']:[false,`No se puede articular ${s.name} de ${s.year}.º con un espacio de ${year}.º.`]}
      m=slot.match(/-c(\d+)$/);
      if(m){
        const term=Number(m[1]),year=Math.ceil(term/2);
        if(s.year!==year)return[false,`No se puede articular ${s.name} de ${s.year}.º con C${term}, que corresponde a ${year}.º.`];
        const key=slot.replace(/-c\d+$/,'');
        const row=rowDefs().find(r=>r.k===key);
        if(!row||(row.a&&!row.a(term)))return[false,'Ese espacio no está habilitado en este cuatrimestre.'];
        return[true,''];
      }
    }
    return previousValidTarget(slot,s);
  };

  // La matriz de Sociales queda limpia: una fila base y, solo con Opción B,
  // una segunda fila visible exclusivamente en C5/C6.
  const previousRowDefs=rowDefs;
  rowDefs=function(){
    return previousRowDefs().filter(r=>r.k!=='socialConfig').map(r=>{
      if(r.k==='socialA')return{...r,l:'Ciencias Sociales'};
      if(r.k==='socialB')return{...r,l:'↳ Segundo laboratorio · Nivel 3'};
      return r;
    });
  };

  function touchChoice(el,option){
    el.onpointerdown=e=>{
      if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
      e.preventDefault();
      const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.textContent=option==='A'?'Sociales N3 · 4 juntas':'Sociales N3 · 2 + 2';document.body.appendChild(ghost);
      const move=ev=>{ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px'};
      const cleanup=()=>{ghost.remove();el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',cancel)};
      const up=ev=>{const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-slot]');cleanup();if(target&&['socialA-c5','socialA-c6'].includes(target.dataset.slot))chooseSocial(option);else block('Soltá la opción sobre Ciencias Sociales de C5 o C6.')};
      const cancel=()=>cleanup();move(e);el.setPointerCapture?.(e.pointerId);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',cancel);
    };
  }

  function decorateSocial(){
    const matrix=$id('matrix');if(!matrix)return;
    const opt=socialOption();
    const c5=matrix.querySelector('[data-slot="socialA-c5"]');
    const baseRow=c5?.closest('.grid');
    const rowLabel=baseRow?.querySelector('.rowlabel');
    if(rowLabel){
      let choice=rowLabel.querySelector('.social-choice');
      if(!choice){choice=document.createElement('div');choice.className='social-choice';rowLabel.appendChild(choice)}
      choice.innerHTML='<div class="social-choice-title">Nivel 3 · definición institucional. Arrastrá una opción a C5 o C6:</div>'+
        '<div class="social-choice-chip '+(opt==='A'?'active':'')+'" draggable="true" data-choice="A">⠿ 4 materias juntas</div>'+
        '<div class="social-choice-chip '+(opt==='B'?'active':'')+'" draggable="true" data-choice="B">⠿ 2 laboratorios · 2 + 2</div>';
      choice.querySelectorAll('[data-choice]').forEach(el=>{
        const option=el.dataset.choice;
        el.ondragstart=e=>{e.stopPropagation();e.dataTransfer.setData('text/plain','social-option:'+option)};
        touchChoice(el,option);
      });
    }

    for(const term of [5,6]){
      const drop=matrix.querySelector('[data-slot="socialA-c'+term+'"]');if(!drop)continue;
      const strong=drop.querySelector('strong');if(strong)strong.textContent=(opt==='A'?'Laboratorio único':'Laboratorio A')+' · C'+term;
      let note=drop.querySelector('.social-cell-note');if(!note){note=document.createElement('div');note.className='social-cell-note';strong?.insertAdjacentElement('afterend',note)}
      note.innerHTML=opt==='A'?'4 materias juntas<small>La composición se replica entre C5 y C6.</small>':'2 materias<small>La misma pareja se replica entre C5 y C6.</small>';
    }
    if(opt==='B')for(const term of [5,6]){
      const drop=matrix.querySelector('[data-slot="socialB-c'+term+'"]');if(!drop)continue;
      const strong=drop.querySelector('strong');if(strong)strong.textContent='Laboratorio B · C'+term;
      let note=drop.querySelector('.social-cell-note');if(!note){note=document.createElement('div');note.className='social-cell-note';strong?.insertAdjacentElement('afterend',note)}
      note.innerHTML='2 materias<small>La misma pareja se replica entre C5 y C6.</small>';
    }

    if(matrix.__v21SocialDrop)matrix.removeEventListener('drop',matrix.__v21SocialDrop,true);
    const capture=e=>{
      const raw=e.dataTransfer?.getData('text/plain')||'';if(!raw.startsWith('social-option:'))return;
      const target=e.target.closest('[data-slot]');if(!target||!['socialA-c5','socialA-c6'].includes(target.dataset.slot))return;
      e.preventDefault();e.stopImmediatePropagation();chooseSocial(raw.slice('social-option:'.length));
    };
    matrix.__v21SocialDrop=capture;matrix.addEventListener('drop',capture,true);
  }

  const previousRenderMatrix=renderMatrix;
  renderMatrix=function(){previousRenderMatrix();decorateSocial()};

  const modal=$id('rulesModal');
  if(modal){
    const rules=[...modal.querySelectorAll('.rule')];
    const socialRule=rules.find(r=>r.textContent.includes('Ciencias Sociales de 3.º:'));
    if(socialRule)socialRule.innerHTML='<strong>Ciencias Sociales de 3.º:</strong> la Opción A muestra un laboratorio en C5 y otro en C6, ambos con las cuatro materias y la misma composición. La Opción B muestra dos laboratorios en C5 y dos en C6, agrupados 2+2 y con las mismas parejas en ambos cuatrimestres. La opción se cambia por drag & drop dentro de la propia fila de Ciencias Sociales.';
    const customRule=document.createElement('div');customRule.className='rule';customRule.innerHTML='<strong>Materias agregadas por la escuela:</strong> pueden articular con cualquier espacio curricular del mismo año —troncal, laboratorio, taller, Formación Orientada, Proyecto u Otros formatos— respetando las reglas y mínimos prescriptos del espacio de destino.';modal.querySelector('.modal-box')?.appendChild(customRule);
  }
})();
