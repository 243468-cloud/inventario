package com.miel.backend.controller;

import com.miel.backend.model.Presentation;
import com.miel.backend.model.PresentationStock;
import com.miel.backend.repository.PresentationRepository;
import com.miel.backend.repository.PresentationStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presentations")
@RequiredArgsConstructor
public class PresentationController {

    private final PresentationRepository presentationRepository;
    private final PresentationStockRepository presentationStockRepository;

    @GetMapping
    public ResponseEntity<List<Presentation>> getPresentations(@RequestParam(required = false) String is_active) {
        if ("eq.true".equals(is_active)) {
            return ResponseEntity.ok(presentationRepository.findByIsActiveTrue());
        }
        return ResponseEntity.ok(presentationRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Presentation> createPresentation(@Valid @RequestBody Presentation presentation) {
        if (presentation.getIsActive() == null) {
            presentation.setIsActive(true);
        }
        if (presentation.getMinStock() == null) {
            presentation.setMinStock(0);
        }
        if (presentation.getContainerCost() == null) {
            presentation.setContainerCost(java.math.BigDecimal.ZERO);
        }
        return ResponseEntity.ok(presentationRepository.save(presentation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Presentation> updatePresentation(@PathVariable Integer id, @RequestBody Presentation update) {
        return presentationRepository.findById(id)
            .map(presentation -> {
                if (update.getContainerCost() != null) {
                    presentation.setContainerCost(update.getContainerCost());
                }
                if (update.getName() != null) {
                    presentation.setName(update.getName());
                }
                if (update.getMinStock() != null) {
                    presentation.setMinStock(update.getMinStock());
                }
                // we can update more fields if needed
                return ResponseEntity.ok(presentationRepository.save(presentation));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Obtener el stock de envases vacíos de una presentación */
    @GetMapping("/{id}/empty-stock")
    public ResponseEntity<Map<String, Object>> getEmptyStock(@PathVariable Integer id) {
        int emptyStock = presentationStockRepository.findById(id)
            .map(s -> s.getEmptyStock() != null ? s.getEmptyStock() : 0)
            .orElse(0);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("presentation_id", id);
        result.put("empty_stock", emptyStock);
        return ResponseEntity.ok(result);
    }

    /** Actualizar el stock de envases vacíos de una presentación */
    @PutMapping("/{id}/empty-stock")
    public ResponseEntity<Map<String, Object>> updateEmptyStock(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body) {
        int emptyCount = body.getOrDefault("empty_stock", 0);
        PresentationStock stock = presentationStockRepository.findById(id)
            .orElseGet(() -> {
                PresentationStock s = new PresentationStock();
                s.setPresentationId(id);
                s.setCurrentStock(0);
                s.setEmptyStock(0);
                return s;
            });
        stock.setEmptyStock(emptyCount);
        presentationStockRepository.save(stock);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("presentation_id", id);
        result.put("empty_stock", emptyCount);
        return ResponseEntity.ok(result);
    }
}
