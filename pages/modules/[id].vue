
<template>
  <div class="module-page">
    <div v-if="moduleData" class="module-content">
      <header class="module-header">
        <div class="module-status">
          <span class="status-indicator"></span>
          {{ $route.params.id.toUpperCase() }} - ESTADO OPERATIVO
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="showKPIEditor = !showKPIEditor">
            {{ showKPIEditor ? 'Cerrar Editor' : '✏️ Ajustar KPIs' }}
          </button>
        </div>
      </header>

      <!-- EDITOR DE KPIs RÁPIDO -->
      <section v-if="showKPIEditor" class="kpi-editor animate-in">
        <h3>✏️ Panel de Control Estratégico</h3>
        <p>Ajusta el porcentaje de cumplimiento. El sistema calculará el valor ejecutado y actualizará los semáforos.</p>
        <div class="editor-grid">
          <div v-for="kpi in moduleKPIs" :key="kpi.id" class="editor-row">
            <div class="kpi-label-group">
              <label>{{ kpi.name }}</label>
              <span class="meta-label">Meta: {{ kpi.targetValue }} {{ kpi.unit }}</span>
            </div>
            
            <div class="range-wrap">
              <input 
                type="range" 
                v-model.number="kpi.simulatedPercent" 
                min="0" 
                max="120" 
                step="1"
                class="kpi-slider"
              />
              <div class="slider-value" :class="getSimulatedStatus(kpi.simulatedPercent)">
                {{ kpi.simulatedPercent }}%
                <small>({{ calcValue(kpi) }} {{ kpi.unit }})</small>
              </div>
            </div>

            <button class="btn-save" @click="updateKPI(kpi)" :disabled="updatingId === kpi.id">
              {{ updatingId === kpi.id ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </section>

      <!-- TARJETAS DE MÉTRICAS -->
      <div class="stats-overview">
        <div v-for="(value, key) in displayStats" :key="key" class="stat-card">
          <div class="stat-icon">{{ getIcon(key) }}</div>
          <div class="stat-info">
            <label>{{ formatKey(key) }}</label>
            <span class="stat-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- PROTECCIÓN DE VISTA ADMIN (SIMULADA) -->
      <div v-if="!isAuthenticated" class="admin-login-overlay">
        <div class="login-card animate-pop">
          <h3>🔐 Acceso Restringido: Admin</h3>
          <p>Ingresa la contraseña maestra para ver analítica avanzada.</p>
          <input 
            type="password" 
            v-model="passwordInput" 
            placeholder="Password"
            @keyup.enter="checkLogin"
          />
          <button @click="checkLogin">Entrar al Sistema</button>
          <p v-if="loginError" class="error-msg">Contraseña incorrecta</p>
        </div>
      </div>

      <div v-else class="analysis-grid">
        <!-- ÁRBOL DE DECISIÓN FUNCIONAL -->
        <section class="strategic-box">
          <h3>🧠 Centro de Mando: Acciones Estratégicas</h3>
          <div class="decision-tree">
            <div class="node root">
              <strong>Diagnóstico de la IA:</strong>
              <p>{{ moduleData.análisisEstratégico }}</p>
            </div>
            <div class="tree-arrow">⬇️ Selecciona una contramedida</div>
            <div class="decision-options">
              <button 
                class="option-card positive" 
                @click="executeDecision('A')"
                :disabled="executing"
              >
                <strong>⚡ {{ decisionA.title }}</strong>
                <p>{{ decisionA.desc }}</p>
              </button>
              <button 
                class="option-card neutral" 
                @click="executeDecision('B')"
                :disabled="executing"
              >
                <strong>🛡️ {{ decisionB.title }}</strong>
                <p>{{ decisionB.desc }}</p>
              </button>
            </div>
          </div>
          
          <!-- SECCIÓN DE ANALÍTICA OLAP ESPECÍFICA -->
          <div class="olap-analytics animate-in">
            <header class="olap-header">
              <h4>📊 Análisis Multidimensional (OLAP)</h4>
              <span class="olap-tag">Live Data</span>
            </header>
            
            <!-- VISTA VENTAS: EMBUDO DE CONVERSIÓN -->
            <div v-if="$route.params.id === 'sales'" class="olap-viz sales-funnel">
              <div class="funnel-step tier1"><span>Prospectos: 1,250</span></div>
              <div class="funnel-step tier2"><span>Cotizaciones: 480</span></div>
              <div class="funnel-step tier3"><span>Cierre: 124</span></div>
              <label>Embudo de Ventas Internacionales</label>
            </div>

            <!-- VISTA PRODUCCIÓN: CARGA DE PLANTA -->
            <div v-if="$route.params.id === 'production'" class="olap-viz plant-gauge">
              <div class="gauge-container">
                <div class="gauge-bar" :style="{ transform: `rotate(${Math.min(180, 140 + Math.random() * 30)}deg)` }"></div>
                <div class="gauge-center">92%</div>
              </div>
              <label>Utilización de Maquinaria (Tostadoras)</label>
            </div>

            <!-- VISTA FINANZAS: COMPOSICIÓN DE GASTOS -->
            <div v-if="$route.params.id === 'finance'" class="olap-viz finance-pie">
              <div class="pie-chart-sim">
                <div class="pie-slice" style="--p:45;--c:var(--ctp-green)"></div>
                <div class="pie-slice" style="--p:30;--c:var(--ctp-blue)"></div>
                <div class="pie-slice" style="--p:25;--c:var(--ctp-mauve)"></div>
              </div>
              <div class="pie-legend">
                <span><i style="background:var(--ctp-green)"></i> OpEx (45%)</span>
                <span><i style="background:var(--ctp-blue)"></i> Inversión (30%)</span>
              </div>
            </div>

            <!-- VISTA RRHH: DISTRIBUCIÓN DE TALENTO -->
            <div v-if="$route.params.id === 'hr'" class="olap-viz hr-radar">
              <div class="radar-sim">
                <div class="radar-poly"></div>
              </div>
              <label>Balance de Competencias (Soft vs Hard)</label>
            </div>
          </div>
        </section>

        <div class="charts-column">
          <!-- GRÁFICO DE TENDENCIAS -->
          <section class="module-trends">
            <h3>📈 Rendimiento Histórico (Últimos 6 Meses)</h3>
            <div class="trend-chart">
              <div v-for="i in 6" :key="i" class="trend-bar" :style="{ height: (30 + Math.random() * 60) + '%' }">
                <span class="bar-value">{{ Math.round(30 + Math.random() * 60) }}%</span>
                <span class="bar-label">M{{ i }}</span>
              </div>
            </div>
          </section>

          <!-- MATRIZ DE RIESGO DINÁMICA POR MÓDULO -->
          <section class="module-trends scatter-box">
            <h3>🎯 Matriz de Riesgo: {{ $route.params.id.toUpperCase() }}</h3>
            <div class="scatter-plot">
              <div class="quadrants">
                <div class="quadrant q1"><span>Peligro</span></div>
                <div class="quadrant q2"><span>Inestable</span></div>
                <div class="quadrant q3"><span>Lento</span></div>
                <div class="quadrant q4"><span>Líder</span></div>
              </div>
              <!-- Puntos dinámicos basados en el módulo -->
              <div 
                v-for="(p, idx) in riskPoints" 
                :key="idx" 
                class="scatter-point" 
                :style="{ bottom: p.y + '%', left: p.x + '%' }"
                :class="p.status"
                :title="p.label"
              >
                <div class="point-tooltip">{{ p.label }}</div>
              </div>
            </div>
          </section>

          <!-- NUEVO: HEATMAP DE CARGA OPERATIVA -->
          <section class="module-trends heatmap-box">
            <h3>🔥 Mapa de Calor: Carga de Trabajo</h3>
            <div class="heatmap-grid">
              <div v-for="n in 24" :key="n" class="heat-cell" :style="{ opacity: 0.2 + Math.random() * 0.8 }"></div>
            </div>
            <div class="heatmap-labels"><span>Turno Mañana</span><span>Turno Tarde</span><span>Turno Noche</span></div>
          </section>
        </div>
      </div>

      <!-- TABLA DE ACTIVIDAD REAL -->
      <section class="recent-activity">
        <h3>📄 Registro de Actividad Operativa</h3>
        <table v-if="activities?.length">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Responsable</th>
              <th>Impacto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="act in activities" :key="act.id_log">
              <td>{{ formatDate(act.fecha) }}</td>
              <td>{{ act.evento }}</td>
              <td>{{ act.responsable }}</td>
              <td>
                <span class="impact-badge" :class="act.impacto.toLowerCase()">{{ act.impacto }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="no-data">No hay actividad reciente registrada.</p>
      </section>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Consultando base de datos del módulo {{ $route.params.id }}...</p>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const { data: summary, refresh } = await useFetch('/api/objectives');
const { data: activities, refresh: refreshActivity } = await useFetch(() => `/api/activity?modulo=${route.params.id}`);

const moduleToPerspective = {
  sales: 'customer',
  finance: 'financial',
  production: 'internal',
  hr: 'learning',
  supply: 'internal',
  intl: 'customer',
  strategy: 'learning'
};
const perspectiveSlug = computed(() => moduleToPerspective[route.params.id] || 'financial');
const { data: moduleKPIsData } = await useFetch(() => `/api/objectives?perspective=${perspectiveSlug.value}`);

const showKPIEditor = ref(false);
const updatingId = ref(null);
const executing = ref(false);

// LOGIN LOGIC (ADMIN PROTECTED)
const isAuthenticated = ref(false);
const passwordInput = ref('');
const loginError = ref(false);

function checkLogin() {
  if (passwordInput.value === 'elceiboadmin') {
    isAuthenticated.value = true;
    loginError.value = false;
  } else {
    loginError.value = true;
  }
}

// MATRIZ DE RIESGO DINÁMICA
const riskPoints = computed(() => {
  const mod = route.params.id;
  const basePoints = {
    sales: [
      { x: 85, y: 20, label: 'Exportación EU', status: 'optimal' },
      { x: 40, y: 70, label: 'Logística Asia', status: 'warning' },
      { x: 15, y: 85, label: 'Ventas Locales', status: 'critical' }
    ],
    production: [
      { x: 90, y: 15, label: 'Tostado', status: 'optimal' },
      { x: 65, y: 40, label: 'Prensado', status: 'warning' },
      { x: 30, y: 80, label: 'Empaque', status: 'critical' }
    ],
    finance: [
      { x: 75, y: 30, label: 'Liquidez', status: 'optimal' },
      { x: 50, y: 55, label: 'Cuentas x Cobrar', status: 'warning' },
      { x: 20, y: 90, label: 'Deuda Bancaria', status: 'critical' }
    ],
    hr: [
      { x: 80, y: 25, label: 'Formación Técnica', status: 'optimal' },
      { x: 45, y: 60, label: 'Clima Laboral', status: 'warning' },
      { x: 10, y: 75, label: 'Rotación', status: 'critical' }
    ]
  };
  return basePoints[mod] || basePoints.sales;
});

const moduleData = computed(() => {
  if (!summary.value?.moduleStatus) return null;
  return summary.value.moduleStatus[route.params.id] || summary.value.moduleStatus['production'];
});

const displayStats = computed(() => {
  if (!moduleData.value) return {};
  const { análisisEstratégico, ...stats } = moduleData.value;
  return stats;
});

const moduleKPIs = ref([]);
watch(moduleKPIsData, (val) => {
  if (val) {
    moduleKPIs.value = val.map(k => {
      const currentPercent = k.targetValue ? Math.round((k.currentValue / k.targetValue) * 100) : 0;
      return { ...k, simulatedPercent: currentPercent };
    });
  }
}, { immediate: true });

function calcValue(kpi) {
  return Number(((kpi.simulatedPercent / 100) * kpi.targetValue).toFixed(2));
}

function getSimulatedStatus(percent) {
  if (percent >= 90) return 'optimal';
  if (percent >= 70) return 'warning';
  return 'critical';
}

// Decisiones personalizadas por módulo
const decisionContent = {
  sales: {
    A: { title: 'Escalar Exportaciones', desc: 'Invertir en logística para el mercado asiático.', log: 'Decisión: Inversión en logística Asia aprobada.' },
    B: { title: 'Fidelización Local', desc: 'Lanzar programa de descuentos para socios nacionales.', log: 'Decisión: Programa de fidelización socios iniciado.' }
  },
  production: {
    A: { title: 'Mantenimiento Mayor', desc: 'Parada programada para renovación de tostadoras.', log: 'Decisión: Renovación de tostadoras programada.' },
    B: { title: 'Turno Extra', desc: 'Habilitar tercer turno para cubrir demanda de Q3.', log: 'Decisión: Tercer turno productivo habilitado.' }
  },
  finance: {
    A: { title: 'Inversión en Bonos', desc: 'Colocar excedentes en fondos de bajo riesgo.', log: 'Decisión: Colocación de excedentes en bonos.' },
    B: { title: 'Reducción de Deuda', desc: 'Pago anticipado a proveedores para mejorar crédito.', log: 'Decisión: Pago anticipado a proveedores ejecutado.' }
  },
  hr: {
    A: { title: 'Plan de Incentivos', desc: 'Bonos por cumplimiento de metas de calidad.', log: 'Decisión: Plan de incentivos por calidad activo.' },
    B: { title: 'Capacitación Senior', desc: 'Especialización para maestros chocolateros.', log: 'Decisión: Especialización senior iniciada.' }
  },
  default: {
    A: { title: 'Optimizar Proceso', desc: 'Ajustar parámetros operativos.', log: 'Decisión: Optimización de procesos generales.' },
    B: { title: 'Auditoría Externa', desc: 'Validar cumplimiento de normas.', log: 'Decisión: Solicitud de auditoría externa.' }
  }
};

const decisionA = computed(() => decisionContent[route.params.id]?.A || decisionContent.default.A);
const decisionB = computed(() => decisionContent[route.params.id]?.B || decisionContent.default.B);

async function updateKPI(kpi) {
  updatingId.value = kpi.id;
  try {
    await $fetch('/api/data/metric', {
      method: 'POST',
      body: {
        id_indicador: kpi.id,
        valor_ejecutado: kpi.newValue,
        valor_meta: kpi.targetValue,
        id_fecha: new Date().toISOString().split('T')[0]
      }
    });
    await refresh();
    alert('KPI actualizado correctamente.');
  } catch (e) {
    alert('Error al actualizar.');
  } finally {
    updatingId.value = null;
  }
}

async function executeDecision(option) {
  executing.value = true;
  const content = option === 'A' ? decisionA.value : decisionB.value;
  try {
    await $fetch('/api/activity', {
      method: 'POST',
      body: {
        modulo: route.params.id,
        evento: content.log,
        responsable: 'Gerencia General',
        impacto: 'ALTO'
      }
    });
    await refreshActivity();
    alert(`Decisión Ejecutada: ${content.title}`);
  } catch (e) {
    alert('Error al ejecutar decisión.');
  } finally {
    executing.value = false;
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES');
}

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function getIcon(key) {
  const icons = {
    estado: '✅', órdenesActivas: '📦', eficienciaPlanta: '⚡', últimoMantenimiento: '🛠️',
    totalEmpleados: '👥', horasTrabajadasMes: '🕒', índiceAusentismo: '📉',
    materiaPrimaAcopiada: '🌾', pedidosExportación: '🚢', cumplimientoProveedores: '🤝',
    ingresosTotales: '💰', órdenesProcesadas: '🧾', tasaConversión: '🎯',
    balanceCaja: '🏛️', estadoAuditoría: '🔎', impuestosAlDía: '📝',
    mercadosActivos: '🌍', certificacionesVigentes: '📜', volumenExportación: '📦',
    faseActual: '🚀', objetivosCumplidos: '🏆', puntuaciónAlineación: '📍'
  };
  return icons[key] || '📊';
}
</script>

<style scoped>
.module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }

.module-status {
  background: var(--ctp-mantle);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--ctp-green);
  border: 1px solid var(--ctp-surface1);
}

.status-indicator { width: 10px; height: 10px; background: var(--ctp-green); border-radius: 50%; box-shadow: 0 0 10px var(--ctp-green); }

.kpi-editor {
  background: var(--ctp-surface1);
  padding: 25px;
  border-radius: 16px;
  margin-bottom: 30px;
  border: 1px solid var(--ctp-green);
}

.editor-grid { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
.editor-row { display: flex; justify-content: space-between; align-items: center; }
.input-wrap { display: flex; gap: 10px; }
.input-wrap input { background: var(--ctp-mantle); border: 1px solid var(--ctp-surface2); color: var(--ctp-text); padding: 8px; border-radius: 6px; width: 100px; }
.input-wrap button { background: var(--ctp-green); color: var(--ctp-base); border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }

.stats-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; }
.stat-card { background: var(--ctp-surface0); padding: 25px; border-radius: 16px; border: 1px solid var(--ctp-surface1); display: flex; align-items: center; gap: 20px; }
.stat-icon { font-size: 2rem; background: var(--ctp-mantle); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
.stat-info label { display: block; font-size: 0.75rem; color: var(--ctp-overlay1); text-transform: uppercase; }
.stat-value { font-size: 1.2rem; font-weight: bold; color: var(--ctp-text); }

.analysis-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 40px; }
.strategic-box, .module-trends, .recent-activity { background: var(--ctp-surface0); padding: 30px; border-radius: 16px; border: 1px solid var(--ctp-surface1); }
.strategic-box h3, .module-trends h3, .recent-activity h3 { margin-top: 0; color: var(--ctp-green); margin-bottom: 25px; }

.decision-tree { display: flex; flex-direction: column; align-items: center; gap: 15px; }
.node.root { background: var(--ctp-mantle); padding: 20px; border-radius: 12px; border: 1px solid var(--ctp-green); text-align: center; width: 100%; }
.decision-options { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; }
.option-card { background: var(--ctp-surface1); border: 1px solid var(--ctp-surface2); color: var(--ctp-text); padding: 20px; border-radius: 12px; cursor: pointer; text-align: left; transition: all 0.2s; }
.option-card:hover:not(:disabled) { border-color: var(--ctp-green); transform: translateY(-3px); }
.option-card.positive { border-left: 5px solid var(--ctp-green); }
.option-card.neutral { border-left: 5px solid var(--ctp-blue); }

.trend-chart { height: 250px; display: flex; align-items: flex-end; justify-content: space-around; padding: 20px 0; }
.trend-bar { width: 40px; background: linear-gradient(to top, var(--ctp-green), var(--ctp-teal)); border-radius: 8px 8px 0 0; position: relative; display: flex; justify-content: center; }
.bar-value { position: absolute; top: -25px; font-size: 0.7rem; font-weight: bold; color: var(--ctp-green); }
.bar-label { position: absolute; bottom: -25px; font-size: 0.65rem; color: var(--ctp-subtext0); }

.charts-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.scatter-box {
  flex: 1;
}

.scatter-plot {
  position: relative;
  width: 100%;
  height: 250px;
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface2);
  border-radius: 8px;
  overflow: hidden;
}

.quadrants {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: 100%;
  height: 100%;
}

.quadrant {
  border: 1px dashed var(--ctp-surface1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.quadrant span {
  font-size: 0.7rem;
  color: var(--ctp-overlay0);
  opacity: 0.5;
  text-transform: uppercase;
}

.q1 { background: rgba(243, 139, 168, 0.05); } /* Red top left */
.q4 { background: rgba(166, 226, 46, 0.05); } /* Green bottom right */

.scatter-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--ctp-green);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--ctp-green);
  transform: translate(-50%, 50%);
  cursor: help;
  transition: transform 0.2s;
}

