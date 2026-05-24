/* ══════════════════════════════════════════════════════════
   SuSpa — Panel de Administración (admin.js)
══════════════════════════════════════════════════════════ */

const API = 'api/admin.php';

/* ── Helpers ──────────────────────────────────────────── */
async function api(action, data = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data })
  });
  return res.json();
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.className = 'admin-toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = 'admin-toast', 3500);
}

function statusBadge(estado) {
  const colors = {
    pendiente:  'badge-pending',
    confirmada: 'badge-confirmed',
    completada: 'badge-completed',
    cancelada:  'badge-cancelled',
    no_asistio: 'badge-noshow'
  };
  const labels = {
    pendiente:  'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada:  'Cancelada',
    no_asistio: 'No asistió'
  };
  return `<span class="admin-badge ${colors[estado] || ''}">${labels[estado] || estado}</span>`;
}

function activoBadge(val) {
  return val
    ? '<span class="admin-badge badge-completed">Activo</span>'
    : '<span class="admin-badge badge-cancelled">Inactivo</span>';
}

function formatDate(d) {
  if (!d) return '—';
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatPrice(p) {
  return p !== null && p !== undefined && p !== '' ? '$' + parseFloat(p).toFixed(2) : 'Consultar';
}

/* ── Cache de datos ──────────────────────────────────── */
let _categories = [];
let _services   = [];
let _promotions = [];
let _reservations = [];

/* ══════════════════════════════════════════════════════════
   VERIFICAR SESIÓN ADMIN
══════════════════════════════════════════════════════════ */
async function checkAdmin() {
  try {
    const res = await fetch('api/check_session.php', { cache: 'no-store' });
    const data = await res.json();
    if (!data.logged_in || !data.user.is_admin) {
      window.location.href = 'login.html';
      return false;
    }
    document.getElementById('adminUserName').textContent = data.user.name;
    document.getElementById('adminAvatar').textContent = data.user.name.charAt(0).toUpperCase();
    return true;
  } catch {
    window.location.href = 'login.html';
    return false;
  }
}

/* ══════════════════════════════════════════════════════════
   NAVEGACIÓN SPA
══════════════════════════════════════════════════════════ */
const sectionTitles = {
  dashboard:    { title: 'Dashboard', desc: 'Resumen general del negocio' },
  services:     { title: 'Servicios', desc: 'Gestiona los tratamientos del spa' },
  promotions:   { title: 'Promociones', desc: 'Gestiona packs y ofertas especiales' },
  reservations: { title: 'Reservas', desc: 'Administra las citas agendadas' }
};

function navigateTo(section) {
  // Actualizar nav items
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`[data-section="${section}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Mostrar sección
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');

  // Actualizar header
  const info = sectionTitles[section] || {};
  document.getElementById('adminPageTitle').textContent = info.title || '';
  document.getElementById('adminPageDesc').textContent = info.desc || '';

  // Cerrar sidebar en móvil
  document.getElementById('adminSidebar').classList.remove('open');

  // Cargar datos
  if (section === 'dashboard')    loadDashboard();
  if (section === 'services')     loadServices();
  if (section === 'promotions')   loadPromotions();
  if (section === 'reservations') loadReservations();
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */
async function loadDashboard() {
  const res = await api('get_dashboard');
  if (!res.ok) return;
  const s = res.stats;

  document.getElementById('dashboardStats').innerHTML = `
    <div class="admin-stat-card">
      <div class="admin-stat-icon" style="background:rgba(200,164,165,0.15);color:var(--primary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${s.servicios_activos}</span>
        <span class="admin-stat-label">Servicios Activos</span>
      </div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon" style="background:rgba(201,168,76,0.15);color:var(--accent);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${s.reservas_pendientes}</span>
        <span class="admin-stat-label">Reservas Pendientes</span>
      </div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon" style="background:rgba(37,211,102,0.12);color:#25d366;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${s.total_clientes}</span>
        <span class="admin-stat-label">Clientes Registrados</span>
      </div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon" style="background:rgba(200,164,165,0.15);color:var(--secondary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${s.promos_activas}</span>
        <span class="admin-stat-label">Promos Activas</span>
      </div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon" style="background:rgba(201,168,76,0.15);color:var(--accent);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${s.reservas_hoy}</span>
        <span class="admin-stat-label">Citas Hoy</span>
      </div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon" style="background:rgba(37,211,102,0.12);color:#25d366;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="admin-stat-info">
        <span class="admin-stat-value">${s.completadas_mes}</span>
        <span class="admin-stat-label">Completadas (Mes)</span>
      </div>
    </div>
  `;

  // Reservas recientes
  const tbody = document.getElementById('recentReservationsBody');
  if (s.reservas_recientes && s.reservas_recientes.length > 0) {
    tbody.innerHTML = s.reservas_recientes.map(r => `
      <tr>
        <td>#${r.id_reserva}</td>
        <td>${r.cliente}</td>
        <td>${r.servicio || '—'}</td>
        <td>${formatDate(r.fecha_cita)}</td>
        <td>${statusBadge(r.estado)}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">No hay reservas recientes</td></tr>';
  }
}

/* ══════════════════════════════════════════════════════════
   SERVICIOS
══════════════════════════════════════════════════════════ */
async function loadCategories() {
  const res = await api('get_categories');
  if (res.ok) _categories = res.categories;
}

async function loadServices() {
  if (_categories.length === 0) await loadCategories();

  // Llenar filtro de categorías
  const filterSel = document.getElementById('serviceCategoryFilter');
  if (filterSel.options.length <= 1) {
    _categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_categoria;
      opt.textContent = c.nombre;
      filterSel.appendChild(opt);
    });
  }

  const res = await api('get_services');
  if (!res.ok) return;
  _services = res.services;
  renderServices();
}

