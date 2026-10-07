package com.miel.backend.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.lowagie.text.Document;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class ReportService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private com.miel.backend.repository.InventoryItemRepository inventoryItemRepository;

    public Map<String, Object> getSummaryReport() {
        String sql = "SELECT " +
                "COUNT(p.id) as total_presentaciones, " +
                "COALESCE(SUM(ps.current_stock), 0) as total_envases_stock, " +
                "COALESCE((SELECT current_stock_kg FROM bulk_honey_inventory LIMIT 1), 0) as miel_granel_kg, " +
                "COALESCE(SUM(ps.current_stock * cp.sale_price), 0) as valor_proyectado_venta " +
                "FROM presentations p " +
                "LEFT JOIN presentation_stock ps ON p.id = ps.presentation_id " +
                "LEFT JOIN (SELECT sph.presentation_id, sph.sale_price FROM sale_price_history sph INNER JOIN (SELECT presentation_id, MAX(effective_date) as max_date FROM sale_price_history GROUP BY presentation_id) max_sph ON sph.presentation_id = max_sph.presentation_id AND sph.effective_date = max_sph.max_date) cp ON p.id = cp.presentation_id " +
                "WHERE p.is_active = true AND p.name != 'Test Presentation'";

        return jdbcTemplate.queryForMap(sql);
    }

    // 1 cubeta estándar de miel ≈ 27 kg
    private static final double KG_POR_CUBETA = 27.0;

    public List<Map<String, Object>> getContainerAnalysis() {
        String sql = "SELECT " +
                "p.id, " +
                "p.name AS nombre, " +
                "p.weight_grams AS peso_gramos, " +
                "COALESCE(ps.current_stock, 0) AS envases_llenos, " +
                "COALESCE(ps.empty_stock, 0) AS envases_vacios, " +
                "ROUND(COALESCE(ps.current_stock, 0) * p.weight_grams / 1000.0, 3) AS miel_usada_kg, " +
                "GREATEST(COALESCE((SELECT current_stock_kg FROM bulk_honey_inventory LIMIT 1), 0), 0) AS miel_disponible_kg, " +
                "GREATEST(FLOOR(GREATEST(COALESCE((SELECT current_stock_kg FROM bulk_honey_inventory LIMIT 1), 0), 0) * 1000 / p.weight_grams), 0) AS envases_posibles " +
                "FROM presentations p " +
                "LEFT JOIN presentation_stock ps ON p.id = ps.presentation_id " +
                "WHERE p.is_active = true AND p.name != 'Test Presentation' " +
                "ORDER BY p.weight_grams DESC";
        return jdbcTemplate.queryForList(sql);
    }

    private String formatCategory(String category) {
        if (category == null) return "Otro";
        switch (category) {
            case "BULK_HONEY": return "Miel y Derivados";
            case "CONTAINER": return "Envases Vacíos";
            case "CHEESE": return "Quesos";
            case "OTHER": return "Extras";
            case "DEHYDRATED": return "Deshidratados";
            default: return category;
        }
    }

    private String formatUnit(String unit) {
        if (unit == null) return "Piezas";
        switch (unit) {
            case "PIECE": return "Piezas";
            case "KG": return "Kilogramos";
            case "GRAM": return "Gramos";
            default: return unit;
        }
    }

    public ByteArrayInputStream exportInventoryToExcel() throws IOException {
        List<com.miel.backend.model.InventoryItem> rawItems = inventoryItemRepository.findAll();
        List<com.miel.backend.model.RealTimeInventoryDTO> inventoryList = inventoryService.getRealTimeInventory();
        Map<String, Object> summary = getSummaryReport();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // ── HOJA 1: Inventario de Almacén (Materia Prima, Envases, Quesos, Extras) ──
            Sheet sheetAlmacen = workbook.createSheet("Almacén e Inventario Físico");
            int rAlm = 0;

            // Encabezado de la hoja de almacén
            Font hFontAlm = workbook.createFont();
            hFontAlm.setBold(true);
            hFontAlm.setColor(IndexedColors.WHITE.getIndex());
            CellStyle hStyleAlm = workbook.createCellStyle();
            hStyleAlm.setFont(hFontAlm);
            hStyleAlm.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
            hStyleAlm.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] colsAlm = {"ID", "Nombre de Producto", "Categoría", "Unidad", "Stock Actual", "Costo Unitario ($)", "Valor Total ($)", "Stock Mínimo", "Alerta Stock"};
            Row hRowAlm = sheetAlmacen.createRow(rAlm++);
            for (int c = 0; c < colsAlm.length; c++) {
                Cell cell = hRowAlm.createCell(c);
                cell.setCellValue(colsAlm[c]);
                cell.setCellStyle(hStyleAlm);
            }

            double totalAlmacenValue = 0;
            // Sort items by category for grouping
            java.util.List<com.miel.backend.model.InventoryItem> sortedItems = rawItems.stream()
                .sorted(java.util.Comparator.comparing(com.miel.backend.model.InventoryItem::getCategory))
                .collect(java.util.stream.Collectors.toList());

            // Category header style
            CellStyle catHeaderStyle = workbook.createCellStyle();
            Font catFont = workbook.createFont();
            catFont.setBold(true);
            catHeaderStyle.setFont(catFont);
            catHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            catHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String currentCategory = null;
            for (com.miel.backend.model.InventoryItem item : sortedItems) {
                // Print category separator row
                if (!item.getCategory().equals(currentCategory)) {
                    currentCategory = item.getCategory();
                    Row catRow = sheetAlmacen.createRow(rAlm++);
                    Cell catCell = catRow.createCell(0);
                    catCell.setCellValue("▶  " + formatCategory(currentCategory));
                    catCell.setCellStyle(catHeaderStyle);
                }

                Row row = sheetAlmacen.createRow(rAlm++);
                double stock = item.getCurrentStock() != null ? item.getCurrentStock().doubleValue() : 0.0;
                double cost = item.getCostPerUnit() != null ? item.getCostPerUnit().doubleValue() : 0.0;
                double valTotal = stock * cost;
                totalAlmacenValue += valTotal;
                double minStk = item.getMinStock() != null ? item.getMinStock().doubleValue() : 0.0;
                boolean isLow = item.getIsActive() != null && item.getIsActive() && stock <= minStk && minStk > 0;

                row.createCell(0).setCellValue(item.getId());
                row.createCell(1).setCellValue(item.getName());
                row.createCell(2).setCellValue(formatCategory(item.getCategory()));
                row.createCell(3).setCellValue(formatUnit(item.getUnit()));
                row.createCell(4).setCellValue(stock);
                row.createCell(5).setCellValue(cost);
                row.createCell(6).setCellValue(valTotal);
                row.createCell(7).setCellValue(minStk);
                row.createCell(8).setCellValue(isLow ? "BAJO STOCK" : "NORMAL");
            }

            // Fila de total de almacén
            Row totalRow = sheetAlmacen.createRow(rAlm++);
            Cell cTotLabel = totalRow.createCell(1);
            cTotLabel.setCellValue("TOTAL VALOR ESTIMADO ALMACÉN:");
            Font totFont = workbook.createFont();
            totFont.setBold(true);
            CellStyle totStyle = workbook.createCellStyle();
            totStyle.setFont(totFont);
            cTotLabel.setCellStyle(totStyle);
            Cell cTotVal = totalRow.createCell(6);
            cTotVal.setCellValue(totalAlmacenValue);
            cTotVal.setCellStyle(totStyle);

            for (int c = 0; c < colsAlm.length; c++) {
                sheetAlmacen.autoSizeColumn(c);
            }

            // ── HOJA 2: Presentaciones Envasadas ─────────────────────────
            Sheet sheet = workbook.createSheet("Presentaciones Envasadas");
            int rowIdx = 0;

            Row headerRow = sheet.createRow(rowIdx++);
            String[] columns = {"ID Presentación", "Nombre", "Peso (g)", "Stock Mínimo", "Stock Actual", "Costo Unitario ($)", "Precio Venta ($)", "Valor Total ($)", "Alerta Stock"};

            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(hStyleAlm);
            }

            if (inventoryList.isEmpty()) {
                Row emptyRow = sheet.createRow(rowIdx++);
                emptyRow.createCell(0).setCellValue("Sin presentaciones activas con precio de venta registrado.");
            } else {
                for (com.miel.backend.model.RealTimeInventoryDTO row : inventoryList) {
                    Row excelRow = sheet.createRow(rowIdx++);
                    excelRow.createCell(0).setCellValue(row.getPresentation_id());
                    excelRow.createCell(1).setCellValue(row.getPresentation_name());
                    excelRow.createCell(2).setCellValue(row.getWeight_grams().doubleValue());
                    excelRow.createCell(3).setCellValue(row.getMin_stock());
                    excelRow.createCell(4).setCellValue(row.getStock_actual());
                    excelRow.createCell(5).setCellValue(row.getCosto_unitario().doubleValue());
                    excelRow.createCell(6).setCellValue(row.getPrecio_venta_vigente().doubleValue());
                    excelRow.createCell(7).setCellValue(row.getValor_total_stock().doubleValue());
                    excelRow.createCell(8).setCellValue(row.getLow_stock_alert() ? "Sí" : "No");
                }
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // ── HOJA 3: Análisis de Envases ──────────────────────────
            List<Map<String, Object>> analysis = getContainerAnalysis();
            Sheet sheet2 = workbook.createSheet("Análisis de Envases");

            String[] cols2 = {
                "Presentación", "Peso (g)", "Envases Llenos", "Envases Vacíos",
                "Miel Usada (kg)", "Miel Disponible (kg)",
                "Cubetas Disponibles", "Envases Más que se Pueden Llenar"
            };
            Row hRow2 = sheet2.createRow(0);
            for (int c = 0; c < cols2.length; c++) {
                Cell cell = hRow2.createCell(c);
                cell.setCellValue(cols2[c]);
                cell.setCellStyle(hStyleAlm);
            }

            int r2 = 1;
            for (Map<String, Object> row : analysis) {
                Row exRow = sheet2.createRow(r2++);
                double mielDisponible = row.get("miel_disponible_kg") != null
                    ? ((Number) row.get("miel_disponible_kg")).doubleValue() : 0.0;
                double cubetas = mielDisponible / KG_POR_CUBETA;

                exRow.createCell(0).setCellValue(String.valueOf(row.get("nombre")));
                exRow.createCell(1).setCellValue(((Number) row.get("peso_gramos")).doubleValue());
                exRow.createCell(2).setCellValue(((Number) row.get("envases_llenos")).longValue());
                exRow.createCell(3).setCellValue(((Number) row.get("envases_vacios")).longValue());
                exRow.createCell(4).setCellValue(((Number) row.get("miel_usada_kg")).doubleValue());
                exRow.createCell(5).setCellValue(mielDisponible);
                exRow.createCell(6).setCellValue(Math.round(cubetas * 100.0) / 100.0);
                exRow.createCell(7).setCellValue(((Number) row.get("envases_posibles")).longValue());
            }
            for (int c = 0; c < cols2.length; c++) {
                sheet2.autoSizeColumn(c);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream exportInventoryToPdf() throws IOException {
        List<com.miel.backend.model.InventoryItem> rawItems = inventoryItemRepository.findAll();
        List<com.miel.backend.model.RealTimeInventoryDTO> inventoryList = inventoryService.getRealTimeInventory();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Inventario General - Selva Maya", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Tabla Almacén Físico
            com.lowagie.text.Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
            Paragraph p1 = new Paragraph("Inventario Físico (Mieles, Envases, Quesos, Extras)", sectionFont);
            p1.setSpacingAfter(8);
            document.add(p1);

            PdfPTable tableAlm = new PdfPTable(6);
            tableAlm.setWidthPercentage(100);
            tableAlm.setSpacingAfter(15f);
            float[] wAlm = {3f, 2f, 1.2f, 1.5f, 1.5f, 1.5f};
            try { tableAlm.setWidths(wAlm); } catch (Exception e) {}

            com.lowagie.text.Font hFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            String[] almHeaders = {"Producto", "Categoría", "Unidad", "Stock Actual", "Costo ($)", "Estado"};
            for (String h : almHeaders) {
                PdfPCell c = new PdfPCell(new Phrase(h, hFont));
                c.setBackgroundColor(new java.awt.Color(230, 240, 230));
                c.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                tableAlm.addCell(c);
            }

            com.lowagie.text.Font rFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            for (com.miel.backend.model.InventoryItem it : rawItems) {
                tableAlm.addCell(new Phrase(it.getName(), rFont));
                tableAlm.addCell(new Phrase(formatCategory(it.getCategory()), rFont));
                tableAlm.addCell(new Phrase(formatUnit(it.getUnit()), rFont));
                tableAlm.addCell(new Phrase(String.valueOf(it.getCurrentStock()), rFont));
                tableAlm.addCell(new Phrase("$" + it.getCostPerUnit(), rFont));
                boolean low = it.getIsActive() && it.getCurrentStock().compareTo(it.getMinStock()) <= 0;
                tableAlm.addCell(new Phrase(low ? "BAJO" : "OK", rFont));
            }
            document.add(tableAlm);

            if (!inventoryList.isEmpty()) {
                Paragraph p2 = new Paragraph("Presentaciones Envasadas", sectionFont);
                p2.setSpacingBefore(10);
                p2.setSpacingAfter(8);
                document.add(p2);

                PdfPTable tablePres = new PdfPTable(5);
                tablePres.setWidthPercentage(100);
                float[] wPres = {3f, 1.5f, 1.5f, 1.5f, 1.5f};
                try { tablePres.setWidths(wPres); } catch (Exception e) {}

                String[] presHeaders = {"Presentación", "Peso (g)", "Stock", "Precio Venta", "Valor Total"};
                for (String h : presHeaders) {
                    PdfPCell c = new PdfPCell(new Phrase(h, hFont));
                    c.setBackgroundColor(new java.awt.Color(220, 230, 245));
                    tablePres.addCell(c);
                }
                for (com.miel.backend.model.RealTimeInventoryDTO row : inventoryList) {
                    tablePres.addCell(new Phrase(row.getPresentation_name(), rFont));
                    tablePres.addCell(new Phrase(String.valueOf(row.getWeight_grams()), rFont));
                    tablePres.addCell(new Phrase(String.valueOf(row.getStock_actual()), rFont));
                    tablePres.addCell(new Phrase("$" + row.getPrecio_venta_vigente(), rFont));
                    tablePres.addCell(new Phrase("$" + row.getValor_total_stock(), rFont));
                }
                document.add(tablePres);
            }

            document.close();
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
