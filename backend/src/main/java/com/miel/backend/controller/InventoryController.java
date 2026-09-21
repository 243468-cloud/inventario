package com.miel.backend.controller;

import com.miel.backend.model.RealTimeInventoryDTO;
import com.miel.backend.model.StockMovement;
import com.miel.backend.model.Presentation;
import com.miel.backend.repository.PresentationRepository;
import com.miel.backend.repository.StockMovementRepository;
import com.miel.backend.service.InventoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

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
            String presentationName = "Miel a Granel";
            if (m.getPresentationId() != null) {
                Optional<Presentation> p = presentationRepository.findById(m.getPresentationId());
                if (p.isPresent()) presentationName = p.get().getName();
            }
            return Map.<String, Object>of(
                "id", m.getId(),
                "itemType", m.getItemType(),
                "presentationName", presentationName,
                "movementType", m.getMovementType(),
                "quantity", m.getQuantity(),
                "referenceType", m.getReferenceType(),
                "movementDate", m.getMovementDate() != null ? m.getMovementDate().toString() : ""
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/production-batch")
    public ResponseEntity<Void> registerProductionBatch(@Valid @RequestBody ProductionBatchRequest request) {
        inventoryService.registerProductionBatch(request.getP_presentation_id(), request.getP_quantity_produced());
        return ResponseEntity.ok().build();
    }

    @Data
    public static class ProductionBatchRequest {
        @NotNull(message = "La presentación es obligatoria")
        private Integer p_presentation_id;

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser mayor a 0")
        private Integer p_quantity_produced;
    }
}
