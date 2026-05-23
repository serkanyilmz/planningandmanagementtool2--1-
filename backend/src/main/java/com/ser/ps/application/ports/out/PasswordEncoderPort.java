package com.ser.ps.application.ports.out;

public interface PasswordEncoderPort {

    String encode(String rawPassword);
}
