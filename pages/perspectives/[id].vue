
<template>
  <div class="perspective-page">
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Analizando indicadores estratégicos...</p>
    </div>
    
    <div v-else>
      <!-- SECCIÓN DE GRÁFICOS SUPERIOR -->
      <div class="charts-row">
        <section class="monthly-tracking card-base">
          <header class="card-header">
            <h3>📈 Seguimiento Mensual de Cumplimiento</h3>
            <span class="view-mode">Vista Semestral</span>
          </header>
          <div class="history-grid">
            <div v-for="point in history" :key="point.mes" class="history-item">
              <div class="h-bar-container">
                <div class="h-bar" :style="{ height: point.cumplimiento + '%' }">
                  <div class="h-val-bubble">{{ Math.round(point.cumplimiento) }}%</div>
                </div>
              </div>
              <label>{{ point.mes }}</label>
            </div>
          </div>
        </section>

        <section class="goal-distribution card-base">
          <h3>🎯 Distribución de Objetivos</h3>
          <div class="donut-sim">
            <div class="donut-hole">
              <span class="total-count">{{ metrics.length }}</span>
              <label>Indicadores</label>
            </div>
            <div class="donut-stats">
              <div class="d-stat"><span class="dot optimal"></span> Óptimos: {{ optimalCount }}</div>
              <div class="d-stat"><span class="dot warning"></span> Alerta: {{ warningCount }}</div>
              <div class="d-stat"><span class="dot critical"></span> Críticos: {{ criticalCount }}</div>
            </div>
          </div>
        </section>
      </div>

      <!-- GRID DE INDICADORES INTERACTIVOS CON MARGEN -->
      <div class="section-divider">
        <div class="divider-line"></div>
        <span class="divider-text">Indicadores Estratégicos (KPI / KMI)</span>
      </div>

      <!-- NUEVA SECCIÓN DE GRÁFICOS ANALÍTICOS -->
      <div class="charts-row secondary-charts">
        <section class="performance-compare card-base">
          <h3>📊 Desempeño Comparativo</h3>
          <div class="comparison-bars">
            <div v-for="m in topMetrics" :key="m.id" class="comp-bar-item">
              <div class="comp-label">{{ m.name }}</div>
              <div class="comp-track">
                <div class="comp-fill" :style="{ width: Math.round((m.currentValue/m.targetValue)*100) + '%' }" :class="m.status"></div>
                <span class="comp-val">{{ Math.round((m.currentValue/m.targetValue)*100) }}%</span>
              </div>
            </div>
          </div>
        </section>

        <section class="efficiency-trend card-base">
          <h3>⚡ Tendencia de Eficiencia</h3>
          <div class="trend-line-sim">
            <svg viewBox="0 0 400 150" class="trend-svg">
              <path d="M0,120 Q50,110 100,90 T200,60 T300,40 T400,30" fill="none" stroke="var(--ctp-green)" stroke-width="3" />
              <circle cx="0" cy="120" r="4" fill="var(--ctp-green)" />
              <circle cx="100" cy="90" r="4" fill="var(--ctp-green)" />
              <circle cx="200" cy="60" r="4" fill="var(--ctp-green)" />
              <circle cx="300" cy="40" r="4" fill="var(--ctp-green)" />
              <circle cx="400" cy="30" r="4" fill="var(--ctp-green)" />
            </svg>
            <div class="trend-labels">
              <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span>
            </div>
          </div>
        </section>
      </div>

      <div class="metrics-grid">
        <PerspectivesObjectiveCard 
          v-for="metric in metrics" 
          :key="metric.id" 
          :metric="metric"
          @select="openModal"
        />
      </div>

      <div v-if="!metrics || metrics.length === 0" class="no-data-state">
        <p>No se han encontrado indicadores para la perspectiva {{ $route.params.id }}.</p>
      </div>

      <!-- MODAL DE DETALLE -->
      <div v-if="selectedMetric" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content animate-pop">
          <header class="modal-header">
            <div class="header-left">
              <span class="type-tag" :class="selectedMetric.type">{{ selectedMetric.type }}</span>
              <h2>{{ selectedMetric.name }}</h2>
            </div>
            <button class="close-btn" @click="closeModal">&times;</button>
          </header>

          <div class="modal-body">
            <div class="status-banner" :class="selectedMetric.status">
              Estado Actual: <strong>{{ getStatusLabel(selectedMetric.status) }}</strong>
            </div>

            <div class="metrics-comparison">
              <div class="comp-card">
                <label>Valor Ejecutado</label>
                <div class="val">{{ selectedMetric.currentValue }} {{ selectedMetric.unit }}</div>
              </div>
              <div class="comp-card">
                <label>Meta Establecida</label>
                <div class="val">{{ selectedMetric.targetValue }} {{ selectedMetric.unit }}</div>
              </div>
              <div class="comp-card highlight">
                <label>Cumplimiento</label>
                <div class="val">{{ Math.round((selectedMetric.currentValue / selectedMetric.targetValue) * 100) }}%</div>
              </div>
            </div>

            <section class="analysis-section">
              <h3>🔍 Significado Estratégico</h3>
              <p>{{ getMeaning(selectedMetric) }}</p>
            </section>

            <section class="analysis-section">
              <h3>💡 Plan de Acción Recomendado</h3>
              <div class="action-box" :class="selectedMetric.status">
                {{ getActionPlan(selectedMetric.status) }}
              </div>
            </section>
          </div>
          
          <footer class="modal-footer">
            <button class="btn-primary" @click="closeModal">Entendido</button>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const { data: metrics, pending } = await useFetch(`/api/objectives?perspective=${route.params.id}`);
