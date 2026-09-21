package com.miel.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "recipe_items")
public class RecipeItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "presentation_id", nullable = false)
    private Integer presentationId;

    @Column(name = "inventory_item_id", nullable = false)
    private Integer inventoryItemId;

    @Column(name = "quantity_required", nullable = false)
    private BigDecimal quantityRequired;
}
