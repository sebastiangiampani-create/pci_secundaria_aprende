(() => {
  const local=name=>'pci://app/_offline/'+name;

  function ensureStyles(){
    if(document.getElementById('pciOfflineBrandStyles'))return;
    const style=document.createElement('style');
    style.id='pciOfflineBrandStyles';
    style.textContent=''
      +'.top .brand.pci-offline-brand{display:flex;align-items:center;gap:12px;min-width:250px}'
      +'.top .brand.pci-offline-brand img{display:block;width:min(290px,42vw);height:auto;max-height:50px;object-fit:contain;object-position:left center}'
      +'.top .brand.pci-offline-brand small{display:none!important}'
      +'#pciOfflineInstitutionalFooter{margin-top:26px;background:#fff;border-top:1px solid rgba(18,57,92,.12)}'
      +'#pciOfflineInstitutionalFooter .pci-brand-upper{padding:28px 24px 22px;display:flex;justify-content:flex-start}'
      +'#pciOfflineInstitutionalFooter .pci-brand-upper img{display:block;width:min(360px,78vw);height:auto}'
      +'#pciOfflineInstitutionalFooter .pci-brand-lower{background:#103d5c;padding:28px 24px;display:flex;justify-content:flex-start;align-items:center}'
      +'#pciOfflineInstitutionalFooter .pci-brand-lower img{display:block;width:min(760px,92vw);height:auto;max-height:150px;object-fit:contain;object-position:left center}'
      +'@media(max-width:700px){.top .brand.pci-offline-brand{min-width:0}.top .brand.pci-offline-brand img{width:min(230px,58vw);max-height:42px}#pciOfflineInstitutionalFooter .pci-brand-upper{padding:22px 20px 18px}#pciOfflineInstitutionalFooter .pci-brand-lower{padding:24px 20px}}';
    document.head.appendChild(style);
  }

  function installHeaderLogo(){
    const brand=document.querySelector('.top .brand');
    if(!brand||brand.dataset.pciOfflineLogo==='1')return;
    brand.dataset.pciOfflineLogo='1';
    brand.classList.add('pci-offline-brand');
    brand.innerHTML='<img src="'+local('brand-escuela-maestros.svg')+'" alt="Escuela de Maestros">';
  }

  function installInstitutionalFooter(){
    if(document.getElementById('pciOfflineInstitutionalFooter'))return;
    const footer=document.createElement('section');
    footer.id='pciOfflineInstitutionalFooter';
    footer.setAttribute('aria-label','Identidad institucional');
    footer.innerHTML='<div class="pci-brand-upper"><img src="'+local('brand-escuela-maestros.svg')+'" alt="Escuela de Maestros"></div>'
      +'<div class="pci-brand-lower"><img src="'+local('brand-ministerio.svg')+'" alt="Ministerio de Educación · Buenos Aires Ciudad"></div>';
    const cc=document.getElementById('ccLicenseFooter');
    if(cc)cc.before(footer);else document.body.appendChild(footer);
  }

  function repairKnownImages(){
    document.querySelectorAll('img').forEach(img=>{
      if(img.dataset.pciOfflineRepaired==='1')return;
      const text=[img.alt,img.title,img.src,img.id,img.className].join(' ');
      let replacement='';
      if(/creative|license|by-nc-nd|licensebutton/i.test(text))replacement=local('cc-badge.svg');
      else if(/ministerio|buenos\s*aires|ciudad/i.test(text))replacement=local('brand-ministerio.svg');
      else if(/escuela|maestro/i.test(text))replacement=local('brand-escuela-maestros.svg');
      if(!replacement)return;
      img.dataset.pciOfflineRepaired='1';
      img.addEventListener('error',()=>{img.src=replacement},{once:true});
      if(!img.complete||img.naturalWidth===0)img.src=replacement;
    });
  }

  function install(){
    ensureStyles();
    installHeaderLogo();
    installInstitutionalFooter();
    repairKnownImages();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;install()});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pci-app-ready',()=>setTimeout(install,120));
})();