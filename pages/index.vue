
<template>
  <div>
    <div class="summary-cards">
      <div class="card highlight">
        <h3>Índice de Salud CMI</h3>
        <p class="big-number">{{ summary?.averageProgress }}%</p>
        <span class="subtitle">Cumplimiento Global</span>
      </div>
      <div class="card">
        <h3>Indicadores Estratégicos</h3>
        <div class="metric-row">
          <span>KGIs (Metas):</span>
          <strong>{{ summary?.totalKGIs }}</strong>
        </div>
        <div class="metric-row">
          <span>KPIs (Procesos):</span>
          <strong>{{ summary?.totalKPIs }}</strong>
        </div>
      </div>
      <div class="card">
        <h3>Planta Industrial</h3>
        <p class="status-badge" :class="summary?.moduleStatus?.production?.estado?.toLowerCase() || ''">
          {{ summary?.moduleStatus?.production?.estado }}
        </p>
        <div class="small-info">Eficiencia: {{ summary?.moduleStatus?.production?.eficienciaPlanta }}</div>
      </div>
      <div class="card">
        <h3>Ventas Totales</h3>
        <p class="big-number">{{ summary?.moduleStatus?.sales?.ingresosTotales }}</p>
        <span class="subtitle">{{ summary?.moduleStatus?.sales?.órdenesProcesadas }} Órdenes</span>
      </div>
      <div class="card">
        <h3>Balance Caja</h3>
        <p class="big-number">{{ summary?.moduleStatus?.finance?.balanceCaja }}</p>
        <span class="subtitle">Estado: {{ summary?.moduleStatus?.finance?.estadoAuditoría }}</span>
      </div>
    </div>

    <section v-if="aiInsight" class="ai-insight-banner">
      <div class="ai-icon">✨</div>
      <div class="ai-content">
        <strong>Insight de IA:</strong> {{ aiInsight.analysis }}
        <NuxtLink to="/ai-assistant" class="ai-link">Ver más insights</NuxtLink>
      </div>
    </section>

    <section class="bsc-grid">
      <div v-for="p in perspectives" :key="p.slug" class="perspective-card">
        <div class="p-header" :style="{ backgroundColor: p.color }">
          <h4>{{ p.name }}</h4>
        </div>
        <div class="p-body">
          <p>{{ p.desc }}</p>
          <NuxtLink :to="'/perspectives/' + p.slug" class="btn-link">Ver Mapa de Indicadores</NuxtLink>
        </div>
      </div>
    </section>

    <section class="modules-section">
      <h3>Módulos de Gestión Operativa</h3>
      <div class="modules-links">
        <NuxtLink to="/modules/sales">💰 Ventas</NuxtLink>
        <NuxtLink to="/modules/finance">📈 Finanzas</NuxtLink>
        <NuxtLink to="/modules/production">🏭 Producción</NuxtLink>
        <NuxtLink to="/modules/hr">👥 Recursos Humanos</NuxtLink>
        <NuxtLink to="/modules/supply">📦 Suministro</NuxtLink>
        <NuxtLink to="/modules/intl">🌍 Internacionalización</NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
const { data: summary } = await useFetch('/api/objectives');
const { data: insights } = await useFetch('/api/ai/insights');

const aiInsight = computed(() => insights.value?.[0] || null);

const perspectives = [
  { name: 'Financiera', slug: 'financial', color: '#2ecc71', desc: 'Maximizar el valor para los socios y rentabilidad de exportación.' },
  { name: 'Clientes', slug: 'customer', color: '#3498db', desc: 'Satisfacción del mercado orgánico y posicionamiento de marca.' },
  { name: 'Procesos Internos', slug: 'internal', color: '#f1c40f', desc: 'Excelencia en producción, calidad y certificaciones.' },
  { name: 'Aprendizaje y Crecimiento', slug: 'learning', color: '#e67e22', desc: 'Capacitación del socio y adopción de tecnologías.' }
];
</script>

<style scoped>
.ai-insight-banner {
  background: linear-gradient(90deg, var(--ctp-surface0) 0%, var(--ctp-surface1) 100%);
  padding: 20px 30px;
  border-radius: 16px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid var(--ctp-green);
  box-shadow: 0 0 20px rgba(166, 226, 46, 0.1);
}

.ai-icon {
  font-size: 1.5rem;
}

.ai-content {
  flex: 1;
  font-size: 1rem;
  color: var(--ctp-text);
}

.ai-link {
  color: var(--ctp-green);
  margin-left: 15px;
  font-weight: bold;
  text-decoration: none;
}

.ai-link:hover {
  text-decoration: underline;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.card {
  background: var(--ctp-surface0);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--ctp-surface1);
  color: var(--ctp-text);
}

.card.highlight {
  background: var(--ctp-green);
  color: var(--ctp-base);
  border: none;
}

.big-number {
  font-size: 3.5rem;
  font-weight: bold;
  margin: 10px 0;
  color: var(--ctp-green);
}

.card.highlight .big-number {
  color: var(--ctp-base);
}

.subtitle {
  color: var(--ctp-subtext0);
  font-size: 0.9rem;
}

.card.highlight .subtitle {
  color: var(--ctp-surface2);
}

.metric-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 0.95rem;
}

.status-badge {
  padding: 8px 25px;
  border-radius: 25px;
  font-weight: bold;
  color: var(--ctp-base);
  margin-bottom: 12px;
}

.status-badge.activo { background: var(--ctp-green); }

.bsc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.perspective-card {
  background: var(--ctp-surface0);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ctp-surface1);
}

.p-header {
  padding: 20px;
  color: var(--ctp-base);
  text-align: center;
  font-weight: bold;
}

.p-header h4 { margin: 0; font-size: 1.3rem; }

.p-body {
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.p-body p {
  color: var(--ctp-subtext1);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 25px;
}

.btn-link {
  text-decoration: none;
  color: var(--ctp-text);
  font-weight: bold;
  border: 2px solid var(--ctp-surface2);
  padding: 10px 20px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s;
}

.btn-link:hover {
  background: var(--ctp-surface2);
  border-color: var(--ctp-surface2);
}

.modules-section {
  background: var(--ctp-mantle);
  padding: 40px;
  border-radius: 16px;
  border: 1px solid var(--ctp-surface0);
}

.modules-section h3 {
  margin-top: 0;
  color: var(--ctp-green);
}

.modules-links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.modules-links a {
  text-decoration: none;
  background: var(--ctp-surface0);
  padding: 15px 25px;
  border-radius: 12px;
  color: var(--ctp-text);
  border: 1px solid var(--ctp-surface1);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modules-links a:hover {
  background: var(--ctp-surface1);
  transform: translateY(-3px);
  border-color: var(--ctp-green);
}
</style>
