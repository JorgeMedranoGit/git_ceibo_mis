
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './utils/db';

export async function initializeDatabase() {
  try {
    const sqlPath = join(process.cwd(), '../bd.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    // Split by ROLLBACK or other markers if necessary, but here we'll just run it.
    // Note: The provided bd.sql ends with ROLLBACK, which would undo everything.
    // We should remove ROLLBACK if we want to commit.
    const cleanSql = sql.replace(/ROLLBACK/g, 'COMMIT');
    
    console.log('Iniciando inicialización de base de datos...');
    await query(cleanSql);
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}
