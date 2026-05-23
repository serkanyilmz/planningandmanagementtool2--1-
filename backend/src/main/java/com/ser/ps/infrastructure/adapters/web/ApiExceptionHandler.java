package com.ser.ps.infrastructure.adapters.web;

import com.ser.ps.application.dto.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new ApiErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials() {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorResponse("Invalid username/email or password"));
    }
}
