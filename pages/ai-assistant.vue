
<template>
  <div class="ai-container">
    <section class="insights-section">
      <h3>🔍 Insights Automáticos</h3>
      <div v-if="pending" class="loading">Analizando datos del sistema...</div>
      <div v-else class="insights-grid">
        <div v-for="(insight, index) in insights" :key="index" class="insight-card">
          <h4>{{ insight.title }}</h4>
          <p class="analysis">{{ insight.analysis }}</p>
          <div class="recommendation">
            <strong>💡 Recomendación:</strong> {{ insight.recommendation }}
          </div>
        </div>
      </div>
    </section>

    <section class="chat-section">
      <h3>💬 Chat con el Sistema</h3>
      <div class="chat-box" ref="chatBox">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="msg-content">{{ msg.text }}</div>
        </div>
        <div v-if="chatPending" class="message ai">
          <div class="msg-content">Escribiendo...</div>
        </div>
      </div>
      <div class="input-area">
        <input 
          v-model="userInput" 
          @keyup.enter="sendMessage" 
          placeholder="Pregunta algo sobre ventas, empleados o producción..."
          :disabled="chatPending"
        />
        <button @click="sendMessage" :disabled="chatPending">Enviar</button>
      </div>
    </section>
  </div>
</template>

<script setup>
const { data: insights, pending } = await useFetch('/api/ai/insights');

const userInput = ref('');
const messages = ref([
  { role: 'ai', text: '¡Hola! Soy el asistente de IA del Sistema Ceibo. Puedo ayudarte a analizar los KPIs y responder preguntas sobre los datos del negocio. ¿En qué puedo ayudarte hoy?' }
]);
const chatPending = ref(false);
const chatBox = ref(null);

const sendMessage = async () => {
  if (!userInput.value.trim() || chatPending.value) return;

  const userMsg = userInput.value;
  messages.value.push({ role: 'user', text: userMsg });
  userInput.value = '';
  chatPending.value = true;

  try {
    const { data } = await useFetch('/api/ai/chat', {
      method: 'POST',
      body: { message: userMsg }
    });
    
    messages.value.push({ role: 'ai', text: data.value.response });
  } catch (e) {
    messages.value.push({ role: 'ai', text: 'Lo siento, hubo un error al procesar tu solicitud.' });
  } finally {
    chatPending.value = false;
    nextTick(() => {
      if (chatBox.value) {
        chatBox.value.scrollTop = chatBox.value.scrollHeight;
      }
    });
  }
};
</script>

<style scoped>
.ai-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.insight-card {
  background: var(--ctp-surface0);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid var(--ctp-green);
}

.insight-card h4 {
  margin-top: 0;
  color: var(--ctp-green);
}

.analysis {
  font-size: 0.95rem;
  color: var(--ctp-subtext1);
  margin-bottom: 15px;
}

.recommendation {
  background: var(--ctp-mantle);
  padding: 10px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.chat-section {
  background: var(--ctp-surface0);
  padding: 30px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-box {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
  padding-right: 10px;
}

.message {
  max-width: 80%;
  padding: 12px 18px;
  border-radius: 15px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.message.ai {
  align-self: flex-start;
  background: var(--ctp-surface1);
  color: var(--ctp-text);
  border-bottom-left-radius: 2px;
}

.message.user {
  align-self: flex-end;
  background: var(--ctp-green);
  color: var(--ctp-base);
  border-bottom-right-radius: 2px;
}

.input-area {
  display: flex;
  gap: 10px;
}

.input-area input {
  flex: 1;
  background: var(--ctp-mantle);
  border: 1px solid var(--ctp-surface1);
  padding: 12px 20px;
  border-radius: 10px;
  color: var(--ctp-text);
  outline: none;
}

.input-area input:focus {
  border-color: var(--ctp-green);
}

.input-area button {
  background: var(--ctp-green);
  color: var(--ctp-base);
  border: none;
  padding: 0 25px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.input-area button:hover {
  opacity: 0.9;
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  color: var(--ctp-subtext0);
  font-style: italic;
}
</style>
