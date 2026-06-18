package com.ser.ps.domain.service;

import com.ser.ps.application.dto.AuthResponse;
import com.ser.ps.application.dto.LoginRequest;
import com.ser.ps.application.dto.RegisterRequest;
import com.ser.ps.application.dto.UpdateEmailRequest;
import com.ser.ps.application.dto.UpdatePasswordRequest;
import com.ser.ps.application.dto.UploadedImage;
import com.ser.ps.application.ports.in.AuthService;
import com.ser.ps.application.ports.out.CredentialAuthenticationPort;
import com.ser.ps.application.ports.out.JwtTokenPort;
import com.ser.ps.application.ports.out.PasswordEncoderPort;
import com.ser.ps.application.ports.out.StoredFileRepositoryPort;
import com.ser.ps.application.ports.out.UserRepositoryPort;
import com.ser.ps.domain.model.StoredFile;
import com.ser.ps.domain.model.User;
import java.util.Set;
import org.springframework.transaction.annotation.Transactional;

@Transactional
public class AuthServiceImpl implements AuthService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoderPort passwordEncoderPort;
    private final CredentialAuthenticationPort credentialAuthenticationPort;
    private final JwtTokenPort jwtTokenPort;
    private final StoredFileRepositoryPort storedFileRepositoryPort;

    public AuthServiceImpl(
            UserRepositoryPort userRepositoryPort,
            PasswordEncoderPort passwordEncoderPort,
            CredentialAuthenticationPort credentialAuthenticationPort,
            JwtTokenPort jwtTokenPort,
            StoredFileRepositoryPort storedFileRepositoryPort
    ) {
        this.userRepositoryPort = userRepositoryPort;
        this.passwordEncoderPort = passwordEncoderPort;
        this.credentialAuthenticationPort = credentialAuthenticationPort;
        this.jwtTokenPort = jwtTokenPort;
        this.storedFileRepositoryPort = storedFileRepositoryPort;
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

    @Override
    public AuthResponse me(String username) {
        User user = currentUser(username);
        return toAuthResponse(user, null);
    }

    @Override
    public AuthResponse updateEmail(UpdateEmailRequest request, String username) {
        User user = currentUser(username);
        requireCurrentPassword(user, request.currentPassword());
        String email = normalize(request.email()).toLowerCase();
        if (email.isBlank() || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalArgumentException("A valid email is required");
        }
        if (!email.equals(user.getEmail()) && userRepositoryPort.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already taken");
        }
        user.setEmail(email);
        return toAuthResponse(userRepositoryPort.save(user), null);
    }

    @Override
    public AuthResponse updatePassword(UpdatePasswordRequest request, String username) {
        User user = currentUser(username);
        requireCurrentPassword(user, request.currentPassword());
        String newPassword = request.newPassword() == null ? "" : request.newPassword();
        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        user.setPasswordHash(passwordEncoderPort.encode(newPassword));
        return toAuthResponse(userRepositoryPort.save(user), null);
    }

    @Override
    public AuthResponse updateAvatar(UploadedImage image, String username) {
        User user = currentUser(username);
        StoredFile storedFile = storeImage(image, user);
        user.setProfileImage(storedFile);
        return toAuthResponse(userRepositoryPort.save(user), null);
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
        String profileImageFileId = user.getProfileImage() == null ? "" : String.valueOf(user.getProfileImage().getId());
        return new AuthResponse(
                token == null ? "" : token,
                "Bearer",
                jwtTokenPort.getExpirationMs() / 1000,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                profileImageFileId,
                profileImageFileId.isBlank() ? "" : "/api/files/" + profileImageFileId
        );
    }

    private User currentUser(String username) {
        return userRepositoryPort.findByUsernameOrEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }

    private void requireCurrentPassword(User user, String currentPassword) {
        if (!passwordEncoderPort.matches(currentPassword == null ? "" : currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
    }

    private StoredFile storeImage(UploadedImage image, User user) {
        if (image == null || image.data() == null || image.data().length == 0 || image.sizeBytes() <= 0) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (image.sizeBytes() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image must be 5MB or smaller");
        }
        if (!ALLOWED_IMAGE_TYPES.contains(image.contentType())) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, and GIF images are supported");
        }
        String filename = normalize(image.originalFilename()).isBlank() ? "image" : normalize(image.originalFilename());
        return storedFileRepositoryPort.save(new StoredFile(filename, image.contentType(), image.sizeBytes(), image.data(), user));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
