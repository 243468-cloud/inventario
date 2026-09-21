package com.miel.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // 'CONTAINER', 'BULK_HONEY', 'DEHYDRATED'

    @Column(nullable = false)
    private String unit; // 'PIECE', 'KG', 'GRAM'

    @Column(nullable = false)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal costPerUnit = BigDecimal.ZERO;

    @Column(name = "min_stock", nullable = false)
    private BigDecimal minStock = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
