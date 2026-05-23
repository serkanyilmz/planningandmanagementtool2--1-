package com.ser.ps.application.ports.out;

public interface CredentialAuthenticationPort {

    void authenticate(String usernameOrEmail, String password);
}
