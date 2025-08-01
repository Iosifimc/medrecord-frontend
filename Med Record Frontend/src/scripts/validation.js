// validation.js - Módulo de validaciones en tiempo real
export class FormValidator {
  constructor(formSelector, options = {}) {
    this.form = document.querySelector(formSelector);
    this.options = {
      validateOnInput: true,
      validateOnBlur: true,
      showErrors: true,
      ...options
    };
    
    this.validators = new Map();
    this.fieldStates = new Map();
    
    if (this.form) {
      this.initialize();
    }
  }
  
  // Inicializar el validador
  initialize() {
    this.setupEventListeners();
    this.validateAll();
  }
  
  // Configurar event listeners
  setupEventListeners() {
    if (!this.form) return;
    
    const inputs = this.form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (this.options.validateOnInput) {
        input.addEventListener('input', () => this.validateField(input));
        input.addEventListener('change', () => this.validateField(input));
      }
      
      if (this.options.validateOnBlur) {
        input.addEventListener('blur', () => this.validateField(input));
      }
      
      // Validación especial para campos numéricos
      if (input.type === 'number') {
        input.addEventListener('keypress', (e) => {
          if (e.key === '-' && input.classList.contains('no-negative')) {
            e.preventDefault();
          }
        });
      }
    });
  }
  
  // Agregar validador personalizado
  addValidator(fieldName, validator, message) {
    this.validators.set(fieldName, { validator, message });
  }
  
  // Validar un campo específico
  validateField(field) {
    const fieldName = field.name || field.id;
    const value = field.value.trim();
    const type = field.type;
    const tagName = field.tagName.toLowerCase();
    
    let isValid = true;
    let errorMessage = '';
    
    // Validaciones básicas según el tipo
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Este campo es obligatorio';
    } else if (value) {
      // Validaciones específicas por tipo
      switch (type) {
        case 'email':
          if (!this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Ingresa un correo electrónico válido';
          }
          break;
          
        case 'number':
          if (!this.isValidNumber(value, field)) {
            isValid = false;
            errorMessage = this.getNumberErrorMessage(field);
          }
          break;
          
        case 'date':
          if (!this.isValidDate(value)) {
            isValid = false;
            errorMessage = 'Ingresa una fecha válida';
          }
          break;
          
        case 'password':
          if (!this.isValidPassword(value)) {
            isValid = false;
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          }
          break;
      }
      
      // Validaciones de longitud
      if (field.hasAttribute('minlength')) {
        const minLength = parseInt(field.getAttribute('minlength'));
        if (value.length < minLength) {
          isValid = false;
          errorMessage = `Mínimo ${minLength} caracteres`;
        }
      }
      
      if (field.hasAttribute('maxlength')) {
        const maxLength = parseInt(field.getAttribute('maxlength'));
        if (value.length > maxLength) {
          isValid = false;
          errorMessage = `Máximo ${maxLength} caracteres`;
        }
      }
      
      // Validaciones personalizadas
      if (this.validators.has(fieldName)) {
        const customValidator = this.validators.get(fieldName);
        if (!customValidator.validator(value, field)) {
          isValid = false;
          errorMessage = customValidator.message;
        }
      }
    }
    
    // Aplicar estado visual
    this.applyFieldState(field, isValid, errorMessage);
    
    // Guardar estado
    this.fieldStates.set(fieldName, { isValid, errorMessage });
    
    return isValid;
  }
  
  // Validar todos los campos
  validateAll() {
    if (!this.form) return false;
    
    const inputs = this.form.querySelectorAll('input, select, textarea');
    let allValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        allValid = false;
      }
    });
    
    return allValid;
  }
  
  // Aplicar estado visual al campo
  applyFieldState(field, isValid, errorMessage) {
    if (!this.options.showErrors) return;
    
    // Remover clases anteriores
    field.classList.remove('valid', 'invalid', 'field-error', 'field-success');
    
    if (field.value.trim()) {
      if (isValid) {
        field.classList.add('valid', 'field-success');
      } else {
        field.classList.add('invalid', 'field-error');
      }
    }
    
    // Mostrar/ocultar mensaje de error
    this.toggleErrorMessage(field, errorMessage);
  }
  
  // Mostrar/ocultar mensaje de error
  toggleErrorMessage(field, errorMessage) {
    let errorElement = field.parentNode.querySelector('.field-error-message');
    
    if (errorMessage) {
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        field.parentNode.appendChild(errorElement);
      }
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
    } else if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  // Validaciones específicas
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  isValidNumber(value, field) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    // Validar mínimo
    if (field.hasAttribute('min')) {
      const min = parseFloat(field.getAttribute('min'));
      if (num < min) return false;
    }
    
    // Validar máximo
    if (field.hasAttribute('max')) {
      const max = parseFloat(field.getAttribute('max'));
      if (num > max) return false;
    }
    
    // Validar que no sea negativo si tiene clase no-negative
    if (field.classList.contains('no-negative') && num < 0) {
      return false;
    }
    
    return true;
  }
  
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
  
  isValidPassword(password) {
    return password.length >= 6;
  }
  
  getNumberErrorMessage(field) {
    if (field.classList.contains('no-negative')) {
      return 'El valor debe ser mayor a 0';
    }
    
    if (field.hasAttribute('min') && field.hasAttribute('max')) {
      const min = field.getAttribute('min');
      const max = field.getAttribute('max');
      return `El valor debe estar entre ${min} y ${max}`;
    }
    
    if (field.hasAttribute('min')) {
      const min = field.getAttribute('min');
      return `El valor mínimo es ${min}`;
    }
    
    if (field.hasAttribute('max')) {
      const max = field.getAttribute('max');
      return `El valor máximo es ${max}`;
    }
    
    return 'Ingresa un valor numérico válido';
  }
  
  // Obtener estado de validación
  getFieldState(fieldName) {
    return this.fieldStates.get(fieldName);
  }
  
  // Verificar si el formulario es válido
  isFormValid() {
    return Array.from(this.fieldStates.values()).every(state => state.isValid);
  }
  
  // Limpiar validaciones
  clearValidations() {
    if (!this.form) return;
    
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.classList.remove('valid', 'invalid', 'field-error', 'field-success');
      this.toggleErrorMessage(input, '');
    });
    
    this.fieldStates.clear();
  }
  
  // Destruir validador
  destroy() {
    if (!this.form) return;
    
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.removeEventListener('input', this.validateField);
      input.removeEventListener('change', this.validateField);
      input.removeEventListener('blur', this.validateField);
    });
    
    this.validators.clear();
    this.fieldStates.clear();
  }
}

