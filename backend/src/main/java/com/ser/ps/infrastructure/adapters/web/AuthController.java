package com.ser.ps.infrastructure.adapters.web;

import com.ser.ps.application.dto.AuthResponse;
import com.ser.ps.application.dto.LoginRequest;
import com.ser.ps.application.dto.LogoutResponse;
import com.ser.ps.application.dto.RegisterRequest;
import com.ser.ps.application.dto.UpdateEmailRequest;
import com.ser.ps.application.dto.UpdatePasswordRequest;
import com.ser.ps.application.dto.UploadedImage;
import com.ser.ps.application.ports.in.AuthService;
import com.ser.ps.infrastructure.security.JwtUtils;
import com.ser.ps.infrastructure.security.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthController(
            AuthService authService,
            JwtUtils jwtUtils,
            TokenBlacklistService tokenBlacklistService
    ) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse me(Principal principal) {
        return authService.me(principal.getName());
    }

    @PatchMapping("/me/email")
    public AuthResponse updateEmail(@RequestBody UpdateEmailRequest request, Principal principal) {
        return authService.updateEmail(request, principal.getName());
    }

    @PatchMapping("/me/password")
    public AuthResponse updatePassword(@RequestBody UpdatePasswordRequest request, Principal principal) {
        return authService.updatePassword(request, principal.getName());
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthResponse updateAvatar(@RequestPart("file") MultipartFile file, Principal principal) throws IOException {
        return authService.updateAvatar(toUploadedImage(file), principal.getName());
    }

    @PostMapping("/logout")
    public LogoutResponse logout(HttpServletRequest request) {
        String token = extractBearerToken(request);
        Instant expiresAt = jwtUtils.extractExpiration(token);
        tokenBlacklistService.revoke(token, expiresAt);
        return new LogoutResponse("Logged out successfully");
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Bearer token is required");
        }
        return header.substring(7);
    }

    private UploadedImage toUploadedImage(MultipartFile file) throws IOException {
        return new UploadedImage(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                file.getBytes()
        );
    }
}
