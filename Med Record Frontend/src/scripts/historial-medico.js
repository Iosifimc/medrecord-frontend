// historial-medico.js - VERSIÓN MEJORADA CON GRÁFICAS AVANZADAS
// Funcionalidad completa con segunda gráfica y rangos normales
import { apiRequest } from './api.js';
import { modalAlerts } from './modal-alerts.js';
import { FormValidator, validators } from './validation.js';

// Variables globales
let currentUser = null;
let userMedicalHistory = null;
let userConsultations = null;
let userMeasurements = null;

// Rangos normales para medidas corporales
const NORMAL_RANGES = {
  glucosa: {
    min: 70,
    max: 100,
    unit: 'mg/dL',
    name: 'Glucosa en ayunas',
    optimal: { min: 80, max: 90 }
  },
  presion: {
    systolic: { min: 90, max: 120 },
    diastolic: { min: 60, max: 80 },
    unit: 'mmHg',
    name: 'Presión arterial',
    optimal: { systolic: { min: 100, max: 110 }, diastolic: { min: 65, max: 75 } }
  },
  temperatura: {
    min: 36.1,
    max: 37.2,
    unit: '°C',
    name: 'Temperatura corporal',
    optimal: { min: 36.5, max: 36.8 }
  }
};

// Inicializar variable global para la sección actual del modal
window.currentSection = 'detalles';

// --- Inicialización principal ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkUserAuthentication();
    initializeNavigation();
    await loadUserData();
    initializeModules();
    await loadInitialData();
  } catch (error) {
    console.error('Error en inicialización:', error);
    modalAlerts.error('Error al cargar la página. Por favor, inicia sesión nuevamente.');
  }
});

// [MANTENER TODAS LAS FUNCIONES EXISTENTES...]
// --- Verificación de autenticación ---
async function checkUserAuthentication() {
  const userData = localStorage.getItem('user');
  if (!userData) {
    throw new Error('Usuario no autenticado');
  }
  
  currentUser = JSON.parse(userData);
  if (!currentUser.idUsuario) {
    throw new Error('Datos de usuario inválidos');
  }
}

// --- Inicialización de navegación ---
function initializeNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      this.classList.add('active');
      const tabId = this.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// --- Cargar datos del usuario ---
async function loadUserData() {
  try {
    // Primero actualizar con los datos que tenemos
    updateUserInfo();
    
    // TEMPORAL: Comentar la petición a la API hasta que esté funcionando
    console.log('currentUser desde localStorage:', currentUser);
    
    // Intentar obtener datos actualizados de la API (opcional)
    try {
      const userData = await apiRequest(`/users/${currentUser.idUsuario}`);
      console.log('Datos recibidos de la API:', userData);
      currentUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateUserInfo();
    } catch (apiError) {
      console.warn('No se pudieron obtener datos actualizados de la API:', apiError.message);
      console.log('Continuando con datos del localStorage...');
      // No es un error crítico, continuamos con los datos del localStorage
    }
    
  } catch (error) {
    console.error('Error crítico al cargar datos del usuario:', error);
    // Solo mostrar error si es realmente crítico
    modalAlerts.warning('Usando datos locales. Algunos datos podrían no estar actualizados.');
  }
}

// --- Actualizar información del usuario en el header ---
function updateUserInfo() {
  const userInfoElement = document.querySelector('.user-info');
  if (userInfoElement && currentUser) {
    const age = calculateAge(currentUser.fechaNacimiento);
    const fullName = `${currentUser.nombre} ${currentUser.apellidoPaterno} ${currentUser.apellidoMaterno}`.trim();
    
    userInfoElement.innerHTML = `
      <div class="user-name">${fullName} | ${age} años</div>
      <div>${currentUser.correo}</div>
      <button class="logout-btn" onclick="logout()">Cerrar sesión</button>
    `;
  }
}

