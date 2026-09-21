package com.miel.backend.controller;

import com.miel.backend.model.InventoryItem;
import com.miel.backend.model.PurchaseEntry;
import com.miel.backend.repository.InventoryItemRepository;
import com.miel.backend.repository.PurchaseEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/almacen")
@RequiredArgsConstructor
public class AlmacenController {

    private final InventoryItemRepository inventoryItemRepository;
    private final PurchaseEntryRepository purchaseEntryRepository;
    private final com.miel.backend.repository.RecipeItemRepository recipeItemRepository;

    @GetMapping("/items")
    public ResponseEntity<List<InventoryItem>> getInventoryItems() {
        return ResponseEntity.ok(inventoryItemRepository.findAll());
    }

    @PostMapping("/items")
    public ResponseEntity<InventoryItem> createInventoryItem(@RequestBody InventoryItem item) {
        return ResponseEntity.ok(inventoryItemRepository.save(item));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<InventoryItem> updateInventoryItem(@PathVariable Integer id, @RequestBody InventoryItem update) {
        return inventoryItemRepository.findById(id)
            .map(item -> {
                if (update.getName() != null) item.setName(update.getName());
                if (update.getCategory() != null) item.setCategory(update.getCategory());
                if (update.getUnit() != null) item.setUnit(update.getUnit());
                if (update.getMinStock() != null) item.setMinStock(update.getMinStock());
                if (update.getCostPerUnit() != null) item.setCostPerUnit(update.getCostPerUnit());
                if (update.getIsActive() != null) item.setIsActive(update.getIsActive());
                return ResponseEntity.ok(inventoryItemRepository.save(item));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/entradas")
    public ResponseEntity<PurchaseEntry> registerEntry(@RequestBody PurchaseEntry entry) {
        InventoryItem item = inventoryItemRepository.findById(entry.getInventoryItemId())
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));
        item.setCurrentStock(item.getCurrentStock().add(entry.getTotalBaseQuantity()));
        inventoryItemRepository.save(item);
        return ResponseEntity.ok(purchaseEntryRepository.save(entry));
    }

    @PostMapping("/recipes")
    public ResponseEntity<com.miel.backend.model.RecipeItem> createRecipeItem(@RequestBody com.miel.backend.model.RecipeItem item) {
        return ResponseEntity.ok(recipeItemRepository.save(item));
    }

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @PostMapping("/cleanup")
    public ResponseEntity<String> cleanupDb() {
        jdbcTemplate.execute("DELETE FROM presentation_stock WHERE presentation_id IN (1,2,3,4)");
        jdbcTemplate.execute("DELETE FROM sale_price_history WHERE presentation_id IN (1,2,3,4)");
        jdbcTemplate.execute("DELETE FROM stock_movements WHERE presentation_id IN (1,2,3,4)");
        jdbcTemplate.execute("DELETE FROM recipe_items WHERE presentation_id IN (1,2,3,4)");
        jdbcTemplate.execute("DELETE FROM production_batches WHERE presentation_id IN (1,2,3,4)");
        jdbcTemplate.execute("DELETE FROM presentations WHERE id IN (1,2,3,4)");

        jdbcTemplate.execute("UPDATE inventory_items SET name = 'Hexagonal 12/260' WHERE name = 'Envase 330g'");
        jdbcTemplate.execute("UPDATE inventory_items SET name = 'Frasco 48/1 OZ' WHERE name = 'Envase 30g'");
        jdbcTemplate.execute("UPDATE inventory_items SET name = 'Botella 12/360' WHERE name = 'Envase 950g'");

        return ResponseEntity.ok("OK");
    }
}
