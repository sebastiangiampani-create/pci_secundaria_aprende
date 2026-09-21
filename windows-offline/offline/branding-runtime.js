(() => {
  const local=(name)=>'pci://app/_offline/'+name;
  const rules=[
    {re:/escuela|maestro/i,src:local('brand-escuela-maestros.svg')},
    {re:/ministerio|buenos\s*aires|ciudad/i,src:local('brand-ministerio.svg')},
    {re:/creative|license|by-nc-nd|licensebutton/i,src:local('cc-badge.svg')}
  ];
  function repair(img){
    if(!img||img.dataset.pciOfflineBrand==='1')return;
    const text=[img.alt,img.title,img.src,img.id,img.className].join(' ');
    const hit=rules.find(r=>r.re.test(text));
    if(hit){
      img.dataset.pciOfflineBrand='1';
      if(!img.complete||img.naturalWidth===0)img.src=hit.src;
      img.addEventListener('error',()=>{img.src=hit.src},{once:true});
    }
  }
  function scan(){
    document.querySelectorAll('img').forEach(repair);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pci-app-ready',()=>setTimeout(scan,100));
})();