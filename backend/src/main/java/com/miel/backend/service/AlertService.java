package com.miel.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AlertService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // Ejecuta todos los dias a las 8 AM. Para pruebas rapidas, podrias usar cron = "0 * * * * *" (cada minuto)
    @Scheduled(cron = "0 0 8 * * *")
    public void checkLowStockAndAlert() {
        String sql = "SELECT presentation_name, min_stock, stock_actual " +
                     "FROM real_time_inventory " +
                     "WHERE low_stock_alert = true";

        List<Map<String, Object>> lowStockItems = jdbcTemplate.queryForList(sql);

        if (!lowStockItems.isEmpty()) {
            StringBuilder emailBody = new StringBuilder();
            emailBody.append("Alerta de Stock Bajo detectada en los siguientes productos:\n\n");

            for (Map<String, Object> item : lowStockItems) {
                emailBody.append(String.format("- %s: Stock Actual = %s (Minimo Ideal = %s)\n",
                        item.get("presentation_name"),
                        item.get("stock_actual"),
                        item.get("min_stock")));
            }

            emailBody.append("\nPor favor, programe una nueva captura de produccion pronto.\n");

            sendEmail("admin@inventariomiel.com", "Alerta de Stock Bajo - Inventario Miel", emailBody.toString());
        }
    }

    private void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to); // Idealmente obtenerlo de application.properties
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            System.out.println("Alerta de correo enviada a " + to);
        } catch (Exception e) {
            System.err.println("Error enviando correo de alerta: " + e.getMessage());
        }
    }
}
