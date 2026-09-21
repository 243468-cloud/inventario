export interface Presentacion {
  id: number;
  name: string;
  weightGrams: number;
  isActive: boolean;
  minStock: number;
  containerCost?: number;
}

export interface InventoryItem {
  presentation_id: number;
  presentation_name: string;
  weight_grams: number;
  min_stock: number;
  stock_actual: number;
  costo_por_gramo: number;
  costo_unitario: number;
  precio_venta_vigente: number;
  valor_total_stock: number;
  low_stock_alert: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  role: string;
}
