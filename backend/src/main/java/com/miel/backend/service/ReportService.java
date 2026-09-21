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

    public ByteArrayInputStream exportInventoryToExcel() throws IOException {
        List<com.miel.backend.model.RealTimeInventoryDTO> inventoryList = inventoryService.getRealTimeInventory();
        Map<String, Object> summary = getSummaryReport();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inventario en Tiempo Real");

            int rowIdx = 0;

            // Summary Style
            CellStyle summaryStyle = workbook.createCellStyle();
            Font summaryFont = workbook.createFont();
            summaryFont.setBold(true);
            summaryStyle.setFont(summaryFont);

            double mielKg = summary.get("miel_granel_kg") != null
                ? ((Number) summary.get("miel_granel_kg")).doubleValue() : 0.0;
            double cubetasSummary = mielKg / KG_POR_CUBETA;
            boolean mielNegativa = mielKg < 0;

            String[] summaryLabels = {
                "=== RESUMEN GENERAL DEL INVENTARIO ===",
                "Miel a Granel disponible (kg): " + String.format("%.3f", mielKg)
                    + (mielNegativa ? "  ⚠ STOCK NEGATIVO - Registra miel en Almacen" : ""),
                "Equivalente en Cubetas (27 kg c/u): " + (mielKg >= 0 ? String.format("%.2f", cubetasSummary) : "N/A"),
                "Total Envases Llenos en Stock: " + summary.get("total_envases_stock"),
                "Total Presentaciones Activas: " + summary.get("total_presentaciones"),
                "Valor Proyectado de Venta ($): " + String.format("%.2f", ((Number) summary.get("valor_proyectado_venta")).doubleValue())
                    + (((Number) summary.get("valor_proyectado_venta")).doubleValue() == 0 ? "  (Configura precios en Costos y Precios)" : "")
            };

            for (String label : summaryLabels) {
                Row row = sheet.createRow(rowIdx++);
                Cell cell = row.createCell(0);
                cell.setCellValue(label);
                if (label.equals("Resumen de Inventario")) {
                    cell.setCellStyle(summaryStyle);
                }
            }
            
            rowIdx++; // Empty row before the table

            // Header Font
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.DARK_GREEN.getIndex());

            // Header CellStyle
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Row for Header
            Row headerRow = sheet.createRow(rowIdx++);

            // Header titles
            String[] columns = {"ID Presentación", "Nombre", "Peso (g)", "Stock Mínimo", "Stock Actual", "Costo Unitario ($)", "Precio Venta ($)", "Valor Total ($)", "Alerta Stock"};

            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

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

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // ── SEGUNDA HOJA: Análisis de Envases ──────────────────────────
            List<Map<String, Object>> analysis = getContainerAnalysis();
            Sheet sheet2 = workbook.createSheet("Análisis de Envases");

            // Header de la segunda hoja
            Font hFont2 = workbook.createFont();
            hFont2.setBold(true);
            hFont2.setColor(IndexedColors.DARK_BLUE.getIndex());
            CellStyle hStyle2 = workbook.createCellStyle();
            hStyle2.setFont(hFont2);
            hStyle2.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
            hStyle2.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] cols2 = {
                "Presentación", "Peso (g)", "Envases Llenos", "Envases Vacíos",
                "Miel Usada (kg)", "Miel Disponible (kg)",
                "Cubetas Disponibles", "Envases Más que se Pueden Llenar"
            };
            Row hRow2 = sheet2.createRow(0);
            for (int c = 0; c < cols2.length; c++) {
                Cell cell = hRow2.createCell(c);
                cell.setCellValue(cols2[c]);
                cell.setCellStyle(hStyle2);
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
        List<com.miel.backend.model.RealTimeInventoryDTO> inventoryList = inventoryService.getRealTimeInventory();
        Map<String, Object> summary = getSummaryReport();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Inventario en Tiempo Real", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            com.lowagie.text.Font summaryBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            com.lowagie.text.Font summaryNormalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            
            document.add(new Paragraph("Resumen General", summaryBoldFont));
            document.add(new Paragraph("Miel a Granel / Cubetas (kg): " + summary.get("miel_granel_kg"), summaryNormalFont));
            document.add(new Paragraph("Total Envases en Stock: " + summary.get("total_envases_stock"), summaryNormalFont));
            document.add(new Paragraph("Total Presentaciones: " + summary.get("total_presentaciones"), summaryNormalFont));
            Paragraph projectedSales = new Paragraph("Balance / Valor Proyectado de Venta ($): " + summary.get("valor_proyectado_venta"), summaryNormalFont);
            projectedSales.setSpacingAfter(20);
            document.add(projectedSales);

            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);
            float[] columnWidths = {1f, 3f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 2f, 1.5f};
            try {
                table.setWidths(columnWidths);
            } catch (Exception e) {}

            com.lowagie.text.Font headerFontPdf = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            String[] headers = {"ID", "Nombre", "Peso(g)", "Min", "Actual", "Costo", "Precio", "Valor Total", "Alerta"};

            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFontPdf));
                cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                cell.setBackgroundColor(new java.awt.Color(200, 240, 200));
                table.addCell(cell);
            }

            com.lowagie.text.Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            for (com.miel.backend.model.RealTimeInventoryDTO row : inventoryList) {
                table.addCell(new Phrase(String.valueOf(row.getPresentation_id()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getPresentation_name()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getWeight_grams()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getMin_stock()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getStock_actual()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getCosto_unitario()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getPrecio_venta_vigente()), rowFont));
                table.addCell(new Phrase(String.valueOf(row.getValor_total_stock()), rowFont));
                table.addCell(new Phrase(row.getLow_stock_alert() ? "Sí" : "No", rowFont));
            }

            document.add(table);

            // ── SEGUNDA TABLA: Análisis de Envases ─────────────────────────
            List<Map<String, Object>> analysis = getContainerAnalysis();

            com.lowagie.text.Font t2TitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph t2Title = new Paragraph("\nAnálisis de Envases Llenos y Capacidad Restante", t2TitleFont);
            t2Title.setSpacingBefore(20);
            t2Title.setSpacingAfter(8);
            document.add(t2Title);

            // Nota de cubeta
            com.lowagie.text.Font noteFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9);
            document.add(new Paragraph("* 1 cubeta estándar = 27 kg de miel", noteFont));

            PdfPTable table2 = new PdfPTable(8);
            table2.setWidthPercentage(100);
            table2.setSpacingBefore(6f);
            float[] widths2 = {2.5f, 1f, 1.2f, 1.2f, 1.5f, 1.5f, 1.3f, 2f};
            try { table2.setWidths(widths2); } catch (Exception e2) {}

            com.lowagie.text.Font hFont2Pdf = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
            String[] headers2 = {
                "Presentación", "Peso(g)", "Llenos", "Vacíos",
                "Miel Usada(kg)", "Miel Disp.(kg)",
                "Cubetas", "Envases Posibles"
            };
            for (String h : headers2) {
                PdfPCell hCell = new PdfPCell(new Phrase(h, hFont2Pdf));
                hCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                hCell.setBackgroundColor(new java.awt.Color(173, 216, 230));
                table2.addCell(hCell);
            }

            com.lowagie.text.Font rowFont2 = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Map<String, Object> row : analysis) {
                double mielDisponible = row.get("miel_disponible_kg") != null
                    ? ((Number) row.get("miel_disponible_kg")).doubleValue() : 0.0;
                double cubetas = mielDisponible / KG_POR_CUBETA;

                table2.addCell(new Phrase(String.valueOf(row.get("nombre")), rowFont2));
                table2.addCell(new Phrase(String.valueOf(row.get("peso_gramos")), rowFont2));
                table2.addCell(new Phrase(String.valueOf(row.get("envases_llenos")), rowFont2));
                table2.addCell(new Phrase(String.valueOf(row.get("envases_vacios")), rowFont2));
                table2.addCell(new Phrase(String.valueOf(row.get("miel_usada_kg")), rowFont2));
                table2.addCell(new Phrase(String.format("%.3f", mielDisponible), rowFont2));
                table2.addCell(new Phrase(String.format("%.2f", cubetas), rowFont2));
                table2.addCell(new Phrase(String.valueOf(row.get("envases_posibles")), rowFont2));
            }
            document.add(table2);
            document.close();

            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
