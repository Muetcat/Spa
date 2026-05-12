/* ── SuSpa — Autenticación con Backend ──────────────────────────────── */

// Al cargar la página, verificamos la sesión en el servidor
async function checkSession() {
  try {
    const res = await fetch('api/check_session.php', { cache: 'no-store' });
    const data = await res.json();
    updateAuthUI(data.logged_in ? data.user : null);
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    updateAuthUI(null);
  }
}

function updateAuthUI(user) {
  const userNav = document.getElementById('userNav');
  if (!userNav) return;

  if (user) {
    userNav.innerHTML = `
      <div class="user-menu" id="userMenuContainer">
        <button class="user-avatar-btn" id="avatarBtn" aria-label="Mi cuenta">
          <span class="user-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
        </button>
        <div class="user-dropdown" id="userDropdown">
          <p class="user-dropdown-name">${user.name || 'Usuario'}</p>
          <p class="user-dropdown-email">${user.email}</p>
          <hr style="border-color:var(--border-glass);margin:0.5rem 0;">
          <a href="perfil.html" style="display:block; padding:0.5rem 1rem; color:var(--text); text-decoration:none; font-size:0.9rem; text-align:left;">
            Mi Perfil
          </a>
          <button id="logoutBtn" style="width:100%; text-align:left; background:none; color:var(--accent); font-size:0.9rem; padding:0.5rem 1rem; cursor:pointer;">
            Cerrar sesión
          </button>
        </div>
      </div>`;

    document.getElementById('avatarBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('open');
    });

    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await fetch('api/logout.php', { method: 'POST' });
        window.location.href = 'index.html';
      } catch (err) {
        console.error('Error al cerrar sesión:', err);
      }
    });

  } else {
    userNav.innerHTML = `
      <a href="login.html" class="user-login-btn" aria-label="Iniciar sesión">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Ingresar</span>
      </a>`;
  }
}

/* Cerrar dropdown al clic fuera */
document.addEventListener('click', e => {
  const dd = document.getElementById('userDropdown');
  if (dd && !e.target.closest('.user-menu')) dd.classList.remove('open');
});

document.addEventListener('DOMContentLoaded', () => {
  const navbarSocial = document.querySelector('.navbar-social');
  if (navbarSocial) {
    let userNav = document.getElementById('userNav');
    if (!userNav) {
      userNav = document.createElement('div');
      userNav.id        = 'userNav';
      userNav.className = 'user-nav';
      navbarSocial.insertBefore(userNav, navbarSocial.firstChild);
    }
  }
  checkSession();
});
