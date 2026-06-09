
import { query } from '../utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { modulo, evento, responsable, impacto } = body;

  const sql = `
    INSERT INTO lakehouse_gold.fact_actividad_sistema (id_fecha, modulo, evento, responsable, impacto)
    VALUES (CURRENT_DATE, $1, $2, $3, $4)
  `;
  
  await query(sql, [modulo, evento, responsable, impacto]);
  return { status: 'success' };
});
