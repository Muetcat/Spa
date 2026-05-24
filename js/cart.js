
/* ── SuSpa — Carrito de Compras (por usuario) ──────────────── */

/* Clave dinámica: suspa_cart_<userId> | suspa_cart_guest */
let _cartUserId = null;

function getCartKey() {
  return _cartUserId ? 'suspa_cart_' + _cartUserId : 'suspa_cart_guest';
}

/**
 * Cambia el usuario activo del carrito.
 * Se llama desde auth.js al verificar sesión.
 * @param {number|string|null} userId  — ID del usuario o null para invitado
 */
function setCartUser(userId) {
  const oldKey = getCartKey();
  _cartUserId = userId || null;
  const newKey = getCartKey();

  /* Si cambiamos de invitado a un usuario logueado,
     mover los ítems del carrito invitado al del usuario (merge) */
  if (oldKey !== newKey) {
    const guestCart = JSON.parse(localStorage.getItem(oldKey) || '[]');
    const userCart  = JSON.parse(localStorage.getItem(newKey) || '[]');

    if (guestCart.length > 0 && userId) {
      /* Reemplazar el carrito del usuario con el carrito de invitado actual
         para evitar que aparezcan ítems antiguos de sesiones pasadas */
      localStorage.setItem(newKey, JSON.stringify(guestCart));
      localStorage.removeItem(oldKey); // limpiar carrito invitado
    }
  }

  updateCartUI();
}

function getCart() {
  return JSON.parse(localStorage.getItem(getCartKey()) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  updateCartUI();
}

function addToCart(id, name, price, duration, category) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, duration, category, qty: 1 });
  }
  saveCart(cart);
  showToast(`"${name}" añadido al carrito`);
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function toggleCart() {
  document.getElementById('cartDrawer').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

function handleReservationClick(e) {
  e.preventDefault();
  closeCart();
  if (!_cartUserId) {
    window.location.href = 'login.html?from=reserva.html';
  } else {
    window.location.href = 'reserva.html';
  }
}

function showToast(msg) {
  let toast = document.getElementById('cartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCartUI() {
  const cart = getCart();
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
  }

  renderCartItems(cart);

  /* Si estamos en la página de reserva, actualizar resumen */
  if (typeof renderCartSummary === 'function') {
    renderCartSummary();
  }
}

function renderCartItems(cart) {
  const container = document.getElementById('cartItems');
  const footer    = document.getElementById('cartFooter');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="52" height="52">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p>Tu carrito está vacío</p>
        <span>Agrega servicios desde nuestro catálogo</span>
      </div>`;
    if (footer) footer.innerHTML = '';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-category">${item.category}</span>
        <p class="cart-item-name">${item.name}</p>
        <span class="cart-item-duration">${item.duration}</span>
      </div>
      <div class="cart-item-right">
        <p class="cart-item-price">${item.price > 0 ? '$' + (item.price * item.qty).toFixed(2) : 'Consultar'}</p>
        <div class="cart-item-qty">
          <button onclick="changeQty('${item.id}',-1)" aria-label="Reducir">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.id}',1)" aria-label="Aumentar">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>`).join('');

  const total      = cart.filter(i => i.price > 0).reduce((s, i) => s + i.price * i.qty, 0);
  const hasUnprice = cart.some(i => i.price === 0);

  if (footer) footer.innerHTML = `
    <div class="cart-total">
      <span>Total estimado</span>
      <strong>${total > 0 ? '$' + total.toFixed(2) : ''}${hasUnprice ? ' + consultar' : ''}</strong>
    </div>
    <a href="#" class="btn-primary" style="justify-content:center;width:100%;margin-top:1rem;" onclick="handleReservationClick(event)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      </svg>
      Reservar cita
    </a>
    <button class="cart-clear-btn" onclick="clearCart()">Vaciar carrito</button>`;
}

/* ── Inicialización al cargar el DOM ───────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Inyectar drawer */
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Carrito de compras">
      <div class="cart-drawer-header">
        <h3>Tu carrito</h3>
        <button class="cart-close-btn" onclick="closeCart()" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="cart-items" id="cartItems"></div>
      <div class="cart-footer" id="cartFooter"></div>
    </aside>`;
  document.body.appendChild(wrap);

  /* Botón carrito en navbar */
  const navbarSocial = document.querySelector('.navbar-social');
  if (navbarSocial) {
    const btn = document.createElement('button');
    btn.className = 'cart-nav-btn';
    btn.setAttribute('aria-label', 'Abrir carrito');
    btn.onclick = toggleCart;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge" id="cartBadge" style="display:none">0</span>`;
    const reservar = navbarSocial.querySelector('.btn-primary');
    navbarSocial.insertBefore(btn, reservar || null);
  }

  /* Delegación de eventos para botones "Agregar" */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;
    const { id, name, price, duration, category } = btn.dataset;
    addToCart(id, name, parseFloat(price) || 0, duration, category);
    const orig = btn.textContent;
    btn.textContent = '✓ Agregado';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('added');
    }, 2000);
  });

  updateCartUI();
});
