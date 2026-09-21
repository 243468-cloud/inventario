package com.miel.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RealTimeInventoryDTO {
    private Integer presentation_id;
    private String presentation_name;
    private BigDecimal weight_grams;
    private Integer min_stock;
    private Integer stock_actual;
    private BigDecimal costo_por_gramo;
    private BigDecimal costo_unitario;
    private BigDecimal precio_venta_vigente;
    private BigDecimal valor_total_stock;
    private Boolean low_stock_alert;
}
