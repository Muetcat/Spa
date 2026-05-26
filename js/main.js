
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* ── Menú hamburguesa ────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('mobile-open');
    hamburger.setAttribute('aria-expanded', isOpen);
    // animar barras
    const bars = hamburger.querySelectorAll('span');
    if (isOpen) {
      bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      bars[1].style.opacity   = '0';
      bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
    }
  });

  // Cerrar menú al hacer clic en un enlace
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      const bars = hamburger.querySelectorAll('span');
      bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
    });
  });
}

/* ── Animación al desplazar (Scroll reveal) ─────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* ── Selector dinámico de reservas (categorías) — FALLBACK ─ */
const categorySelect = document.getElementById('categoria');
const serviceSelect  = document.getElementById('servicio');

const servicesData = {
  facial: [
    'Limpieza Facial Profunda',
    'Hidratación Facial Intensiva',
    'Tratamiento Anti-Edad',
    'Peeling Químico',
    'Mascarilla Iluminadora Gold',
    'Tratamiento para Acné',
  ],
  corporal: [
    'Masaje Relajante',
    'Masaje Descontracturante',
    'Masaje con Piedras Calientes',
    'Exfoliación Corporal Premium',
    'Envoltura Reductora',
    'Drenaje Linfático Manual',
  ],
  cejas: [
    'Diseño de Cejas',
    'Laminado de Cejas',
    'Extensión de Pestañas Clásica',
    'Extensión de Pestañas Volumen',
    'Lifting de Pestañas',
    'Tinte de Cejas y Pestañas',
  ],
  promo: [
    'Pack Relajación Total',
    'Pack Novia Completo',
    'Pack Corporal Completo',
    'Primera Visita',
  ],
};

function populateServices(category) {
  if (!serviceSelect) return;
  serviceSelect.innerHTML = '<option value="">— Selecciona un servicio —</option>';
  const list = servicesData[category] || [];
  list.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    serviceSelect.appendChild(opt);
  });
}

if (categorySelect) {
  categorySelect.addEventListener('change', () => {
    populateServices(categorySelect.value);
  });
}

/* ── Resumen del carrito en la página de reserva ──────────── */
let _bookingFromCart = false; // indica si reservamos desde el carrito

function renderCartSummary() {
  const summaryEl         = document.getElementById('cartSummary');
  const summaryWrapper    = document.getElementById('cartSummaryWrapper');
  const fallbackCategoria = document.getElementById('fallbackCategoria');
  const fallbackServicio  = document.getElementById('fallbackServicio');
  const btnEnviar         = document.getElementById('btn-enviar');

  if (!summaryEl) return; // no estamos en reserva.html

  const cart = typeof getCart === 'function' ? getCart() : [];

  if (cart.length === 0) {
    /* Sin ítems → ocultar resumen, mostrar selectores manuales */
    _bookingFromCart = false;
    summaryWrapper.style.display = 'none';
    if (fallbackCategoria) fallbackCategoria.style.display = '';
    if (fallbackServicio)  fallbackServicio.style.display  = '';
    /* Hacer los selects required */
    if (categorySelect) categorySelect.required = true;
    if (serviceSelect)  serviceSelect.required  = true;
    if (btnEnviar) btnEnviar.disabled = false;
    return;
  }

  /* Con ítems → mostrar resumen, ocultar selectores */
  _bookingFromCart = true;
  summaryWrapper.style.display = '';
  if (fallbackCategoria) fallbackCategoria.style.display = 'none';
  if (fallbackServicio)  fallbackServicio.style.display  = 'none';
  if (categorySelect) categorySelect.removeAttribute('required');
  if (serviceSelect)  serviceSelect.removeAttribute('required');
  if (btnEnviar) btnEnviar.disabled = false;

  const total      = cart.filter(i => i.price > 0).reduce((s, i) => s + i.price * i.qty, 0);
  const hasUnprice = cart.some(i => i.price === 0);

  summaryEl.innerHTML = cart.map(item => `
    <div class="cart-summary-item">
      <div class="cart-summary-item-left">
        <span class="cart-summary-category">${item.category}</span>
        <p class="cart-summary-name">${item.name}</p>
        <span class="cart-summary-duration">${item.duration || ''}</span>
      </div>
      <div class="cart-summary-item-right">
        <span class="cart-summary-price">${item.price > 0 ? '$' + (item.price * item.qty).toFixed(2) : 'Consultar'}</span>
        <span class="cart-summary-qty">×${item.qty}</span>
      </div>
    </div>`).join('') + `
    <div class="cart-summary-total">
      <span>Total estimado:</span>
      <strong>${total > 0 ? '$' + total.toFixed(2) : ''}${hasUnprice ? ' + consultar' : ''}</strong>
    </div>
    <button type="button" class="cart-summary-edit" onclick="window.history.back()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Modificar carrito
    </button>`;
}

