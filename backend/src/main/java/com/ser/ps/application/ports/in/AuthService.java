package com.ser.ps.application.ports.in;

import com.ser.ps.application.dto.AuthResponse;
import com.ser.ps.application.dto.LoginRequest;
import com.ser.ps.application.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
