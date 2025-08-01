// test-functions.js
// Archivo de prueba para verificar que todas las funciones están definidas

console.log('=== Verificación de funciones del historial médico ===');

// Lista de funciones que deben estar definidas
const requiredFunctions = [
  'checkUserAuthentication',
  'initializeNavigation',
  'loadUserData',
  'updateUserInfo',
  'calculateAge',
  'initializeModules',
  'loadInitialData',
  'openModal',
  'closeModal',
  'loadMedicalHistory',
  'loadConsultations',
  'loadPersonalMeasurements',
  'displayMedicalHistory',
  'displayConsultations',
  'displayMeasurements',
  'formatDate',
  'getMedidaTypeName',
  'getMedidaIcon',
  'getMedidaUnit',
  'updateModalNavigation',
  'initializeMeasurementListeners',
  'addRealTimeValidation',
  'preventNegativeNumbers',
  'clearNewRecordForm',
  'addRealTimeModalValidation'
];

// Verificar que todas las funciones estén definidas
let allFunctionsDefined = true;

requiredFunctions.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    console.log(`✅ ${funcName} - DEFINIDA`);
  } else {
    console.log(`❌ ${funcName} - NO DEFINIDA`);
    allFunctionsDefined = false;
  }
});

// Verificar funciones globales (window)
const globalFunctions = [
  'editConsulta',
  'deleteConsulta',
  'editMedida',
  'deleteMedida',
  'editAlergia',
  'editMedicamento',
  'editCirugia',
  'editEnfermedad',
  'openMedicalHistoryModal',
  'openMeasurementModal',
  'logout'
];

console.log('\n=== Funciones globales (window) ===');
globalFunctions.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    console.log(`✅ ${funcName} - DEFINIDA`);
  } else {
    console.log(`❌ ${funcName} - NO DEFINIDA`);
    allFunctionsDefined = false;
  }
});

// Resultado final
console.log('\n=== RESULTADO FINAL ===');
if (allFunctionsDefined) {
  console.log('🎉 TODAS LAS FUNCIONES ESTÁN DEFINIDAS CORRECTAMENTE');
} else {
  console.log('⚠️  ALGUNAS FUNCIONES FALTAN');
}

// Verificar variables globales
console.log('\n=== Variables globales ===');
const globalVars = ['currentUser', 'userMedicalHistory', 'userConsultations', 'userMeasurements'];
globalVars.forEach(varName => {
  if (typeof window[varName] !== 'undefined') {
    console.log(`✅ ${varName} - DEFINIDA`);
  } else {
    console.log(`❌ ${varName} - NO DEFINIDA`);
  }
});

console.log('\n=== Prueba completada ==='); 