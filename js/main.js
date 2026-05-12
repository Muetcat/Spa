
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

/* ── Selector dinámico de reservas (categorías) ─ */
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

/* ── Envío de formulario + modal ───────────────── */
const bookingForm   = document.getElementById('bookingForm');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');

if (bookingForm) {
  // Crear elemento de error para el formulario de reserva
  let bookingError = document.getElementById('booking-error');
  if (!bookingError) {
    bookingError = document.createElement('p');
    bookingError.id = 'booking-error';
    bookingError.style.cssText = 'color:#e07575;font-size:0.9rem;margin-top:1rem;display:none;text-align:center;';
    bookingForm.querySelector('.form-submit').after(bookingError);
  }

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    bookingError.style.display = 'none';

    // Validación visual de campos requeridos
    const inputs = bookingForm.querySelectorAll('[required]');
    let valid = true;
    inputs.forEach(inp => {
      if (!inp.value.trim()) {
        inp.style.borderColor = '#e07575';
        valid = false;
        setTimeout(() => inp.style.borderColor = '', 2500);
      }
    });
    if (!valid) return;

    const btn = document.getElementById('btn-enviar');
    const prevHTML = btn.innerHTML;
    btn.innerHTML = 'Enviando…';
    btn.disabled = true;

    // Construir payload manualmente para asegurar los nombres de campo correctos
    const payload = {
      nombre:    document.getElementById('nombre').value.trim(),
      telefono:  document.getElementById('telefono').value.trim(),
      email:     document.getElementById('email').value.trim(),
      categoria: document.getElementById('categoria').value,
      servicio:  document.getElementById('servicio').value,
      fecha:     document.getElementById('fecha').value,
      horario:   document.getElementById('horario').value,
      notas:     document.getElementById('notas').value.trim(),
    };

    try {
      const response = await fetch('api/reserva.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let result;
      try { result = await response.json(); }
      catch { result = { ok: false, message: 'Respuesta inesperada del servidor.' }; }

      btn.innerHTML = prevHTML;
      btn.disabled = false;

      if (!result.ok) {
        bookingError.textContent = result.message || 'Ocurrió un error. Inténtalo de nuevo.';
        bookingError.style.display = 'block';
        return;
      }

      // Éxito: mostrar modal de confirmación
      if (modalOverlay) {
        modalOverlay.classList.add('active');
        bookingForm.reset();
      }
    } catch (err) {
      btn.innerHTML = prevHTML;
      btn.disabled = false;
      bookingError.textContent = 'Error de conexión. Asegúrate de estar en el servidor (localhost).';
      bookingError.style.display = 'block';
    }
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
