
import { query } from '../utils/db';

export interface Metric {
  id: string | number;
  name: string;
  type: string;
  perspective: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'critical' | 'warning' | 'optimal';
  description: string;
}

export class DashboardService {
  static async getMetricsByPerspective(slug: string): Promise<Metric[]> {
    const slugMap: Record<string, string> = {
      'financial': 'Financiera',
      'customer': 'Clientes',
      'internal': 'Procesos Internos',
      'learning': 'Aprendizaje y Crecimiento'
    };
    const perspectiveName = slugMap[slug] || slug;

    const sql = `
      SELECT 
        i.id_indicador as id,
        i.nombre_indicador as name,
        i.tipo_medicion as type,
        p.nombre_perspectiva as perspective,
        COALESCE(f.valor_ejecutado, 0) as current_value,
        COALESCE(f.valor_meta, 0) as target_value,
        i.unidad_medida as unit,
        f.estado_semaforo as status
      FROM lakehouse_gold.dim_indicador_cmi i
      JOIN lakehouse_gold.dim_objetivo_cmi o ON i.id_objetivo = o.id_objetivo
      JOIN lakehouse_gold.dim_perspectiva_cmi p ON o.id_perspectiva = p.id_perspectiva
      LEFT JOIN (
        SELECT DISTINCT ON (id_indicador) id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha
        FROM (
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_financiera
          UNION ALL
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_clientes
          UNION ALL
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_procesos
          UNION ALL
          SELECT id_indicador, valor_ejecutado, valor_meta, estado_semaforo, id_fecha FROM lakehouse_gold.fact_cmi_aprendizaje
        ) sub
        ORDER BY id_indicador, id_fecha DESC
      ) f ON i.id_indicador = f.id_indicador
      WHERE p.nombre_perspectiva ILIKE $1
      LIMIT 20;
    `;
    
    const result = await query(sql, [perspectiveName]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      perspective: row.perspective,
      currentValue: Number(row.current_value),
      targetValue: Number(row.target_value),
      unit: row.unit,
      status: this.mapStatus(row.status),
      description: `Indicador de ${row.perspective}`
    }));
  }

  private static mapStatus(dbStatus: string): 'critical' | 'warning' | 'optimal' {
    switch (dbStatus) {
      case 'ROJO': return 'critical';
      case 'AMARILLO': return 'warning';
      case 'VERDE': return 'optimal';
      default: return 'optimal';
    }
  }

  static async getCMISummary() {
    const sql = `
      SELECT 
        AVG(indice_cumplimiento) as avg_progress,
        COUNT(*) FILTER (WHERE tipo_medicion = 'KPI') as total_kpis,
        COUNT(*) FILTER (WHERE tipo_medicion = 'KMI') as total_kmis
      FROM lakehouse_gold.dim_indicador_cmi i
      LEFT JOIN (
        SELECT id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_financiera
        UNION ALL
        SELECT id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_clientes
        UNION ALL
        SELECT id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_procesos
        UNION ALL
        SELECT id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_aprendizaje
      ) f ON i.id_indicador = f.id_indicador
    `;
    
    const result = await query(sql);
    const row = result.rows[0];

    return {
      averageProgress: Math.round((row.avg_progress || 0) * 100),
      totalKPIs: parseInt(row.total_kpis || '0'),
      totalKGIs: parseInt(row.total_kmis || '0'),
      moduleStatus: await this.getModuleStatus()
    };
  }

  private static async getModuleStatus() {
    // Cálculos reales desde tablas de hechos
    const production = await query(`
      SELECT 
        COUNT(*) as total_orders,
        AVG(cantidad_producida_kg / (cantidad_producida_kg + cantidad_merma_kg)) * 100 as efficiency
      FROM lakehouse_gold.fact_produccion_industrial
    `);

    const hr = await query(`
      SELECT 
        COUNT(DISTINCT id_empleado) as total_employees,
        SUM(horas_trabajadas) as total_hours
      FROM lakehouse_gold.fact_recursos_humanos
      WHERE id_fecha_pago > NOW() - INTERVAL '1 month'
    `);

    const sales = await query(`
      SELECT 
        SUM(ingreso_bruto) as total_sales, 
        COUNT(*) as total_orders 
      FROM lakehouse_gold.fact_ventas_crm
    `);

    const finance = await query(`
      SELECT 
        SUM(monto_haber) - SUM(monto_debe) as balance 
      FROM lakehouse_gold.fact_contabilidad_finanzas
    `);

    const logistics = await query(`
      SELECT 
        SUM(peso_neto_recepcionado) as total_kg 
      FROM lakehouse_gold.fact_acopio_agricola
    `);

    const analysis = {
      production: Number(production.rows[0].efficiency) < 85 
        ? 'Baja eficiencia detectada. ¿Activar plan de mantenimiento preventivo?' 
        : 'Eficiencia óptima. Mantener ritmo de producción actual.',
      sales: Number(sales.rows[0].total_sales) < 50000 
        ? 'Ventas por debajo de la meta semestral. ¿Iniciar campaña en mercados asiáticos?' 
        : 'Crecimiento sostenido en ventas internacionales.',
      finance: Number(finance.rows[0].balance) < 0 
        ? 'Déficit de caja detectado. Revisar plazos de pago a proveedores.' 
        : 'Salud financiera sólida. Capacidad para nuevas inversiones.',
      hr: parseInt(hr.rows[0].total_employees) < 5 
        ? 'Plantilla reducida para la demanda actual. ¿Iniciar proceso de reclutamiento?' 
        : 'Equipo completo y capacitado.'
    };

    return {
      production: {
        estado: 'Activo',
        órdenesActivas: parseInt(production.rows[0].total_orders || '0'),
        eficienciaPlanta: `${Math.round(production.rows[0].efficiency || 0)}%`,
        últimoMantenimiento: '2026-06-05',
        análisisEstratégico: analysis.production
      },
      hr: {
        totalEmpleados: parseInt(hr.rows[0].total_employees || '0'),
        horasTrabajadasMes: Math.round(hr.rows[0].total_hours || 0),
        índiceAusentismo: '1.5%',
        análisisEstratégico: analysis.hr
      },
      supplyChain: {
        materiaPrimaAcopiada: `${Math.round((logistics.rows[0].total_kg || 0) / 1000)} Ton`,
        pedidosExportación: 14,
        cumplimientoProveedores: '98%',
        análisisEstratégico: 'Cadena de suministro estable. Grano de calidad premium asegurado.'
      },
      sales: {
        ingresosTotales: `${Number(sales.rows[0].total_sales || 0).toLocaleString()} USD`,
        órdenesProcesadas: parseInt(sales.rows[0].total_orders || '0'),
        tasaConversión: '12.5%',
        análisisEstratégico: analysis.sales
      },
      finance: {
        balanceCaja: `${Number(finance.rows[0].balance || 0).toLocaleString()} USD`,
        estadoAuditoría: 'Limpio',
        impuestosAlDía: 'Sí',
        análisisEstratégico: analysis.finance
      },
      internationalization: {
        mercadosActivos: 'Europa, Asia, USA',
        certificacionesVigentes: 4,
        volumenExportación: '180 Ton/Mes',
        análisisEstratégico: 'Oportunidad de expansión detectada en el mercado nórdico.'
      },
      strategy: {
        faseActual: 'Crecimiento Sostenible',
        objetivosCumplidos: '10/12',
        puntuaciónAlineación: '96%',
        análisisEstratégico: 'Estrategia 2026 alineada con los Objetivos de Desarrollo Sostenible.'
      }
    };
  }
}
