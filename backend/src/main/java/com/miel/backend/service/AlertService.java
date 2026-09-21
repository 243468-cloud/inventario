package com.miel.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AlertService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Ejecuta todos los dias a las 8 AM.
    @Scheduled(cron = "0 0 8 * * *")
    public void checkLowStockAndAlert() {
        String sql = "SELECT presentation_name, min_stock, stock_actual " +
                     "FROM real_time_inventory " +
                     "WHERE low_stock_alert = true";

        List<Map<String, Object>> lowStockItems = jdbcTemplate.queryForList(sql);

        if (!lowStockItems.isEmpty()) {
            StringBuilder body = new StringBuilder();
            body.append("⚠️ Alerta de Stock Bajo detectada en los siguientes productos:\n\n");

            for (Map<String, Object> item : lowStockItems) {
                body.append(String.format("- %s: Stock Actual = %s (Minimo Ideal = %s)\n",
                        item.get("presentation_name"),
                        item.get("stock_actual"),
                        item.get("min_stock")));
            }

            body.append("\nPor favor, programe una nueva captura de produccion pronto.\n");

            // Email desactivado (spring-boot-starter-mail removido para reducir memoria).
            // Alerta se registra en consola; re-habilitar email si se migra a plan con mas RAM.
            System.out.println("[ALERTA STOCK BAJO]\n" + body);
        }
    }
}