// Validadores específicos para el proyecto
export const validators = {
  // Validar nombre completo (mínimo 2 palabras)
  fullName: (value) => {
    const words = value.trim().split(/\s+/);
    return words.length >= 2 && words.every(word => word.length >= 2);
  },
  
  // Validar edad mínima (18 años)
  minimumAge: (value) => {
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  },
  
  // Validar fecha futura no permitida
  notFutureDate: (value) => {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual
    return selectedDate <= today;
  },
  
  // Validar que el valor esté en un rango específico
  inRange: (value, min, max) => {
    const num = parseFloat(value);
    return num >= min && num <= max;
  },
  
  // Validar formato de teléfono
  phoneFormat: (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    return phoneRegex.test(value);
  }
};

// Función para inicializar validaciones en toda la página
export function initializePageValidations() {
  // Validaciones para formulario de registro
  const registerForm = document.querySelector('form');
  if (registerForm && window.location.pathname.includes('registrarse.html')) {
    const registerValidator = new FormValidator('form');
    
    // Validadores personalizados para registro
    registerValidator.addValidator('name', validators.fullName, 'Ingresa nombre y apellido');
    registerValidator.addValidator('birthdate', validators.minimumAge, 'Debes ser mayor de 18 años');
    registerValidator.addValidator('birthdate', validators.notFutureDate, 'La fecha no puede ser futura');
    
    // Hacer disponible globalmente
    window.registerValidator = registerValidator;
  }
  
  // Validaciones para formulario de login
  if (registerForm && window.location.pathname.includes('iniciar-sesion.html')) {
    const loginValidator = new FormValidator('form');
    window.loginValidator = loginValidator;
  }
  
  // Validaciones para modal de historial médico
  if (window.location.pathname.includes('historial-medico.html')) {
    initializeMedicalFormValidations();
  }
}

// Inicializar validaciones específicas del formulario médico
function initializeMedicalFormValidations() {
  // Validaciones para el modal principal
  const mainModal = document.getElementById('newRecordModal');
  if (mainModal) {
    const modalValidator = new FormValidator('#newRecordModal form', {
      validateOnInput: true,
      validateOnBlur: true
    });
    
    // Validadores específicos para campos médicos
    modalValidator.addValidator('diagnostico', (value) => value.length >= 10, 'El diagnóstico debe tener al menos 10 caracteres');
    modalValidator.addValidator('centroMedico', (value) => value.length >= 3, 'Ingresa el nombre del centro médico');
    modalValidator.addValidator('nombreDoctor', validators.fullName, 'Ingresa el nombre completo del doctor');
    
    window.modalValidator = modalValidator;
  }
  
  // Validaciones para el modal de mediciones
  const measurementModal = document.getElementById('newMeasurementModal');
  if (measurementModal) {
    const measurementValidator = new FormValidator('#newMeasurementModal form', {
      validateOnInput: true,
      validateOnBlur: true
    });
    
    // Validadores específicos para mediciones
    measurementValidator.addValidator('valor', (value) => {
      const num = parseFloat(value);
      return num > 0 && num < 1000; // Rango razonable para medidas corporales
    }, 'El valor debe estar entre 0 y 1000');
    
    measurementValidator.addValidator('fecha', validators.notFutureDate, 'La fecha no puede ser futura');
    
    window.measurementValidator = measurementValidator;
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePageValidations);
} else {
  initializePageValidations();
} 