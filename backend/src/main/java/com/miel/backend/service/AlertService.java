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

    @Autowired
    private PushNotificationService pushNotificationService;

    // Ejecuta todos los dias a las 8 AM.
    @Scheduled(cron = "0 0 8 * * *")
    public void checkLowStockAndAlert() {
        String sql = "SELECT presentation_name, min_stock, stock_actual " +
                     "FROM real_time_inventory " +
                     "WHERE low_stock_alert = true";

        List<Map<String, Object>> lowStockItems = jdbcTemplate.queryForList(sql);

        if (!lowStockItems.isEmpty()) {
            StringBuilder body = new StringBuilder("Stock bajo detectado:\n");
            for (Map<String, Object> item : lowStockItems) {
                body.append(String.format("• %s: %s uds. (mínimo: %s)\n",
                        item.get("presentation_name"),
                        item.get("stock_actual"),
                        item.get("min_stock")));
            }

            String title = " Alerta de Stock Bajo";
            pushNotificationService.sendToAll(title, body.toString().trim());
            System.out.println("[ALERTA] Push enviado: " + lowStockItems.size() + " producto(s) con stock bajo.");
        }
    }
}
