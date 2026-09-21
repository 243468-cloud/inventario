package com.miel.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "purchase_entries")
public class PurchaseEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "inventory_item_id", nullable = false)
    private Integer inventoryItemId;

    @Column(name = "format_type", nullable = false)
    private String formatType; // 'CUBETA', 'GALON', 'KILO', 'PIEZA'

    @Column(name = "format_quantity", nullable = false)
    private BigDecimal formatQuantity;

    @Column(name = "total_base_quantity", nullable = false)
    private BigDecimal totalBaseQuantity;

    @Column(name = "entry_date", nullable = false)
    private LocalDateTime entryDate = LocalDateTime.now();
}
