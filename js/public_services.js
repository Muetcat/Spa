/* ── Renderizado Dinámico de Servicios en el Frontend Público ── */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('dynamic-services-list');
  if (!container) return;

  const category = container.dataset.category; // e.g. 'facial', 'corporal', 'cejas'
  
  try {
    const res = await fetch(`api/public_services.php${category ? '?category=' + category : ''}`);
    const data = await res.json();

    if (!data.ok || !data.services || data.services.length === 0) {
      container.innerHTML = '<p class="admin-empty">No hay servicios disponibles en este momento.</p>';
      return;
    }

    let html = '';
    data.services.forEach((s, i) => {
      const num = String(i + 1).padStart(2, '0');
      const imgHtml = s.imagen_ruta 
        ? `<div class="service-item-img-wrap" style="width: 100px; height: 100px; flex-shrink: 0; border-radius: 8px; overflow: hidden; margin-right: 1.5rem; border: 1px solid var(--border-glass);"><img src="${s.imagen_ruta}" alt="${s.nombre}" style="width: 100%; height: 100%; object-fit: cover;"></div>`
        : '';
        
      const priceHtml = s.precio !== null ? `$${parseFloat(s.precio).toFixed(2)}` : 'Consultar';
      
      html += `
        <div class="service-item reveal">
          <span class="service-item-num">${num}</span>
          ${imgHtml}
          <div class="service-item-info" style="flex: 1;">
            <h3>${s.nombre}</h3>
            <p>${s.descripcion || ''}</p>
          </div>
          <div class="service-item-actions">
            <span class="service-item-price">${priceHtml}</span>
            <span class="service-item-badge">${s.duracion_min} min</span>
            <button type="button" class="add-to-cart-btn" 
              data-id="${s.id_servicio}" 
              data-name="${s.nombre}"
              data-price="${s.precio || 0}" 
              data-duration="${s.duracion_min} min" 
              data-category="${category || s.categoria_clave}">+ Agregar</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    
    // Re-aplicar IntersectionObserver para las nuevas cards "reveal"
    if (typeof revealObserver !== 'undefined') {
      container.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }
    
    // Re-bindear eventos del carrito
    if (typeof initCartButtons === 'function') {
      initCartButtons();
    }

  } catch (err) {
    console.error('Error cargando servicios:', err);
    container.innerHTML = '<p class="admin-empty">Ocurrió un error al cargar los servicios.</p>';
  }
});
