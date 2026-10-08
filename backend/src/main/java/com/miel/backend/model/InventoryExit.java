package com.miel.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "inventory_exits")
public class InventoryExit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "inventory_item_id", nullable = false)
    private Integer inventoryItemId;

    @Column(name = "format_type", nullable = false)
    private String formatType; // 'PIEZA', 'KILO', 'CUBETA', 'GALON'

    @Column(name = "format_quantity", nullable = false)
    private BigDecimal formatQuantity;

    @Column(name = "total_base_quantity", nullable = false)
    private BigDecimal totalBaseQuantity;

    @Column(name = "reason", nullable = false)
    private String reason; // 'VENTA_DIRECTA', 'MERMA', 'CONSUMO_INTERNO', 'AJUSTE'

    @Column(name = "notes")
    private String notes;

    @Column(name = "exit_date", nullable = false)
    private LocalDateTime exitDate = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (exitDate == null) {
            exitDate = LocalDateTime.now();
        }
    }
}