.scatter-point:nth-child(2) { background: var(--ctp-red); box-shadow: 0 0 10px var(--ctp-red); }
.scatter-point:nth-child(3) { background: var(--ctp-yellow); box-shadow: 0 0 10px var(--ctp-yellow); }

.scatter-point:hover { transform: translate(-50%, 50%) scale(1.5); }

.distribution-box {
  margin-top: 0;
}

.progress-bar-stack {
  display: flex;
  height: 30px;
  border-radius: 15px;
  overflow: hidden;
  margin-top: 20px;
}

.pb-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ctp-base);
  font-size: 0.75rem;
  font-weight: bold;
}

.pb-green { background: var(--ctp-green); }
.pb-yellow { background: var(--ctp-yellow); }
.pb-red { background: var(--ctp-red); }

/* Slider Styles */
.range-wrap {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  margin: 0 20px;
}

.kpi-slider {
  flex: 1;
  accent-color: var(--ctp-green);
  cursor: pointer;
}

.slider-value {
  font-weight: bold;
  font-size: 1rem;
  min-width: 60px;
  text-align: right;
}

.slider-value.optimal { color: var(--ctp-green); }
.slider-value.warning { color: var(--ctp-yellow); }
.slider-value.critical { color: var(--ctp-red); }

.slider-value small {
  display: block;
  font-size: 0.7rem;
  color: var(--ctp-overlay1);
}