/* ── Configurar fecha mínima para reservas ──────────────── */
const dateInput = document.getElementById('fecha');
if (dateInput) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  dateInput.max = maxDate.toISOString().split('T')[0];
}

/* ── Envío de formulario + modal con Asistente de 2 Pasos y PayPal ── */
const bookingForm   = document.getElementById('bookingForm');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');

let paypalButtonsInitialized = false;

// Función de envío unificado
async function submitReservation(payload) {
  const btn = document.getElementById('btn-enviar');
  const prevHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = 'Confirmando...';
    btn.disabled = true;
  }
  
  const bookingError = document.getElementById('booking-error');
  if (bookingError) bookingError.style.display = 'none';

  try {
    const response = await fetch('api/reserva.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let result;
    try { result = await response.json(); }
    catch { result = { ok: false, message: 'Respuesta inesperada del servidor.' }; }

    if (btn) {
      btn.innerHTML = prevHTML;
      btn.disabled = false;
    }

    if (!result.ok) {
      if (bookingError) {
        bookingError.textContent = result.message || 'Ocurrió un error. Inténtalo de nuevo.';
        bookingError.style.display = 'block';
      } else {
        alert(result.message || 'Ocurrió un error.');
      }
      return;
    }

    // Éxito: mostrar modal de confirmación
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      bookingForm.reset();
      
      // Resetear asistente al Paso 1
      document.getElementById('step-2').style.display = 'none';
      document.getElementById('step-1').style.display = 'block';
      document.getElementById('step-1').classList.add('active');
      document.getElementById('step-2').classList.remove('active');

      /* Vaciar carrito tras reserva exitosa */
      if (typeof clearCart === 'function') clearCart();
      renderCartSummary();
    }
  } catch (err) {
    if (btn) {
      btn.innerHTML = prevHTML;
      btn.disabled = false;
    }
    if (bookingError) {
      bookingError.textContent = 'Error de conexión. Asegúrate de estar en el servidor (localhost).';
      bookingError.style.display = 'block';
    } else {
      alert('Error de conexión.');
    }
  }
}

