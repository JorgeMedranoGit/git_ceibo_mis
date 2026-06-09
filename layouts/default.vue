
<template>
  <div class="app-container">
    <aside class="sidebar">
      <h2>Sistema Ceibo</h2>
      <nav>
        <ul>
          <li><NuxtLink to="/">Resumen General</NuxtLink></li>
          <li><NuxtLink to="/ai-assistant">✨ Asistente AI</NuxtLink></li>
          <li><NuxtLink to="/data-entry">📝 Gestión de Datos</NuxtLink></li>
          <li class="nav-section">Perspectivas</li>
          <li><NuxtLink to="/perspectives/financial">Financiera</NuxtLink></li>
          <li><NuxtLink to="/perspectives/customer">Clientes</NuxtLink></li>
          <li><NuxtLink to="/perspectives/internal">Procesos Internos</NuxtLink></li>
          <li><NuxtLink to="/perspectives/learning">Aprendizaje y Crecimiento</NuxtLink></li>
          <li class="nav-section">Módulos</li>
          <li><NuxtLink to="/modules/sales">💰 Ventas</NuxtLink></li>
          <li><NuxtLink to="/modules/finance">📈 Finanzas</NuxtLink></li>
          <li><NuxtLink to="/modules/production">🏭 Producción</NuxtLink></li>
          <li><NuxtLink to="/modules/hr">👥 Recursos Humanos</NuxtLink></li>
          <li><NuxtLink to="/modules/supply">📦 Suministro</NuxtLink></li>
          <li><NuxtLink to="/modules/intl">🌍 Internacionalización</NuxtLink></li>
          <li><NuxtLink to="/modules/strategy">🎯 Estrategia</NuxtLink></li>
        </ul>
      </nav>
    </aside>
    <main class="content">
      <header class="top-bar">
        <h1>{{ title }}</h1>
      </header>
      <div class="page-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
const route = useRoute();
const title = computed(() => {
  const path = route.path;
  if (path === '/') return 'Tablero de Control Estratégico';
  if (path === '/ai-assistant') return 'Asistente de Inteligencia Artificial';
  if (path === '/data-entry') return 'Gestión y Poblado de Datos';
  if (path.includes('financial')) return 'Perspectiva Financiera';
  if (path.includes('customer')) return 'Perspectiva de Clientes';
  if (path.includes('internal')) return 'Perspectiva de Procesos Internos';
  if (path.includes('learning')) return 'Perspectiva de Aprendizaje y Crecimiento';
  if (path.includes('sales')) return 'Módulo de Ventas y CRM';
  if (path.includes('finance')) return 'Módulo de Finanzas y Contabilidad';
  if (path.includes('production')) return 'Módulo de Producción';
  if (path.includes('hr')) return 'Módulo de Recursos Humanos';
  if (path.includes('supply')) return 'Suministro y Materias Primas';
  if (path.includes('intl')) return 'Internacionalización';
  if (path.includes('strategy')) return 'Estrategias y Evolución';
  return 'Sistema Ceibo';
});
</script>

<style>
:root {
  /* Catppuccin Mocha Palette */
  --ctp-rosewater: #f5e0dc;
  --ctp-flamingo: #f2cdcd;
  --ctp-pink: #f5c2e7;
  --ctp-mauve: #cba6f7;
  --ctp-red: #f38ba8;
  --ctp-maroon: #eba0ac;
  --ctp-peach: #fab387;
  --ctp-yellow: #f9e2af;
  --ctp-green: #a6e22e; /* Customized for 'Ceibo' feel */
  --ctp-teal: #94e2d5;
  --ctp-sky: #89dceb;
  --ctp-sapphire: #74c7ec;
  --ctp-blue: #89b4fa;
  --ctp-lavender: #b4befe;
  --ctp-text: #cdd6f4;
  --ctp-subtext1: #bac2de;
  --ctp-subtext0: #a6adc8;
  --ctp-overlay2: #9399b2;
  --ctp-overlay1: #7f849c;
  --ctp-overlay0: #6c7086;
  --ctp-surface2: #585b70;
  --ctp-surface1: #45475a;
  --ctp-surface0: #313244;
  --ctp-base: #1e1e2e;
  --ctp-mantle: #181825;
  --ctp-crust: #11111b;

  --primary-color: var(--ctp-green);
  --bg-color: var(--ctp-base);
  --sidebar-width: 260px;
}

body {
  margin: 0;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background-color: var(--ctp-base);
  color: var(--ctp-text);
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background-color: var(--ctp-mantle);
  color: var(--ctp-text);
  padding: 25px;
  box-shadow: 4px 0 10px rgba(0,0,0,0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.sidebar h2 {
  font-size: 1.4rem;
  margin-bottom: 30px;
  color: var(--ctp-green);
  border-bottom: 1px solid var(--ctp-surface1);
  padding-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar h2::before {
  content: '🌿';
}

.sidebar nav {
  flex: 1;
  overflow-y: auto;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin-bottom: 8px;
}

.sidebar a {
  color: var(--ctp-subtext1);
  text-decoration: none;
  font-size: 0.95rem;
  padding: 10px 15px;
  display: block;
  border-radius: 8px;
  transition: all 0.2s;
}

.sidebar a:hover, .router-link-active {
  background-color: var(--ctp-surface0);
  color: var(--ctp-green);
}

.nav-section {
  font-weight: bold;
  margin-top: 25px;
  margin-bottom: 10px;
  color: var(--ctp-overlay1);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Important for flex child to not overflow */
}

.top-bar {
  background-color: var(--ctp-crust);
  padding: 15px 40px;
  border-bottom: 1px solid var(--ctp-surface0);
}

.top-bar h1 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--ctp-text);
}

.page-content {
  padding: 40px;
}
</style>
