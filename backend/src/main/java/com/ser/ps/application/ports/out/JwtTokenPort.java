package com.ser.ps.application.ports.out;

public interface JwtTokenPort {

    String generateToken(String username);

    long getExpirationMs();
}
