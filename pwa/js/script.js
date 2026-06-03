// ============= LOGIN =============
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    })
    .then(res => {
      if (!res.ok) throw new Error('Credenciales incorrectas');
      return res.json();
    })
    .then(data => {
      localStorage.setItem('usuario', data.usuario);
      window.location.href = 'dashboard.html';
    })
    .catch(err => alert('❌ Error: ' + err.message));
  });
}

// ============= LOGOUT =============
function logout() {
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

// ============================================================
// OFFLINE SYNC — helpers para localStorage
// ============================================================

function getPendientes(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || [];
  } catch {
    return [];
  }
}

function setPendientes(clave, lista) {
  localStorage.setItem(clave, JSON.stringify(lista));
}

function agregarPendiente(clave, item) {
  const lista = getPendientes(clave);
  lista.push(item);
  setPendientes(clave, lista);
}

// ============= INVENTARIO - Guardar Producto =============
const formInventario = document.querySelector('.form-inventario');
if (formInventario) {

  // IDs correctos según tu inventario.html (los inputs no tienen id,
  // los seleccionamos por posición igual que antes)
  formInventario.addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs  = formInventario.querySelectorAll('input');
    const selects = formInventario.querySelectorAll('select');

    const data = {
      nombre:    inputs[0].value,
      categoria: selects[0].value,
      unidad:    inputs[1].value,
      precio:    parseFloat(inputs[2].value)
    };

    if (!navigator.onLine) {
      // ── OFFLINE: guardar en localStorage ──
      agregarPendiente('productosPendientes', data);
      alert('📴 Sin conexión. El producto se guardará cuando vuelvas a conectarte.');
      formInventario.reset();
    } else {
      // ── ONLINE: enviar al servidor ──
      guardarProductoEnServidor(data, () => {
        formInventario.reset();
        cargarInventario();
      });
    }
  });
}

function guardarProductoEnServidor(data, callback) {
  fetch('http://localhost:3000/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al guardar');
    return res.json();
  })
  .then(() => {
    if (callback) callback();
  })
  .catch(err => alert('❌ Error al guardar: ' + err.message));
}

// ============= INVENTARIO - Cargar Tabla =============
function cargarInventario() {
  fetch('http://localhost:3000/productos')
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('.tabla-inventario tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No hay productos registrados</td></tr>';
        return;
      }

      data.forEach(p => {
        tbody.innerHTML += `
          <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>${p.unidad}</td>
            <td>${p.stock}</td>
            <td>${p.precio} Bs.</td>
          </tr>`;
      });
    })
    .catch(() => {
      const tbody = document.querySelector('.tabla-inventario tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center">Sin conexión — datos no disponibles</td></tr>';
    });
}

const btnActualizar = document.getElementById('actualizar-inventario');
if (btnActualizar) btnActualizar.addEventListener('click', cargarInventario);

// ============= MOVIMIENTOS - Cargar Productos en Select =============
function cargarProductosEnSelect() {
  const selectProducto = document.querySelector('.form-movimiento select:first-child');
  if (!selectProducto) return;

  fetch('http://localhost:3000/productos')
    .then(res => res.json())
    .then(data => {
      selectProducto.innerHTML = '<option value="">Seleccione un producto</option>';
      data.forEach(p => {
        selectProducto.innerHTML += `<option value="${p.id}">${p.nombre} (Stock: ${p.stock})</option>`;
      });
    })
    .catch(() => console.warn('No se pudieron cargar productos en el select (offline)'));
}

// ============= MOVIMIENTOS - Registrar Movimiento =============
const formMovimiento = document.querySelector('.form-movimiento');
if (formMovimiento) {
  formMovimiento.addEventListener('submit', function(e) {
    e.preventDefault();

    const selects = formMovimiento.querySelectorAll('select');
    const inputs  = formMovimiento.querySelectorAll('input');

    const data = {
      producto_id: parseInt(selects[0].value),
      tipo:        selects[1].value,
      cantidad:    parseInt(inputs[0].value),
      fecha:       inputs[1].value,
      usuario_id:  1
    };

    if (!data.producto_id) {
      alert('❌ Por favor seleccione un producto');
      return;
    }

    if (!navigator.onLine) {
      // ── OFFLINE: guardar en localStorage ──
      agregarPendiente('movimientosPendientes', data);
      alert('📴 Sin conexión. El movimiento se guardará cuando vuelvas a conectarte.');
      formMovimiento.reset();
    } else {
      guardarMovimientoEnServidor(data, () => {
        formMovimiento.reset();
        cargarMovimientos();
        cargarProductosEnSelect();
      });
    }
  });
}

