package com.ser.ps.infrastructure.config;

import com.ser.ps.application.ports.in.AuthService;
import com.ser.ps.application.ports.out.CredentialAuthenticationPort;
import com.ser.ps.application.ports.out.JwtTokenPort;
import com.ser.ps.application.ports.out.PasswordEncoderPort;
import com.ser.ps.application.ports.out.StoredFileRepositoryPort;
import com.ser.ps.application.ports.out.UserRepositoryPort;
import com.ser.ps.domain.service.AuthServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthUseCaseConfig {

    @Bean
    public AuthService authService(
            UserRepositoryPort userRepositoryPort,
            PasswordEncoderPort passwordEncoderPort,
            CredentialAuthenticationPort credentialAuthenticationPort,
            JwtTokenPort jwtTokenPort,
            StoredFileRepositoryPort storedFileRepositoryPort
    ) {
        return new AuthServiceImpl(
                userRepositoryPort,
                passwordEncoderPort,
                credentialAuthenticationPort,
                jwtTokenPort,
                storedFileRepositoryPort
        );
    }
}
