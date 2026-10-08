package com.miel.backend.controller;

import com.miel.backend.model.InventoryExit;
import com.miel.backend.model.InventoryItem;
import com.miel.backend.model.PurchaseEntry;
import com.miel.backend.model.StockMovement;
import com.miel.backend.repository.InventoryExitRepository;
import com.miel.backend.repository.InventoryItemRepository;
import com.miel.backend.repository.PurchaseEntryRepository;
import com.miel.backend.repository.RecipeItemRepository;
import com.miel.backend.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/almacen")
@RequiredArgsConstructor
public class AlmacenController {

    private final InventoryItemRepository inventoryItemRepository;
    private final PurchaseEntryRepository purchaseEntryRepository;
    private final InventoryExitRepository inventoryExitRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final StockMovementRepository stockMovementRepository;

    @GetMapping("/items")
    public ResponseEntity<List<InventoryItem>> getInventoryItems() {
        return ResponseEntity.ok(inventoryItemRepository.findAll());
    }

    @PostMapping("/items")
    public ResponseEntity<InventoryItem> createInventoryItem(@RequestBody InventoryItem item) {
        return inventoryItemRepository.findByName(item.getName())
            .map(existing -> {
                if (item.getCurrentStock() != null && item.getCurrentStock().compareTo(BigDecimal.ZERO) > 0) {
                    existing.setCurrentStock(existing.getCurrentStock().add(item.getCurrentStock()));
                }
                if (item.getCostPerUnit() != null && item.getCostPerUnit().compareTo(BigDecimal.ZERO) > 0) {
                    existing.setCostPerUnit(item.getCostPerUnit());
                }
                if (item.getMinStock() != null) {
                    existing.setMinStock(item.getMinStock());
                }
                existing.setIsActive(true);
                return ResponseEntity.ok(inventoryItemRepository.save(existing));
            })
            .orElseGet(() -> ResponseEntity.ok(inventoryItemRepository.save(item)));
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
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));
        
        item.setCurrentStock(item.getCurrentStock().add(entry.getTotalBaseQuantity()));
        inventoryItemRepository.save(item);
        PurchaseEntry saved = purchaseEntryRepository.save(entry);

        StockMovement mov = new StockMovement();
        mov.setItemType("INVENTORY_ITEM");
        mov.setMovementType("IN");
        mov.setQuantity(entry.getTotalBaseQuantity());
        mov.setReferenceType("COMPRA_ENTRADA");
        mov.setReferenceId(item.getId());
        stockMovementRepository.save(mov);

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/salidas")
    public ResponseEntity<InventoryExit> registerExit(@RequestBody InventoryExit exit) {
        InventoryItem item = inventoryItemRepository.findById(exit.getInventoryItemId())
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));

        if (exit.getTotalBaseQuantity() == null || exit.getTotalBaseQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }

        if (item.getCurrentStock().compareTo(exit.getTotalBaseQuantity()) < 0) {
            throw new RuntimeException(
                "Stock insuficiente en almacén. Disponible: " + item.getCurrentStock() + " " + item.getUnit() +
                ", solicitados: " + exit.getTotalBaseQuantity()
            );
        }

        item.setCurrentStock(item.getCurrentStock().subtract(exit.getTotalBaseQuantity()));
        inventoryItemRepository.save(item);

        InventoryExit saved = inventoryExitRepository.save(exit);

        StockMovement mov = new StockMovement();
        mov.setItemType("INVENTORY_ITEM");
        mov.setMovementType("OUT");
        mov.setQuantity(exit.getTotalBaseQuantity());
        String ref = exit.getReason() != null ? exit.getReason() : "SALIDA";
        if (exit.getNotes() != null && !exit.getNotes().isBlank()) {
            ref += " (" + exit.getNotes() + ")";
        }
        mov.setReferenceType(ref);
        mov.setReferenceId(item.getId());
        stockMovementRepository.save(mov);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/salidas")
    public ResponseEntity<List<Map<String, Object>>> getRecentExits() {
        List<InventoryExit> exits = inventoryExitRepository.findAllByOrderByExitDateDesc();
        List<Map<String, Object>> result = exits.stream().limit(50).map(e -> {
            String itemName = "Material #" + e.getInventoryItemId();
            var itemOpt = inventoryItemRepository.findById(e.getInventoryItemId());
            if (itemOpt.isPresent()) {
                itemName = itemOpt.get().getName();
            }
            return Map.<String, Object>of(
                "id", e.getId(),
                "inventoryItemId", e.getInventoryItemId(),
                "itemName", itemName,
                "formatType", e.getFormatType(),
                "formatQuantity", e.getFormatQuantity(),
                "totalBaseQuantity", e.getTotalBaseQuantity(),
                "reason", e.getReason(),
                "notes", e.getNotes() != null ? e.getNotes() : "",
                "exitDate", e.getExitDate() != null ? e.getExitDate().toString() : ""
            );
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
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
