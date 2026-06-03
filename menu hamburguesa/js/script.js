document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ usuario, password })
  })
  .then(res => {
    if (!res.ok) throw new Error('Credenciales incorrectas');
    return res.json();
  })
  .then(data => {
    alert('Login exitoso');
    // Redirigir manualmente
    window.location.href = 'dashboard.html';
  })
  .catch(err => {
    alert('Error: ' + err.message);
  });
});