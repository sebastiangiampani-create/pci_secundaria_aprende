(() => {
  state.institutional=state.institutional||{};
  if(!state.institutional.planningPolicy)state.institutional.planningPolicy={threePlus:'two-per-team'};
  else if(!state.institutional.planningPolicy.threePlus)state.institutional.planningPolicy.threePlus='two-per-team';

  function apply(){
    const r=state.institutional=state.institutional||{};
    r.planningPolicy=r.planningPolicy||{threePlus:'two-per-team'};
    if(r.planningPolicy.threePlus!=='two-per-team')return;
    r.planningOverrides=r.planningOverrides||{};
    const staff=window.PCIStaffPlanningV68;if(!staff?.teacherPlanning)return;
    for(const teacher of Object.values(r.teachers||{})){
      const p=staff.teacherPlanning(teacher.id,r.assignments||{});if(!p||p.count<3)continue;
      const byTeam={};for(const team of p.teams||[])byTeam[team.id]=2;
      r.planningOverrides[teacher.id]={...(r.planningOverrides[teacher.id]||{}),byTeam,validated:true,policy:'two-per-team'};
    }
    save();staff.decorate?.();setTimeout(()=>window.PCIInstitutionalAccordionV69?.refresh?.(),80);
  }

  window.addEventListener('pci-app-ready',()=>setTimeout(apply,1850));
  window.PCIOperationalDefaultsV71={apply};
})();