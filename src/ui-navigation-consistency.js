(() => {
  const STYLE_ID='pci-nav-consistency-style';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .pci-backbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 16px}
      .pci-backbtn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:9px 14px;border:1px solid #cfd9e1;border-radius:999px;background:#fff;color:#12395c;font:800 .82rem/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 12px rgba(18,57,92,.06);cursor:pointer}
      .pci-backbtn:hover{border-color:#12395c}.pci-backbtn:focus-visible{outline:3px solid rgba(131,222,211,.65);outline-offset:2px}
      #proposal .v28-back{display:inline-flex!important;align-items:center!important;min-height:40px!important;padding:8px 13px!important;border:1px solid #cfd9e1!important;border-radius:999px!important;background:#fff!important;box-shadow:0 4px 12px rgba(18,57,92,.06)!important;cursor:pointer!important}
      #proposal .v28-hero{box-sizing:border-box}
      @media(max-width:760px){
        .pci-backbar{position:sticky;top:6px;z-index:60;margin-bottom:10px;padding:5px 0;background:rgba(255,255,255,.94);backdrop-filter:blur(8px)}
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
      }
    `;document.head.appendChild(style);
  }

  const visible=el=>!!el&&!el.hidden&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
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

  function targetFor(section){
    if(section?.id==='proposal') return {label:'Volver',action:proposalBack};
    if(section?.id==='institutional') return {label:'Volver al panel',action:()=>window.screen?.('panel')};
    if(section?.id==='offer') return {label:'Volver al panel',action:()=>window.screen?.('panel')};
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

  function refresh(){['offer','proposal','institutional'].forEach(id=>ensureBack(document.getElementById(id)));}
  document.addEventListener('click',()=>setTimeout(refresh,0),true);
  window.addEventListener('popstate',refresh);
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(refresh,40)});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class']});
  setTimeout(refresh,0);
})();
