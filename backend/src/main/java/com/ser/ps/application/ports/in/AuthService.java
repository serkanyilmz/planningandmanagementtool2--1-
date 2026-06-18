package com.ser.ps.application.ports.in;

import com.ser.ps.application.dto.AuthResponse;
import com.ser.ps.application.dto.LoginRequest;
import com.ser.ps.application.dto.RegisterRequest;
import com.ser.ps.application.dto.UpdateEmailRequest;
import com.ser.ps.application.dto.UpdatePasswordRequest;
import com.ser.ps.application.dto.UploadedImage;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse me(String username);

    AuthResponse updateEmail(UpdateEmailRequest request, String username);

    AuthResponse updatePassword(UpdatePasswordRequest request, String username);

    AuthResponse updateAvatar(UploadedImage image, String username);
}
