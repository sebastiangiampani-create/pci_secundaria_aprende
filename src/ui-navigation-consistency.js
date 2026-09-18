(() => {
  const STYLE_ID='pci-nav-consistency-style';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .pci-backbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 16px}
      .pci-backbtn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:9px 14px;border:1px solid #cfd9e1;border-radius:999px;background:#fff;color:#12395c;font:800 .82rem/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 12px rgba(18,57,92,.06);cursor:pointer}
      .pci-backbtn:hover{border-color:#12395c}.pci-backbtn:focus-visible{outline:3px solid rgba(131,222,211,.65);outline-offset:2px}
      #proposal .v28-back{display:inline-flex!important;align-items:center!important;min-height:40px!important;padding:8px 13px!important;border:1px solid #cfd9e1!important;border-radius:999px!important;background:#fff!important;box-shadow:0 4px 12px rgba(18,57,92,.06)!important;cursor:pointer!important}
      #proposal .v28-hero{box-sizing:border-box}

      #pciGlobalDock{position:sticky;top:8px;z-index:110;display:flex;justify-content:center;margin:8px auto 18px;pointer-events:none}
      #pciGlobalDock .pci-dock-inner{display:flex;align-items:center;justify-content:center;gap:2px;max-width:min(920px,calc(100vw - 24px));padding:7px 10px;border:1px solid #d7e0e7;border-radius:22px;background:rgba(255,255,255,.97);box-shadow:0 10px 30px rgba(18,57,92,.12);backdrop-filter:blur(12px);overflow-x:auto;scrollbar-width:none;pointer-events:auto}
      #pciGlobalDock .pci-dock-inner::-webkit-scrollbar{display:none}
      #pciGlobalDock button{flex:0 0 auto;min-height:46px;padding:8px 14px;border:0;border-radius:999px;background:transparent;color:#12395c;font:800 .72rem/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:7px}
      #pciGlobalDock button:hover{background:#eef4f7}
      #pciGlobalDock button.is-active{background:#12395c;color:#fff}
      #pciGlobalDock button.pci-dock-back{border:1px solid #d7e0e7;background:#f7fafc;margin-right:4px}
      #pciGlobalDock button+button{border-left:1px solid #edf1f4;border-radius:0}
      #pciGlobalDock button.is-active{border-radius:999px}
      #pciGlobalDock .pci-dock-icon{font-size:1rem;font-weight:900;line-height:1}
      #pciGlobalDock[hidden],#pciGlobalDock button[hidden]{display:none!important}
      .screen>.back{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:8px 12px!important;margin:0 0 12px!important;border:1px solid #d7e0e7!important;border-radius:999px!important;background:#fff!important;box-shadow:0 4px 12px rgba(18,57,92,.05);font-weight:800!important;color:#12395c!important}

      @media(max-width:760px){
        body{padding-bottom:76px}
        .pci-backbar{margin-bottom:10px;padding:5px 0}
        .screen>.back{display:none!important}
        .pci-backbtn,#proposal .v28-back{min-height:44px!important;font-size:.78rem!important}
        #proposal .v28-hero{margin-left:-16px!important;margin-right:-16px!important;padding-left:16px!important;padding-right:16px!important}
        #proposal .v28-section{align-items:flex-start!important;flex-direction:column!important}
        #proposal .v28-area-grid{grid-template-columns:1fr!important}
        #proposal .v28-area{min-height:150px!important}
        #proposal .v28-work{grid-template-columns:minmax(0,1fr)!important}
        #proposal .v28-bag{position:static!important;max-height:none!important;padding:13px!important}
        #proposal .v28-groups{grid-template-columns:minmax(0,1fr)!important}
        #proposal .v28-group{padding:14px!important}
        #proposal .v28-content{grid-template-columns:21px minmax(0,1fr)!important}
        #proposal .v28-selectbar{grid-template-columns:1fr!important}
        #proposal .v28-selectbar .v28-btn{width:100%!important}
        #pciGlobalDock{position:fixed;top:auto;left:0;right:0;bottom:8px;margin:0;z-index:150;padding:0 8px}
        #pciGlobalDock .pci-dock-inner{width:100%;max-width:none;justify-content:space-between;border-radius:20px;padding:6px;box-sizing:border-box}
        #pciGlobalDock button{min-height:48px;padding:9px 11px;font-size:.68rem}
        #pciGlobalDock .pci-dock-icon{font-size:1.05rem}
        #pciGlobalDock button[data-dock="institutional"]{display:none}
      }
    `;document.head.appendChild(style);
  }

  const visible=el=>!!el&&!el.hidden&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  const sectionVisible=id=>visible(document.getElementById(id));

  const proposalBack=()=>{
    const home=document.getElementById('v28home'),board=document.getElementById('v28board'),matrix=document.getElementById('v28matrix');
    if(visible(board)||visible(matrix)){
      const b=document.getElementById(visible(matrix)?'v28mback':'v28back');
      if(b){b.click();return true;}
    }
    if(visible(home)){
      const b=document.getElementById('v28panel');if(b){b.click();return true;}
    }
    return false;
  };

  function goHome(){window.screen?.('home')}
  function goPanel(){window.screen?.('panel')}
  function goOffer(){window.screen?.('offer')}
  function goProposal(){window.screen?.('proposal');setTimeout(()=>document.getElementById('v28home')?.removeAttribute('hidden'),0)}
  function goManagement(){
    window.screen?.('institutional');
    setTimeout(()=>{
      const open=document.querySelector('[data-v71n-open],#v71LeanPanelEntry button,#institutional [data-open-management]');
      if(open)open.click();
    },60);
  }
  function goBack(){
    if(sectionVisible('proposal')&&proposalBack())return;
    if(sectionVisible('offer')||sectionVisible('institutional')){goPanel();return;}
    if(sectionVisible('panel')){goHome();return;}
    if(sectionVisible('home'))return;
  }

  function targetFor(section){
    if(section?.id==='proposal') return {label:'Volver',action:proposalBack};
    if(section?.id==='institutional') return {label:'Volver al panel',action:goPanel};
    if(section?.id==='offer') return {label:'Volver al panel',action:goPanel};
    return null;
  }

  function ensureBack(section){
    if(!section||!visible(section))return;
    const target=targetFor(section);if(!target)return;
    if(section.id==='proposal'&&section.querySelector('.v28-back'))return;
    let bar=section.querySelector(':scope > .pci-backbar');
    if(!bar){bar=document.createElement('div');bar.className='pci-backbar';section.prepend(bar);}
    let btn=bar.querySelector('.pci-backbtn');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='pci-backbtn';bar.appendChild(btn);}
    btn.textContent=`← ${target.label}`;btn.onclick=target.action;
  }

  function currentScreen(){
    if(sectionVisible('home'))return'home';
    if(sectionVisible('offer'))return'offer';
    if(sectionVisible('proposal'))return'proposal';
    if(sectionVisible('institutional'))return'institutional';
    if(sectionVisible('panel'))return'panel';
    return'';
  }

  function ensureDock(){
    let dock=document.getElementById('pciGlobalDock');
    if(!dock){
      dock=document.createElement('nav');dock.id='pciGlobalDock';dock.setAttribute('aria-label','Navegación principal del PCI');
      dock.innerHTML=`<div class="pci-dock-inner">
        <button type="button" class="pci-dock-back" data-dock="back"><span class="pci-dock-icon">←</span><span>Volver</span></button>
        <button type="button" data-dock="home"><span class="pci-dock-icon">⌂</span><span>Inicio</span></button>
        <button type="button" data-dock="offer"><span class="pci-dock-icon">◇</span><span>Mapa de la Oferta</span></button>
        <button type="button" data-dock="proposal"><span class="pci-dock-icon">△</span><span>Propuesta Curricular</span></button>
        <button type="button" data-dock="institutional"><span class="pci-dock-icon">▦</span><span>Gestión</span></button>
      </div>`;
      const header=document.querySelector('header');
      if(header?.parentNode)header.insertAdjacentElement('afterend',dock);else document.body.prepend(dock);
      dock.querySelector('[data-dock="back"]').onclick=goBack;
      dock.querySelector('[data-dock="home"]').onclick=goHome;
      dock.querySelector('[data-dock="offer"]').onclick=goOffer;
      dock.querySelector('[data-dock="proposal"]').onclick=goProposal;
      dock.querySelector('[data-dock="institutional"]').onclick=goManagement;
    }
    const current=currentScreen();
    dock.hidden=!current;
    const back=dock.querySelector('[data-dock="back"]');
    if(back)back.hidden=current==='home'||current==='panel';
    dock.querySelectorAll('[data-dock]').forEach(b=>b.classList.toggle('is-active',b.dataset.dock===current));
  }

  function refresh(){
    ['offer','proposal','institutional'].forEach(id=>ensureBack(document.getElementById(id)));
    ensureDock();
  }

  document.addEventListener('click',()=>setTimeout(refresh,0),true);
  window.addEventListener('popstate',refresh);
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(refresh,40)});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class']});
  setTimeout(refresh,0);
})();