const { data: history } = await useFetch(`/api/perspective-history?perspective=${route.params.id}`);

const selectedMetric = ref(null);

const optimalCount = computed(() => metrics.value?.filter(m => m.status === 'optimal').length || 0);
const warningCount = computed(() => metrics.value?.filter(m => m.status === 'warning').length || 0);
const criticalCount = computed(() => metrics.value?.filter(m => m.status === 'critical').length || 0);

const topMetrics = computed(() => {
  if (!metrics.value) return [];
  // Take 4 representative metrics for the comparison chart
  return metrics.value.slice(0, 4);
});

function openModal(metric) {
  selectedMetric.value = metric;
}

function closeModal() {
  selectedMetric.value = null;
}

function getStatusLabel(status) {
  const labels = { optimal: 'ÓPTIMO', warning: 'ADVERTENCIA', critical: 'CRÍTICO' };
  return labels[status];
}

function getMeaning(m) {
  const meanings = {
    // FINANCIERA
    'Margen Neto': 'Evalúa la capacidad de la cooperativa para convertir ingresos en beneficio real tras costos operativos y de exportación.',
    'EBITDA Anual': 'Refleja la salud financiera operativa bruta, fundamental para la reinversión en maquinaria y pagos a socios.',
    'ROI Marketing': 'Retorno directo de la inversión en ferias internacionales de chocolate y campañas digitales.',
    'Liquidez Corriente': 'Capacidad de la empresa para cubrir sus obligaciones de corto plazo con sus activos más líquidos.',
    'Costo de Ventas': 'Eficiencia en la estructura de costos directos de producción de cacao y derivados.',
    'Valor Económico Agregado': 'Mide el valor real creado por la cooperativa por encima del costo de capital empleado.',
    'Días de Cartera (Cuentas por Cobrar)': 'Velocidad con la que los clientes internacionales y locales pagan sus facturas.',

    // CLIENTES
    'Retención Clientes': 'Indica la fidelidad de los compradores europeos y estadounidenses ante la competencia de otros orígenes.',
    'NPS Global': 'Mide la satisfacción del cliente final; un NPS alto asegura contratos a largo plazo en mercados premium.',
    'Índice de Quejas': 'Monitoreo de inconformidades; crucial para mantener la certificación Fairtrade y la confianza.',
    'Participación Mercado Europa': 'Porcentaje de ventas en el mercado europeo en comparación con los competidores directos.',
    'Tiempo Respuesta Soporte': 'Agilidad para resolver dudas sobre pedidos, certificaciones o logística de envíos.',
    'Lifetime Value (LTV)': 'Valor proyectado de los ingresos que un cliente generará a lo largo de su relación con El Ceibo.',
    'Costo Adquisición Cliente': 'Inversión requerida en marketing y ventas para conseguir un nuevo distribuidor o cliente B2B.',
    'Tasa Conversión Leads': 'Efectividad del equipo comercial para convertir prospectos interesados en compradores reales.',
    'Clientes con Certificación Orgánica': 'Número de clientes que exigen y compran productos bajo el sello de certificación orgánica.',
    'Conciencia de Marca (Awareness)': 'Reconocimiento de la marca El Ceibo en los mercados objetivo internacionales.',

    // PROCESOS INTERNOS
    'Rendimiento Industrial': 'Eficiencia de conversión de materia prima (cacao en baba) en producto terminado.',
    'Capacidad Planta': 'Nivel de uso de la infraestructura industrial para satisfacer la demanda de chocolate terminado.',
    'Calidad Lote (Aprobación)': 'Porcentaje de lotes producidos que pasan los estrictos controles de calidad e inocuidad.',
    'Tiempo Ciclo Producción': 'Velocidad desde la recepción del grano hasta el empaque del chocolate; clave para la frescura.',
    'Merma de Materia Prima': 'Mide el desperdicio de cacao en el proceso; impacta directamente en el margen neto.',
    'Disponibilidad de Activos': 'Porcentaje de tiempo que las máquinas tostadoras y prensadoras están listas para operar.',
    'Eficiencia Energética': 'Consumo de energía (kWh) por cada tonelada de cacao procesada; objetivo de sostenibilidad.',
    'Cumplimiento Plan Producción': 'Precisión de la planta para producir la cantidad exacta planificada para cada semana.',
    'Accidentabilidad Laboral': 'Registro de incidentes en planta; métrica crítica para la seguridad ocupacional.',

    // APRENDIZAJE Y CRECIMIENTO
    'Horas Formación': 'Asegura que el personal operativo esté al día con certificaciones orgánicas y normas de inocuidad.',
    'Índice Clima Laboral': 'Fundamental para retener el talento experto en catación y procesos industriales de alta precisión.',
    'Rotación Personal': 'Mide la pérdida de empleados clave; una alta rotación afecta la consistencia de la calidad.',
    'Inversión I+D': 'Presupuesto destinado a desarrollar nuevos productos (ej. barras con inclusiones locales).',
    'Adopción de Nuevas Tecnologías': 'Porcentaje de procesos digitalizados o integrados en el Sistema Ceibo.'
  };
  return meanings[m.name] || 'Indicador clave integrado en el mapa estratégico para asegurar el crecimiento sostenible del Sistema Ceibo.';
}

