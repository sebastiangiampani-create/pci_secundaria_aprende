(() => {
  const modal=document.getElementById('rulesModal');
  if(!modal)return;
  const box=modal.querySelector('.modal-box');
  if(!box)return;

  const rules=[...box.querySelectorAll('.rule')];
  const existing=rules.find(r=>/Formación Orientada:/i.test(r.textContent||''));
  const html=`<strong>Formación Orientada · composición mínima:</strong> los laboratorios y talleres de FO deben estar conformados por al menos <strong>dos asignaturas / espacios curriculares del mismo año</strong>. La única excepción general es <strong>Nivel 3</strong>, donde un laboratorio o un taller puede quedar conformado por una sola asignatura. En Nivel 4 y Nivel 5, una sola asignatura no alcanza para conformar válidamente el espacio. Si una articulación o un movimiento deja un laboratorio/taller FO por debajo de ese mínimo, el sistema debe impedirlo y explicar el motivo.`;

  if(existing)existing.innerHTML=html;
  else{
    const rule=document.createElement('div');
    rule.className='rule';
    rule.innerHTML=html;
    box.appendChild(rule);
  }
})();