// --- Calcular edad ---
function calculateAge(birthDate) {
  if (!birthDate) return 'N/A';
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// --- Inicializar módulos ---
function initializeModules() {
  updateModalNavigation();
  initializeMeasurementListeners();
  addRealTimeValidation();
  preventNegativeNumbers();
}

// --- Cargar datos iniciales ---
async function loadInitialData() {
  try {
    await loadMedicalHistory();
    await loadConsultations();
    await loadPersonalMeasurements();
    await loadPersonalMeasurementModal();
    await loadEnhancedCharts(); // NUEVA función mejorada
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
    modalAlerts.error('Error al cargar los datos médicos');
  }
}

// NUEVA FUNCIÓN: Cargar gráficas mejoradas con segunda sección
const loadEnhancedCharts = async () => {
  try {
    const data = await apiRequest(`/medidas/usuario/${currentUser.idUsuario}`, {
      method: 'GET'
    });

    // Reemplazar el contenido del módulo de gráficas
    const graficasContainer = document.querySelector("#graficas");
    graficasContainer.innerHTML = `
      <div class="charts-enhanced-container">
        <!-- Primera sección: Gráfica básica -->
        <div class="chart-section-wrapper">
          <div class="section-title">
            <h2>📊 Seguimiento de Medidas</h2>
            <p>Visualiza la evolución de tus medidas corporales</p>
          </div>
          
          <div class="measurement-tabs">
            <button class="measurement-tab active" data-type="peso">Peso</button>
            <button class="measurement-tab" data-type="altura">Altura</button>
            <button class="measurement-tab" data-type="presion">Presión arterial</button>
            <button class="measurement-tab" data-type="temperatura">Temperatura</button>
            <button class="measurement-tab" data-type="glucosa">Glucosa</button>
          </div>
          
          <div class="charts-main-content">
            <div class="chart-section">
              <div class="chart-header">
                <h3>Gráfica por mes</h3>
                <button id="graficar-btn" class="btn-chart">Actualizar</button>
              </div>
              
              <div class="month-year-selector">
                <button class="nav-btn prev-month" id="prev-chart">◀</button>
                <p class="current-month-year">
                  <span id="currentMonth">Julio</span>
                  <span id="currentYear">2025</span> 
                </p>
                <button class="nav-btn next-month" id="next-chart">▶</button>
              </div>
              
              <div class="chart-container">
                <canvas id="measurementChart" width="600" height="300"></canvas>
              </div>
            </div>
            
            <div class="stats-section">
              <div class="stats-header">
                <h3>Estadísticas básicas</h3>
              </div>
              
              <div class="stats-content">
                <div class="stat-item">
                  <span class="stat-label">Mediciones registradas:</span>
                  <span class="stat-value" id="totalMeasurements">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Primer registro:</span>
                  <span class="stat-value" id="firstMeasurement">-</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Último registro:</span>
                  <span class="stat-value" id="lastMeasurement">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Segunda sección: Análisis clínico con rangos normales -->
        <div class="clinical-analysis-section">
          <div class="section-title">
            <h2>🏥 Análisis Clínico</h2>
            <p>Compara tus valores con rangos médicos normales</p>
          </div>

          <!-- Selector de medidas para análisis clínico -->
          <div class="clinical-tabs">
            <button class="clinical-tab active" data-type="glucosa">
              <span class="tab-icon">🩸</span>
              <span>Glucosa</span>
            </button>
            <button class="clinical-tab" data-type="presion">
              <span class="tab-icon">❤️</span>
              <span>Presión Arterial</span>
            </button>
            <button class="clinical-tab" data-type="temperatura">
              <span class="tab-icon">🌡️</span>
              <span>Temperatura</span>
            </button>
          </div>

          <div class="clinical-content">
            <!-- Control de período -->
            <div class="period-selector">
              <label for="periodSelect">Período de análisis:</label>
              <select id="periodSelect" class="period-select">
                <option value="1">Último mes</option>
                <option value="3">Últimos 3 meses</option>
                <option value="6" selected>Últimos 6 meses</option>
                <option value="12">Último año</option>
              </select>
            </div>

            <!-- Gráfica con rangos normales -->
            <div class="clinical-chart-section">
              <div class="clinical-chart-header">
                <h3 id="clinicalChartTitle">Análisis de Glucosa</h3>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-color optimal"></div>
                    <span>Rango óptimo</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color normal"></div>
                    <span>Rango normal</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color user-data"></div>
                    <span>Tus valores</span>
                  </div>
                </div>
              </div>
              
              <div class="clinical-chart-container">
                <canvas id="clinicalChart" width="800" height="400"></canvas>
              </div>
            </div>

            <!-- Análisis estadístico -->
            <div class="clinical-stats-grid">
              <div class="clinical-stat-card">
                <h4>📈 Promedio</h4>
                <div class="stat-value-large" id="avgValue">-</div>
                <div class="stat-status" id="avgStatus">-</div>
              </div>
              
              <div class="clinical-stat-card">
                <h4>📊 Rango</h4>
                <div class="stat-range">
                  <span>Min: <span id="minValue">-</span></span>
                  <span>Max: <span id="maxValue">-</span></span>
                </div>
              </div>
              
              <div class="clinical-stat-card">
                <h4>✅ En rango normal</h4>
                <div class="stat-percentage" id="normalPercentage">-</div>
                <div class="stat-count" id="normalCount">-</div>
              </div>
              
              <div class="clinical-stat-card">
                <h4>⚠️ Fuera de rango</h4>
                <div class="stat-percentage" id="abnormalPercentage">-</div>
                <div class="stat-count" id="abnormalCount">-</div>
              </div>
            </div>


          </div>
        </div>
      </div>
    `;

    // Inicializar la funcionalidad
    initializeEnhancedCharts(data);
  } catch (error) {
    console.error('Error al cargar gráficas mejoradas:', error);
    modalAlerts.error('Error al cargar las gráficas');
  }
};

// NUEVA FUNCIÓN: Inicializar gráficas mejoradas
function initializeEnhancedCharts(data) {
  const graficasContainer = document.querySelector("#graficas");
  
  // Elementos de la primera sección (gráfica básica)
  const basicTabs = graficasContainer.querySelectorAll(".measurement-tab");
  const nextMonthButton = graficasContainer.querySelector("#next-chart");
  const previousMonthButton = graficasContainer.querySelector("#prev-chart");
  const textMonth = graficasContainer.querySelector("#currentMonth");
  const textYear = graficasContainer.querySelector("#currentYear");
  const totalMeasurementsEl = graficasContainer.querySelector("#totalMeasurements");
  const firstMeasurementEl = graficasContainer.querySelector("#firstMeasurement");
  const lastMeasurementEl = graficasContainer.querySelector("#lastMeasurement");

  // Elementos de la segunda sección (análisis clínico)
  const clinicalTabs = graficasContainer.querySelectorAll(".clinical-tab");
  const periodSelect = graficasContainer.querySelector("#periodSelect");
  const clinicalChartTitle = graficasContainer.querySelector("#clinicalChartTitle");

  const nombresMes = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  let fecha = new Date();
  let mes = fecha.getMonth();
  let año = fecha.getFullYear();
  let medidaBasica = "peso";
  let medidaClinica = "glucosa";
  let periodoMeses = 6;

  let basicChartInstance = null;
  let clinicalChartInstance = null;

  // Actualizar texto de fecha
  const actualizarTexto = () => {
    textMonth.textContent = nombresMes[mes];
    textYear.textContent = año;
  };

  actualizarTexto();

  // Filtrar datos para gráfica básica
  const filtrarDatosBasicos = () => {
    return data
      .filter(item => item.tipoMedida.toLowerCase() === medidaBasica.toLowerCase())
      .filter(item => {
        const fecha = new Date(item.fechaRegistro);
        return fecha.getMonth() === mes && fecha.getFullYear() === año;
      })
      .map(item => ({
        fecha: new Date(item.fechaRegistro),
        fechaStr: new Date(item.fechaRegistro).toLocaleDateString('es-MX'),
        valor: item.valorMedida
      }));
  };

  // Filtrar datos para análisis clínico
  const filtrarDatosClinicos = () => {
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - periodoMeses);
    
    return data
      .filter(item => item.tipoMedida.toLowerCase() === medidaClinica.toLowerCase())
      .filter(item => new Date(item.fechaRegistro) >= fechaLimite)
      .map(item => ({
        fecha: new Date(item.fechaRegistro),
        fechaStr: new Date(item.fechaRegistro).toLocaleDateString('es-MX'),
        valor: item.valorMedida
      }))
      .sort((a, b) => a.fecha - b.fecha);
  };

  // Renderizar gráfica básica
  const renderizarGraficaBasica = () => {
    const datosFiltrados = filtrarDatosBasicos();

    // Actualizar estadísticas básicas
    totalMeasurementsEl.textContent = datosFiltrados.length;

    if (datosFiltrados.length > 0) {
      const fechasOrdenadas = datosFiltrados
        .map(d => d.fecha)
        .sort((a, b) => a - b);
      firstMeasurementEl.textContent = fechasOrdenadas[0].toLocaleDateString('es-MX');
      lastMeasurementEl.textContent = fechasOrdenadas[fechasOrdenadas.length - 1].toLocaleDateString('es-MX');
    } else {
      firstMeasurementEl.textContent = "-";
      lastMeasurementEl.textContent = "-";
    }

    const ctx = document.getElementById('measurementChart').getContext('2d');

    if (basicChartInstance) {
      basicChartInstance.destroy();
    }

    basicChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datosFiltrados.map(d => d.fechaStr),
        datasets: [{
          label: `${medidaBasica.charAt(0).toUpperCase() + medidaBasica.slice(1)}`,
          data: datosFiltrados.map(d => d.valor),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  };

  // Renderizar gráfica clínica con rangos
  const renderizarGraficaClinica = () => {
    const datosClinicos = filtrarDatosClinicos();
    const rango = NORMAL_RANGES[medidaClinica];
    
    if (!rango) {
      console.error(`No hay rangos definidos para ${medidaClinica}`);
      return;
    }

    // Actualizar título
    clinicalChartTitle.textContent = `Análisis de ${rango.name}`;

    const ctx = document.getElementById('clinicalChart').getContext('2d');

    if (clinicalChartInstance) {
      clinicalChartInstance.destroy();
    }

    // Preparar datasets
    const datasets = [];

    // Dataset de valores del usuario
    datasets.push({
      label: 'Tus valores',
      data: datosClinicos.map(d => d.valor),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      tension: 0.4,
      fill: false,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      type: 'line'
    });

    // Líneas de rangos normales
    if (medidaClinica === 'presion') {
      // Para presión arterial, mostrar rangos sistólico y diastólico
      datasets.push({
        label: 'Límite superior sistólico',
        data: new Array(datosClinicos.length).fill(rango.systolic.max),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line'
      });
      
      datasets.push({
        label: 'Límite inferior sistólico',
        data: new Array(datosClinicos.length).fill(rango.systolic.min),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line'
      });
    } else {
      // Para otras medidas
      datasets.push({
        label: 'Límite superior normal',
        data: new Array(datosClinicos.length).fill(rango.max),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line'
      });
      
      datasets.push({
        label: 'Límite inferior normal',
        data: new Array(datosClinicos.length).fill(rango.min),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line'
      });

      // Rango óptimo
      if (rango.optimal) {
        datasets.push({
          label: 'Límite superior óptimo',
          data: new Array(datosClinicos.length).fill(rango.optimal.max),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderDash: [3, 3],
          pointRadius: 0,
          type: 'line'
        });
        
        datasets.push({
          label: 'Límite inferior óptimo',
          data: new Array(datosClinicos.length).fill(rango.optimal.min),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderDash: [3, 3],
          pointRadius: 0,
          type: 'line'
        });
      }
    }

    clinicalChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datosClinicos.map(d => d.fechaStr),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });

    // Actualizar estadísticas clínicas
    actualizarEstadisticasClinicas(datosClinicos, rango);
  };

  // Actualizar estadísticas clínicas
  const actualizarEstadisticasClinicas = (datos, rango) => {
    if (datos.length === 0) {
      document.getElementById('avgValue').textContent = '-';
      document.getElementById('avgStatus').textContent = '-';
      document.getElementById('minValue').textContent = '-';
      document.getElementById('maxValue').textContent = '-';
      document.getElementById('normalPercentage').textContent = '-';
      document.getElementById('normalCount').textContent = '-';
      document.getElementById('abnormalPercentage').textContent = '-';
      document.getElementById('abnormalCount').textContent = '-';
      return;
    }

    const valores = datos.map(d => d.valor);
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);

    // Calcular cuántos valores están en rango normal
    let enRangoNormal = 0;
    
    if (medidaClinica === 'presion') {
      // Para presión arterial (simplificado - asumiendo que el valor es sistólico)
      enRangoNormal = valores.filter(v => 
        v >= rango.systolic.min && v <= rango.systolic.max
      ).length;
    } else {
      enRangoNormal = valores.filter(v => 
        v >= rango.min && v <= rango.max
      ).length;
    }

    const porcentajeNormal = Math.round((enRangoNormal / valores.length) * 100);
    const porcentajeAnormal = 100 - porcentajeNormal;

    // Actualizar DOM
    document.getElementById('avgValue').textContent = `${promedio.toFixed(1)} ${rango.unit}`;
    document.getElementById('minValue').textContent = `${minimo} ${rango.unit}`;
    document.getElementById('maxValue').textContent = `${maximo} ${rango.unit}`;
    document.getElementById('normalPercentage').textContent = `${porcentajeNormal}%`;
    document.getElementById('normalCount').textContent = `${enRangoNormal} de ${valores.length}`;
    document.getElementById('abnormalPercentage').textContent = `${porcentajeAnormal}%`;
    document.getElementById('abnormalCount').textContent = `${valores.length - enRangoNormal} de ${valores.length}`;

    // Estado del promedio
    let estadoPromedio = '';
    let claseEstado = '';
    
    if (medidaClinica === 'presion') {
      if (promedio >= rango.systolic.min && promedio <= rango.systolic.max) {
        estadoPromedio = 'Normal';
        claseEstado = 'status-normal';
      } else if (promedio < rango.systolic.min) {
        estadoPromedio = 'Bajo';
        claseEstado = 'status-low';
      } else {
        estadoPromedio = 'Alto';
        claseEstado = 'status-high';
      }
    } else {
      if (promedio >= rango.min && promedio <= rango.max) {
        estadoPromedio = 'Normal';
        claseEstado = 'status-normal';
      } else if (promedio < rango.min) {
        estadoPromedio = 'Bajo';
        claseEstado = 'status-low';
      } else {
        estadoPromedio = 'Alto';
        claseEstado = 'status-high';
      }
    }

    const avgStatusEl = document.getElementById('avgStatus');
    avgStatusEl.textContent = estadoPromedio;
    avgStatusEl.className = `stat-status ${claseEstado}`;
  };



  // Event listeners para tabs básicas
  basicTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      basicTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      medidaBasica = tab.dataset.type;
      renderizarGraficaBasica();
    });
  });

  // Event listeners para tabs clínicas
  clinicalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      clinicalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      medidaClinica = tab.dataset.type;
      renderizarGraficaClinica();
    });
  });

  // Event listeners para navegación de meses
  nextMonthButton.addEventListener('click', () => {
    mes++;
    if (mes > 11) {
      mes = 0;
      año++;
    }
    actualizarTexto();
    renderizarGraficaBasica();
  });

  previousMonthButton.addEventListener('click', () => {
    mes--;
    if (mes < 0) {
      mes = 11;
      año--;
    }
    actualizarTexto();
    renderizarGraficaBasica();
  });

  // Event listener para selector de período
  periodSelect.addEventListener('change', (e) => {
    periodoMeses = parseInt(e.target.value);
    renderizarGraficaClinica();
  });

  // Renderizar gráficas iniciales
  renderizarGraficaBasica();
  renderizarGraficaClinica();
}

