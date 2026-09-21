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
@Table(name = "raw_material_cost_history")
public class RawMaterialCostHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cost_per_kg", nullable = false)
    private BigDecimal costPerKg;

    @Column(name = "effective_date")
    private LocalDateTime effectiveDate;

    @PrePersist
    protected void onCreate() {
        effectiveDate = LocalDateTime.now();
    }
}
