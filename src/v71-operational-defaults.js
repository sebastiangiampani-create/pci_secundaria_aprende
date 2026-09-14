(() => {
  state.institutional=state.institutional||{};
  if(!state.institutional.planningPolicy)state.institutional.planningPolicy={threePlus:'two-per-team'};
  else if(!state.institutional.planningPolicy.threePlus)state.institutional.planningPolicy.threePlus='two-per-team';

  function apply(){
    const policy=state.institutional?.planningPolicy;
    if(policy?.threePlus!=='two-per-team')return;
    const api=window.PCIOperationalCloseoutV71;
    if(!api)return;
    api.setPlanningPolicy?.('two-per-team');
  }

  window.addEventListener('pci-app-ready',()=>setTimeout(apply,1850));
  window.PCIOperationalDefaultsV71={apply};
})();