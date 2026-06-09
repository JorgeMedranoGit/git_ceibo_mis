
<template>
  <div class="data-entry">
    <section class="form-card">
      <h3>🆕 Registrar Nueva Medición (Hecho CMI)</h3>
      <p>Añade un valor ejecutado para un indicador específico en una fecha.</p>
      
      <form @submit.prevent="submitMetric">
        <div class="form-group">
          <label>Indicador</label>
          <select v-model="formMetric.id_indicador" required>
            <option v-for="ind in indicators" :key="ind.id_indicador" :value="ind.id_indicador">
              {{ ind.nombre_indicador }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Valor Ejecutado</label>
            <input type="number" step="0.01" v-model="formMetric.valor_ejecutado" required />
          </div>
          <div class="form-group">
            <label>Valor Meta</label>
            <input type="number" step="0.01" v-model="formMetric.valor_meta" required />
          </div>
        </div>

        <div class="form-group">
          <label>Fecha</label>
          <input type="date" v-model="formMetric.id_fecha" required />
        </div>

        <button type="submit" :disabled="submittingMetric">
          {{ submittingMetric ? 'Guardando...' : 'Registrar Medición' }}
        </button>
      </form>
    </section>

    <section class="form-card">
      <h3>👤 Registrar Nuevo Empleado</h3>
      <form @submit.prevent="submitEmployee">
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" v-model="formEmployee.nombre_completo" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Cargo</label>
            <input type="text" v-model="formEmployee.cargo" required />
          </div>
          <div class="form-group">
            <label>Departamento</label>
            <input type="text" v-model="formEmployee.departamento" required />
          </div>
        </div>
        <button type="submit" class="secondary" :disabled="submittingEmployee">
          {{ submittingEmployee ? 'Guardando...' : 'Registrar Empleado' }}
        </button>
      </form>
    </section>

    <section class="form-card">
      <h3>🎯 Crear Nuevo Indicador (KPI/KMI)</h3>
      <p>Crea un nuevo indicador estratégico y asócialo a un objetivo del CMI.</p>
      <form @submit.prevent="submitIndicator">
        <div class="form-group">
          <label>Objetivo Estratégico</label>
          <select v-model="formIndicator.id_objetivo" required>
            <option v-for="obj in objectives" :key="obj.id_objetivo" :value="obj.id_objetivo">
              {{ obj.nombre_perspectiva }} - {{ obj.nombre_objetivo }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Código Único (Ej: KPI-X-01)</label>
            <input type="text" v-model="formIndicator.codigo_indicador" required />
          </div>
          <div class="form-group">
            <label>Nombre del Indicador</label>
            <input type="text" v-model="formIndicator.nombre_indicador" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="formIndicator.tipo_medicion" required>
              <option value="KPI">KPI (Rendimiento)</option>
              <option value="KMI">KMI (Resultado)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Unidad de Medida</label>
            <input type="text" v-model="formIndicator.unidad_medida" placeholder="%, USD, Horas..." required />
          </div>
        </div>

        <div class="form-group">
          <label>Tendencia Óptima</label>
          <select v-model="formIndicator.tendencia_optima" required>
            <option value="MAXIMIZAR">Maximizar (Mayor es mejor)</option>
            <option value="MINIMIZAR">Minimizar (Menor es mejor)</option>
          </select>
        </div>

        <button type="submit" class="tertiary" :disabled="submittingIndicator">
          {{ submittingIndicator ? 'Guardando...' : 'Crear Indicador' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
const { data: indicators, refresh: refreshIndicators } = await useFetch('/api/indicators');
const { data: objectives } = await useFetch('/api/objectives-list');

const formMetric = ref({
  id_indicador: '',
  valor_ejecutado: 0,
  valor_meta: 0,
  id_fecha: new Date().toISOString().split('T')[0]
});

const formEmployee = ref({
  nombre_completo: '',
  cargo: '',
  departamento: ''
});

const formIndicator = ref({
  id_objetivo: '',
  codigo_indicador: '',
  nombre_indicador: '',
  tipo_medicion: 'KPI',
  unidad_medida: '%',
  tendencia_optima: 'MAXIMIZAR'
});

const submittingMetric = ref(false);
const submittingEmployee = ref(false);
const submittingIndicator = ref(false);

const submitMetric = async () => {
  submittingMetric.value = true;
  try {
    await $fetch('/api/data/metric', {
      method: 'POST',
      body: formMetric.value
    });
    alert('Medición registrada con éxito');
  } catch (e) {
    alert('Error al registrar medición');
  } finally {
    submittingMetric.value = false;
  }
};

const submitEmployee = async () => {
  submittingEmployee.value = true;
  try {
    await $fetch('/api/data/employee', {
      method: 'POST',
      body: formEmployee.value
    });
    alert('Empleado registrado con éxito');
    formEmployee.value = { nombre_completo: '', cargo: '', departamento: '' };
  } catch (e) {
    alert('Error al registrar empleado');
  } finally {
    submittingEmployee.value = false;
  }
};

const submitIndicator = async () => {
  submittingIndicator.value = true;
  try {
    await $fetch('/api/data/indicator', {
      method: 'POST',
      body: formIndicator.value
    });
    alert('Indicador creado con éxito');
    formIndicator.value = { id_objetivo: '', codigo_indicador: '', nombre_indicador: '', tipo_medicion: 'KPI', unidad_medida: '%', tendencia_optima: 'MAXIMIZAR' };
    await refreshIndicators(); // Actualizar lista de la primera tarjeta
  } catch (e) {
    alert('Error al crear el indicador (verifica que el código no esté duplicado)');
  } finally {
    submittingIndicator.value = false;
  }
};
</script>

<style scoped>
.data-entry {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
}

.form-card {
  background: var(--ctp-surface0);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid var(--ctp-surface1);
}

.form-card h3 {
  margin-top: 0;
  color: var(--ctp-green);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

label {
  font-size: 0.9rem;
  color: var(--ctp-subtext0);
}

input, select {
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface1);
  padding: 12px;
  border-radius: 8px;
  color: var(--ctp-text);
  outline: none;
}

input:focus, select:focus {
  border-color: var(--ctp-green);
}

button {
  width: 100%;
  padding: 15px;
  background: var(--ctp-green);
  color: var(--ctp-base);
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;
}

button.secondary {
  background: var(--ctp-blue);
}

button.tertiary {
  background: var(--ctp-mauve);
}

button:hover:not(:disabled) {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
