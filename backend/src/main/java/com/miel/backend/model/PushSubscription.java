package com.miel.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "push_subscriptions")
@Data
@NoArgsConstructor
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String endpoint;

    @Column(nullable = false, length = 256)
    private String p256dh;

    @Column(nullable = false, length = 128)
    private String auth;
}
