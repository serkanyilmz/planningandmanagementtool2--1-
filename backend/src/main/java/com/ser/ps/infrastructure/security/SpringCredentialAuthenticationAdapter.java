package com.ser.ps.infrastructure.security;

import com.ser.ps.application.ports.out.CredentialAuthenticationPort;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class SpringCredentialAuthenticationAdapter implements CredentialAuthenticationPort {

    private final AuthenticationManager authenticationManager;

    public SpringCredentialAuthenticationAdapter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    public void authenticate(String usernameOrEmail, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(usernameOrEmail, password)
        );
    }
}
