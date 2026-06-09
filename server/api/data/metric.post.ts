
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id_indicador, valor_ejecutado, valor_meta, id_fecha } = body;

  // Find perspective to know which fact table to use
  const pResult = await query(`
    SELECT p.nombre_perspectiva 
    FROM lakehouse_gold.dim_indicador_cmi i
    JOIN lakehouse_gold.dim_objetivo_cmi o ON i.id_objetivo = o.id_objetivo
    JOIN lakehouse_gold.dim_perspectiva_cmi p ON o.id_perspectiva = p.id_perspectiva
    WHERE i.id_indicador = $1
  `, [id_indicador]);

  if (pResult.rows.length === 0) throw new Error('Indicador no encontrado');

  const perspective = pResult.rows[0].nombre_perspectiva.toLowerCase();
  const indice_cumplimiento = valor_ejecutado / valor_meta;
  const estado_semaforo = indice_cumplimiento >= 0.9 ? 'VERDE' : (indice_cumplimiento >= 0.7 ? 'AMARILLO' : 'ROJO');

  let table = '';
  if (perspective.includes('finan')) table = 'fact_cmi_financiera';
  else if (perspective.includes('client')) table = 'fact_cmi_clientes';
  else if (perspective.includes('proc') || perspective.includes('inter')) table = 'fact_cmi_procesos';
  else table = 'fact_cmi_aprendizaje';

  await query(`
    INSERT INTO lakehouse_gold.${table} (id_fecha, id_indicador, valor_ejecutado, valor_meta, indice_cumplimiento, estado_semaforo)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id_fecha, id_indicador, valor_ejecutado, valor_meta, indice_cumplimiento, estado_semaforo]);

  return { status: 'success' };
});
