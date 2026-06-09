
import { query } from '../utils/db';

export default defineEventHandler(async (event) => {
  const result = await query('SELECT id_indicador, nombre_indicador FROM lakehouse_gold.dim_indicador_cmi ORDER BY nombre_indicador');
  return result.rows;
});