function renderServices() {
  const tbody     = document.getElementById('servicesBody');
  const search    = document.getElementById('serviceSearch').value.toLowerCase();
  const catFilter = document.getElementById('serviceCategoryFilter').value;

  let filtered = _services;
  if (search) filtered = filtered.filter(s => s.nombre.toLowerCase().includes(search));
  if (catFilter) filtered = filtered.filter(s => String(s.id_categoria) === catFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No se encontraron servicios</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr class="${s.activo ? '' : 'row-inactive'}">
      <td>
        ${s.imagen_ruta 
          ? `<img src="${s.imagen_ruta}" alt="Img" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid var(--border-glass);">`
          : `<span style="color:var(--text-muted);">—</span>`
        }
      </td>
      <td class="td-bold">${s.nombre}</td>
      <td><span class="admin-cat-pill">${s.categoria_nombre}</span></td>
      <td>${formatPrice(s.precio)}</td>
      <td>${s.duracion_min} min</td>
      <td>${s.es_destacado ? '<span class="admin-badge badge-confirmed">Sí</span>' : '—'}</td>
      <td>${activoBadge(s.activo)}</td>
      <td class="td-actions">
        <button class="admin-action-btn edit" title="Editar" onclick="editService(${s.id_servicio})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="admin-action-btn toggle" title="${s.activo ? 'Desactivar' : 'Activar'}" onclick="toggleService(${s.id_servicio}, ${s.activo ? 0 : 1})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            ${s.activo
              ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
              : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
            }
          </svg>
        </button>
        <button class="admin-action-btn cancel" title="Eliminar" onclick="deleteService(${s.id_servicio})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function openServiceModal(service = null) {
  const overlay = document.getElementById('serviceModalOverlay');
  document.getElementById('serviceModalTitle').textContent = service ? 'Editar Servicio' : 'Nuevo Servicio';
  document.getElementById('serviceFormError').textContent = '';

  // Llenar select de categorías
  const sel = document.getElementById('svc_categoria');
  sel.innerHTML = '<option value="">— Seleccionar —</option>';
  _categories.forEach(c => {
    sel.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`;
  });

  const previewContainer = document.getElementById('svc_imagen_preview_container');

  if (service) {
    document.getElementById('svc_id').value         = service.id_servicio;
    document.getElementById('svc_nombre').value      = service.nombre;
    document.getElementById('svc_descripcion').value = service.descripcion || '';
    document.getElementById('svc_precio').value      = service.precio ?? '';
    document.getElementById('svc_duracion').value    = service.duracion_min;
    document.getElementById('svc_orden').value       = service.orden;
    document.getElementById('svc_categoria').value   = service.id_categoria;
    document.getElementById('svc_destacado').checked = !!service.es_destacado;
    document.getElementById('svc_activo').checked    = !!service.activo;
    
    // Guardamos la ruta existente en un atributo de datos temporal
    document.getElementById('svc_imagen').dataset.existingPath = service.imagen_ruta || '';
    
    if (service.imagen_ruta) {
      previewContainer.innerHTML = `<img src="${service.imagen_ruta}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      previewContainer.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted);">Sin foto</span>`;
    }
  } else {
    document.getElementById('serviceForm').reset();
    document.getElementById('svc_id').value = '';
    document.getElementById('svc_activo').checked = true;
    document.getElementById('svc_imagen').dataset.existingPath = '';
    previewContainer.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted);">Sin foto</span>`;
  }

  overlay.classList.add('active');
}

function closeServiceModal() {
  document.getElementById('serviceModalOverlay').classList.remove('active');
}

function editService(id) {
  const s = _services.find(x => x.id_servicio == id);
  if (s) openServiceModal(s);
}

async function toggleService(id, activo) {
  const res = await api('toggle_service', { id_servicio: id, activo });
  if (res.ok) {
    showToast(res.message);
    loadServices();
  } else {
    showToast(res.message, 'error');
  }
}

async function deleteService(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este servicio permanentemente? Esta acción no se puede deshacer.')) return;
  const res = await api('delete_service', { id_servicio: id });
  if (res.ok) {
    showToast(res.message);
    loadServices();
  } else {
    showToast(res.message, 'error');
  }
}

async function saveService(e) {
  e.preventDefault();
  
  const saveBtn = document.getElementById('serviceModalSave');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando...';

  const id = document.getElementById('svc_id').value;
  const data = {
    nombre:       document.getElementById('svc_nombre').value.trim(),
    descripcion:  document.getElementById('svc_descripcion').value.trim(),
    precio:       document.getElementById('svc_precio').value,
    duracion_min: parseInt(document.getElementById('svc_duracion').value),
    id_categoria: parseInt(document.getElementById('svc_categoria').value),
    es_destacado: document.getElementById('svc_destacado').checked ? 1 : 0,
    activo:       document.getElementById('svc_activo').checked ? 1 : 0,
    orden:        parseInt(document.getElementById('svc_orden').value) || 0,
    imagen_ruta:  document.getElementById('svc_imagen').dataset.existingPath || ''
  };

  // Subir imagen si se seleccionó una nueva
  const fileInput = document.getElementById('svc_imagen');
  if (fileInput.files.length > 0) {
    saveBtn.textContent = 'Subiendo imagen...';
    const fd = new FormData();
    fd.append('action', 'upload_service_image');
    fd.append('imagen', fileInput.files[0]);
    
    try {
      const uploadRes = await fetch(API, { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (uploadData.ok) {
        data.imagen_ruta = uploadData.path;
      } else {
        document.getElementById('serviceFormError').textContent = uploadData.message;
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
        return;
      }
    } catch (err) {
      document.getElementById('serviceFormError').textContent = 'Error al subir la imagen.';
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
      return;
    }
  }

  let res;
  if (id) {
    data.id_servicio = parseInt(id);
    res = await api('update_service', data);
  } else {
    res = await api('create_service', data);
  }

  if (res.ok) {
    showToast(res.message);
    closeServiceModal();
    loadServices();
  } else {
    document.getElementById('serviceFormError').textContent = res.message;
  }
  
  saveBtn.disabled = false;
  saveBtn.textContent = originalText;
}


/* ══════════════════════════════════════════════════════════
   PROMOCIONES
══════════════════════════════════════════════════════════ */
async function loadPromotions() {
  const res = await api('get_promotions');
  if (!res.ok) return;
  _promotions = res.promotions;
  renderPromotions();
}

function renderPromotions() {
  const tbody  = document.getElementById('promosBody');
  const search = document.getElementById('promoSearch').value.toLowerCase();

  let filtered = _promotions;
  if (search) filtered = filtered.filter(p => p.nombre.toLowerCase().includes(search));

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No se encontraron promociones</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr class="${p.activo ? '' : 'row-inactive'}">
      <td class="td-bold">${p.nombre}</td>
      <td>${p.etiqueta_badge || '—'}</td>
      <td>${p.precio_original ? '$' + parseFloat(p.precio_original).toFixed(2) : '—'}</td>
      <td>${p.precio_oferta ? '$' + parseFloat(p.precio_oferta).toFixed(2) : '—'}</td>
      <td>${p.porcentaje_dto ? p.porcentaje_dto + '%' : '—'}</td>
      <td>${activoBadge(p.activo)}</td>
      <td class="td-actions">
        <button class="admin-action-btn edit" title="Editar" onclick="editPromo(${p.id_promocion})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function openPromoModal(promo = null) {
  const overlay = document.getElementById('promoModalOverlay');
  document.getElementById('promoModalTitle').textContent = promo ? 'Editar Promoción' : 'Nueva Promoción';
  document.getElementById('promoFormError').textContent = '';

  if (promo) {
    document.getElementById('promo_id').value              = promo.id_promocion;
    document.getElementById('promo_nombre').value           = promo.nombre;
    document.getElementById('promo_descripcion').value      = promo.descripcion || '';
    document.getElementById('promo_badge').value            = promo.etiqueta_badge || '';
    document.getElementById('promo_precio_original').value  = promo.precio_original ?? '';
    document.getElementById('promo_precio_oferta').value    = promo.precio_oferta ?? '';
    document.getElementById('promo_dto').value              = promo.porcentaje_dto ?? '';
    document.getElementById('promo_orden').value            = promo.orden;
    document.getElementById('promo_activo').checked         = !!promo.activo;
  } else {
    document.getElementById('promoForm').reset();
    document.getElementById('promo_id').value = '';
    document.getElementById('promo_activo').checked = true;
  }

  overlay.classList.add('active');
}

function closePromoModal() {
  document.getElementById('promoModalOverlay').classList.remove('active');
}

function editPromo(id) {
  const p = _promotions.find(x => x.id_promocion == id);
  if (p) openPromoModal(p);
}

async function savePromo(e) {
  e.preventDefault();
  const id = document.getElementById('promo_id').value;
  const data = {
    nombre:          document.getElementById('promo_nombre').value.trim(),
    descripcion:     document.getElementById('promo_descripcion').value.trim(),
    etiqueta_badge:  document.getElementById('promo_badge').value.trim(),
    precio_original: document.getElementById('promo_precio_original').value,
    precio_oferta:   document.getElementById('promo_precio_oferta').value,
    porcentaje_dto:  document.getElementById('promo_dto').value,
    activo:          document.getElementById('promo_activo').checked ? 1 : 0,
    orden:           parseInt(document.getElementById('promo_orden').value) || 0
  };

  let res;
  if (id) {
    data.id_promocion = parseInt(id);
    res = await api('update_promotion', data);
  } else {
    res = await api('create_promotion', data);
  }

  if (res.ok) {
    showToast(res.message);
    closePromoModal();
    loadPromotions();
  } else {
    document.getElementById('promoFormError').textContent = res.message;
  }
}


/* ══════════════════════════════════════════════════════════
   RESERVAS
══════════════════════════════════════════════════════════ */
async function loadReservations() {
  const estado = document.getElementById('reservationStatusFilter').value;
  const res = await api('get_reservations', estado ? { estado } : {});
  if (!res.ok) return;
  _reservations = res.reservations;
  renderReservations();
}

function renderReservations() {
  const tbody  = document.getElementById('reservationsBody');
  const search = document.getElementById('reservationSearch').value.toLowerCase();

  let filtered = _reservations;
  if (search) filtered = filtered.filter(r =>
    r.cliente.toLowerCase().includes(search) ||
    (r.servicio && r.servicio.toLowerCase().includes(search))
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">No se encontraron reservas</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>#${r.id_reserva}</td>
      <td class="td-bold">${r.cliente}</td>
      <td>${r.servicio || r.promocion || '—'}</td>
      <td>${formatDate(r.fecha_cita)}</td>
      <td>${r.hora_inicio ? r.hora_inicio.substring(0,5) : '—'}</td>
      <td>${statusBadge(r.estado)}</td>
      <td class="td-actions">
        <button class="admin-action-btn edit" title="Ver detalle" onclick="viewReservation(${r.id_reserva})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        ${r.estado === 'pendiente' ? `
          <button class="admin-action-btn confirm" title="Confirmar" onclick="updateReservationStatus(${r.id_reserva}, 'confirmada')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        ` : ''}
        ${r.estado === 'confirmada' ? `
          <button class="admin-action-btn confirm" title="Completar" onclick="updateReservationStatus(${r.id_reserva}, 'completada')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        ` : ''}
        ${['pendiente','confirmada'].includes(r.estado) ? `
          <button class="admin-action-btn cancel" title="Cancelar" onclick="updateReservationStatus(${r.id_reserva}, 'cancelada')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function viewReservation(id) {
  const r = _reservations.find(x => x.id_reserva == id);
  if (!r) return;

  const detail = document.getElementById('reservationDetail');
  detail.innerHTML = `
    <div class="admin-detail-grid">
      <div class="admin-detail-item">
        <span class="admin-detail-label">Cliente</span>
        <span class="admin-detail-value">${r.cliente}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Teléfono</span>
        <span class="admin-detail-value">${r.tel_cliente || '—'}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Correo</span>
        <span class="admin-detail-value">${r.email_cliente || '—'}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Servicio</span>
        <span class="admin-detail-value">${r.servicio || r.promocion || '—'}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Fecha</span>
        <span class="admin-detail-value">${formatDate(r.fecha_cita)}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Hora</span>
        <span class="admin-detail-value">${r.hora_inicio ? r.hora_inicio.substring(0,5) : '—'}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Estado</span>
        <span class="admin-detail-value">${statusBadge(r.estado)}</span>
      </div>
      <div class="admin-detail-item">
        <span class="admin-detail-label">Creada</span>
        <span class="admin-detail-value">${r.fecha_creacion || '—'}</span>
      </div>
      ${r.notas_reserva ? `
        <div class="admin-detail-item full-width">
          <span class="admin-detail-label">Notas</span>
          <span class="admin-detail-value">${r.notas_reserva}</span>
        </div>
      ` : ''}
    </div>
    <div class="admin-detail-actions">
      <label>Cambiar estado:</label>
      <select id="detailStatusSelect">
        <option value="pendiente"  ${r.estado === 'pendiente'  ? 'selected' : ''}>Pendiente</option>
        <option value="confirmada" ${r.estado === 'confirmada' ? 'selected' : ''}>Confirmada</option>
        <option value="completada" ${r.estado === 'completada' ? 'selected' : ''}>Completada</option>
        <option value="cancelada"  ${r.estado === 'cancelada'  ? 'selected' : ''}>Cancelada</option>
        <option value="no_asistio" ${r.estado === 'no_asistio' ? 'selected' : ''}>No asistió</option>
      </select>
      <button class="admin-btn-primary" onclick="updateStatusFromDetail(${r.id_reserva})">Actualizar</button>
    </div>
  `;

  document.getElementById('reservationModalOverlay').classList.add('active');
}

async function updateReservationStatus(id, estado) {
  const res = await api('update_reservation_status', { id_reserva: id, estado });
  if (res.ok) {
    showToast(res.message);
    loadReservations();
  } else {
    showToast(res.message, 'error');
  }
}

async function updateStatusFromDetail(id) {
  const estado = document.getElementById('detailStatusSelect').value;
  const res = await api('update_reservation_status', { id_reserva: id, estado });
  if (res.ok) {
    showToast(res.message);
    document.getElementById('reservationModalOverlay').classList.remove('active');
    loadReservations();
  } else {
    showToast(res.message, 'error');
  }
}


/* ══════════════════════════════════════════════════════════
   INICIALIZACIÓN
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  // Verificar admin
  const ok = await checkAdmin();
  if (!ok) return;

  // Cargar categorías para los modales
  await loadCategories();

  // Navegación sidebar
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });

  // Logout
  document.getElementById('admin-logout-btn').addEventListener('click', async () => {
    try {
      await fetch('api/logout.php', { method: 'POST' });
      window.location.href = 'login.html';
    } catch { window.location.href = 'login.html'; }
  });

  // ── Servicios ──
  document.getElementById('btnNewService').addEventListener('click', () => openServiceModal());
  document.getElementById('serviceModalClose').addEventListener('click', closeServiceModal);
  document.getElementById('serviceModalCancel').addEventListener('click', closeServiceModal);
  document.getElementById('serviceModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeServiceModal();
  });
  document.getElementById('serviceForm').addEventListener('submit', saveService);
  document.getElementById('serviceSearch').addEventListener('input', renderServices);
  document.getElementById('serviceCategoryFilter').addEventListener('change', renderServices);
  
  // Preview local de imagen al seleccionar un archivo
  document.getElementById('svc_imagen').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('svc_imagen_preview_container');
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        previewContainer.innerHTML = `<img src="${evt.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
      }
      reader.readAsDataURL(file);
    } else {
      const existing = this.dataset.existingPath;
      if (existing) {
        previewContainer.innerHTML = `<img src="${existing}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        previewContainer.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted);">Sin foto</span>`;
      }
    }
  });

  // ── Promociones ──
  document.getElementById('btnNewPromo').addEventListener('click', () => openPromoModal());
  document.getElementById('promoModalClose').addEventListener('click', closePromoModal);
  document.getElementById('promoModalCancel').addEventListener('click', closePromoModal);
  document.getElementById('promoModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePromoModal();
  });
  document.getElementById('promoForm').addEventListener('submit', savePromo);
  document.getElementById('promoSearch').addEventListener('input', renderPromotions);

  // ── Reservas ──
  document.getElementById('reservationModalClose').addEventListener('click', () => {
    document.getElementById('reservationModalOverlay').classList.remove('active');
  });
  document.getElementById('reservationModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
  });
  document.getElementById('reservationSearch').addEventListener('input', renderReservations);
  document.getElementById('reservationStatusFilter').addEventListener('change', loadReservations);

  // Cargar dashboard inicial
  navigateTo('dashboard');
});
