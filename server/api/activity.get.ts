
import { query } from '../utils/db';

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  const modulo = queryParams.modulo as string;

  let sql = `
    SELECT id_fecha as fecha, evento, responsable, impacto 
    FROM lakehouse_gold.fact_actividad_sistema
  `;
  
  const params = [];
  if (modulo) {
    sql += ` WHERE modulo = $1`;
    params.push(modulo);
  }
  
  sql += ` ORDER BY id_fecha DESC LIMIT 10`;

  const result = await query(sql, params);
  return result.rows;
});
