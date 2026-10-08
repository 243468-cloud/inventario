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
import com.miel.backend.model.SalePriceHistory;
import com.miel.backend.repository.SalePriceHistoryRepository;

@RestController
@RequestMapping("/api/presentations")
@RequiredArgsConstructor
public class PresentationController {

    private final PresentationRepository presentationRepository;
    private final PresentationStockRepository presentationStockRepository;
    private final SalePriceHistoryRepository salePriceHistoryRepository;

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
                if (update.getWeightGrams() != null) {
                    presentation.setWeightGrams(update.getWeightGrams());
                }
                if (update.getMinStock() != null) {
                    presentation.setMinStock(update.getMinStock());
                }
                return ResponseEntity.ok(presentationRepository.save(presentation));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Actualizar el stock actual (frascos llenos) forzosamente */
    @PutMapping("/{id}/stock")
    public ResponseEntity<Map<String, Object>> updateStock(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body) {
        int currentStock = body.getOrDefault("current_stock", 0);
        PresentationStock stock = presentationStockRepository.findById(id)
            .orElseGet(() -> {
                PresentationStock s = new PresentationStock();
                s.setPresentationId(id);
                s.setCurrentStock(0);
                s.setEmptyStock(0);
                return s;
            });
        stock.setCurrentStock(currentStock);
        presentationStockRepository.save(stock);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("presentation_id", id);
        result.put("current_stock", currentStock);
        return ResponseEntity.ok(result);
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

    /** Agregar un nuevo registro de precio de venta */
    @PostMapping("/{id}/sale-price")
    public ResponseEntity<SalePriceHistory> addSalePrice(
            @PathVariable Integer id,
            @RequestBody Map<String, java.math.BigDecimal> body) {
        java.math.BigDecimal price = body.get("sale_price");
        if (price == null) {
            return ResponseEntity.badRequest().build();
        }
        SalePriceHistory sph = new SalePriceHistory();
        sph.setPresentationId(id);
        sph.setSalePrice(price);
        sph.setEffectiveDate(java.time.LocalDateTime.now());
        return ResponseEntity.ok(salePriceHistoryRepository.save(sph));
    }
}
