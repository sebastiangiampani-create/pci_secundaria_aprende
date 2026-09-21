(() => {
  function removeLegacyView(){
    document.getElementById('scheduleViews')?.remove();
  }

  function render(){
    removeLegacyView();
  }

  removeLegacyView();
  window.addEventListener('pci-app-ready',()=>setTimeout(removeLegacyView,120));
  document.addEventListener('click',e=>{
    if(e.target.closest('#openInstitutional,#openInstitutionalGeneral,[data-v71n-open],[data-v73-open="horarios"]')){
      setTimeout(removeLegacyView,80);
    }
  },true);

  window.PCIScheduleViews={render,legacyDisabled:true};
})();