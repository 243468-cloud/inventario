package com.miel.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class KeepAliveService {

    private static final Logger logger = LoggerFactory.getLogger(KeepAliveService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${KEEP_ALIVE_URL:https://inventario-7m82.onrender.com/api/ping}")
    private String keepAliveUrl;

    // Se ejecuta cada 4 minutos (240,000 milisegundos)
    @Scheduled(fixedRate = 240000)
    public void ping() {
        try {
            String response = restTemplate.getForObject(keepAliveUrl, String.class);
            logger.info("[KeepAlive] Ping exitoso a {}: {}", keepAliveUrl, response);
        } catch (Exception e) {
            logger.warn("[KeepAlive] Error al hacer ping a {}: {}", keepAliveUrl, e.getMessage());
        }
    }
}
