package com.miel.backend.controller;

import com.miel.backend.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.miel.backend.model.User;
import com.miel.backend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Data
    static class RegisterRequest {
        @NotBlank(message = "El usuario no puede estar vacío")
        @Size(min = 3, max = 20, message = "El usuario debe tener entre 3 y 20 caracteres")
        private String username;

        @NotBlank(message = "La contraseña no puede estar vacía")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        private String password;

        private String role; // Opcional; solo ADMIN puede asignar roles
    }

    /**
     * Login público.
     * Devuelve mensaje genérico en caso de error para evitar enumeración de usuarios.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // Validación básica de input
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales inválidas"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username.trim(), password)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            String role = authentication.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("authenticated");

            log.info("Login exitoso para usuario: {}", username.trim());

            return ResponseEntity.ok(Map.of(
                "accessToken", jwt,
                "role", role
            ));
        } catch (BadCredentialsException ex) {
            // Mensaje genérico: NO revelar si el usuario existe o no
            log.warn("Intento de login fallido para username: {}", username.trim());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciales inválidas"));
        } catch (Exception ex) {
            log.error("Error inesperado en login");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error interno. Intenta de nuevo."));
        }
    }

    /**
     * Registro de nuevos usuarios.
     * PROTEGIDO: Solo usuarios con rol ADMIN pueden crear nuevas cuentas.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> registerEmployee(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.findByUsername(req.getUsername().trim()).isPresent()) {
            // Mismo mensaje tanto si existe como si no — evita enumeración
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "No se pudo completar el registro. Intenta con otro nombre."));
        }

        String assignedRole = (req.getRole() != null && !req.getRole().isBlank())
                ? req.getRole().toLowerCase() : "authenticated";

        User user = new User();
        user.setUsername(req.getUsername().trim());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(assignedRole);
        userRepository.save(user);

        log.info("Nuevo usuario registrado por ADMIN: {}, rol: {}", req.getUsername().trim(), assignedRole);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Usuario registrado correctamente"));
    }
}
