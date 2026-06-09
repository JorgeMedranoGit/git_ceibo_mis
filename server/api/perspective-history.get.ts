
import { query } from '../utils/db';

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  const slug = queryParams.perspective as string;

  if (!slug) return [];

  const slugMap: Record<string, string> = {
    'financial': 'Financiera',
    'customer': 'Clientes',
    'internal': 'Procesos Internos',
    'learning': 'Aprendizaje y Crecimiento'
  };
  const perspectiveName = slugMap[slug] || slug;

  const sql = `
    SELECT 
      t.nombre_mes as mes,
      AVG(f.indice_cumplimiento) * 100 as cumplimiento
    FROM lakehouse_gold.dim_tiempo t
    JOIN (
      SELECT id_fecha, id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_financiera
      UNION ALL
      SELECT id_fecha, id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_clientes
      UNION ALL
      SELECT id_fecha, id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_procesos
      UNION ALL
      SELECT id_fecha, id_indicador, indice_cumplimiento FROM lakehouse_gold.fact_cmi_aprendizaje
    ) f ON t.id_fecha = f.id_fecha
    JOIN lakehouse_gold.dim_indicador_cmi i ON f.id_indicador = i.id_indicador
    JOIN lakehouse_gold.dim_objetivo_cmi o ON i.id_objetivo = o.id_objetivo
    JOIN lakehouse_gold.dim_perspectiva_cmi p ON o.id_perspectiva = p.id_perspectiva
    WHERE p.nombre_perspectiva ILIKE $1
    GROUP BY t.mes, t.nombre_mes
    ORDER BY t.mes ASC
  `;

  const result = await query(sql, [perspectiveName]);
  return result.rows;
});
