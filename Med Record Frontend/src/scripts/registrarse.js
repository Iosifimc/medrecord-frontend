// registrarse.js
// Lógica de registro de usuario modularizada y lista para API
import { apiRequest } from './api.js';
import { showAlert } from './modal-alerts.js';
import { FormValidator, validators } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    removePasswordArrow();
    fixGenderSelect();
  }, 100);

  const form = document.querySelector('form');
  const nameInput = document.getElementById('name');
  const lastnameInput = document.getElementById('lastname');
  const birthdateInput = document.getElementById('birthdate');
  const genderSelect = document.querySelector('select');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const registerBtn = document.querySelector('.register-btn');

  // Inicializar validador de formulario
  formValidator = new FormValidator('form');
  
  // Agregar validadores personalizados
  formValidator.addValidator('birthdate', validators.minimumAge, 'Debes ser mayor de 18 años');
  formValidator.addValidator('birthdate', validators.notFutureDate, 'La fecha no puede ser futura');

  // Fecha máxima (13 años)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  birthdateInput.max = maxDate.toISOString().split('T')[0];

  [nameInput, lastnameInput].forEach(input => {
    input.addEventListener('blur', function () {
      if (this.value.trim()) {
        this.value = formatName(this.value.trim());
      }
    });
  });

  form.addEventListener('submit', handleSubmit);
});

document.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    const form = document.querySelector('form');
    form.dispatchEvent(new Event('submit'));
  }
});

// Inicializar validador de formulario
let formValidator;

const handleValidateForm = () => {
  // La validación ahora se maneja automáticamente por el FormValidator
  if (formValidator) {
    return formValidator.isFormValid();
  }
  return false;
};

const handleSubmit = async event => {
  event.preventDefault();
  const formData = getFormData();
  const registerBtn = document.querySelector('.register-btn');

  // Usar el nuevo sistema de validación
  if (!formValidator || !formValidator.isFormValid()) {
    showAlert('Por favor completa todos los campos correctamente', 'error');
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerHTML = '<span class="loading-spinner"></span>Registrando...';

  try {
    //objeto para enviar a la api
    const userData = {
      nombre: formData.name,
      apellidoPaterno: formData.lastname,
      apellidoMaterno: '',
      correo: formData.email,
      contrasena: formData.password,
      fechaNacimiento: formData.birthdate,
      sexo: formData.gender === '1' ? 'Masculino' : 'Femenino'
    };

    //enviar a la api
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    //si la respuesta es exitosa, enviar el mismo objeto a la api a /verificar-email  por post
    const token = response.tokenVerificacion;
    //agregar el token de verificacion a la api por query params  
    const response2 = await apiRequest(`/verificar-email?token=${token}`, {
      method: 'POST',
    });

    showAlert('¡Registro exitoso! Redirigiendo al inicio de sesión...', 'success');
    setTimeout(() => {
      window.location.href = 'iniciar-sesion.html';
    }, 2000);
  } catch (error) {
    console.log(error);
    if (error.message === '409') {
      showAlert('El correo electrónico ya está en uso', 'error');
    } else {
      showAlert('Error al registrar usuario: ' + (error.message || 'Intenta de nuevo'), 'error');
    }
    // showAlert('Error al registrar usuario: ' + (error.message || 'Intenta de nuevo'), 'error');
    registerBtn.disabled = false;
    registerBtn.innerHTML = 'Registrarse';
  }
};

const getFormData = () => ({
  name: document.getElementById('name').value.trim(),
  lastname: document.getElementById('lastname').value.trim(),
  birthdate: document.getElementById('birthdate').value,
  gender: document.querySelector('select').value,
  email: document.getElementById('email').value.trim().toLowerCase(),
  password: document.getElementById('password').value
});

const validateAllFieldsSimple = data => {
  if (!data.name || data.name.length < 2) {
    return { isValid: false, message: 'Por favor ingrese un nombre válido (mínimo 2 caracteres)', field: 'name' };
  }
  if (!data.lastname || data.lastname.length < 2) {
    return { isValid: false, message: 'Por favor ingrese apellidos válidos (mínimo 2 caracteres)', field: 'lastname' };
  }
  if (!data.birthdate) {
    return { isValid: false, message: 'Por favor seleccione su fecha de nacimiento', field: 'birthdate' };
  }
  const age = calculateAge(data.birthdate);
  if (age < 13 || age > 120) {
    return { isValid: false, message: 'La edad debe estar entre 13 y 120 años', field: 'birthdate' };
  }
  if (!data.gender) {
    return { isValid: false, message: 'Por favor seleccione su sexo', field: 'gender' };
  }
  if (!data.email || !isValidEmail(data.email)) {
    return { isValid: false, message: 'Por favor ingrese un correo electrónico válido', field: 'email' };
  }
  if (!data.password || data.password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres', field: 'password' };
  }
  return { isValid: true };
};



const calculateAge = birthdate => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatName = name => name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function removePasswordArrow() {
  // Implementación opcional
}

function fixGenderSelect() {
  const genderSelect = document.querySelector('#gender');
  if (genderSelect) {
    genderSelect.style.backgroundImage = "url('data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e')";
    genderSelect.style.backgroundPosition = 'right 12px center';
    genderSelect.style.backgroundRepeat = 'no-repeat';
    genderSelect.style.backgroundSize = '16px';
    genderSelect.style.appearance = 'none';
    genderSelect.style.webkitAppearance = 'none';
    genderSelect.style.mozAppearance = 'none';
  }
} 