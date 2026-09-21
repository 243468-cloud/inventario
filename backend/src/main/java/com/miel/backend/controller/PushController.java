package com.miel.backend.controller;

import com.miel.backend.model.PushSubscription;
import com.miel.backend.service.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/push")
public class PushController {

    private final PushNotificationService pushService;

    public PushController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    /** Devuelve la VAPID public key para que el frontend pueda suscribirse */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getVapidPublicKey()));
    }

    /** El frontend llama a este endpoint cuando el usuario acepta las notificaciones */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@RequestBody PushSubscription subscription) {
        pushService.saveSubscription(subscription);
        return ResponseEntity.ok().build();
    }

    /** Elimina la suscripción cuando el usuario cierra sesión o revoca el permiso */
    @DeleteMapping("/subscribe")
    public ResponseEntity<Void> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        if (endpoint != null) {
            pushService.deleteSubscription(endpoint);
        }
        return ResponseEntity.ok().build();
    }
}