.btn-save {
  background: var(--ctp-green);
  color: var(--ctp-base);
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.kpi-label-group {
  display: flex;
  flex-direction: column;
  width: 200px;
}

.meta-label {
  font-size: 0.7rem;
  color: var(--ctp-overlay1);
}

.recent-activity table { width: 100%; border-collapse: collapse; }
.recent-activity th, .recent-activity td { text-align: left; padding: 15px; border-bottom: 1px solid var(--ctp-surface1); font-size: 0.9rem; }
.impact-badge { padding: 4px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 900; }
.impact-badge.alto { background: rgba(243, 139, 168, 0.2); color: var(--ctp-red); }
.impact-badge.medio { background: rgba(250, 179, 135, 0.2); color: var(--ctp-peach); }

.btn-outline { background: none; border: 1px solid var(--ctp-surface2); color: var(--ctp-text); padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.btn-outline:hover { border-color: var(--ctp-green); }

/* NUEVOS ESTILOS: LOGIN ADMIN Y HEATMAP */
.admin-login-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(10px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.login-card {
  background: var(--ctp-surface0);
  padding: 40px;
  border-radius: 24px;
  border: 1px solid var(--ctp-green);
  text-align: center;
  max-width: 400px;
  box-shadow: 0 0 50px rgba(166, 226, 46, 0.2);
}

.login-card h3 { color: var(--ctp-green); margin-bottom: 10px; }
.login-card p { font-size: 0.9rem; color: var(--ctp-overlay1); margin-bottom: 25px; }

.login-card input {
  width: 100%;
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface1);
  color: var(--ctp-text);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.1rem;
}

.login-card button {
  width: 100%;
  background: var(--ctp-green);
  color: var(--ctp-base);
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
}

.error-msg { color: var(--ctp-red); margin-top: 15px; font-weight: bold; }

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
  margin-top: 20px;
}

.heat-cell {
  height: 30px;
  background: var(--ctp-green);
  border-radius: 4px;
}

.heatmap-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 0.65rem;
  color: var(--ctp-overlay1);
}