// Inicialización de botones PayPal
async function initPaypalButtons(totalAmount, clientEmail, getBookingPayload) {
  const container = document.getElementById('paypal-button-container');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--accent);">Cargando PayPal...</div>';
  
  try {
    const response = await fetch('api/get_paypal_config.php');
    const config = await response.json();
    if (!config.ok) {
      throw new Error(config.message || 'Error al obtener configuración de PayPal.');
    }
    
    // Cargar SDK dinámicamente si no está en la página
    if (!window.paypal) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.paypal_client_id}&currency=${config.paypal_currency || 'USD'}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal.'));
        document.head.appendChild(script);
      });
    }
    
    container.innerHTML = ''; // Limpiar el loader antes de renderizar
    
    window.paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: totalAmount.toFixed(2),
              currency_code: config.paypal_currency || 'USD'
            },
            description: 'Reservas SuSpa - ' + clientEmail
          }]
        });
      },
      onApprove: async function(data, actions) {
        container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--accent);">Procesando pago de PayPal...</div>';
        
        try {
          const details = await actions.order.capture();
          
          // Captura exitosa: enviar reserva
          const payload = getBookingPayload();
          payload.metodo_pago = 'paypal';
          payload.estado_pago = 'pagado';
          payload.paypal_order_id = details.id;
          payload.paypal_capture_id = details.purchase_units[0].payments.captures[0].id;
          payload.monto_pagado = parseFloat(details.purchase_units[0].payments.captures[0].amount.value);
          
          await submitReservation(payload);
        } catch (err) {
          console.error(err);
          alert('Hubo un error al procesar el pago o registrar tu reserva.');
          initPaypalButtons(totalAmount, clientEmail, getBookingPayload);
        }
      },
      onError: function(err) {
        console.error('Error en PayPal:', err);
        alert('Ocurrió un error con el pago de PayPal. Por favor, inténtalo de nuevo.');
        initPaypalButtons(totalAmount, clientEmail, getBookingPayload);
      }
    }).render('#paypal-button-container');
    
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p style="color:#e07575;font-size:0.85rem;text-align:center;">Error al iniciar PayPal: ${error.message}</p>`;
  }
}

if (bookingForm) {
  // Crear elemento de error para el formulario de reserva
  let bookingError = document.getElementById('booking-error');
  if (!bookingError) {
    bookingError = document.createElement('p');
    bookingError.id = 'booking-error';
    bookingError.style.cssText = 'color:#e07575;font-size:0.9rem;margin-top:1rem;display:none;text-align:center;';
    bookingForm.appendChild(bookingError);
  }

  /* Renderizar resumen del carrito al cargar */
  renderCartSummary();

  const btnSiguiente = document.getElementById('btn-siguiente');
  const btnRegresar  = document.getElementById('btn-regresar');
  const step1        = document.getElementById('step-1');
  const step2        = document.getElementById('step-2');

  if (btnSiguiente && step1 && step2) {
    btnSiguiente.addEventListener('click', () => {
      bookingError.style.display = 'none';

      // Validación visual de campos requeridos en Paso 1
      const inputs = step1.querySelectorAll('[required]');
      let valid = true;
      inputs.forEach(inp => {
        if (!inp.value.trim()) {
          inp.style.borderColor = '#e07575';
          valid = false;
          setTimeout(() => inp.style.borderColor = '', 2500);
        }
      });

      /* Validar que tengamos servicios (carrito o manual) */
      const cart = typeof getCart === 'function' ? getCart() : [];
      if (_bookingFromCart && cart.length === 0) {
        bookingError.textContent = 'Tu carrito está vacío. Agrega servicios antes de reservar.';
        bookingError.style.display = 'block';
        return;
      }
      
      if (!_bookingFromCart) {
        const serv = document.getElementById('servicio');
        const cat  = document.getElementById('categoria');
        if (!cat || !cat.value || !serv || !serv.value) {
          if (cat)  cat.style.borderColor = '#e07575';
          if (serv) serv.style.borderColor = '#e07575';
          valid = false;
          setTimeout(() => {
            if (cat)  cat.style.borderColor = '';
            if (serv) serv.style.borderColor = '';
          }, 2500);
        }
      }
      
      if (!valid) {
        bookingError.textContent = 'Por favor completa todos los campos obligatorios (*).';
        bookingError.style.display = 'block';
        bookingError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Si todo es válido, pasar al Paso 2
      step1.style.display = 'none';
      step1.classList.remove('active');
      step2.style.display = 'block';
      step2.classList.add('active');

      // Llenar datos de verificación
      document.getElementById('val-cliente').textContent = document.getElementById('nombre').value.trim();
      document.getElementById('val-contacto').textContent = `${document.getElementById('telefono').value.trim()} | ${document.getElementById('email').value.trim()}`;
      
      // Formatear fecha
      const rawDate = document.getElementById('fecha').value;
      if (rawDate) {
        const dateParts = rawDate.split('-');
        if (dateParts.length === 3) {
          document.getElementById('val-fecha').textContent = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        } else {
          document.getElementById('val-fecha').textContent = rawDate;
        }
      }
      
      const horarioSelect = document.getElementById('horario');
      document.getElementById('val-horario').textContent = horarioSelect.options[horarioSelect.selectedIndex].text;
      
      const notasVal = document.getElementById('notas').value.trim();
      const notasRow = document.getElementById('val-notas-row');
      if (notasVal) {
        document.getElementById('val-notas').textContent = notasVal;
        notasRow.style.display = '';
      } else {
        notasRow.style.display = 'none';
      }

      // Listar servicios seleccionados en el resumen y sumar total
      const summaryItemsContainer = document.getElementById('verificationSummaryItems');
      let totalAmount = 0;
      let hasUnpriced = false;
      let itemsHTML = '';

      if (_bookingFromCart) {
        totalAmount = cart.filter(i => i.price > 0).reduce((s, i) => s + i.price * i.qty, 0);
        hasUnpriced = cart.some(i => i.price === 0);
        itemsHTML = cart.map(item => `
          <div class="verification-item">
            <div>
              <strong>${item.name}</strong>
              <span class="verification-item-sub">${item.category} | ${item.duration || ''}</span>
            </div>
            <div style="text-align:right">
              <strong>${item.price > 0 ? '$' + (item.price * item.qty).toFixed(2) : 'Consultar'}</strong>
              <span class="verification-item-sub">Cant: ${item.qty}</span>
            </div>
          </div>
        `).join('');
      } else {
        const servName = document.getElementById('servicio').value;
        const catName = document.getElementById('categoria').value;
        hasUnpriced = true;
        itemsHTML = `
          <div class="verification-item">
            <div>
              <strong>${servName}</strong>
              <span class="verification-item-sub">${catName}</span>
            </div>
            <div style="text-align:right">
              <strong>Consultar</strong>
              <span class="verification-item-sub">Cant: 1</span>
            </div>
          </div>
        `;
      }

      summaryItemsContainer.innerHTML = itemsHTML;
      
      const totalLabel = document.getElementById('val-total');
      if (hasUnpriced) {
        totalLabel.textContent = totalAmount > 0 ? `$${totalAmount.toFixed(2)} + Consultar` : 'Consultar precio';
      } else {
        totalLabel.textContent = `$${totalAmount.toFixed(2)}`;
      }

      // TABS DE PAGO
      const tabPaypal = document.getElementById('tab-paypal');
      const tabLocal  = document.getElementById('tab-local');
      const paypalContainer = document.getElementById('paypal-button-container');
      const btnLocal = document.getElementById('btn-enviar');

      // Restaurar valores por defecto (Local)
      tabLocal.classList.add('active');
      tabPaypal.classList.remove('active');
      document.querySelector('input[name="payment_method"][value="local"]').checked = true;
      paypalContainer.style.display = 'none';
      btnLocal.style.display = 'block';

      // Si hay precios sin definir, no permitir pago PayPal
      if (totalAmount <= 0 || hasUnpriced) {
        tabPaypal.style.pointerEvents = 'none';
        tabPaypal.style.opacity = '0.3';
        tabPaypal.setAttribute('title', 'PayPal no disponible para servicios con precio a consultar.');
      } else {
        tabPaypal.style.pointerEvents = '';
        tabPaypal.style.opacity = '';
        tabPaypal.removeAttribute('title');
      }

      // Eventos clic en las pestañas de método de pago
      tabLocal.onclick = () => {
        tabLocal.classList.add('active');
        tabPaypal.classList.remove('active');
        document.querySelector('input[name="payment_method"][value="local"]').checked = true;
        paypalContainer.style.display = 'none';
        btnLocal.style.display = 'block';
      };

      tabPaypal.onclick = () => {
        if (totalAmount <= 0 || hasUnpriced) return;
        tabPaypal.classList.add('active');
        tabLocal.classList.remove('active');
        document.querySelector('input[name="payment_method"][value="paypal"]').checked = true;
        btnLocal.style.display = 'none';
        paypalContainer.style.display = 'block';

        // Lanzar inicialización de PayPal
        initPaypalButtons(totalAmount, document.getElementById('email').value.trim(), () => {
          const payload = {
            nombre:    document.getElementById('nombre').value.trim(),
            telefono:  document.getElementById('telefono').value.trim(),
            email:     document.getElementById('email').value.trim(),
            fecha:     document.getElementById('fecha').value,
            horario:   document.getElementById('horario').value,
            notas:     document.getElementById('notas').value.trim(),
          };
          if (_bookingFromCart) {
            payload.servicios = cart.map(item => ({
              nombre:    item.name,
              categoria: item.category,
              qty:       item.qty,
            }));
          } else {
            payload.categoria = document.getElementById('categoria').value;
            payload.servicio  = document.getElementById('servicio').value;
          }
          return payload;
        });
      };

    });
  }

  if (btnRegresar && step1 && step2) {
    btnRegresar.addEventListener('click', () => {
      step2.style.display = 'none';
      step2.classList.remove('active');
      step1.style.display = 'block';
      step1.classList.add('active');
      bookingError.style.display = 'none';
    });
  }

  // Submit tradicional del formulario (solo para pago local)
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    bookingError.style.display = 'none';
    
    const methodInput = document.querySelector('input[name="payment_method"]:checked');
    const method = methodInput ? methodInput.value : 'local';
    
    if (method !== 'local') return; // PayPal se maneja a través de su SDK

    const cart = typeof getCart === 'function' ? getCart() : [];
    const payload = {
      nombre:    document.getElementById('nombre').value.trim(),
      telefono:  document.getElementById('telefono').value.trim(),
      email:     document.getElementById('email').value.trim(),
      fecha:     document.getElementById('fecha').value,
      horario:   document.getElementById('horario').value,
      notas:     document.getElementById('notas').value.trim(),
      metodo_pago: 'local',
      estado_pago: 'pendiente',
      monto_pagado: 0.00
    };

    if (_bookingFromCart) {
      payload.servicios = cart.map(item => ({
        nombre:    item.name,
        categoria: item.category,
        qty:       item.qty,
      }));
    } else {
      payload.categoria = document.getElementById('categoria').value;
      payload.servicio  = document.getElementById('servicio').value;
    }

    await submitReservation(payload);
  });
}

if (modalClose) {
  modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
  });
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });
}

/* ── Agregar estilos de menú móvil dinámicamente ─────── */
const style = document.createElement('style');
style.textContent = `
  #navLinks.mobile-open {
    display: flex !important;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 100vh;
    background: rgba(18,9,14,0.97);
    backdrop-filter: blur(20px);
    align-items: center;
    justify-content: center;
    gap: 2.5rem;
    z-index: 999;
  }
  #navLinks.mobile-open a {
    font-size: 1.5rem;
    letter-spacing: 0.15em;
  }
`;
document.head.appendChild(style);

/* ── Cargar estadísticas reales desde la base de datos ── */
document.addEventListener('DOMContentLoaded', async () => {
  const statClientes = document.getElementById('stat-clientes');
  const statAnios = document.getElementById('stat-anios');
  const statServicios = document.getElementById('stat-servicios');

  if (statClientes || statAnios || statServicios) {
    try {
      const res = await fetch('api/public_stats.php');
      const data = await res.json();
      if (data.ok) {
        if (statClientes) statClientes.textContent = `+${data.clientes}`;
        if (statAnios) statAnios.textContent = `${data.anios}`;
        if (statServicios) statServicios.textContent = `${data.servicios}+`;
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }
});