// [MANTENER TODAS LAS DEMÁS FUNCIONES EXISTENTES...]

// Función para abrir modal
function openModal() {
  const modal = document.getElementById('newRecordModal');
  if (!modal) {
    modalAlerts.error('Error: No se encontró el modal de consulta médica');
    return;
  }
  
  try {
    if (!window.editingRecord) {
      window.editingRecord = null;
      clearNewRecordForm();
    }
    
    modal.style.display = 'block';
    window.currentSection = 'detalles';
    
    const dateInput = modal.querySelector('input[type="date"]');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    const sections = modal.querySelectorAll('.form-section');
    sections.forEach(section => section.classList.remove('active'));
    const firstSection = modal.querySelector('#detalles');
    if (firstSection) {
      firstSection.classList.add('active');
    }
    
    const navItems = modal.querySelectorAll('.modal-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    const firstNavItem = modal.querySelector('.modal-nav-item[data-section="detalles"]');
    if (firstNavItem) {
      firstNavItem.classList.add('active');
    }
    
    updateModalButtons();
    
    setTimeout(() => {
      verifyAndFixSections();
      addRealTimeModalValidation();
    }, 100);
    
  } catch (error) {
    console.error('Error al abrir modal:', error);
    modalAlerts.error('Error al abrir el formulario de consulta médica');
  }
}

window.openModal = openModal;

function closeModal() {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  window.editingRecord = null;
  modal.style.display = 'none';
  setTimeout(() => {
    clearNewRecordForm();
  }, 100);
}

window.closeModal = closeModal;

// Funciones de navegación del modal
window.nextSection = () => {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const sections = ['detalles', 'medidas', 'tratamiento'];
  
  if (!window.currentSection) {
    window.currentSection = 'detalles';
  }
  
  const currentSectionIndex = sections.indexOf(window.currentSection);
  
  if (currentSectionIndex < sections.length - 1) {
    const nextSectionIndex = currentSectionIndex + 1;
    const nextSectionName = sections[nextSectionIndex];
    
    const currentSectionElement = modal.querySelector('.form-section.active');
    if (currentSectionElement) {
      currentSectionElement.classList.remove('active');
    }
    
    const nextSectionElement = modal.querySelector(`#${nextSectionName}`);
    if (nextSectionElement) {
      nextSectionElement.classList.add('active');
      nextSectionElement.style.display = 'block';
      nextSectionElement.style.opacity = '1';
      nextSectionElement.style.transform = 'translateX(0)';
    }
    
    modal.querySelectorAll('.modal-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const nextNavItem = modal.querySelector(`[data-section="${nextSectionName}"]`);
    if (nextNavItem) {
      nextNavItem.classList.add('active');
    }
    
    window.currentSection = nextSectionName;
    updateModalButtons();
  }
};

window.previousSection = () => {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const sections = ['detalles', 'medidas', 'tratamiento'];
  
  if (!window.currentSection) {
    window.currentSection = 'detalles';
  }
  
  const currentSectionIndex = sections.indexOf(window.currentSection);
  
  if (currentSectionIndex > 0) {
    const prevSectionIndex = currentSectionIndex - 1;
    const prevSectionName = sections[prevSectionIndex];
    
    const currentSectionElement = modal.querySelector('.form-section.active');
    if (currentSectionElement) {
      currentSectionElement.classList.remove('active');
    }
    
    const prevSectionElement = modal.querySelector(`#${prevSectionName}`);
    if (prevSectionElement) {
      prevSectionElement.classList.add('active');
      prevSectionElement.style.display = 'block';
      prevSectionElement.style.opacity = '1';
      prevSectionElement.style.transform = 'translateX(0)';
    }
    
    modal.querySelectorAll('.modal-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const prevNavItem = modal.querySelector(`[data-section="${prevSectionName}"]`);
    if (prevNavItem) {
      prevNavItem.classList.add('active');
    }
    
    window.currentSection = prevSectionName;
    updateModalButtons();
  }
};

function updateModalButtons() {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const sections = ['detalles', 'medidas', 'tratamiento'];
  const currentSectionIndex = sections.indexOf(window.currentSection || 'detalles');
  
  const prevButton = modal.querySelector('.modal-footer .btn-secondary');
  const nextButton = modal.querySelector('.modal-footer .btn-primary');
  
  if (prevButton) {
    prevButton.disabled = currentSectionIndex === 0;
    prevButton.style.opacity = currentSectionIndex === 0 ? '0.5' : '1';
  }
  
  if (nextButton) {
    if (currentSectionIndex === sections.length - 1) {
      nextButton.textContent = 'Guardar';
      nextButton.onclick = saveConsultation;
    } else {
      nextButton.textContent = 'Siguiente';
      nextButton.onclick = nextSection;
    }
  }
}

function verifyAndFixSections() {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const sections = ['detalles', 'medidas', 'tratamiento'];
  let activeSectionFound = false;
  
  sections.forEach(sectionId => {
    const section = modal.querySelector(`#${sectionId}`);
    if (section) {
      const isActive = section.classList.contains('active');
      
      if (isActive) {
        activeSectionFound = true;
        section.style.display = 'block';
        section.style.opacity = '1';
        section.style.transform = 'translateX(0)';
      } else {
        section.style.display = 'none';
        section.style.opacity = '0';
        section.style.transform = 'translateX(20px)';
      }
    }
  });
  
  if (!activeSectionFound) {
    const detallesSection = modal.querySelector('#detalles');
    if (detallesSection) {
      detallesSection.classList.add('active');
      detallesSection.style.display = 'block';
      detallesSection.style.opacity = '1';
      detallesSection.style.transform = 'translateX(0)';
      window.currentSection = 'detalles';
    }
  }
}

// Función para guardar consulta
window.saveConsultation = async () => {
  try {
    const modal = document.getElementById('newRecordModal');
    if (!modal || modal.style.display !== 'block') {
      modalAlerts.error('El formulario no está disponible');
      return;
    }

    const validation = validateConsultationForm();
    if (!validation.isValid) {
      showSectionAlert('tratamiento', validation.message, 'error');
      return;
    }

    const consultationData = collectConsultationData();
    
    const saveButton = document.querySelector('.modal-footer .btn-primary');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Guardando...';
    saveButton.disabled = true;

    console.log(consultationData);
    const response = await apiRequest('/consultas', {
      method: 'POST',
      body: JSON.stringify(consultationData)
    });

    modalAlerts.success('Consulta médica registrada correctamente');
    closeModal();
    
    await loadConsultations();

  } catch (error) {
    console.error('Error al guardar consulta:', error);
    modalAlerts.error('Error al guardar la consulta: ' + (error.message || 'Intenta de nuevo'));
    
    const saveButton = document.querySelector('.modal-footer .btn-primary');
    saveButton.textContent = 'Guardar';
    saveButton.disabled = false;
  }
};

// Validar formulario de consulta
function validateConsultationForm() {
  const diagnosticoInput = document.querySelector('#detalles input[placeholder*="Diagnóstico"]');
  const fechaInput = document.querySelector('#detalles input[type="date"]');
  const centroMedicoInput = document.querySelector('#detalles input[placeholder*="Centro médico"]');
  const doctorInput = document.querySelector('#detalles input[placeholder*="Nombre completo del doctor"]');

  if (!diagnosticoInput || !fechaInput || !centroMedicoInput || !doctorInput) {
    return { isValid: false, message: 'Error: No se encontraron todos los campos del formulario' };
  }

  const diagnostico = diagnosticoInput.value.trim();
  const fechaConsulta = fechaInput.value;
  const centroMedico = centroMedicoInput.value.trim();
  const doctor = doctorInput.value.trim();

  if (!diagnostico) {
    return { isValid: false, message: 'El diagnóstico es obligatorio' };
  }
  if (!fechaConsulta) {
    return { isValid: false, message: 'La fecha de consulta es obligatoria' };
  }
  if (!centroMedico) {
    return { isValid: false, message: 'El centro médico es obligatorio' };
  }
  if (!doctor) {
    return { isValid: false, message: 'El nombre del doctor es obligatorio' };
  }

  const consultaDate = new Date(fechaConsulta);
  const today = new Date();
  if (consultaDate > today) {
    return { isValid: false, message: 'La fecha de consulta no puede ser futura' };
  }

  return { isValid: true };
}

// Recopilar datos del formulario
function collectConsultationData() {
  const diagnosticoInput = document.querySelector('#detalles input[placeholder*="Diagnóstico"]');
  const fechaInput = document.querySelector('#detalles input[type="date"]');
  const centroMedicoInput = document.querySelector('#detalles input[placeholder*="Centro médico"]');
  const doctorInput = document.querySelector('#detalles input[placeholder*="Nombre completo del doctor"]');

  if (!diagnosticoInput || !fechaInput || !centroMedicoInput || !doctorInput) {
    throw new Error('No se encontraron todos los campos del formulario');
  }

  const diagnostico = diagnosticoInput.value.trim();
  const fechaConsulta = fechaInput.value;
  const centroMedico = centroMedicoInput.value.trim();
  const doctor = doctorInput.value.trim();

  const medidas = [];
  document.querySelectorAll('#measurementsList .measurement-row').forEach(row => {
    const tipoSelect = row.querySelector('select');
    const valorInput = row.querySelector('input[type="number"]');
    
    if (tipoSelect.value && valorInput.value) {
      const tipoMedida = getMedidaIdFromName(tipoSelect.value);
      medidas.push({
        idMedida: tipoMedida,
        fechaRegistro: fechaConsulta,
        valorMedida: parseFloat(valorInput.value),
        notaAdicional: `Registrado durante consulta médica`
      });
    }
  });

  const prescripciones = [];
  document.querySelectorAll('#medicationsList .medication-row').forEach(row => {
    const nombreInput = row.querySelector('input[placeholder*="Paracetamol"]');
    const presentacionInput = row.querySelector('input[placeholder*="Tabletas 500 mg"]');
    const dosisInput = row.querySelector('input[placeholder*="1 tableta"]');
    const frecuenciaInput = row.querySelector('input[placeholder*="En horas"]');
    const duracionInput = row.querySelector('input[placeholder*="En días"]');
    
    if (nombreInput.value.trim() && dosisInput.value.trim()) {
      prescripciones.push({
        nombreMedicamento: nombreInput.value.trim(),
        presentacionMedicamento: presentacionInput.value.trim() || 'No especificado',
        dosis: dosisInput.value.trim(),
        frecuencia: frecuenciaInput.value ? `Cada ${frecuenciaInput.value} horas` : 'No especificado',
        duracion: duracionInput.value ? `${duracionInput.value} días` : 'No especificado'
      });
    }
  });

  const procedimientos = [];
  document.querySelectorAll('#proceduresList .procedure-row').forEach(row => {
    const procedimientoSelect = row.querySelector('select');
    const notasInput = row.querySelector('input[placeholder*="Detalles importantes"]');
    
    if (procedimientoSelect.value) {
      const procedimientoId = getProcedimientoIdFromName(procedimientoSelect.value);
      procedimientos.push({
        idProcedimiento: procedimientoId,
        notaAdicional: notasInput.value.trim() || 'Procedimiento realizado durante consulta'
      });
    }
  });

  return {
    consultaMedica: {
      idUsuario: currentUser.idUsuario,
      diagnostico: diagnostico,
      doctor: doctor,
      clinica: centroMedico,
      fechaConsulta: fechaConsulta
    },
    prescripciones: prescripciones,
    medidasConsulta: medidas,
    procedimientos: procedimientos
  };
}

// Funciones auxiliares
function getMedidaIdFromName(nombre) {
  const medidas = {
    'peso': 1,           // ✅ Peso (kg)
    'altura': 2,         // ✅ Altura (cm)  
    'presion': 3,        // ✅ Presion arterial (mmHg)
    'glucosa': 4,        // 🔧 CORREGIDO: era 5, ahora 4 según SQL
    'temperatura': 6     // 🔧 CORREGIDO: era 4, ahora 6 según SQL
  };
  return medidas[nombre] || 1;
}

function getProcedimientoIdFromName(nombre) {
  const procedimientos = {
    'aplicacion-inyecciones': 1,     // 🔧 Aplicación de inyecciones
    'signos-vitales': 2,             // 🔧 Toma de signos vitales
    'curacion-heridas': 3,           // ✅ Curación y limpieza de heridas simples
    'sutura': 4,                     // ✅ Sutura de heridas menores
    'retiro-puntos': 5,              // ✅ Retiro de puntos de sutura
    'lavado-otico': 6,               // 🔧 Lavado ótico
    'nebulizacion': 7,               // 🔧 Nebulización
    'ferulas-vendajes': 8,           // 🔧 Colocación de férulas o vendajes
    'drenaje-abscesos': 9,           // 🔧 Drenaje de abscesos pequeños
    'extraccion-cuerpos': 10         // 🔧 Extracción de cuerpos extraños superficiales
  };
  return procedimientos[nombre] || 1;
}

function showSectionAlert(section, message, type = 'error') {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const alertElement = modal.querySelector(`#alert-${section}`);
  if (alertElement) {
    const messageElement = alertElement.querySelector('.alert-message');
    const iconElement = alertElement.querySelector('.alert-icon');
    
    messageElement.textContent = message;
    iconElement.textContent = type === 'error' ? '⚠️' : '✅';
    alertElement.className = `section-alert show ${type}`;
    
    setTimeout(() => {
      alertElement.classList.remove('show');
    }, 5000);
  }
}

// [CONTINÚA CON TODAS LAS DEMÁS FUNCIONES ORIGINALES...]

window.addMedication = () => {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const medicationsList = modal.querySelector('#medicationsList');
  if (!medicationsList) return;
  
  const newMedication = document.createElement('div');
  newMedication.className = 'medication-row';
  newMedication.innerHTML = `
    <div class="medication-header">
      <div class="form-group">
        <label class="form-label">Nombre del medicamento</label>
        <input type="text" class="form-input" placeholder="Ej: Paracetamol">
      </div>
      <div class="form-group">
        <label class="form-label">Presentación del medicamento</label>
        <input type="text" class="form-input" placeholder="Ej: Tabletas 500 mg">
      </div>
      <button type="button" class="delete-btn" onclick="removeMedication(this)">🗑</button>
    </div>
    <div class="medication-details">
      <div class="form-group">
        <label class="form-label">Dosis</label>
        <input type="text" class="form-input" placeholder="Ej: 1 tableta, 10 ml">
      </div>
      <div class="form-group">
        <label class="form-label">Tiempo entre dosis</label>
        <input type="number" class="form-input no-negative" placeholder="En horas" min="1" max="72" step="1">
      </div>
      <div class="form-group">
        <label class="form-label">Duración</label>
        <input type="number" class="form-input no-negative" placeholder="En días" min="1" max="365" step="1">
      </div>
    </div>
  `;
  medicationsList.appendChild(newMedication);
};

window.removeMedication = (element) => {
  if (element && element.closest('.medication-row')) {
    element.closest('.medication-row').remove();
  }
};

window.addMeasurement = () => {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const measurementsList = modal.querySelector('#measurementsList');
  if (!measurementsList) return;
  
  const newMeasurement = document.createElement('div');
  newMeasurement.className = 'measurement-row';
  newMeasurement.innerHTML = `
    <div class="form-group">
      <label class="form-label">Medida corporal a registrar</label>
      <select class="form-input" placeholder="Ej: Peso, Altura, Presión arterial">
        <option value="">Seleccione una medida</option>
        <option value="peso">Peso (kg)</option>
        <option value="altura">Altura (cm)</option>
        <option value="presion">Presión arterial (mmHg)</option>
        <option value="temperatura">Temperatura (°C)</option>
        <option value="glucosa">Glucosa (mg/dL)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Valor registrado</label>
      <input type="number" class="form-input no-negative" placeholder="Ej: 70 (kg), 175 (cm)" min="0" step="0.1">
    </div>
    <button type="button" class="delete-btn" onclick="removeMeasurement(this)">🗑</button>
  `;
  measurementsList.appendChild(newMeasurement);
};

window.removeMeasurement = (element) => {
  if (element && element.closest('.measurement-row')) {
    element.closest('.measurement-row').remove();
  }
};

window.addProcedure = () => {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const proceduresList = modal.querySelector('#proceduresList');
  if (!proceduresList) return;
  
  const newProcedure = document.createElement('div');
  newProcedure.className = 'procedure-row';
  newProcedure.innerHTML = `
    <div class="form-group">
      <label class="form-label">Procedimiento médico</label>
      <select class="form-input">
        <option value="">Seleccione un procedimiento</option>
        <option value="aplicacion-inyecciones">Aplicación de inyecciones</option>
        <option value="signos-vitales">Toma de signos vitales</option>
        <option value="curacion-heridas">Curación y limpieza de heridas simples</option>
        <option value="sutura">Sutura de heridas menores</option>
        <option value="retiro-puntos">Retiro de puntos de sutura</option>
        <option value="lavado-otico">Lavado ótico</option>
        <option value="nebulizacion">Nebulización</option>
        <option value="ferulas-vendajes">Colocación de férulas o vendajes</option>
        <option value="drenaje-abscesos">Drenaje de abscesos pequeños</option>
        <option value="extraccion-cuerpos">Extracción de cuerpos extraños superficiales</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <input type="text" class="form-input" placeholder="Detalles importantes (opcional)">
    </div>
    <button type="button" class="delete-btn" onclick="removeProcedure(this)">🗑</button>
  `;
  proceduresList.appendChild(newProcedure);
};

window.removeProcedure = (element) => {
  if (element && element.closest('.procedure-row')) {
    element.closest('.procedure-row').remove();
  }
};

window.hideAlert = (type) => {
  const mainModal = document.getElementById('newRecordModal');
  if (mainModal) {
    const alertElement = mainModal.querySelector(`#alert-${type}`);
    if (alertElement) {
      alertElement.classList.remove('show');
    }
  }
  
  const measurementModal = document.getElementById('newMeasurementModal');
  if (measurementModal) {
    const alertElement = measurementModal.querySelector(`#alert-${type}`);
    if (alertElement) {
      alertElement.classList.remove('show');
    }
  }
};

// Modal de medición individual
window.openMeasurementModal = () => {
  const modal = document.getElementById('newMeasurementModal');
  if (modal) {
    modal.style.display = 'block';
    const dateInput = modal.querySelector('input[type="date"]');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    const tipoSelect = modal.querySelector('.measurement-form-select');
    const valorInput = modal.querySelector('.measurement-form-input');
    const fechaInput = modal.querySelector('input[type="date"]');
    
    if (tipoSelect) {
      tipoSelect.addEventListener('change', addMeasurementModalValidation);
    }
    if (valorInput) {
      valorInput.addEventListener('input', addMeasurementModalValidation);
    }
    if (fechaInput) {
      fechaInput.addEventListener('change', addMeasurementModalValidation);
    }
  }
};

window.closeMeasurementModal = () => {
  const modal = document.getElementById('newMeasurementModal');
  if (modal) {
    modal.style.display = 'none';
    
    const tipoSelect = modal.querySelector('.measurement-form-select');
    const valorInput = modal.querySelector('.measurement-form-input');
    const fechaInput = modal.querySelector('input[type="date"]');
    
    if (tipoSelect) {
      tipoSelect.selectedIndex = 0;
      tipoSelect.classList.remove('valid', 'invalid');
    }
    if (valorInput) {
      valorInput.value = '';
      valorInput.classList.remove('valid', 'invalid');
    }
    if (fechaInput) {
      fechaInput.value = '';
      fechaInput.classList.remove('valid', 'invalid');
    }
    
    const alertElement = modal.querySelector('#alert-measurement');
    if (alertElement) {
      alertElement.classList.remove('show');
    }
    
    const saveButton = modal.querySelector('.btn-save');
    if (saveButton) {
      saveButton.textContent = 'Guardar medición';
      saveButton.disabled = false;
    }
  }
};

window.saveMeasurement = async () => {
  try {
    const modal = document.getElementById('newMeasurementModal');
    if (!modal) {
      modalAlerts.error('Modal de medición no disponible');
      return;
    }
    
    if (!measurementValidator || !measurementValidator.isFormValid()) {
      showMeasurementAlert('Por favor completa todos los campos correctamente', 'error');
      return;
    }
    
    const tipoSelect = modal.querySelector('.measurement-form-select');
    const valorInput = modal.querySelector('.measurement-form-input');
    const fechaInput = modal.querySelector('input[type="date"]');
  
    console.log(valorInput.value);
    const medidaData = {
      idMedida: getMedidaIdFromName(tipoSelect.value),
      idUsuario: currentUser.idUsuario,
      fechaRegistro: fechaInput.value,
      valorMedida: valorInput.value,
      notaAdicional: `Medida registrada manualmente`
    };

    const saveButton = modal.querySelector('.btn-save');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Guardando...';
    saveButton.disabled = true;

    await apiRequest('/medidas-personales', {
      method: 'POST',
      body: JSON.stringify(medidaData)
    });

    showMeasurementAlert('Medida registrada correctamente', 'success');
    setTimeout(() => {
      closeMeasurementModal();
    }, 1500);
    
    await loadPersonalMeasurementModal();
    await loadEnhancedCharts(); // Recargar gráficas mejoradas

  } catch (error) {
    console.error('Error al guardar medida:', error);
    showMeasurementAlert('Error al guardar la medida: ' + (error.message || 'Intenta de nuevo'), 'error');
    
    const saveButton = modal.querySelector('.btn-save');
    if (saveButton) {
      saveButton.textContent = 'Guardar medición';
      saveButton.disabled = false;
    }
  }
};

function showMeasurementAlert(message, type = 'error') {
  const modal = document.getElementById('newMeasurementModal');
  if (!modal) return;
  
  const alertElement = modal.querySelector('#alert-measurement');
  if (alertElement) {
    const messageElement = alertElement.querySelector('.alert-message');
    const iconElement = alertElement.querySelector('.alert-icon');
    
    messageElement.textContent = message;
    iconElement.textContent = type === 'error' ? '⚠️' : '✅';
    alertElement.className = `section-alert show ${type}`;
    
    setTimeout(() => {
      alertElement.classList.remove('show');
    }, 5000);
  }
}

// Event listener global para cerrar modales
window.onclick = function(event) {
  const modal = document.getElementById('newRecordModal');
  if (modal && event.target === modal) {
    closeModal();
  }
  
  const measurementModal = document.getElementById('newMeasurementModal');
  if (measurementModal && event.target === measurementModal) {
    closeMeasurementModal();
  }
};

// Cargar historial médico
async function loadMedicalHistory() {
  try {
    userMedicalHistory = await apiRequest(`/antecedentes-medicos/usuario/${currentUser.idUsuario}`);
    displayMedicalHistory(userMedicalHistory);
  } catch (error) {
    console.warn('Error al cargar historial médico:', error.message);
    // Mostrar estado vacío en lugar de error
    displayMedicalHistory(null);
  }
}

// Cargar consultas médicas
async function loadConsultations() {
  try {
    userConsultations = await apiRequest(`/consultas/usuario/${currentUser.idUsuario}`);
    displayConsultations(userConsultations);
  } catch (error) {
    console.warn('Error al cargar consultas:', error.message);
    // Mostrar estado vacío en lugar de error
    displayConsultations([]);
  }
}

// Cargar información personal del usuario
async function loadPersonalMeasurements() {
  try {
    userMeasurements = await apiRequest(`/users/${currentUser.idUsuario}`);
    console.log('Datos del usuario cargados:', userMeasurements);
    
    const userData = document.querySelector('#informacion');

    // CORRECCIÓN: Manejo seguro de fechas
    let fechaNacimientoFormatted = '';
    let fechaNacimientoInput = '';
    
    if (userMeasurements.fechaNacimiento) {
      const fechaNacimiento = new Date(userMeasurements.fechaNacimiento);
      
      // Para mostrar en pantalla (formato legible)
      fechaNacimientoFormatted = fechaNacimiento.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      
      // Para el input date (formato YYYY-MM-DD)
      fechaNacimientoInput = fechaNacimiento.toISOString().split('T')[0];
    }

    userData.innerHTML = `
     <div class="profile-container">
                <div class="profile-card">
                    <div class="profile-form">
                        <div class="profile-row">
                            <div class="profile-group">
                                <label class="profile-label">Nombre</label>
                                <input type="text" id="nombre" class="profile-input readonly" value="${userMeasurements.nombre || ''}" readonly>
                            </div>
                            <div class="profile-group">
                                <label class="profile-label">Apellidos</label>
                                <input type="text" id="apellidos" class="profile-input readonly" value="${(userMeasurements.apellidoPaterno || '') + ' ' + (userMeasurements.apellidoMaterno || '')}" readonly>
                            </div>
                        </div>
                        
                        <div class="profile-row">
                            <div class="profile-group">
                                <label class="profile-label">Fecha de nacimiento</label>
                                <input type="date" id="fechaNacimiento" class="profile-input readonly" value="${fechaNacimientoInput}" readonly>
                            </div>
                            <div class="profile-group">
                                <label class="profile-label">Sexo</label>
                                <select id="sexo" class="profile-input readonly" disabled>
                                    <option value="Masculino" ${userMeasurements.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
                                    <option value="Femenino" ${userMeasurements.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="profile-row">
                            <div class="profile-group">
                                <label class="profile-label">Correo electrónico</label>
                                <input type="email" class="profile-input readonly" id="email-input" value="${userMeasurements.correo || ''}" readonly>
                            </div>
                            <div class="profile-group">
                                <label class="profile-label">Contraseña</label>
                                <div class="password-field">
                                    <input type="password" class="profile-input readonly" id="password-input" value="************" readonly>
                                    <button type="button" class="toggle-password" id="toggle-password" title="Mostrar contraseña">👁️</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-actions">
                            <button type="button" class="btn-edit" id="edit-btn">Editar perfil</button>
                            <button type="button" class="btn-save-changes" id="save-btn" disabled>Guardar cambios</button>
                        </div>
                    </div>
                </div>
            </div>
    `;

    const saveButton = userData.querySelector("#save-btn");
    saveButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!saveButton.disabled) {
        try {
          saveButton.textContent = 'Guardando...';
          saveButton.disabled = true;
          
          const nombre = userData.querySelector('#nombre').value.trim();
          const apellidosCompletos = userData.querySelector('#apellidos').value.trim();
          
          const apellidosArray = apellidosCompletos.split(' ');
          const apellidoPaterno = apellidosArray[0] || '';
          const apellidoMaterno = apellidosArray.slice(1).join(' ') || '';
          
          const fechaInput = userData.querySelector('#fechaNacimiento').value;
          let fechaNacimiento = fechaInput;
          
          if (fechaInput.includes('/')) {
            const partes = fechaInput.split("/");
            fechaNacimiento = `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
          }
          
          const sexo = userData.querySelector('#sexo').value;
          const correo = userData.querySelector('#email-input').value.trim();
          
          if (!nombre || !apellidoPaterno || !fechaNacimiento || !sexo || !correo) {
            modalAlerts.error('Por favor completa todos los campos obligatorios');
            return;
          }
          
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(correo)) {
            modalAlerts.error('Por favor ingresa un correo electrónico válido');
            return;
          }
          
          const data = {
            nombre: nombre,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            fechaNacimiento: fechaNacimiento,
            sexo: sexo,
            correo: correo
          };
          
          console.log('Datos a enviar:', data);
          
          const response = await apiRequest(`/users/${currentUser.idUsuario}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          console.log('Respuesta del servidor:', response);
          
          currentUser = { ...currentUser, ...data };
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          updateUserInfo();
          toggleEditMode(false);
          modalAlerts.success('Perfil actualizado correctamente');
          
        } catch (error) {
          console.error('Error al actualizar perfil:', error);
          modalAlerts.error('Error al actualizar el perfil: ' + (error.message || 'Intenta de nuevo'));
        } finally {
          saveButton.textContent = 'Guardar cambios';
          saveButton.disabled = true;
        }
      }
    });

    const editButton = userData.querySelector("#edit-btn");
    editButton.addEventListener('click', (e) => {
      e.preventDefault();
      toggleEditMode(true);
    });
    
    function toggleEditMode(editMode) {
      const inputs = userData.querySelectorAll("input:not(#password-input)");
      const selectSexo = userData.querySelector("#sexo");
      const saveButton = userData.querySelector("#save-btn");
      const editButton = userData.querySelector("#edit-btn");
      
      inputs.forEach(input => {
        input.readOnly = !editMode;
        if (editMode) {
          input.classList.remove("readonly");
          input.classList.add("editable");
        } else {
          input.classList.add("readonly");
          input.classList.remove("editable");
        }
      });
      
      selectSexo.disabled = !editMode;
      if (editMode) {
        selectSexo.classList.remove("readonly");
        selectSexo.classList.add("editable");
      } else {
        selectSexo.classList.add("readonly");
        selectSexo.classList.remove("editable");
      }
      
      saveButton.disabled = !editMode;
      editButton.textContent = editMode ? 'Cancelar edición' : 'Editar perfil';
      
      if (!editMode && editButton.textContent === 'Cancelar edición') {
        loadPersonalMeasurements();
      }
    }
    
    const togglePasswordVisibility = userData.querySelector("#toggle-password");
    togglePasswordVisibility.addEventListener('click', (e) => {
      e.preventDefault();
      const passwordInput = userData.querySelector("#password-input");
      
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordInput.value = "Nueva contraseña (no implementado)";
        togglePasswordVisibility.textContent = "🙈";
      } else {
        passwordInput.type = "password";
        passwordInput.value = "************";
        togglePasswordVisibility.textContent = "👁️";
      }
    });

  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
    modalAlerts.error('Error al cargar los datos del usuario');
  }
}

