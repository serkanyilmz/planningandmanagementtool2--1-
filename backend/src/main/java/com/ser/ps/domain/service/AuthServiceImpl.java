package com.ser.ps.domain.service;

import com.ser.ps.application.dto.AuthResponse;
import com.ser.ps.application.dto.LoginRequest;
import com.ser.ps.application.dto.RegisterRequest;
import com.ser.ps.application.ports.in.AuthService;
import com.ser.ps.application.ports.out.CredentialAuthenticationPort;
import com.ser.ps.application.ports.out.JwtTokenPort;
import com.ser.ps.application.ports.out.PasswordEncoderPort;
import com.ser.ps.application.ports.out.UserRepositoryPort;
import com.ser.ps.domain.model.User;

public class AuthServiceImpl implements AuthService {

    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoderPort passwordEncoderPort;
    private final CredentialAuthenticationPort credentialAuthenticationPort;
    private final JwtTokenPort jwtTokenPort;

    public AuthServiceImpl(
            UserRepositoryPort userRepositoryPort,
            PasswordEncoderPort passwordEncoderPort,
            CredentialAuthenticationPort credentialAuthenticationPort,
            JwtTokenPort jwtTokenPort
    ) {
        this.userRepositoryPort = userRepositoryPort;
        this.passwordEncoderPort = passwordEncoderPort;
        this.credentialAuthenticationPort = credentialAuthenticationPort;
        this.jwtTokenPort = jwtTokenPort;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        RegisterRequest normalizedRequest = request.normalized();
        validateRegistration(normalizedRequest);

        if (userRepositoryPort.existsByUsername(normalizedRequest.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepositoryPort.existsByEmail(normalizedRequest.email())) {
            throw new IllegalArgumentException("Email is already taken");
        }

        User user = new User(
                normalizedRequest.username(),
                normalizedRequest.email(),
                passwordEncoderPort.encode(normalizedRequest.password()),
                normalizedRequest.fullName()
        );

        User savedUser = userRepositoryPort.save(user);
        String token = jwtTokenPort.generateToken(savedUser.getUsername());
        return toAuthResponse(savedUser, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        LoginRequest normalizedRequest = request.normalized();
        if (normalizedRequest.usernameOrEmail().isBlank() || normalizedRequest.password().isBlank()) {
            throw new IllegalArgumentException("Username/email and password are required");
        }

        credentialAuthenticationPort.authenticate(normalizedRequest.usernameOrEmail(), normalizedRequest.password());

        User user = userRepositoryPort.findByUsernameOrEmail(normalizedRequest.usernameOrEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username/email or password"));
        String token = jwtTokenPort.generateToken(user.getUsername());
        return toAuthResponse(user, token);
    }

    private void validateRegistration(RegisterRequest request) {
        if (request.fullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (request.username().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (!request.username().matches("^[A-Za-z0-9._-]{3,30}$")) {
            throw new IllegalArgumentException("Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens");
        }
        if (request.email().isBlank() || !request.email().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalArgumentException("A valid email is required");
        }
        if (request.password().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(
                token,
                "Bearer",
                jwtTokenPort.getExpirationMs() / 1000,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName()
        );
    }
}
