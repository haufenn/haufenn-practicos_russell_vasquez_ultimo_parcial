(function () {
  const btn = document.createElement('button');
  btn.innerHTML = '&#9776;';
  btn.setAttribute('aria-label', 'Abrir menú');
  btn.setAttribute('aria-expanded', 'false');
  btn.style.cssText = 'display:none;position:fixed;top:12px;right:15px;z-index:2000;background:transparent;border:none;color:white;font-size:2rem;cursor:pointer;line-height:1;padding:4px 8px;';
  document.body.appendChild(btn);

  const ul = document.querySelector('header nav ul');
  const mq = window.matchMedia('(max-width: 768px)');

  function aplicarMobile(esMobile) {
    if (esMobile) {
      btn.style.display = 'block';
      ul.style.cssText = 'display:none;flex-direction:column;position:fixed;top:0;left:0;width:100%;height:100vh;background:#2c3e50;justify-content:center;align-items:center;gap:24px;z-index:1500;margin:0;padding:0;list-style:none;';
    } else {
      btn.style.display = 'none';
      ul.removeAttribute('style');
      ul.classList.remove('menu-abierto');
      btn.innerHTML = '&#9776;';
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  aplicarMobile(mq.matches);
  mq.addEventListener('change', function (e) {
    aplicarMobile(e.matches);
  });

  btn.addEventListener('click', function () {
    const abierto = ul.classList.toggle('menu-abierto');
    ul.style.display = abierto ? 'flex' : 'none';
    btn.innerHTML = abierto ? '&#10005;' : '&#9776;';
    btn.setAttribute('aria-expanded', String(abierto));
  });

  ul.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      ul.classList.remove('menu-abierto');
      ul.style.display = 'none';
      btn.innerHTML = '&#9776;';
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();