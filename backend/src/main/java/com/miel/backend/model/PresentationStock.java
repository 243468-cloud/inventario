package com.miel.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "presentation_stock")
public class PresentationStock {
    @Id
    @Column(name = "presentation_id")
    private Integer presentationId;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock = 0;

    @Column(name = "empty_stock", nullable = false)
    private Integer emptyStock = 0;
}
