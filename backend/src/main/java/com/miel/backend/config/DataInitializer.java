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
    private final SalePriceHistoryRepository salePriceHistoryRepository;

    @Override
    public void run(String... args) {
        try {
            log.info("Iniciando sincronización de inventario verificado (07 Octubre 2026)...");
            initBulkHoney();
            initPresentations();
            initInventoryItems();
            log.info("Sincronización de inventario completada con éxito.");
        } catch (Exception e) {
            log.error("Error durante DataInitializer: {}", e.getMessage(), e);
        }
    }

    private void initBulkHoney() {
        // 32 cubetas x 24.500 kg netos = 784.00 kg
        BigDecimal verifiedBulk = new BigDecimal("784.00");
        Optional<BulkHoneyInventory> bulkOpt = bulkHoneyInventoryRepository.findById(1);
        if (bulkOpt.isEmpty()) {
            BulkHoneyInventory bulk = new BulkHoneyInventory();
            bulk.setId(1);
            bulk.setCurrentStockKg(verifiedBulk);
            bulkHoneyInventoryRepository.save(bulk);
            log.info("Inicializado bulk_honey_inventory con {} kg", verifiedBulk);
        }
    }

    private void initPresentations() {
        record PresDef(int id, String name, double weight, double containerCost, int stock) {}
        List<PresDef> list = List.of(
            new PresDef(1,  "30 gr Miel normal",               30.00,   5.23, 0),
            new PresDef(2,  "30 gr Miel de melipona",          30.00,   5.23, 0),
            new PresDef(3,  "50 gr Miel normal",               50.00,   0.00, 0),
            new PresDef(4,  "50 gr Miel con limon",            50.00,   0.00, 0),
            new PresDef(5,  "50 gr Miel con gengibre",         50.00,   0.00, 0),
            new PresDef(6,  "50 gr Miel con Limon/gengibre",   50.00,   0.00, 0),
            new PresDef(7,  "330 gr Miel normal",              330.00,  14.17, 0),
            new PresDef(8,  "330 gr Miel con limon",           330.00,  14.17, 0),
            new PresDef(9,  "330 gr Miel con gengibre",        330.00,  14.17, 0),
            new PresDef(10, "330 gr Miel con Limon/gengibre",  330.00,  14.17, 0),
            new PresDef(11, "500 gr Miel normal",              500.00,  9.15, 0),
            new PresDef(12, "950 gr Miel normal",              950.00,  4.77, 25), // 25 piezas verificadas
            new PresDef(13, "950 gr Miel Agave",               950.00,  4.77, 15), // 15 piezas verificadas
            new PresDef(14, "5 kg Miel normal",                5000.00, 0.00, 3)   // 3 piezas verificadas
        );

        // Precios iniciales solicitados
        // id 12: 150, id 11: 80, id 7: 100, id 1: 100, id 2: 70, id 8: 120, id 9: 120, id 10: 120, id 14: 500
        java.util.Map<Integer, BigDecimal> initialPrices = java.util.Map.of(
            12, new BigDecimal("150.00"),
            11, new BigDecimal("80.00"),
            7,  new BigDecimal("100.00"),
            1,  new BigDecimal("100.00"),
            2,  new BigDecimal("70.00"),
            8,  new BigDecimal("120.00"),
            9,  new BigDecimal("120.00"),
            10, new BigDecimal("120.00"),
            14, new BigDecimal("500.00")
        );

        for (PresDef def : list) {
            boolean isNewP = !presentationRepository.existsById(def.id());
            Presentation p = presentationRepository.findById(def.id()).orElseGet(() -> {
                Presentation newP = new Presentation();
                newP.setId(def.id());
                return newP;
            });
            p.setName(def.name());
            p.setIsActive(true);
            if (p.getMinStock() == null) p.setMinStock(0);
            if (isNewP) {
                p.setWeightGrams(BigDecimal.valueOf(def.weight()));
                p.setContainerCost(BigDecimal.valueOf(def.containerCost()));
            }
            presentationRepository.save(p);

            // Asegurar registro de stock físico
            boolean isNewPs = !presentationStockRepository.existsById(def.id());
            PresentationStock ps = presentationStockRepository.findById(def.id()).orElseGet(() -> {
                PresentationStock newPs = new PresentationStock();
                newPs.setPresentationId(def.id());
                newPs.setEmptyStock(0);
                return newPs;
            });
            if (isNewPs) {
                ps.setCurrentStock(def.stock());
                presentationStockRepository.save(ps);
            }

            // Asegurar precio inicial
            if (initialPrices.containsKey(def.id())) {
                List<SalePriceHistory> history = salePriceHistoryRepository.findAll();
                boolean hasPrice = history.stream().anyMatch(h -> h.getPresentationId().equals(def.id()));
                if (!hasPrice) {
                    SalePriceHistory sph = new SalePriceHistory();
                    sph.setPresentationId(def.id());
                    sph.setSalePrice(initialPrices.get(def.id()));
                    sph.setEffectiveDate(java.time.LocalDateTime.now());
                    salePriceHistoryRepository.save(sph);
                }
            }
        }
    }

    private void initInventoryItems() {
        record ItemDef(String name, String category, String unit, double stock, double cost) {}
        List<ItemDef> items = List.of(
            // Envases
            new ItemDef("Frasco 30 gr (Caja c/48 pza)",          "CONTAINER", "PIECE", 3888, 5.23),
            new ItemDef("Frasco Hexagonal 330 gr (Caja c/12 pza)", "CONTAINER", "PIECE", 276,  14.17),
            new ItemDef("Botella Cristal 500 gr (Caja c/12 pza)", "CONTAINER", "PIECE", 156,  9.15), // 13 cajas = 156 pzas
            new ItemDef("Botella Licorera 950 gr (Paq c/136 pza)", "CONTAINER", "PIECE", 680,  4.77),
            new ItemDef("Mini Galón 5 kg",                       "CONTAINER", "PIECE", 120,  0.00),
            // Miel y Derivados
            new ItemDef("Cubeta Miel Pura",               "BULK_HONEY", "PIECE", 32,   0.00), // 32 cubetas (24.5 kg neto)
            new ItemDef("Galon Agave",                    "BULK_HONEY", "PIECE", 68.5, 0.00), // 68.5 galones (25 kg neto)
            new ItemDef("Panal",                          "BULK_HONEY", "PIECE", 0,    0.00),
            new ItemDef("Polen",                          "BULK_HONEY", "PIECE", 4,    0.00),
            new ItemDef("Cubeta Miel con Limon",          "BULK_HONEY", "PIECE", 4,    0.00),
            new ItemDef("Cubeta Miel con Limon y Gengibre","BULK_HONEY", "PIECE", 1,   0.00),
            new ItemDef("Cubeta Miel con Gengibre",       "BULK_HONEY", "PIECE", 2,    0.00),
            new ItemDef("Cubeta Miel con Polen",          "BULK_HONEY", "PIECE", 1,    0.00),
            // Quesos
            new ItemDef("Queso Ocosingo",          "CHEESE", "PIECE", 10, 0.00),
            new ItemDef("Queso Mantequilla",       "CHEESE", "PIECE", 9,  0.00),
            new ItemDef("Queso Excelsior",         "CHEESE", "PIECE", 1,  0.00),
            new ItemDef("Queso de Origen Vegetal", "CHEESE", "PIECE", 2,  0.00),
            // Extras
            new ItemDef("Vinagre",           "OTHER", "PIECE", 3,  0.00), // 3 litros
            new ItemDef("Granola",           "OTHER", "PIECE", 2,  0.00), // 2 bolsas (1 kg)
            new ItemDef("Xtabentún (1.5 L)", "OTHER", "PIECE", 11, 0.00)  // 11 unidades
        );

        for (ItemDef def : items) {
            boolean isNew = inventoryItemRepository.findByName(def.name()).isEmpty();
            InventoryItem item = inventoryItemRepository.findByName(def.name()).orElseGet(() -> {
                InventoryItem newItem = new InventoryItem();
                newItem.setName(def.name());
                newItem.setMinStock(BigDecimal.ZERO);
                return newItem;
            });
            item.setCategory(def.category());
            item.setUnit(def.unit());
            item.setIsActive(true);
            if (isNew) {
                item.setCurrentStock(BigDecimal.valueOf(def.stock()));
                item.setCostPerUnit(BigDecimal.valueOf(def.cost()));
            }
            inventoryItemRepository.save(item);
        }
    }
}
