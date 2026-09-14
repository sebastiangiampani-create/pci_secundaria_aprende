(() => {
  let timer=null,wrapped=false;
  function wrapSimulation(){
    if(wrapped)return;const api=window.PCIAnnualSchedulerV68;if(!api?.simulateAssignments)return;
    const original=api.simulateAssignments.bind(api);
    api.simulateAssignments=(...args)=>{const result=original(...args);if(result&&result.entries)delete result.entries;return result};
    window.PCIAnnualSchedulerV65=api;wrapped=true;
  }
  function labels(){
    const sub=document.querySelector('#offer .custom-box .subhead');if(sub)sub.textContent='Bilingüe · Extracurricular · otro espacio extra-plan';
    const name=document.getElementById('customName');if(name)name.placeholder='Nombre de la materia / espacio extra-plan';
    const add=document.getElementById('addCustom');if(add)add.textContent='Agregar espacio extra-plan';
    document.querySelectorAll('#v48InstitutionalContent .v48-origin.custom').forEach(x=>x.textContent='Extra-plan');
  }
  function refresh(){clearTimeout(timer);timer=setTimeout(()=>{wrapSimulation();labels()},60)}
  window.addEventListener('pci-app-ready',()=>setTimeout(refresh,1500));
  document.addEventListener('click',e=>{if(e.target.closest('#openOffer,#openInstitutionalGeneral,#openInstitutional,[data-go="home"]'))setTimeout(refresh,120)},true);
  const observer=new MutationObserver(refresh);observer.observe(document.documentElement,{childList:true,subtree:true});
  window.PCIRuntimeFixV68={refresh};
})();