(()=>{
  const individual=/tiene menos de dos docentes asignados; su planificación queda individual\.?/i;
  function cleanWarnings(root=document){
    const report=root.querySelector?.('#v68AnnualScheduler .v65-report .warn');
    if(!report)return;
    const html=report.innerHTML.split(/<br\s*\/?>/i).filter(part=>{
      const txt=document.createElement('div');txt.innerHTML=part;
      return !individual.test(txt.textContent||'');
    });
    if(html.length)report.innerHTML=html.join('<br>');
    else report.remove();
  }
  let timer=null;
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>cleanWarnings(),40)}
  const start=()=>{
    cleanWarnings();
    if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  };
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
  window.addEventListener('pci-app-ready',schedule);
})();