
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

      <div class="analysis-grid">
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

          <!-- NUEVO GRÁFICO: DISPERSIÓN DE EFICIENCIA -->
          <section class="module-trends scatter-box">
            <h3>🎯 Matriz de Eficiencia vs Riesgo</h3>
            <div class="scatter-plot">
              <div class="quadrants">
                <div class="quadrant q1"><span>Alto Riesgo / Baja Efi.</span></div>
                <div class="quadrant q2"><span>Alto Riesgo / Alta Efi.</span></div>
                <div class="quadrant q3"><span>Bajo Riesgo / Baja Efi.</span></div>
                <div class="quadrant q4"><span>Bajo Riesgo / Alta Efi. (Ideal)</span></div>
              </div>
              <div class="scatter-point" style="bottom: 80%; left: 75%;" title="Métrica Crítica"></div>
              <div class="scatter-point" style="bottom: 45%; left: 30%;" title="Alerta"></div>
              <div class="scatter-point" style="bottom: 20%; left: 85%;" title="Óptimo"></div>
            </div>
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

.animate-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1100px) { .analysis-grid { grid-template-columns: 1fr; } }
</style>
