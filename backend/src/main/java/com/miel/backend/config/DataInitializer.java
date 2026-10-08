package com.miel.backend.config;

import com.miel.backend.model.*;
import com.miel.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PresentationRepository presentationRepository;
    private final PresentationStockRepository presentationStockRepository;
    private final BulkHoneyInventoryRepository bulkHoneyInventoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Override
    public void run(String... args) {
        try {
            log.info("Iniciando verificación y carga automática de productos e inventario...");
            initBulkHoney();
            initPresentations();
            initInventoryItems();
            log.info("Verificación de productos e inventario completada con éxito.");
        } catch (Exception e) {
            log.error("Error durante DataInitializer: {}", e.getMessage(), e);
        }
    }

    private void initBulkHoney() {
        Optional<BulkHoneyInventory> bulkOpt = bulkHoneyInventoryRepository.findById(1);
        if (bulkOpt.isEmpty()) {
            BulkHoneyInventory bulk = new BulkHoneyInventory();
            bulk.setId(1);
            bulk.setCurrentStockKg(new BigDecimal("864.00"));
            bulkHoneyInventoryRepository.save(bulk);
            log.info("Inicializado bulk_honey_inventory con 864.00 kg");
        } else if (bulkOpt.get().getCurrentStockKg().compareTo(BigDecimal.ZERO) <= 0) {
            BulkHoneyInventory bulk = bulkOpt.get();
            bulk.setCurrentStockKg(new BigDecimal("864.00"));
            bulkHoneyInventoryRepository.save(bulk);
            log.info("Actualizado bulk_honey_inventory a 864.00 kg");
        }
    }

    private void initPresentations() {
        record PresDef(int id, String name, double weight, double containerCost) {}
        List<PresDef> list = List.of(
            new PresDef(1,  "30 gr Miel normal",               30.00,   5.23),
            new PresDef(2,  "30 gr Miel de melipona",          30.00,   5.23),
            new PresDef(3,  "50 gr Miel normal",               50.00,   0.00),
            new PresDef(4,  "50 gr Miel con limon",            50.00,   0.00),
            new PresDef(5,  "50 gr Miel con gengibre",         50.00,   0.00),
            new PresDef(6,  "50 gr Miel con Limon/gengibre",   50.00,   0.00),
            new PresDef(7,  "330 gr Miel normal",              330.00,  14.17),
            new PresDef(8,  "330 gr Miel con limon",           330.00,  14.17),
            new PresDef(9,  "330 gr Miel con gengibre",        330.00,  14.17),
            new PresDef(10, "330 gr Miel con Limon/gengibre",  330.00,  14.17),
            new PresDef(11, "500 gr Miel normal",              500.00,  9.15),
            new PresDef(12, "950 gr Miel normal",              950.00,  4.77),
            new PresDef(13, "950 gr Miel Agave",               950.00,  4.77),
            new PresDef(14, "5 kg Miel normal",                5000.00, 0.00)
        );

        for (PresDef def : list) {
            Optional<Presentation> existing = presentationRepository.findById(def.id());
            if (existing.isEmpty()) {
                Presentation p = new Presentation();
                p.setId(def.id());
                p.setName(def.name());
                p.setWeightGrams(BigDecimal.valueOf(def.weight()));
                p.setIsActive(true);
                p.setMinStock(0);
                p.setContainerCost(BigDecimal.valueOf(def.containerCost()));
                presentationRepository.save(p);
                log.info("Creada presentación: {}", def.name());
            } else {
                Presentation p = existing.get();
                p.setName(def.name());
                p.setWeightGrams(BigDecimal.valueOf(def.weight()));
                p.setContainerCost(BigDecimal.valueOf(def.containerCost()));
                p.setIsActive(true);
                presentationRepository.save(p);
            }

            // Asegurar registro de stock
            if (presentationStockRepository.findById(def.id()).isEmpty()) {
                PresentationStock ps = new PresentationStock();
                ps.setPresentationId(def.id());
                ps.setCurrentStock(0);
                ps.setEmptyStock(0);
                presentationStockRepository.save(ps);
            }
        }
    }

    private void initInventoryItems() {
        record ItemDef(String name, String category, String unit, double stock, double cost) {}
        List<ItemDef> items = List.of(
            // Envases
            new ItemDef("Frasco 30 gr (Caja c/48 pza)",          "CONTAINER", "PIECE", 3888, 5.23),
            new ItemDef("Frasco Hexagonal 330 gr (Caja c/12 pza)", "CONTAINER", "PIECE", 276,  14.17),
            new ItemDef("Botella Cristal 500 gr (Caja c/12 pza)", "CONTAINER", "PIECE", 180,  9.15),
            new ItemDef("Botella Licorera 950 gr (Paq c/136 pza)", "CONTAINER", "PIECE", 680,  4.77),
            new ItemDef("Mini Galón 5 kg",                       "CONTAINER", "PIECE", 120,  0.00),
            // Miel y Derivados
            new ItemDef("Panal",                    "BULK_HONEY", "PIECE", 0,    0.00),
            new ItemDef("Polen",                    "BULK_HONEY", "PIECE", 4,    0.00),
            new ItemDef("Cubeta Miel Pura",         "BULK_HONEY", "PIECE", 32,   0.00),
            new ItemDef("Galon Agave",              "BULK_HONEY", "PIECE", 68.5, 0.00),
            new ItemDef("Cubeta Miel con Limon",    "BULK_HONEY", "PIECE", 4,    0.00),
            new ItemDef("Cubeta Miel con Gengibre", "BULK_HONEY", "PIECE", 2,    0.00),
            new ItemDef("Cubeta Miel Exportacion",  "BULK_HONEY", "PIECE", 24,   0.00),
            new ItemDef("Cubeta Miel con Polen",    "BULK_HONEY", "PIECE", 3,    0.00),
            // Quesos
            new ItemDef("Queso Ocosingo",          "CHEESE", "PIECE", 10, 0.00),
            new ItemDef("Queso Excelsior",         "CHEESE", "PIECE", 1,  0.00),
            new ItemDef("Queso de Origen Vegetal", "CHEESE", "PIECE", 2,  0.00),
            new ItemDef("Queso Mantequilla",       "CHEESE", "PIECE", 9,  0.00),
            // Extras
            new ItemDef("Vinagre",    "OTHER", "PIECE", 2,  0.00),
            new ItemDef("Granola",    "OTHER", "PIECE", 0,  0.00),
            new ItemDef("San Marino", "OTHER", "PIECE", 11, 0.00)
        );

        for (ItemDef def : items) {
            Optional<InventoryItem> existing = inventoryItemRepository.findByName(def.name());
            if (existing.isEmpty()) {
                InventoryItem item = new InventoryItem();
                item.setName(def.name());
                item.setCategory(def.category());
                item.setUnit(def.unit());
                item.setCurrentStock(BigDecimal.valueOf(def.stock()));
                item.setCostPerUnit(BigDecimal.valueOf(def.cost()));
                item.setMinStock(BigDecimal.ZERO);
                item.setIsActive(true);
                inventoryItemRepository.save(item);
                log.info("Creado material de almacén: {}", def.name());
            }
        }
    }
}
