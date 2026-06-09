
import { query } from './utils/db';

export async function seedDatabase() {
  console.log('Iniciando poblado masivo de datos del Sistema Ceibo...');

  try {
    // 1. Limpieza de tablas de hechos para evitar duplicados en pruebas
    const tablesToTruncate = [
      'lakehouse_gold.fact_ventas_crm',
      'lakehouse_gold.fact_contabilidad_finanzas',
      'lakehouse_gold.fact_produccion_industrial',
      'lakehouse_gold.fact_recursos_humanos',
      'lakehouse_gold.fact_acopio_agricola',
      'lakehouse_gold.fact_cmi_financiera',
      'lakehouse_gold.fact_cmi_clientes',
      'lakehouse_gold.fact_cmi_procesos',
      'lakehouse_gold.fact_cmi_aprendizaje',
      'lakehouse_gold.dim_tiempo',
      'lakehouse_gold.dim_entidad_comercial',
      'lakehouse_gold.dim_producto_material',
      'lakehouse_gold.dim_empleado_usuario',
      'lakehouse_gold.dim_activo_infraestructura'
    ];
    
    for (const table of tablesToTruncate) {
      await query(`TRUNCATE ${table} CASCADE`);
    }

    // 2. Dimensión de Tiempo (Primer semestre 2026)
    await query(`
      INSERT INTO lakehouse_gold.dim_tiempo (id_fecha, anio, trimestre, mes, nombre_mes, dia_semana, es_fin_semana)
      SELECT 
        d::date, 
        EXTRACT(YEAR FROM d), 
        EXTRACT(QUARTER FROM d), 
        EXTRACT(MONTH FROM d),
        CASE EXTRACT(MONTH FROM d)
          WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
          WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
        END,
        CASE EXTRACT(DOW FROM d)
          WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles' WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes' WHEN 6 THEN 'Sábado'
        END,
        CASE WHEN EXTRACT(DOW FROM d) IN (0, 6) THEN true ELSE false END
      FROM generate_series('2026-01-01'::date, '2026-06-30'::date, '1 day'::interval) d;
    `);

    // 3. Productos y Entidades
    await query(`
      INSERT INTO lakehouse_gold.dim_producto_material (id_producto, tipo_item, descripcion, costo_promedio, es_producto_final)
      VALUES 
        ('CACAO-BA-01', 'Materia Prima', 'Grano de Cacao en Baba', 2.50, false),
        ('CACAO-SE-01', 'Materia Prima', 'Grano de Cacao Seco Grado 1', 4.80, false),
        ('CHOCO-70-01', 'Producto Final', 'Tableta de Chocolate 70% Cacao', 12.00, true),
        ('CHOCO-85-01', 'Producto Final', 'Tableta de Chocolate 85% Cacao Premium', 14.50, true),
        ('MANTE-CA-01', 'Producto Final', 'Manteca de Cacao Pura', 15.50, true),
        ('POLVO-CA-01', 'Producto Final', 'Cacao en Polvo Orgánico', 9.00, true);

      INSERT INTO lakehouse_gold.dim_entidad_comercial (codigo_origen, tipo_entidad, nombre_razon_social, documento_identidad_nit)
      VALUES 
        ('PROD-001', 'Productor', 'Cooperativa El Progreso', 'NIT-100200'),
        ('PROD-002', 'Productor', 'Asociación Sapecho', 'NIT-100201'),
        ('CLI-EU-01', 'Cliente', 'ChocoEurope Distribution', 'VAT-EU9988'),
        ('CLI-EU-02', 'Cliente', 'Swiss Artisan Chocolates', 'VAT-CH4455'),
        ('CLI-US-01', 'Cliente', 'Organic Foods NY', 'EIN-12345'),
        ('CLI-ASIA-01', 'Cliente', 'Tokyo Gourmet Imports', 'J-998877');

      INSERT INTO lakehouse_gold.dim_empleado_usuario (id_empleado, nombre_completo, cargo, departamento, rol_sistema, usuario_acceso)
      VALUES 
        (101, 'Ricardo Arce', 'Gerente General', 'Administración', 'Admin', 'rarce'),
        (102, 'Elena Mendez', 'Jefe de Planta', 'Producción', 'Operador', 'emendez'),
        (103, 'Carlos Luna', 'Analista de Calidad', 'Calidad', 'Auditor', 'cluna');

      INSERT INTO lakehouse_gold.dim_activo_infraestructura (codigo_referencia, categoria_activo, descripcion_activo, vida_util_estimada)
      VALUES 
        ('LINEA-01', 'Maquinaria', 'Línea de Tostado A', 10),
        ('LINEA-02', 'Maquinaria', 'Línea de Prensado B', 10),
        ('CAM-01', 'Vehículo', 'Camión de Recolección 5T', 8);

      INSERT INTO lakehouse_gold.dim_cuenta_contable (cod_cuenta, descripcion_cuenta, grupo_cuenta)
      VALUES 
        ('CTA-100', 'Caja y Bancos', 'Activo'),
        ('CTA-400', 'Ventas Locales', 'Ingreso'),
        ('CTA-500', 'Costo de Producción', 'Egreso');

      INSERT INTO lakehouse_gold.dim_parcela (id_parcela, hectareas_totales, variedad_cultivo, estado_certificacion)
      VALUES 
        ('PARC-A1', 15.5, 'Cacao Criollo', 'Certificado Orgánico');
    `);

    // 4. Hechos Operativos (Ventas, Finanzas, Producción, RRHH)
    await query(`
      -- Ventas: Distribuidas en los meses
      INSERT INTO lakehouse_gold.fact_ventas_crm (id_fecha_facturacion, id_cliente, id_producto, cantidad_vendida, ingreso_bruto)
      SELECT 
        id_fecha, 
        (SELECT id_entidad FROM lakehouse_gold.dim_entidad_comercial WHERE tipo_entidad = 'Cliente' ORDER BY random() LIMIT 1),
        (SELECT id_producto FROM lakehouse_gold.dim_producto_material WHERE es_producto_final = true ORDER BY random() LIMIT 1),
        (random() * 100 + 10)::int,
        (random() * 5000 + 1000)::decimal(15,2)
      FROM lakehouse_gold.dim_tiempo WHERE dia_semana = 'Viernes';

      -- Producción
      INSERT INTO lakehouse_gold.fact_produccion_industrial (id_orden_produccion, id_fecha_inicio, id_producto_final, id_maquina, cantidad_producida_kg, cantidad_merma_kg, aprobacion_calidad, costo_estimado_produccion)
      SELECT 
        (row_number() over())::int,
        id_fecha,
        'CHOCO-70-01',
        (SELECT id_activo FROM lakehouse_gold.dim_activo_infraestructura WHERE categoria_activo = 'Maquinaria' LIMIT 1),
        (random() * 500 + 200),
        (random() * 20),
        true,
        (random() * 3000 + 500)
      FROM lakehouse_gold.dim_tiempo WHERE mes IN (1,2,3,4,5,6) AND EXTRACT(DOW FROM id_fecha) BETWEEN 1 AND 5;

      -- RRHH: Pagos mensuales
      INSERT INTO lakehouse_gold.fact_recursos_humanos (id_fecha_pago, id_empleado, horas_trabajadas, puntaje_kpi_desempeno, salario_liquido_pagado)
      SELECT 
        id_fecha,
        id_empleado,
        160 + (random() * 20),
        85 + (random() * 15),
        2500 + (random() * 500)
      FROM lakehouse_gold.dim_tiempo, lakehouse_gold.dim_empleado_usuario
      WHERE id_fecha IN ('2026-01-30', '2026-02-28', '2026-03-30', '2026-04-30', '2026-05-30');

      -- Contabilidad
      INSERT INTO lakehouse_gold.fact_contabilidad_finanzas (id_fecha, cod_cuenta, monto_debe, monto_haber)
      SELECT 
        id_fecha,
        'CTA-100',
        (random() * 1000),
        (random() * 5000 + 2000)
      FROM lakehouse_gold.dim_tiempo WHERE dia_semana = 'Lunes';

      -- Acopio (Suministro)
      INSERT INTO lakehouse_gold.fact_acopio_agricola (id_fecha_recepcion, id_parcela, id_productor, peso_neto_recepcionado)
      SELECT 
        id_fecha,
        'PARC-A1',
        (SELECT id_entidad FROM lakehouse_gold.dim_entidad_comercial WHERE tipo_entidad = 'Productor' LIMIT 1),
        (random() * 2000 + 500)
      FROM lakehouse_gold.dim_tiempo WHERE dia_semana = 'Miércoles';
    `);

    // 5. CMI (Perspectivas, Objetivos, Indicadores)
    // Aseguramos que los IDs coincidan con lo que DashboardService espera o usa
    await query(`
      INSERT INTO lakehouse_gold.dim_perspectiva_cmi (id_perspectiva, nombre_perspectiva, descripcion_estrategica)
      VALUES 
        (1, 'Financiera', 'Maximizar rentabilidad'),
        (2, 'Clientes', 'Fidelización internacional'),
        (3, 'Procesos Internos', 'Eficiencia productiva'),
        (4, 'Aprendizaje y Crecimiento', 'Desarrollo de talento')
      ON CONFLICT (id_perspectiva) DO UPDATE SET nombre_perspectiva = EXCLUDED.nombre_perspectiva;

      INSERT INTO lakehouse_gold.dim_objetivo_cmi (id_perspectiva, codigo_objetivo, nombre_objetivo)
      VALUES 
        (1, 'OBJ-F', 'Crecimiento de Ingresos'),
        (2, 'OBJ-C', 'Satisfacción del Cliente'),
        (3, 'OBJ-I', 'Calidad de Proceso'),
        (4, 'OBJ-L', 'Capacitación Continua')
      ON CONFLICT (codigo_objetivo) DO NOTHING;

      INSERT INTO lakehouse_gold.dim_indicador_cmi (id_objetivo, codigo_indicador, nombre_indicador, tipo_medicion, unidad_medida, tendencia_optima)
      VALUES 
        -- FINANCIERA (7+)
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'IND-FIN-01', 'Margen Neto', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'KMI-FIN-01', 'EBITDA Anual', 'KMI', 'USD', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'KPI-ROI-01', 'ROI Marketing', 'KPI', 'Ratio', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'IND-FIN-04', 'Liquidez Corriente', 'KPI', 'Ratio', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'IND-FIN-05', 'Costo de Ventas', 'KPI', 'USD', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'KMI-FIN-06', 'Valor Económico Agregado', 'KMI', 'USD', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-F'), 'IND-FIN-07', 'Días de Cartera (Cuentas por Cobrar)', 'KPI', 'Días', 'MINIMIZAR'),

        -- CLIENTES (10+)
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'IND-CLI-01', 'Retención Clientes', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'KMI-CLI-01', 'NPS Global', 'KMI', 'Score', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'KPI-QUE-01', 'Índice de Quejas', 'KPI', '%', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'IND-CLI-04', 'Participación Mercado Europa', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'IND-CLI-05', 'Tiempo Respuesta Soporte', 'KPI', 'Horas', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'KMI-CLI-06', 'Lifetime Value (LTV)', 'KMI', 'USD', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'IND-CLI-07', 'Costo Adquisición Cliente', 'KPI', 'USD', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'IND-CLI-08', 'Tasa Conversión Leads', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'IND-CLI-09', 'Clientes con Certificación Orgánica', 'KPI', 'Num', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-C'), 'KMI-CLI-10', 'Conciencia de Marca (Awareness)', 'KMI', '%', 'MAXIMIZAR'),

        -- PROCESOS INTERNOS (9+)
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'IND-PRO-01', 'Rendimiento Industrial', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'KMI-PRO-01', 'Capacidad Planta', 'KMI', 'Ton/Día', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'KPI-CAL-01', 'Calidad Lote (Aprobación)', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'IND-PRO-04', 'Tiempo Ciclo Producción', 'KPI', 'Horas', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'IND-PRO-05', 'Merma de Materia Prima', 'KPI', '%', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'IND-PRO-06', 'Disponibilidad de Activos', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'KMI-PRO-07', 'Eficiencia Energética', 'KMI', 'kWh/Ton', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'IND-PRO-08', 'Cumplimiento Plan Producción', 'KPI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-I'), 'IND-PRO-09', 'Accidentabilidad Laboral', 'KPI', 'Num', 'MINIMIZAR'),

        -- APRENDIZAJE Y CRECIMIENTO (5+)
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-L'), 'IND-APR-01', 'Horas Formación', 'KPI', 'Horas', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-L'), 'KMI-APR-01', 'Índice Clima Laboral', 'KMI', '%', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-L'), 'KPI-ROT-01', 'Rotación Personal', 'KPI', '%', 'MINIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-L'), 'IND-APR-04', 'Inversión I+D', 'KPI', 'USD', 'MAXIMIZAR'),
        ((SELECT id_objetivo FROM lakehouse_gold.dim_objetivo_cmi WHERE codigo_objetivo='OBJ-L'), 'IND-APR-05', 'Adopción de Nuevas Tecnologías', 'KPI', '%', 'MAXIMIZAR')
      ON CONFLICT (codigo_indicador) DO NOTHING;
    `);

    // 6. Poblar Hechos CMI para los meses de 2026 (Para seguimiento mensual)
    const indicators = await query('SELECT i.id_indicador, p.id_perspectiva FROM lakehouse_gold.dim_indicador_cmi i JOIN lakehouse_gold.dim_objetivo_cmi o ON i.id_objetivo = o.id_objetivo JOIN lakehouse_gold.dim_perspectiva_cmi p ON o.id_perspectiva = p.id_perspectiva');
    
    for (const ind of indicators.rows) {
      const months = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'];
      for (const mDate of months) {
        let table = '';
        if (ind.id_perspectiva === 1) table = 'fact_cmi_financiera';
        else if (ind.id_perspectiva === 2) table = 'fact_cmi_clientes';
        else if (ind.id_perspectiva === 3) table = 'fact_cmi_procesos';
        else table = 'fact_cmi_aprendizaje';

        const exec = 70 + (random() * 25);
        const meta = 90;
        const cumpling = exec / meta;
        const semaforo = cumpling >= 0.9 ? 'VERDE' : (cumpling >= 0.7 ? 'AMARILLO' : 'ROJO');

        await query(`
          INSERT INTO lakehouse_gold.${table} (id_fecha, id_indicador, valor_ejecutado, valor_meta, indice_cumplimiento, estado_semaforo)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [mDate, ind.id_indicador, exec, meta, cumpling, semaforo]);
      }
    }

    await query(`
      -- Crear tabla de logs
      CREATE TABLE IF NOT EXISTS lakehouse_gold.fact_actividad_sistema (
        id_log SERIAL PRIMARY KEY,
        id_fecha DATE,
        modulo VARCHAR(50),
        evento TEXT,
        responsable VARCHAR(100),
        impacto VARCHAR(20)
      );

      -- Limpiar tabla de logs para repoblarla
      TRUNCATE lakehouse_gold.fact_actividad_sistema RESTART IDENTITY CASCADE;

      INSERT INTO lakehouse_gold.fact_actividad_sistema (id_fecha, modulo, evento, responsable, impacto)
      VALUES 
        (CURRENT_DATE - INTERVAL '10 days', 'sales', 'Apertura de nuevo canal de distribución en Tokio', 'Ricardo Arce', 'ALTO'),
        (CURRENT_DATE - INTERVAL '9 days', 'production', 'Mantenimiento preventivo exhaustivo en línea de tostado A', 'Elena Mendez', 'MEDIO'),
        (CURRENT_DATE - INTERVAL '8 days', 'finance', 'Cierre anticipado del balance mensual Q1 con superávit', 'Ricardo Arce', 'ALTO'),
        (CURRENT_DATE - INTERVAL '7 days', 'hr', 'Finalización exitosa de capacitación en normas ISO 22000', 'Carlos Luna', 'ALTO'),
        (CURRENT_DATE - INTERVAL '6 days', 'supply', 'Recepción de lote de 5 toneladas de cacao premium de Sapecho', 'Elena Mendez', 'MEDIO'),
        (CURRENT_DATE - INTERVAL '5 days', 'sales', 'Alerta: Desviación negativa de precios detectada en mercado europeo', 'Sistema Inteligente', 'ALTO'),
        (CURRENT_DATE - INTERVAL '4 days', 'finance', 'Auditoría interna sorpresa de gastos operativos y exportación', 'Comité Auditor', 'MEDIO'),
        (CURRENT_DATE - INTERVAL '3 days', 'production', 'Calibración de sensores de humedad en maquinaria principal', 'Ing. Soporte', 'BAJO'),
        (CURRENT_DATE - INTERVAL '2 days', 'hr', 'Contratación de 2 nuevos catadores senior para laboratorio', 'Recursos Humanos', 'MEDIO'),
        (CURRENT_DATE - INTERVAL '1 days', 'supply', 'Retraso logístico detectado en embarque de proveedores externos', 'Logística', 'ALTO'),
        (CURRENT_DATE, 'sales', 'Cierre de contrato anual con Swiss Artisan Chocolates', 'Gerencia Comercial', 'ALTO'),
        (CURRENT_DATE, 'production', 'Optimización de flujo energético, reducción de consumo del 5%', 'Elena Mendez', 'MEDIO');
    `);

    console.log('Poblado masivo completado exitosamente.');
  } catch (error) {
    console.error('Error crítico durante el seeding:', error);
    throw error;
  }
}

function random() {
  return Math.random();
}
