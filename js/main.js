
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* ── Hamburger menu ────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('mobile-open');
    hamburger.setAttribute('aria-expanded', isOpen);
    // animate bars
    const bars = hamburger.querySelectorAll('span');
    if (isOpen) {
      bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      bars[1].style.opacity   = '0';
      bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
    }
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      const bars = hamburger.querySelectorAll('span');
      bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
    });
  });
}

/* ── Scroll reveal ─────────────────────────── */
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

/* ── Dynamic booking select (service categories) ─ */
const categorySelect = document.getElementById('categoria');
const serviceSelect  = document.getElementById('servicio');

const servicesData = {
  facial: [
    'Limpieza Facial Profunda',
    'Hidratación Facial',
    'Tratamiento Anti-Edad',
    'Peeling Químico',
    'Mascarilla Iluminadora',
  ],
  corporal: [
    'Masaje Relajante',
    'Masaje Descontracturante',
    'Exfoliación Corporal',
    'Envoltura Reductora',
    'Drenaje Linfático',
  ],
  cejas: [
    'Diseño de Cejas',
    'Laminado de Cejas',
    'Extensión de Pestañas Clásica',
    'Extensión Volumen',
    'Lifting de Pestañas',
    'Tinte de Cejas y Pestañas',
  ],
  promo: [
    'Pack Relajación Total',
    'Pack Novia Completo',
    'Pack Corporal Completo',
    'Primera Visita (20% dto.)',
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

/* ── Set min date for booking ──────────────── */
const dateInput = document.getElementById('fecha');
if (dateInput) {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate() + 1).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
  dateInput.max = `${yyyy + 1}-${mm}-${dd}`;
}

/* ── Form submission + modal ───────────────── */
const bookingForm   = document.getElementById('bookingForm');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');

if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Simple validation feedback
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

    // Show confirmation modal
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      bookingForm.reset();
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

/* ── Add mobile nav styles dynamically ─────── */
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