async function loadPersonalMeasurementModal() {
  try {
    userMeasurements = await apiRequest(`/medidas/usuario/${currentUser.idUsuario}`);
    displayMeasurements(userMeasurements);
  } catch (error) {
    console.error('Error al cargar medidas:', error);
  }
}

// Mostrar historial médico
function displayMedicalHistory(data) {
  const historialTab = document.getElementById('historial');
  if (!historialTab) return;
  
  if (!data || (Array.isArray(data.alergias) && data.alergias.length === 0 && 
      Array.isArray(data.medicamentosCronicos) && data.medicamentosCronicos.length === 0 &&
      Array.isArray(data.cirugias) && data.cirugias.length === 0 &&
      Array.isArray(data.enfermedadesCronicas) && data.enfermedadesCronicas.length === 0)) {
    
    historialTab.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No hay historial médico registrado</h3>
        <p>Comienza agregando tus antecedentes médicos para tener un registro completo.</p>
      </div>
    `;
    return;
  }
  
  let historialHTML = '<div class="medical-history-content">';
  
  if (data.alergias && data.alergias.length > 0) {
    historialHTML += `
      <div class="history-section">
        <h3>🔄 Alergias</h3>
        <div class="history-items">
          ${data.alergias.map(alergia => `
            <div class="history-item">
              <span class="item-name">${alergia.nombreAlergia}</span>
              <button class="btn-edit" onclick="editAlergia(${alergia.idAlergia})">✏️</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  if (data.medicamentosCronicos && data.medicamentosCronicos.length > 0) {
    historialHTML += `
      <div class="history-section">
        <h3>💊 Medicamentos Crónicos</h3>
        <div class="history-items">
          ${data.medicamentosCronicos.map(med => `
            <div class="history-item">
              <span class="item-name">${med.nombreMedicamento}</span>
              <button class="btn-edit" onclick="editMedicamento(${med.idMedicamentoCronico})">✏️</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  if (data.cirugias && data.cirugias.length > 0) {
    historialHTML += `
      <div class="history-section">
        <h3>🏥 Cirugías</h3>
        <div class="history-items">
          ${data.cirugias.map(cirugia => `
            <div class="history-item">
              <span class="item-name">${cirugia.nombreCirugia || 'Cirugía'}</span>
              <span class="item-date">${formatDate(cirugia.fechaCirugia)}</span>
              <button class="btn-edit" onclick="editCirugia(${cirugia.idCirugia})">✏️</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  if (data.enfermedadesCronicas && data.enfermedadesCronicas.length > 0) {
    historialHTML += `
      <div class="history-section">
        <h3>🏥 Enfermedades Crónicas</h3>
        <div class="history-items">
          ${data.enfermedadesCronicas.map(enfermedad => `
            <div class="history-item">
              <span class="item-name">${enfermedad.nombreEnfermedadCronica || 'Enfermedad'}</span>
              <span class="item-date">Diagnosticada: ${formatDate(enfermedad.fechaDiagnostico)}</span>
              <button class="btn-edit" onclick="editEnfermedad(${enfermedad.idEnfermedadCronica})">✏️</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  historialHTML += '</div>';
  historialTab.innerHTML = historialHTML;
}

// Mostrar consultas médicas
function displayConsultations(consultas) {
  const consultasTab = document.querySelector('#consultas .records-list');
  if (!consultasTab) return;
  
  if (!consultas || consultas.length === 0) {
    consultasTab.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No hay consultas médicas registradas</h3>
        <p>Comienza agregando tu primera consulta médica usando el botón "Crear un nuevo registro".</p>
      </div>
    `;
    return;
  }
  
  const consultasOrdenadas = consultas.sort((a, b) => 
    new Date(b.fechaConsulta) - new Date(a.fechaConsulta)
  );
  
  let consultasHTML = '';
  consultasOrdenadas.forEach(consulta => {
    consultasHTML += `
      <div class="record-card" data-id="${consulta.idConsulta}">
        <div class="record-header">
          <div class="record-date">${formatDate(consulta.fechaConsulta)}</div>
          <div class="record-actions">
            <button class="btn-edit" onclick="editConsulta(${consulta.idConsulta})">✏️</button>
            <button class="btn-delete" onclick="deleteConsulta(${consulta.idConsulta})">🗑️</button>
          </div>
        </div>
        <div class="record-content">
          <div class="record-field">
            <strong>Diagnóstico:</strong> ${consulta.diagnostico || 'No especificado'}
          </div>
          <div class="record-field">
            <strong>Doctor:</strong> ${consulta.doctor || 'No especificado'}
          </div>
          <div class="record-field">
            <strong>Clínica:</strong> ${consulta.clinica || 'No especificado'}
          </div>
          ${consulta.prescripciones && consulta.prescripciones.length > 0 ? `
            <div class="record-field">
              <strong>Medicamentos:</strong> ${consulta.prescripciones.length} prescripción(es)
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  consultasTab.innerHTML = consultasHTML;
}

// Mostrar medidas personales
function displayMeasurements(medidas) {
  const medidasTab = document.querySelector('#medidas .measurements-grid');
  if (!medidasTab) return;
  
  if (!medidas || medidas.length === 0) {
    medidasTab.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No hay medidas registradas</h3>
        <p>Comienza registrando tus medidas corporales para hacer seguimiento usando el botón "Registrar nueva medición".</p>
      </div>
    `;
    return;
  }
  
  const medidasOrdenadas = medidas.sort((a, b) => 
    new Date(b.fechaRegistro) - new Date(a.fechaRegistro)
  );
  
  let medidasHTML = '';
  medidasOrdenadas.forEach(medida => {
    // 🔧 CORRECCIÓN: Usar directamente tipoMedida en lugar de getMedidaTypeName
    const medidaType = medida.tipoMedida || 'Medida'; // Usar el campo tipoMedida de la API
    const medidaIcon = getMedidaIconFromType(medida.tipoMedida); // Nueva función
    const medidaUnit = medida.unidadMedida || ''; // Usar unidadMedida de la API
    
    medidasHTML += `
      <div class="measurement-card" data-id="${medida.idRegistroMedida}">
        <div class="measurement-header">
          <div class="measurement-icon">${medidaIcon}</div>
          <div class="measurement-type">${medidaType}</div>
          <div class="measurement-actions">
            <button class="btn-edit" onclick="editMedida(${medida.idRegistroMedida})">✏️</button>
            <button class="btn-delete" onclick="deleteMedida(${medida.idRegistroMedida})">🗑️</button>
          </div>
        </div>
        <div class="measurement-content">
          <div class="measurement-value">${medida.valorMedida} ${medidaUnit}</div>
          <div class="measurement-date">${formatDate(medida.fechaRegistro)}</div>
          ${medida.notaAdicional ? `
            <div class="measurement-note">${medida.notaAdicional}</div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  medidasTab.innerHTML = medidasHTML;
}
function getMedidaIconFromType(tipoMedida) {
  if (!tipoMedida) return '📊';
  
  const tipo = tipoMedida.toLowerCase();
  const iconos = {
    'peso': '⚖️',
    'altura': '📏', 
    'presion arterial': '❤️',
    'presión arterial': '❤️', // Por si tiene acento
    'glucosa': '🩸',
    'temperatura': '🌡️',
    'frecuencia cardiaca': '💓'
  };
  
  return iconos[tipo] || '📊';
}

// Funciones de utilidad
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getMedidaTypeName(idMedida) {
  // Esta función ahora no se usará en displayMeasurements, pero se mantiene por compatibilidad
  const tipos = {
    1: 'Peso',
    2: 'Altura', 
    3: 'Presión Arterial',
    4: 'Glucosa',
    6: 'Temperatura'
  };
  return tipos[idMedida] || 'Medida';
}

function getMedidaIcon(idMedida) {
  const iconos = {
    1: '⚖️',      // Peso
    2: '📏',      // Altura
    3: '❤️',      // Presión
    4: '🩸',      // 🔧 CORREGIDO: Glucosa ahora es ID 4
    6: '🌡️'       // 🔧 CORREGIDO: Temperatura ahora es ID 6
  };
  return iconos[idMedida] || '📊';
}

function getMedidaUnit(idMedida) {
  // Esta función ahora no se usará, pero la mantenemos por compatibilidad
  const unidades = {
    1: 'kg',       // Peso
    2: 'cm',       // Altura
    3: 'mmHg',     // Presión
    4: 'mg/dL',    // Glucosa
    6: '°C'        // Temperatura
  };
  return unidades[idMedida] || '';
}


// Funciones CRUD
window.editConsulta = (id) => {
  modalAlerts.info('Función de edición de consulta en desarrollo');
};

window.deleteConsulta = (id) => {
  modalAlerts.confirm(
    '¿Estás seguro de que quieres eliminar esta consulta?',
    async () => {
      try {
        await apiRequest(`/consultas/${id}`, { method: 'DELETE' });
        modalAlerts.success('Consulta eliminada correctamente');
        await loadConsultations();
      } catch (error) {
        modalAlerts.error('Error al eliminar la consulta');
      }
    }
  );
};

window.editMedida = (id) => {
  modalAlerts.info('Función de edición de medida en desarrollo');
};

window.deleteMedida = (id) => {
  modalAlerts.confirm(
    '¿Estás seguro de que quieres eliminar esta medida?',
    async () => {
      try {
        await apiRequest(`/registro-medidas/${id}`, { method: 'DELETE' });
        modalAlerts.success('Medida eliminada correctamente');
        await loadPersonalMeasurementModal();
        await loadEnhancedCharts(); // Recargar gráficas después de eliminar
      } catch (error) {
        modalAlerts.error('Error al eliminar la medida');
      }
    }
  );
};

window.editAlergia = (id) => {
  modalAlerts.info('Función de edición de alergia en desarrollo');
};

window.editMedicamento = (id) => {
  modalAlerts.info('Función de edición de medicamento en desarrollo');
};

window.editCirugia = (id) => {
  modalAlerts.info('Función de edición de cirugía en desarrollo');
};

window.editEnfermedad = (id) => {
  modalAlerts.info('Función de edición de enfermedad en desarrollo');
};

window.openMedicalHistoryModal = () => {
  modalAlerts.info('Modal de historial médico en desarrollo');
};

// Función de logout
window.logout = () => {
  modalAlerts.confirm(
    '¿Estás seguro de que quieres cerrar sesión?',
    () => {
      localStorage.removeItem('user');
      modalAlerts.success('Sesión cerrada correctamente');
      setTimeout(() => {
        window.location.href = 'iniciar-sesion.html';
      }, 1500);
    }
  );
};

// Funciones de utilidad adicionales
function updateModalNavigation() {
  window.currentSection = 'detalles';
  
  document.querySelectorAll('.modal-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const sectionName = this.dataset.section;
      if (sectionName) {
        document.querySelectorAll('.form-section').forEach(section => {
          section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
          targetSection.classList.add('active');
        }
        
        document.querySelectorAll('.modal-nav-item').forEach(navItem => {
          navItem.classList.remove('active');
        });
        this.classList.add('active');
        
        window.currentSection = sectionName;
        updateModalButtons();
      }
    });
  });
  
  updateModalButtons();
}

function initializeMeasurementListeners() {
  // Placeholder para listeners de medidas
}

function addRealTimeValidation() {
  document.addEventListener('input', function(e) {
    const input = e.target;
    
    if (!input || !input.classList || !input.classList.contains('form-input')) {
      return;
    }
    
    const formGroup = input.closest('.form-group');
    
    if (formGroup) {
      input.classList.remove('valid', 'invalid');
      
      if (input.hasAttribute('required') || (input.placeholder && input.placeholder.includes('obligatorio'))) {
        if (input.value.trim() === '') {
          input.classList.add('invalid');
        } else {
          input.classList.add('valid');
        }
      }
      
      if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          input.classList.add('invalid');
        } else {
          input.classList.add('valid');
        }
      }
      
      if (input.type === 'number' && input.value) {
        if (parseFloat(input.value) < 0) {
          input.classList.add('invalid');
        } else {
          input.classList.add('valid');
        }
      }
    }
  });
}

function preventNegativeNumbers() {
  document.addEventListener('input', function(e) {
    const input = e.target;
    
    if (input.type === 'number' && input.classList.contains('no-negative')) {
      if (parseFloat(input.value) < 0) {
        input.value = Math.abs(parseFloat(input.value));
      }
    }
  });
  
  document.addEventListener('keydown', function(e) {
    const input = e.target;
    
    if (input.type === 'number' && input.classList.contains('no-negative')) {
      if (e.key === '-') {
        e.preventDefault();
      }
    }
  });
}

function clearNewRecordForm() {
  document.querySelectorAll('#newRecordModal .form-input').forEach(input => {
    if (input.type === 'text' || input.type === 'number') {
      input.value = '';
    } else if (input.type === 'date') {
      input.value = '';
    } else if (input.tagName === 'SELECT') {
      input.selectedIndex = 0;
    }
    
    input.classList.remove('valid', 'invalid');
  });
  
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  const measurementsList = modal.querySelector('#measurementsList');
  if (measurementsList) {
    const measurementRows = measurementsList.querySelectorAll('.measurement-row');
    for (let i = 1; i < measurementRows.length; i++) {
      measurementRows[i].remove();
    }
    if (measurementRows[0]) {
      measurementRows[0].querySelectorAll('input, select').forEach(input => {
        input.value = '';
      });
    }
  }
  
  const medicationsList = modal.querySelector('#medicationsList');
  if (medicationsList) {
    const medicationRows = medicationsList.querySelectorAll('.medication-row');
    for (let i = 1; i < medicationRows.length; i++) {
      medicationRows[i].remove();
    }
    if (medicationRows[0]) {
      medicationRows[0].querySelectorAll('input').forEach(input => {
        input.value = '';
      });
    }
  }
  
  const proceduresList = modal.querySelector('#proceduresList');
  if (proceduresList) {
    const procedureRows = proceduresList.querySelectorAll('.procedure-row');
    for (let i = 1; i < procedureRows.length; i++) {
      procedureRows[i].remove();
    }
    if (procedureRows[0]) {
      procedureRows[0].querySelectorAll('input, select').forEach(input => {
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        } else {
          input.value = '';
        }
      });
    }
  }
  
  document.querySelectorAll('.section-alert').forEach(alert => {
    alert.classList.remove('show');
  });
  
  window.currentSection = 'detalles';
  updateModalButtons();
}

let modalValidator;
let measurementValidator;

function addRealTimeModalValidation() {
  const modal = document.getElementById('newRecordModal');
  if (!modal) return;
  
  if (!modalValidator) {
    modalValidator = new FormValidator('#newRecordModal', {
      validateOnInput: true,
      validateOnBlur: true
    });
    
    modalValidator.addValidator('diagnostico', (value) => value.length >= 10, 'El diagnóstico debe tener al menos 10 caracteres');
    modalValidator.addValidator('centroMedico', (value) => value.length >= 3, 'Ingresa el nombre del centro médico');
    modalValidator.addValidator('nombreDoctor', validators.fullName, 'Ingresa el nombre completo del doctor');
  }
  
  const medications = document.querySelectorAll('#medicationsList .medication-row');
  let hasValidMedication = false;
  
  medications.forEach(medication => {
    const nombreInput = medication.querySelector('input[placeholder*="Paracetamol"]');
    const dosisInput = medication.querySelector('input[placeholder*="1 tableta"]');
    
    if (nombreInput && dosisInput && nombreInput.value.trim() && dosisInput.value.trim()) {
      hasValidMedication = true;
    }
  });
  
  if (medications.length > 0 && !hasValidMedication) {
    showSectionAlert('tratamiento', 'Por favor completa al menos un medicamento con nombre y dosis', 'error');
  }
}

function addMeasurementModalValidation() {
  const modal = document.getElementById('newMeasurementModal');
  if (!modal) return;
  
  if (!measurementValidator) {
    measurementValidator = new FormValidator('#newMeasurementModal', {
      validateOnInput: true,
      validateOnBlur: true
    });
    
    measurementValidator.addValidator('valor', (value) => {
      const num = parseFloat(value);
      return num > 0 && num < 1000;
    }, 'El valor debe estar entre 0 y 1000');
    
    measurementValidator.addValidator('fecha', validators.notFutureDate, 'La fecha no puede ser futura');
  }
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString !== '';
}

function formatName(name) {
  return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).trim();
}