function guardarMovimientoEnServidor(data, callback) {
  fetch('http://localhost:3000/movimientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => {
    if (!res.ok) throw new Error('Error en el servidor');
    return res.json();
  })
  .then(() => {
    if (callback) callback();
  })
  .catch(err => alert('❌ Error al registrar movimiento: ' + err.message));
}

// ============= MOVIMIENTOS - Cargar Tabla =============
function cargarMovimientos() {
  const tbody = document.querySelector('.tabla-movimientos tbody');
  if (!tbody) return;

  fetch('http://localhost:3000/movimientos')
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = '';
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No hay movimientos registrados</td></tr>';
        return;
      }
      data.forEach(m => {
        tbody.innerHTML += `
          <tr>
            <td>${m.id}</td>
            <td>${m.producto_nombre || m.producto_id}</td>
            <td>${m.tipo}</td>
            <td>${m.cantidad}</td>
            <td>${m.fecha}</td>
            <td>${m.usuario_id}</td>
          </tr>`;
      });
    })
    .catch(() => {
      tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center">Sin conexión — datos no disponibles</td></tr>';
    });
}

// ============= CARGAR DATOS AL INICIAR PÁGINA =============
if (document.querySelector('.tabla-inventario')) cargarInventario();
if (document.querySelector('.form-movimiento')) {
  cargarProductosEnSelect();
  cargarMovimientos();
}

// ============================================================
// SINCRONIZACIÓN AUTOMÁTICA al volver online
// ============================================================
window.addEventListener('online', async () => {
  let sincronizado = false;

  // 1. Sincronizar productos pendientes
  const productosPendientes = getPendientes('productosPendientes');
  if (productosPendientes.length > 0) {
    for (const p of productosPendientes) {
      try {
        await fetch('http://localhost:3000/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        sincronizado = true;
      } catch (err) {
        console.error('Error sincronizando producto:', err);
      }
    }
    localStorage.removeItem('productosPendientes');
  }

  // 2. Sincronizar movimientos pendientes
  const movimientosPendientes = getPendientes('movimientosPendientes');
  if (movimientosPendientes.length > 0) {
    for (const m of movimientosPendientes) {
      try {
        await fetch('http://localhost:3000/movimientos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m)
        });
        sincronizado = true;
      } catch (err) {
        console.error('Error sincronizando movimiento:', err);
      }
    }
    localStorage.removeItem('movimientosPendientes');
  }

  if (sincronizado) {
    alert('✅ Datos sincronizados con el servidor.');
    cargarInventario();
    cargarMovimientos();
    cargarProductosEnSelect();
  }
});

// ============= INDICADOR OFFLINE =============
function mostrarEstadoConexion() {
  const existente = document.getElementById('offline-banner');
  if (existente) existente.remove();

  if (!navigator.onLine) {
    const banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.textContent = '⚠️ Estás offline — los cambios se guardarán localmente';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e67e22;color:white;text-align:center;padding:10px;z-index:9999;font-weight:bold;';
    document.body.prepend(banner);
  }
}

window.addEventListener('load',    mostrarEstadoConexion);
window.addEventListener('online',  mostrarEstadoConexion);
window.addEventListener('offline', mostrarEstadoConexion);

// ============= INSTALACIÓN PWA =============
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.createElement('button');
  installBtn.textContent = '📱 Instalar App';
  installBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#27ae60;color:white;border:none;padding:12px 20px;border-radius:50px;cursor:pointer;z-index:9999;';
  installBtn.onclick = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('App instalada');
    installBtn.remove();
  };
  document.body.appendChild(installBtn);
});