// alert-examples.js
// Ejemplos de uso del sistema de alertas modal

import { modalAlerts } from './modal-alerts.js';

// Ejemplo de alerta de éxito
export const showSuccessExample = () => {
  modalAlerts.success('¡Operación completada exitosamente!');
};

// Ejemplo de alerta de error
export const showErrorExample = () => {
  modalAlerts.error('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
};

// Ejemplo de alerta de advertencia
export const showWarningExample = () => {
  modalAlerts.warning('Esta acción no se puede deshacer.');
};

// Ejemplo de alerta de información
export const showInfoExample = () => {
  modalAlerts.info('Tu sesión expirará en 5 minutos.');
};

// Ejemplo de confirmación
export const showConfirmExample = () => {
  modalAlerts.confirm(
    '¿Estás seguro de que quieres eliminar este registro?',
    () => {
      console.log('Usuario confirmó la acción');
      modalAlerts.success('Registro eliminado correctamente');
    },
    () => {
      console.log('Usuario canceló la acción');
    }
  );
};

// Ejemplo de alerta personalizada
export const showCustomExample = () => {
  modalAlerts.show({
    title: 'Acción Personalizada',
    message: 'Esta es una alerta con opciones personalizadas.',
    type: 'info',
    showCancel: true,
    cancelText: 'No, gracias',
    confirmText: 'Continuar',
    onConfirm: () => {
      modalAlerts.success('¡Continuaste con la acción!');
    },
    onCancel: () => {
      modalAlerts.info('Has cancelado la acción.');
    }
  });
};

// Ejemplo de alerta con auto-cierre personalizado
export const showAutoCloseExample = () => {
  modalAlerts.show({
    title: 'Mensaje Importante',
    message: 'Este mensaje se cerrará automáticamente en 5 segundos.',
    type: 'info',
    autoClose: true,
    autoCloseDelay: 5000
  });
}; 