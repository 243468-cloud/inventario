package com.miel.backend.service;

import com.miel.backend.model.*;
import com.miel.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {
    
    private final PresentationRepository presentationRepository;
    private final ProductionBatchRepository batchRepository;
    private final BulkHoneyInventoryRepository bulkRepository;
    private final StockMovementRepository movementRepository;
    private final PresentationStockRepository stockRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<RealTimeInventoryDTO> getRealTimeInventory() {
        String sql = """
            SELECT 
                p.id AS presentation_id,
                p.name AS presentation_name,
                p.weight_grams,
                p.min_stock,
                COALESCE(ps.current_stock, 0) AS stock_actual,
                (COALESCE(chc.cost_per_kg, 0) / 1000.0) AS costo_por_gramo,
                (COALESCE(chc.cost_per_kg, 0) * (p.weight_grams / 1000.0)) AS costo_unitario,
                COALESCE(cp.sale_price, 0) AS precio_venta_vigente,
                (COALESCE(ps.current_stock, 0) * COALESCE(cp.sale_price, 0)) AS valor_total_stock,
                CASE 
                    WHEN COALESCE(ps.current_stock, 0) < p.min_stock THEN true 
                    ELSE false 
                END as low_stock_alert
            FROM presentations p
            LEFT JOIN presentation_stock ps ON p.id = ps.presentation_id
            LEFT JOIN (
                SELECT sph.presentation_id, sph.sale_price
                FROM sale_price_history sph
                INNER JOIN (
                    SELECT presentation_id, MAX(effective_date) as max_date
                    FROM sale_price_history
                    GROUP BY presentation_id
                ) max_sph ON sph.presentation_id = max_sph.presentation_id AND sph.effective_date = max_sph.max_date
            ) cp ON p.id = cp.presentation_id
            CROSS JOIN (
                SELECT * FROM (
                    SELECT cost_per_kg FROM raw_material_cost_history ORDER BY effective_date DESC LIMIT 1
                ) sub1
                UNION ALL SELECT 0 LIMIT 1
            ) chc
            WHERE p.is_active = true
        """;
        
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            RealTimeInventoryDTO dto = new RealTimeInventoryDTO();
            dto.setPresentation_id(rs.getInt("presentation_id"));
            dto.setPresentation_name(rs.getString("presentation_name"));
            dto.setWeight_grams(rs.getBigDecimal("weight_grams"));
            dto.setMin_stock(rs.getInt("min_stock"));
            dto.setStock_actual(rs.getInt("stock_actual"));
            dto.setCosto_por_gramo(rs.getBigDecimal("costo_por_gramo"));
            dto.setCosto_unitario(rs.getBigDecimal("costo_unitario"));
            dto.setPrecio_venta_vigente(rs.getBigDecimal("precio_venta_vigente"));
            dto.setValor_total_stock(rs.getBigDecimal("valor_total_stock"));
            dto.setLow_stock_alert(rs.getBoolean("low_stock_alert"));
            return dto;
        });
    }

    @Transactional
    public void registerProductionBatch(Integer presentationId, Integer quantityProduced) {
        Presentation presentation = presentationRepository.findById(presentationId)
                .orElseThrow(() -> new RuntimeException("Presentación no encontrada"));
        
        if (!presentation.getIsActive()) {
            throw new RuntimeException("La presentación está inactiva");
        }

        BigDecimal honeyUsedKg = presentation.getWeightGrams()
                .multiply(new BigDecimal(quantityProduced))
                .divide(new BigDecimal("1000"));

        ProductionBatch batch = new ProductionBatch();
        batch.setPresentationId(presentationId);
        batch.setQuantityProduced(quantityProduced);
        batch.setHoneyUsedKg(honeyUsedKg);
        batch = batchRepository.save(batch);

        BulkHoneyInventory bulk = bulkRepository.findById(1)
                .orElseThrow(() -> new RuntimeException("Inventario a granel no encontrado"));

        if (bulk.getCurrentStockKg().compareTo(honeyUsedKg) < 0) {
            throw new RuntimeException(
                "Stock insuficiente. Se necesitan " + honeyUsedKg + " kg pero solo hay " +
                bulk.getCurrentStockKg() + " kg disponibles."
            );
        }

        bulk.setCurrentStockKg(bulk.getCurrentStockKg().subtract(honeyUsedKg));
        bulkRepository.save(bulk);

        StockMovement bulkOut = new StockMovement();
        bulkOut.setItemType("BULK_HONEY");
        bulkOut.setMovementType("OUT");
        bulkOut.setQuantity(honeyUsedKg);
        bulkOut.setReferenceType("PRODUCTION_BATCH");
        bulkOut.setReferenceId(batch.getId());
        movementRepository.save(bulkOut);

        PresentationStock stock = stockRepository.findById(presentationId).orElse(null);
        if (stock == null) {
            stock = new PresentationStock();
            stock.setPresentationId(presentationId);
            stock.setCurrentStock(quantityProduced);
        } else {
            stock.setCurrentStock(stock.getCurrentStock() + quantityProduced);
        }
        stockRepository.save(stock);

        StockMovement presentationIn = new StockMovement();
        presentationIn.setItemType("PRESENTATION");
        presentationIn.setPresentationId(presentationId);
        presentationIn.setMovementType("IN");
        presentationIn.setQuantity(new BigDecimal(quantityProduced));
        presentationIn.setReferenceType("PRODUCTION_BATCH");
        presentationIn.setReferenceId(batch.getId());
        movementRepository.save(presentationIn);
    }
}
