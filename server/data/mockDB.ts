
export interface Metric {
  id: string;
  name: string;
  type: 'KPI' | 'KGI';
  perspective: 'Financial' | 'Customer' | 'Internal' | 'Learning';
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'critical' | 'warning' | 'optimal';
  description: string;
}

export const cmiMetrics: Metric[] = [
  // PERSPECTIVA FINANCIERA
  { 
    id: 'F-KGI-01', 
    name: 'Crecimiento de Ingresos Totales', 
    type: 'KGI', 
    perspective: 'Financial', 
    currentValue: 1250000, 
    targetValue: 1500000, 
    unit: 'USD', 
    status: 'warning',
    description: 'Meta estratégica de facturación anual para expansión internacional.'
  },
  { 
    id: 'F-KPI-01', 
    name: 'Margen de Utilidad Bruta', 
    type: 'KPI', 
    perspective: 'Financial', 
    currentValue: 32, 
    targetValue: 35, 
    unit: '%', 
    status: 'optimal',
    description: 'Indicador de eficiencia en la producción de derivados de cacao.'
  },

  // PERSPECTIVA CLIENTES
  { 
    id: 'C-KGI-01', 
    name: 'Participación en Mercado Europeo', 
    type: 'KGI', 
    perspective: 'Customer', 
    currentValue: 12, 
    targetValue: 20, 
    unit: '%', 
    status: 'warning',
    description: 'Objetivo de posicionamiento de la marca Ceibo en mercados orgánicos.'
  },
  { 
    id: 'C-KPI-01', 
    name: 'Índice de Satisfacción del Cliente (NPS)', 
    type: 'KPI', 
    perspective: 'Customer', 
    currentValue: 8.5, 
    targetValue: 9.0, 
    unit: 'Score', 
    status: 'optimal',
    description: 'Medición de lealtad y calidad percibida por distribuidores internacionales.'
  },

  // PERSPECTIVA PROCESOS INTERNOS
  { 
    id: 'I-KGI-01', 
    name: 'Certificación Orgánica Internacional', 
    type: 'KGI', 
    perspective: 'Internal', 
    currentValue: 100, 
    targetValue: 100, 
    unit: '%', 
    status: 'optimal',
    description: 'Mantenimiento del 100% de las fincas con certificación vigente.'
  },
  { 
    id: 'I-KPI-01', 
    name: 'Rendimiento por Hectárea', 
    type: 'KPI', 
    perspective: 'Internal', 
    currentValue: 450, 
    targetValue: 600, 
    unit: 'kg/Ha', 
    status: 'critical',
    description: 'Productividad de las parcelas de los socios cooperativistas.'
  },

  // PERSPECTIVA APRENDIZAJE Y CRECIMIENTO
  { 
    id: 'L-KGI-01', 
    name: 'Índice de Capacitación Tecnológica', 
    type: 'KGI', 
    perspective: 'Learning', 
    currentValue: 75, 
    targetValue: 90, 
    unit: '%', 
    status: 'warning',
    description: 'Objetivo de digitalización de los procesos de recolección y venta.'
  },
  { 
    id: 'L-KPI-01', 
    name: 'Tasa de Rotación de Personal Clave', 
    type: 'KPI', 
    perspective: 'Learning', 
    currentValue: 5, 
    targetValue: 8, 
    unit: '%', 
    status: 'optimal',
    description: 'Capacidad de retención de talento humano en la planta industrial.'
  }
];

export const moduleStatus = {
  production: {
    status: 'Activo',
    activeLines: 4,
    efficiency: 92,
    lastDowntime: '2h (Mantenimiento preventivo)'
  },
  hr: {
    totalEmployees: 450,
    trainingHoursMonth: 120,
    absenteeismRate: 2.1
  },
  supplyChain: {
    rawMaterialStock: '85%',
    exportOrdersPending: 14,
    supplierCompliance: '98%'
  }
};
