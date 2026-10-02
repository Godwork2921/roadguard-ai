package com.roadguard.roadguardapi.auth.controller;

import com.roadguard.roadguardapi.auth.dto.AuthResponse;
import com.roadguard.roadguardapi.auth.dto.LoginRequest;
import com.roadguard.roadguardapi.auth.dto.RefreshTokenRequest;
import com.roadguard.roadguardapi.auth.dto.RegisterRequest;
import com.roadguard.roadguardapi.auth.service.AuthService;
import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Registration successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@CurrentUser UUID userId) {
        if (userId != null) {
            authService.logout(userId);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
}
