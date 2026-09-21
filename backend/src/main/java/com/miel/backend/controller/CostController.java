package com.miel.backend.controller;

import com.miel.backend.model.RawMaterialCostHistory;
import com.miel.backend.repository.RawMaterialCostHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/costs")
@RequiredArgsConstructor
public class CostController {

    private final RawMaterialCostHistoryRepository costRepository;

    @GetMapping("/bulk-honey")
    public ResponseEntity<Map<String, Object>> getCurrentBulkHoneyCost() {
        List<RawMaterialCostHistory> history = costRepository.findAll(
            PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "effectiveDate"))
        ).getContent();
        
        BigDecimal currentCost = history.isEmpty() ? BigDecimal.ZERO : history.get(0).getCostPerKg();
        return ResponseEntity.ok(Map.of("cost_per_kg", currentCost));
    }

    @PostMapping("/bulk-honey")
    public ResponseEntity<RawMaterialCostHistory> updateBulkHoneyCost(@RequestBody Map<String, BigDecimal> body) {
        BigDecimal newCost = body.get("cost_per_kg");
        if (newCost == null) {
            return ResponseEntity.badRequest().build();
        }
        RawMaterialCostHistory newEntry = new RawMaterialCostHistory();
        newEntry.setCostPerKg(newCost);
        return ResponseEntity.ok(costRepository.save(newEntry));
    }
}
