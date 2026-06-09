
<template>
  <div class="metric-card" :class="[metric.status, { active: isSelected }]" @click="$emit('select', metric)">
    <div class="card-header">
      <span class="type-tag" :class="metric.type">{{ metric.type }}</span>
      <h3>{{ metric.name }}</h3>
      <span class="expand-icon">{{ isSelected ? '▼' : '▶' }}</span>
    </div>
    
    <div class="progress-section">
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <span class="percentage-label">{{ progressPercent }}%</span>
    </div>

    <div class="stats">
      <div class="stat-item">
        <label>Actual</label>
        <span>{{ metric.currentValue }} {{ metric.unit }}</span>
      </div>
      <div class="stat-item">
        <label>Meta</label>
        <span>{{ metric.targetValue }} {{ metric.unit }}</span>
      </div>
    </div>

    <div v-if="isSelected" class="metric-details animate-in">
      <div class="divider"></div>
      <p class="meaning">
        <strong>Significado Estratégico:</strong><br>
        {{ getMeaning(metric) }}
      </p>
      <div class="action-plan" :class="metric.status">
        <strong>Plan de Acción:</strong> {{ getActionPlan(metric.status) }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  metric: { type: Object, required: true },
  isSelected: { type: Boolean, default: false }
});

defineEmits(['select']);

const progressPercent = computed(() => {
  if (!props.metric.targetValue) return 0;
  const p = (props.metric.currentValue / props.metric.targetValue) * 100;
  return Math.min(Math.round(p), 100);
});

function getMeaning(m) {
  const meanings = {
    'Margen Neto': 'Mide la rentabilidad final por cada dólar de venta tras deducir todos los costos.',
    'EBITDA Anual': 'Indica la capacidad operativa de generar caja antes de intereses e impuestos.',
    'Retención Clientes': 'Porcentaje de clientes internacionales que repiten pedidos en el semestre.',
    'NPS Global': 'Nivel de recomendación y lealtad de los distribuidores de cacao.',
    'Rendimiento Industrial': 'Eficiencia de conversión de materia prima en producto terminado.',
    'Capacidad Planta': 'Uso actual de la maquinaria instalada frente al máximo teórico.',
    'Horas Formación': 'Inversión en capital humano para asegurar la calidad del proceso.',
    'Índice Clima Laboral': 'Nivel de satisfacción y compromiso de los socios cooperativistas.'
  };
  return meanings[m.name] || 'Indicador clave para el monitoreo del desempeño estratégico del Sistema Ceibo.';
}

function getActionPlan(status) {
  if (status === 'optimal') return 'Mantener estándares actuales y documentar mejores prácticas.';
  if (status === 'warning') return 'Reforzar supervisión y ajustar desviaciones menores de inmediato.';
  return 'Intervención urgente: Revisar procesos raíz y asignar recursos adicionales.';
}
</script>

<style scoped>
.metric-card {
  background: var(--ctp-surface0);
  border-radius: 16px;
  padding: 24px;
  border-left: 6px solid var(--ctp-surface1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  color: var(--ctp-text);
  border: 1px solid var(--ctp-surface1);
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: var(--ctp-green);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.metric-card.active {
  background: var(--ctp-surface1);
  border-color: var(--ctp-green);
}

.metric-card.optimal { border-left-color: var(--ctp-green); }
.metric-card.warning { border-left-color: var(--ctp-yellow); }
.metric-card.critical { border-left-color: var(--ctp-red); }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.type-tag {
  font-size: 0.65rem;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--ctp-base);
  text-transform: uppercase;
}
.type-tag.KPI { background: var(--ctp-blue); }
.type-tag.KGI { background: var(--ctp-mauve); }
.type-tag.KMI { background: var(--ctp-pink); }

h3 { margin: 0; font-size: 1.1rem; flex: 1; margin-left: 12px; }

.expand-icon { font-size: 0.8rem; color: var(--ctp-overlay1); }

.progress-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.progress-container {
  flex: 1;
  background: var(--ctp-mantle);
  height: 10px;
  border-radius: 20px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--ctp-green);
  transition: width 0.8s ease-out;
}

.metric-card.warning .progress-bar { background: var(--ctp-yellow); }
.metric-card.critical .progress-bar { background: var(--ctp-red); }

.percentage-label {
  font-weight: 900;
  font-size: 1.1rem;
  min-width: 45px;
  color: var(--ctp-green);
}

.stats {
  display: flex;
  justify-content: space-between;
}

.stat-item label {
  display: block;
  font-size: 0.7rem;
  color: var(--ctp-overlay1);
  text-transform: uppercase;
}

.stat-item span {
  font-size: 1rem;
  font-weight: bold;
}

.metric-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--ctp-surface2);
}

.meaning {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--ctp-subtext1);
  margin-bottom: 15px;
}

.action-plan {
  padding: 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  background: var(--ctp-mantle);
}

.action-plan.optimal { border-left: 3px solid var(--ctp-green); }
.action-plan.warning { border-left: 3px solid var(--ctp-yellow); }
.action-plan.critical { border-left: 3px solid var(--ctp-red); }

.animate-in {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
