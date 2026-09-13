(() => {
  function decorate(){
    const row=document.querySelector('#v28home .v28-hero .v28-row');
    if(!row||row.querySelector('[data-v60-print]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='v28-btn primary';
    button.dataset.v60Print='1';
    button.textContent='Impresión de desarrollo curricular';
    row.appendChild(button);
  }
  window.addEventListener('pci-app-ready',()=>setTimeout(decorate,250));
  window.addEventListener('pci-phase2-groups-rendered',decorate);
  window.PCIPhase2PrintV60={decorate};
})();
