(() => {
  let timer=null;
  const $=id=>document.getElementById(id);
  function selected(){return Array.isArray(state.selected)?state.selected:[]}
  function ensureAreas(){
    const home=$('home'), pci=$('pciList');if(!home||!pci)return;
    let curricular=$('v75CurricularArea');
    if(!curricular){
      curricular=document.createElement('section');curricular.id='v75CurricularArea';curricular.className='v75-area v75-curricular';
      const title=$('v74PciTitle');title?.before(curricular);
      curricular.innerHTML='<div class="v75-area-head"><div><div class="eyebrow">1 · Desarrollo Curricular</div><h2>Construcción de los PCI</h2><p>La escuela define sus orientaciones y construye en cada una el Mapa de la Oferta y su Desarrollo Curricular.</p></div><span class="v75-flow">Mapa de la Oferta → Desarrollo Curricular</span></div>';
    }
    const title=$('v74PciTitle');
    if(title&&title.previousElementSibling!==curricular)curricular.after(title);
    let management=$('v71LeanHomeEntry');
    if(management){
      management.classList.add('v75-management');
      let eyebrow=management.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='2 · Gestión Institucional';
    }
    let grading=$('v75Grading');
    if(!grading){
      grading=document.createElement('article');grading.id='v75Grading';grading.className='card v75-grading';
      grading.innerHTML='<div><div class="eyebrow">3 · Calificaciones</div><h2>Calificaciones</h2><p>Conecta los planes del Desarrollo Curricular con agrupamientos, docentes, comisiones y estudiantes de Gestión.</p><small>Se habilitará cuando construyamos el módulo de calificaciones.</small></div><button class="btn soft" type="button" disabled>Próximamente</button>';
      (management||pci).after(grading);
    }
  }
  function cleanPanel(){
    const panel=$('panel');if(!panel)return;
    const hero=panel.querySelector('.hero');
    if(hero){
      const p=hero.querySelector('p');if(p&&p.textContent!=='Construí el PCI de esta orientación: primero organizá el Mapa de la Oferta y luego desarrollá la propuesta curricular.')p.textContent='Construí el PCI de esta orientación: primero organizá el Mapa de la Oferta y luego desarrollá la propuesta curricular.';
    }
    panel.querySelectorAll('.phase-grid .phase').forEach(card=>{
      const h=card.querySelector('h2')?.textContent||'';
      if(/implementaci[oó]n institucional|gesti[oó]n institucional/i.test(h))card.style.display='none';
      if(/propuesta curricular/i.test(h)){const x=card.querySelector('h2');if(x)x.textContent='Desarrollo Curricular'}
    });
  }
  function decorate(){ensureAreas();cleanPanel()}
  function refresh(){clearTimeout(timer);timer=setTimeout(decorate,60)}
  const observer=new MutationObserver(refresh);
  function start(){
    const home=$('home');
    if(home)observer.observe(home,{childList:true,subtree:false});
    decorate();
  }
  window.addEventListener('pci-app-ready',()=>setTimeout(start,600));setTimeout(start,1300);
  const style=document.createElement('style');style.textContent=`
    .v75-area{margin:28px 0 10px;padding:18px 20px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,#f7fafc,#edf4f8)}
    .v75-area-head{display:flex;justify-content:space-between;align-items:center;gap:18px}.v75-area h2{margin:4px 0}.v75-area p{margin:0;color:var(--muted);font-size:.7rem}
    .v75-flow{padding:8px 11px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:.58rem;font-weight:900;white-space:nowrap}
    .v75-management{margin-top:28px!important}.v75-grading{margin-top:12px;padding:20px;display:flex;justify-content:space-between;align-items:center;gap:18px;border-radius:22px;background:#f7f8fa}
    .v75-grading h2{margin:4px 0}.v75-grading p{margin:0;color:var(--muted);font-size:.7rem}.v75-grading small{display:block;margin-top:7px;color:var(--muted);font-size:.56rem}
    @media(max-width:760px){.v75-area-head,.v75-grading{align-items:flex-start;flex-direction:column}.v75-flow{white-space:normal}.v75-grading .btn{width:100%}}
  `;document.head.appendChild(style);
})();