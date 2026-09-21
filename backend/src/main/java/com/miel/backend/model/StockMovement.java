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
@Table(name = "stock_movements")
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "item_type", nullable = false)
    private String itemType;

    @Column(name = "presentation_id")
    private Integer presentationId;

    @Column(name = "movement_type", nullable = false)
    private String movementType;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "reference_type", nullable = false)
    private String referenceType;

    @Column(name = "reference_id")
    private Integer referenceId;

    @Column(name = "movement_date")
    private LocalDateTime movementDate;

    @PrePersist
    protected void onCreate() {
        movementDate = LocalDateTime.now();
    }
}