.point-tooltip {
  position: absolute;
  top: -30px; left: 50%;
  transform: translateX(-50%);
  background: var(--ctp-base);
  color: var(--ctp-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.6rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  border: 1px solid var(--ctp-surface1);
}

.scatter-point:hover .point-tooltip { opacity: 1; }

.animate-pop { animation: popIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>
/* ESTILOS OLAP ANALYTICS */
.olap-analytics {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--ctp-surface1);
}

.olap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.olap-header h4 {
  margin: 0;
  color: var(--ctp-subtext1);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.olap-tag {
  background: var(--ctp-green);
  color: var(--ctp-base);
  font-size: 0.6rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 900;
}

.olap-viz {
  background: var(--ctp-mantle);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.olap-viz label {
  font-size: 0.75rem;
  color: var(--ctp-overlay1);
  font-weight: bold;
}

/* SALES FUNNEL */
.sales-funnel {
  gap: 5px;
}

.funnel-step {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ctp-base);
  font-weight: 900;
  font-size: 0.8rem;
  clip-path: polygon(10% 0, 90% 0, 100% 100%, 0 100%);
  margin-bottom: 2px;
}

.tier1 { background: var(--ctp-green); width: 100%; }
.tier2 { background: var(--ctp-teal); width: 80%; }
.tier3 { background: var(--ctp-blue); width: 60%; }

/* PLANT GAUGE */
.gauge-container {
  position: relative;
  width: 150px;
  height: 75px;
  background: var(--ctp-surface1);
  border-radius: 150px 150px 0 0;
  overflow: hidden;
}

.gauge-bar {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--ctp-green);
  transform-origin: center top;
  transition: transform 1s ease-in-out;
}

.gauge-center {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 50px;
  background: var(--ctp-mantle);
  border-radius: 100px 100px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 5px;
  font-weight: 900;
  font-size: 1.2rem;
  color: var(--ctp-green);
}

/* FINANCE PIE */
.pie-chart-sim {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    var(--ctp-green) 0% 45%,
    var(--ctp-blue) 45% 75%,
    var(--ctp-mauve) 75% 100%
  );
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.pie-legend span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
}

.pie-legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* HR RADAR */
.radar-sim {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, var(--ctp-surface1) 20%, transparent 20%),
              radial-gradient(circle, var(--ctp-surface1) 40%, transparent 40%),
              radial-gradient(circle, var(--ctp-surface1) 60%, transparent 60%);
  border: 1px solid var(--ctp-surface1);
  position: relative;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}

.radar-poly {
  position: absolute;
  top: 50%; left: 50%;
  width: 80%; height: 80%;
  background: rgba(166, 226, 46, 0.3);
  border: 2px solid var(--ctp-green);
  transform: translate(-50%, -50%);
  clip-path: polygon(50% 10%, 90% 40%, 70% 80%, 20% 70%, 10% 30%);
}
</style>
