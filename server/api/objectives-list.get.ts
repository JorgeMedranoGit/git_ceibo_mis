
import { query } from '../utils/db';

export default defineEventHandler(async (event) => {
  const result = await query(`
    SELECT o.id_objetivo, o.nombre_objetivo, p.nombre_perspectiva 
    FROM lakehouse_gold.dim_objetivo_cmi o
    JOIN lakehouse_gold.dim_perspectiva_cmi p ON o.id_perspectiva = p.id_perspectiva
    ORDER BY p.id_perspectiva, o.nombre_objetivo
  `);
  return result.rows;
});
