
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../utils/db';
import { DashboardService } from './dashboardService';

export class AIService {
  static async generateInsights() {
    const summary = await DashboardService.getCMISummary();
    const metrics = await this.getAllCriticalMetrics();

    let insights = [];

    if (summary.averageProgress < 70) {
      insights.push({
        title: 'Bajo Rendimiento General',
        analysis: `El progreso promedio del CMI es de ${summary.averageProgress}%, lo cual está por debajo del umbral crítico del 70%.`,
        recommendation: 'Se recomienda una revisión urgente de las estrategias en todas las perspectivas, priorizando aquellas con semáforo rojo.'
      });
    }

    metrics.forEach(m => {
      insights.push({
        title: `Alerta en ${m.name}`,
        analysis: `El indicador ${m.name} está en estado crítico con un valor de ${m.currentValue} ${m.unit} frente a una meta de ${m.targetValue} ${m.unit}.`,
        recommendation: `Analizar los cuellos de botella en el proceso de ${m.perspective}.`
      });
    });

    return insights;
  }

  static async chat(message: string) {
    // Check if the user has provided a Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return "⚠️ No se ha detectado una API Key de Gemini en el archivo .env. Para usar el agente inteligente real, por favor agrega `GEMINI_API_KEY=tu_clave_aqui` en el archivo .env y reinicia el servidor. \n\nPor ahora, sigo siendo tu asistente automatizado local: pregúntame sobre 'ventas', 'empleados' o 'producción'.";
    }

    try {
      // 1. Gather context from the database
      const summary = await DashboardService.getCMISummary();
      const dbContext = `
        Estás actuando como el Asistente Experto del Sistema Ceibo (una cooperativa de cacao orgánico). 
        Tienes acceso a los siguientes datos en tiempo real:
        - Cumplimiento Estratégico Global (CMI): ${summary.averageProgress}%
        - Ventas: ${summary.moduleStatus.sales?.ingresosTotales}
        - Finanzas: ${summary.moduleStatus.finance?.balanceCaja}
        - Eficiencia de Producción: ${summary.moduleStatus.production?.eficienciaPlanta}
        - Total de Empleados: ${summary.moduleStatus.hr?.totalEmpleados}
        
        El usuario ha preguntado: "${message}".
        
        Instrucciones: 
        1. Responde de forma profesional, clara y concisa.
        2. Utiliza los datos proporcionados para fundamentar tu respuesta.
        3. Si la pregunta es sobre decisiones estratégicas, sugiere contramedidas basadas en el estado del CMI.
      `;

      // 2. Call Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Changed model version
      
      const result = await model.generateContent(dbContext);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error("Error connecting to Gemini API:", error);
      
      // Fallback logic if the API key is completely invalid or the model is still not found
      return "Hubo un problema al conectar con la API de Gemini (Error de Autenticación o Modelo). Revisa que tu clave en .env comience por 'AIzaSy...'. \n\nSin embargo, analizando tus datos locales: El Sistema Ceibo tiene un cumplimiento del " + summary.averageProgress + "%. Revisa el módulo de Ventas (" + summary.moduleStatus.sales?.ingresosTotales + ") y Producción (" + summary.moduleStatus.production?.eficienciaPlanta + ") para detectar cuellos de botella.";
    }
  }

  private static async getAllCriticalMetrics() {
    const sql = `
      SELECT 
        i.nombre_indicador as name,
        p.nombre_perspectiva as perspective,
        f.valor_ejecutado as currentvalue,
        f.valor_meta as targetvalue,
        i.unidad_medida as unit
      FROM lakehouse_gold.dim_indicador_cmi i
      JOIN lakehouse_gold.dim_objetivo_cmi o ON i.id_objetivo = o.id_objetivo
      JOIN lakehouse_gold.dim_perspectiva_cmi p ON o.id_perspectiva = p.id_perspectiva
      JOIN (
        SELECT DISTINCT ON (id_indicador) id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha
        FROM (
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_financiera WHERE estado_semaforo = 'ROJO'
          UNION ALL
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_clientes WHERE estado_semaforo = 'ROJO'
          UNION ALL
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_procesos WHERE estado_semaforo = 'ROJO'
          UNION ALL
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_aprendizaje WHERE estado_semaforo = 'ROJO'
        ) sub
        ORDER BY id_indicador, id_fecha DESC
      ) f ON i.id_indicador = f.id_indicador
    `;
    const result = await query(sql);
    return result.rows.map(row => ({
      name: row.name,
      perspective: row.perspective,
      currentValue: row.currentvalue,
      targetValue: row.targetvalue,
      unit: row.unit
    }));
  }
}
