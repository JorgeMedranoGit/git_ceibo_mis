
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id_objetivo, codigo_indicador, nombre_indicador, tipo_medicion, unidad_medida, tendencia_optima } = body;

  try {
    await query(`
      INSERT INTO lakehouse_gold.dim_indicador_cmi (id_objetivo, codigo_indicador, nombre_indicador, tipo_medicion, unidad_medida, tendencia_optima)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id_objetivo, codigo_indicador, nombre_indicador, tipo_medicion, unidad_medida, tendencia_optima]);

    return { status: 'success' };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al crear indicador',
      data: error
    });
  }
});
