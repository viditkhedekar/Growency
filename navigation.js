(() => {
  const menus = [...document.querySelectorAll('.mobile-menu,.company-menu')];
  if (!menus.length) return;
  menus.forEach(menu => {
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) menu.open = false;
    });
  });
  document.addEventListener('pointerdown', event => {
    menus.forEach(menu => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openMenu = menus.find(menu => menu.open);
    if (!openMenu) return;
    openMenu.open = false;
    openMenu.querySelector('summary').focus();
  });
  matchMedia('(max-width: 960px)').addEventListener('change', () => {
    menus.forEach(menu => { menu.open = false; });
  });
})();
