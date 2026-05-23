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
        if (userRepositoryPort.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepositoryPort.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already taken");
        }

        User user = new User(
                request.username(),
                request.email(),
                passwordEncoderPort.encode(request.password()),
                request.fullName()
        );

        User savedUser = userRepositoryPort.save(user);
        String token = jwtTokenPort.generateToken(savedUser.getUsername());
        return toAuthResponse(savedUser, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        credentialAuthenticationPort.authenticate(request.usernameOrEmail(), request.password());

        User user = userRepositoryPort.findByUsernameOrEmail(request.usernameOrEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username/email or password"));
        String token = jwtTokenPort.generateToken(user.getUsername());
        return toAuthResponse(user, token);
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName()
        );
    }
}