function getActionPlan(status) {
  if (status === 'optimal') return 'Felicitar al equipo responsable y documentar el proceso como estándar de éxito para otros departamentos.';
  if (status === 'warning') return 'Programar una reunión de revisión técnica para identificar desviaciones y ajustar el presupuesto operativo.';
  return 'ALERTA ROJA: Detener procesos relacionados, auditar la última semana de operación y asignar un comité de crisis de inmediato.';
}
</script>

<style scoped>
.perspective-page { display: flex; flex-direction: column; gap: 30px; }

.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }

.card-base {
  background: var(--ctp-surface0);
  padding: 30px;
  border-radius: 20px;
  border: 1px solid var(--ctp-surface1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.card-header h3, h3 { margin-top: 0; color: var(--ctp-green); }

.view-mode {
  font-size: 0.75rem;
  background: var(--ctp-mantle);
  padding: 4px 12px;
  border-radius: 20px;
  color: var(--ctp-overlay1);
}

.history-grid {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 220px;
  padding: 20px 10px;
}

.history-item { flex: 1; display: flex; flex-direction: column; align-items: center; max-width: 80px; }

.h-bar-container {
  width: 100%; height: 180px;
  background: var(--ctp-mantle);
  border-radius: 12px;
  display: flex; align-items: flex-end;
  overflow: visible;
  border: 1px solid var(--ctp-surface1);
}

.h-bar {
  width: 100%;
  background: linear-gradient(to top, var(--ctp-green), var(--ctp-teal));
  border-radius: 8px;
  transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.h-val-bubble {
  position: absolute;
  top: -35px; left: 50%;
  transform: translateX(-50%);
  background: var(--ctp-green);
  color: var(--ctp-base);
  font-size: 0.75rem;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(166, 226, 46, 0.3);
}

.h-val-bubble::after {
  content: '';
  position: absolute;
  bottom: -4px; left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--ctp-green);
}

.history-item label {
  margin-top: 15px;
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--ctp-subtext0);
  text-transform: uppercase;
}

.donut-sim { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 220px; }

.donut-hole {
  width: 120px; height: 120px;
  background: var(--ctp-mantle);
  border: 8px solid var(--ctp-surface1);
  border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  margin-bottom: 20px;
}

.total-count { font-size: 2rem; font-weight: 900; color: var(--ctp-green); }
.donut-hole label { font-size: 0.7rem; color: var(--ctp-overlay1); text-transform: uppercase; }

.donut-stats { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.d-stat { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.optimal { background: var(--ctp-green); }
.dot.warning { background: var(--ctp-yellow); }
.dot.critical { background: var(--ctp-red); }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: var(--ctp-base);
  width: 90%; max-width: 700px;
  border-radius: 24px;
  padding: 40px;
  position: relative;
  border: 1px solid var(--ctp-surface1);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
.header-left { display: flex; flex-direction: column; gap: 10px; }
.modal-header h2 { margin: 0; color: var(--ctp-text); font-size: 1.8rem; }

.type-tag { font-size: 0.7rem; font-weight: 900; padding: 4px 10px; border-radius: 6px; width: fit-content; color: var(--ctp-base); }
.type-tag.KPI { background: var(--ctp-blue); }
.type-tag.KGI { background: var(--ctp-mauve); }
.type-tag.KMI { background: var(--ctp-pink); }

.close-btn { background: none; border: none; color: var(--ctp-overlay1); font-size: 2rem; cursor: pointer; }

.status-banner {
  padding: 12px 20px; border-radius: 12px; margin-bottom: 30px; font-size: 0.9rem;
  background: var(--ctp-surface0); border-left: 5px solid;
}
.status-banner.optimal { border-color: var(--ctp-green); color: var(--ctp-green); }
.status-banner.warning { border-color: var(--ctp-yellow); color: var(--ctp-yellow); }
.status-banner.critical { border-color: var(--ctp-red); color: var(--ctp-red); }

.metrics-comparison { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
.comp-card { background: var(--ctp-mantle); padding: 20px; border-radius: 16px; text-align: center; }
.comp-card label { display: block; font-size: 0.7rem; color: var(--ctp-overlay1); text-transform: uppercase; margin-bottom: 10px; }
.comp-card .val { font-size: 1.2rem; font-weight: 900; color: var(--ctp-text); }
.comp-card.highlight .val { color: var(--ctp-green); }

.analysis-section { margin-bottom: 30px; }
.analysis-section h3 { font-size: 1rem; color: var(--ctp-overlay1); margin-bottom: 15px; border-bottom: 1px solid var(--ctp-surface1); padding-bottom: 10px; }
.analysis-section p { line-height: 1.6; color: var(--ctp-subtext1); }

.action-box { padding: 20px; border-radius: 12px; font-weight: 500; line-height: 1.5; }
.action-box.optimal { background: rgba(166, 226, 46, 0.1); color: var(--ctp-green); }
.action-box.warning { background: rgba(249, 226, 175, 0.1); color: var(--ctp-yellow); }
.action-box.critical { background: rgba(243, 139, 168, 0.1); color: var(--ctp-red); }

.modal-footer { display: flex; justify-content: flex-end; }
.btn-primary { background: var(--ctp-green); color: var(--ctp-base); border: none; padding: 12px 30px; border-radius: 12px; font-weight: 900; cursor: pointer; }

.animate-pop { animation: popIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1200px) { .charts-row { grid-template-columns: 1fr; } }

/* NUEVOS ESTILOS PARA GRÁFICOS SECUNDARIOS Y DIVISORES */
.section-divider {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 40px 0 20px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--ctp-surface1), transparent);
}

.divider-text {
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--ctp-overlay1);
  letter-spacing: 2px;
}

.secondary-charts {
  margin-bottom: 30px;
}

.comparison-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.comp-bar-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comp-label {
  font-size: 0.75rem;
  color: var(--ctp-subtext0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comp-track {
  height: 12px;
  background: var(--ctp-mantle);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.comp-fill {
  height: 100%;
  border-radius: 6px;
}
.comp-fill.optimal { background: var(--ctp-green); }
.comp-fill.warning { background: var(--ctp-yellow); }
.comp-fill.critical { background: var(--ctp-red); }

.comp-val {
  position: absolute;
  right: 10px;
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--ctp-text);
  text-shadow: 0 0 5px var(--ctp-base);
}

.trend-line-sim {
  height: 150px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.trend-svg {
  width: 100%;
  height: 120px;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
  font-size: 0.65rem;
  color: var(--ctp-overlay1);
  font-weight: bold;
}
</style>
