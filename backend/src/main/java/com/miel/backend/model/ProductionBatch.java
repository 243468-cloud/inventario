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
@Table(name = "production_batches")
public class ProductionBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "presentation_id")
    private Integer presentationId;

    @Column(name = "quantity_produced", nullable = false)
    private Integer quantityProduced;

    @Column(name = "honey_used_kg", nullable = false)
    private BigDecimal honeyUsedKg;

    @Column(name = "production_date")
    private LocalDateTime productionDate;

    @PrePersist
    protected void onCreate() {
        productionDate = LocalDateTime.now();
    }
}
