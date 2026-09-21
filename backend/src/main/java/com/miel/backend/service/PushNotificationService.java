package com.miel.backend.service;

import com.miel.backend.model.PushSubscription;
import com.miel.backend.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.util.List;

@Service
public class PushNotificationService {

    private final PushSubscriptionRepository repository;

    @Value("${app.vapid.public-key}")
    private String vapidPublicKey;

    @Value("${app.vapid.private-key}")
    private String vapidPrivateKey;

    @Value("${app.vapid.subject}")
    private String vapidSubject;

    private PushService pushService;

    public PushNotificationService(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    public void saveSubscription(PushSubscription sub) {
        // Evitar duplicados: si ya existe el endpoint, actualizar
        repository.findByEndpoint(sub.getEndpoint()).ifPresentOrElse(existing -> {
            existing.setP256dh(sub.getP256dh());
            existing.setAuth(sub.getAuth());
            repository.save(existing);
        }, () -> repository.save(sub));
    }

    public void deleteSubscription(String endpoint) {
        repository.deleteByEndpoint(endpoint);
    }

    public void sendToAll(String title, String body) {
        List<PushSubscription> subscriptions = repository.findAll();
        String payload = buildPayload(title, body);

        for (PushSubscription sub : subscriptions) {
            try {
                Subscription subscription = new Subscription(
                    sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dh(), sub.getAuth())
                );
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);
            } catch (Exception e) {
                System.err.println("[PUSH] Error enviando a " + sub.getEndpoint() + ": " + e.getMessage());
                // Si el endpoint expiró, eliminarlo
                if (e.getMessage() != null && (e.getMessage().contains("410") || e.getMessage().contains("404"))) {
                    repository.deleteByEndpoint(sub.getEndpoint());
                }
            }
        }
    }

    private String buildPayload(String title, String body) {
        return String.format("{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/favicon.ico\"}",
                title.replace("\"", "'"),
                body.replace("\"", "'"));
    }
}
