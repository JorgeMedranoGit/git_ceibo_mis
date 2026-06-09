
import { initializeDatabase } from '../../dbInit';
import { seedDatabase } from '../../seed';

export default defineEventHandler(async (event) => {
  console.log('--- Iniciando Proceso de Inicialización y Poblado ---');
  await initializeDatabase();
  await seedDatabase();
  return {
    status: 'success',
    message: 'Sistema inicializado y poblado con datos de prueba.'
  };
});
