// modal-alerts.js
// Sistema de alertas modal moderno y reutilizable

class ModalAlerts {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.init();
  }

  init() {
    // Crear el overlay y modal si no existen
    if (!document.querySelector('.modal-overlay')) {
      this.createModalStructure();
    }
    this.overlay = document.querySelector('.modal-overlay');
    this.modal = document.querySelector('.alert-modal');
  }

  createModalStructure() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'alert-modal';
    
    modal.innerHTML = `
      <div class="alert-header">
        <div class="alert-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3 class="alert-title">Título</h3>
      </div>
      <div class="alert-content">
        <p class="alert-message">Mensaje</p>
      </div>
      <div class="alert-actions">
        <button class="alert-btn alert-btn-secondary" data-action="cancel">Cancelar</button>
        <button class="alert-btn alert-btn-primary" data-action="confirm">Aceptar</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('alert-btn')) {
        const action = e.target.dataset.action;
        this.handleAction(action);
      }
    });
  }

  show(options = {}) {
    const {
      title = 'Alerta',
      message = 'Mensaje de alerta',
      type = 'info', // success, error, warning, info
      showCancel = false,
      cancelText = 'Cancelar',
      confirmText = 'Aceptar',
      onConfirm = null,
      onCancel = null,
      autoClose = false,
      autoCloseDelay = 3000
    } = options;

    // Actualizar contenido
    this.updateContent(title, message, type, showCancel, cancelText, confirmText);
    
    // Mostrar modal
    this.overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Guardar callbacks
    this.currentCallbacks = { onConfirm, onCancel };
    
    // Auto close si está habilitado
    if (autoClose) {
      this.autoCloseTimer = setTimeout(() => {
        this.hide();
      }, autoCloseDelay);
    }
  }

  updateContent(title, message, type, showCancel, cancelText, confirmText) {
    const modal = this.modal;
    
    // Actualizar título y mensaje
    modal.querySelector('.alert-title').textContent = title;
    modal.querySelector('.alert-message').textContent = message;
    
    // Actualizar icono según tipo
    const icon = modal.querySelector('.alert-icon svg');
    icon.innerHTML = this.getIconForType(type);
    
    // Actualizar clase de tipo
    modal.className = `alert-modal alert-${type}`;
    
    // Actualizar botones
    const actions = modal.querySelector('.alert-actions');
    const cancelBtn = actions.querySelector('[data-action="cancel"]');
    const confirmBtn = actions.querySelector('[data-action="confirm"]');
    
    cancelBtn.textContent = cancelText;
    confirmBtn.textContent = confirmText;
    
    if (showCancel) {
      cancelBtn.style.display = 'block';
    } else {
      cancelBtn.style.display = 'none';
    }
  }

  getIconForType(type) {
    const icons = {
      success: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
      error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
      warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
      info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
    };
    return icons[type] || icons.info;
  }

  handleAction(action) {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
    
    if (action === 'confirm' && this.currentCallbacks.onConfirm) {
      this.currentCallbacks.onConfirm();
    } else if (action === 'cancel' && this.currentCallbacks.onCancel) {
      this.currentCallbacks.onCancel();
    }
    
    this.hide();
  }

  hide() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
    
    this.overlay.classList.remove('show');
    document.body.style.overflow = '';
    
    // Limpiar callbacks
    this.currentCallbacks = {};
  }

  // Métodos de conveniencia para diferentes tipos de alertas
  success(message, options = {}) {
    this.show({
      title: 'Éxito',
      message,
      type: 'success',
      autoClose: true,
      autoCloseDelay: 3000,
      ...options
    });
  }

  error(message, options = {}) {
    this.show({
      title: 'Error',
      message,
      type: 'error',
      ...options
    });
  }

  warning(message, options = {}) {
    this.show({
      title: 'Advertencia',
      message,
      type: 'warning',
      ...options
    });
  }

  info(message, options = {}) {
    this.show({
      title: 'Información',
      message,
      type: 'info',
      autoClose: true,
      autoCloseDelay: 4000,
      ...options
    });
  }

  confirm(message, onConfirm, onCancel) {
    this.show({
      title: 'Confirmar',
      message,
      type: 'warning',
      showCancel: true,
      onConfirm,
      onCancel
    });
  }
}

// Crear instancia global
const modalAlerts = new ModalAlerts();

// Función de conveniencia para compatibilidad con código existente
export const showAlert = (message, type = 'info', options = {}) => {
  const typeMap = {
    'success': 'success',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };
  
  const alertType = typeMap[type] || 'info';
  modalAlerts[alertType](message, options);
};

// Exportar la instancia para uso avanzado
export { modalAlerts }; 