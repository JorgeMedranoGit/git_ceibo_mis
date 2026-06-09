
import { query } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { nombre_completo, cargo, departamento } = body;

  await query(`
    INSERT INTO lakehouse_gold.dim_empleado_usuario (nombre_completo, cargo, departamento, rol_sistema, usuario_acceso)
    VALUES ($1, $2, $3, 'Usuario', $4)
  `, [nombre_completo, cargo, departamento, nombre_completo.toLowerCase().replace(/\s/g, '.')]);

  return { status: 'success' };
});
