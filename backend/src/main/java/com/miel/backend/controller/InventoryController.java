package com.miel.backend.controller;

import com.miel.backend.model.InventoryItem;
import com.miel.backend.model.Presentation;
import com.miel.backend.model.RealTimeInventoryDTO;
import com.miel.backend.model.StockMovement;
import com.miel.backend.repository.InventoryItemRepository;
import com.miel.backend.repository.PresentationRepository;
import com.miel.backend.repository.StockMovementRepository;
import com.miel.backend.service.InventoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final StockMovementRepository stockMovementRepository;
    private final PresentationRepository presentationRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @GetMapping("/real-time")
    public ResponseEntity<List<RealTimeInventoryDTO>> getRealTimeInventory() {
        return ResponseEntity.ok(inventoryService.getRealTimeInventory());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        List<StockMovement> movements = stockMovementRepository.findAll(
            PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "movementDate"))
        ).getContent();

        List<Map<String, Object>> result = movements.stream().map(m -> {
            String itemName = "Miel a Granel";
            if (m.getPresentationId() != null) {
                Optional<Presentation> p = presentationRepository.findById(m.getPresentationId());
                if (p.isPresent()) itemName = p.get().getName();
            } else if ("INVENTORY_ITEM".equals(m.getItemType()) && m.getReferenceId() != null) {
                Optional<InventoryItem> item = inventoryItemRepository.findById(m.getReferenceId());
                if (item.isPresent()) itemName = item.get().getName();
            }
            return Map.<String, Object>of(
                "id", m.getId(),
                "itemType", m.getItemType(),
                "presentationName", itemName,
                "movementType", m.getMovementType(),
                "quantity", m.getQuantity(),
                "referenceType", m.getReferenceType(),
                "movementDate", m.getMovementDate() != null ? m.getMovementDate().toString() : ""
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/salidas")
    public ResponseEntity<List<Map<String, Object>>> getSalidas() {
        List<StockMovement> movements = stockMovementRepository.findAll(
            PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "movementDate"))
        ).getContent();

        List<Map<String, Object>> salidas = movements.stream()
            .filter(m -> "OUT".equalsIgnoreCase(m.getMovementType()))
            .map(m -> {
                String itemName = "Miel a Granel";
                String category = "Granel";
                if (m.getPresentationId() != null) {
                    Optional<Presentation> p = presentationRepository.findById(m.getPresentationId());
                    if (p.isPresent()) {
                        itemName = p.get().getName();
                        category = "Producto Terminado";
                    }
                } else if ("INVENTORY_ITEM".equals(m.getItemType()) && m.getReferenceId() != null) {
                    Optional<InventoryItem> item = inventoryItemRepository.findById(m.getReferenceId());
                    if (item.isPresent()) {
                        itemName = item.get().getName();
                        category = item.get().getCategory();
                    }
                }
                return Map.<String, Object>of(
                    "id", m.getId(),
                    "itemType", m.getItemType(),
                    "category", category,
                    "name", itemName,
                    "movementType", m.getMovementType(),
                    "quantity", m.getQuantity(),
                    "referenceType", m.getReferenceType(),
                    "movementDate", m.getMovementDate() != null ? m.getMovementDate().toString() : ""
                );
            }).collect(Collectors.toList());

        return ResponseEntity.ok(salidas);
    }

    @PostMapping("/production-batch")
    public ResponseEntity<Void> registerProductionBatch(@Valid @RequestBody ProductionBatchRequest request) {
        inventoryService.registerProductionBatch(request.getP_presentation_id(), request.getP_quantity_produced());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/presentation-exit")
    public ResponseEntity<Map<String, String>> registerPresentationExit(@Valid @RequestBody PresentationMovementRequest request) {
        inventoryService.registerPresentationExit(
            request.getPresentationId(),
            request.getQuantity(),
            request.getReason(),
            request.getNotes()
        );
        return ResponseEntity.ok(Map.of("message", "Salida de producto registrada exitosamente"));
    }

    @PostMapping("/presentation-entry")
    public ResponseEntity<Map<String, String>> registerPresentationEntry(@Valid @RequestBody PresentationMovementRequest request) {
        inventoryService.registerPresentationEntry(
            request.getPresentationId(),
            request.getQuantity(),
            request.getReason(),
            request.getNotes()
        );
        return ResponseEntity.ok(Map.of("message", "Entrada de producto registrada exitosamente"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @Data
    public static class ProductionBatchRequest {
        @NotNull(message = "La presentación es obligatoria")
        private Integer p_presentation_id;

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser mayor a 0")
        private Integer p_quantity_produced;
    }

    @Data
    public static class PresentationMovementRequest {
        @NotNull(message = "La presentación es obligatoria")
        private Integer presentationId;

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser mayor a 0")
        private Integer quantity;

        private String reason; // VENTA, MERMA, MUESTRA, OBSEQUIO, AJUSTE
        private String notes;
    }
}
