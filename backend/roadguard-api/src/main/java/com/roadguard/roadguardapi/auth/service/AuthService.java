package com.roadguard.roadguardapi.auth.service;

import com.roadguard.roadguardapi.auth.dto.AuthResponse;
import com.roadguard.roadguardapi.auth.dto.LoginRequest;
import com.roadguard.roadguardapi.auth.dto.RefreshTokenRequest;
import com.roadguard.roadguardapi.auth.dto.RegisterRequest;
import com.roadguard.roadguardapi.auth.entity.RefreshToken;
import com.roadguard.roadguardapi.auth.repository.RefreshTokenRepository;
import com.roadguard.roadguardapi.common.exception.BadRequestException;
import com.roadguard.roadguardapi.common.exception.DuplicateResourceException;
import com.roadguard.roadguardapi.common.exception.UnauthorizedException;
import com.roadguard.roadguardapi.common.security.JwtTokenProvider;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        return generateAuthResponse(user);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(com.roadguard.roadguardapi.user.entity.UserRole.valueOf(request.getRole()));
        user = userRepository.save(user);

        return generateAuthResponse(user);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (storedToken.isRevoked()) {
            throw new BadRequestException("Refresh token has been revoked");
        }

        if (storedToken.isExpired()) {
            throw new BadRequestException("Refresh token has expired");
        }

        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            throw new BadRequestException("Invalid refresh token");
        }

        if (!"REFRESH".equals(jwtTokenProvider.getTokenType(request.getRefreshToken()))) {
            throw new BadRequestException("Invalid token type");
        }

        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = userRepository.findById(storedToken.getUserId())
            .orElseThrow(() -> new BadRequestException("User not found"));

        return generateAuthResponse(user);
    }

    public void logout(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UUID validateToken(String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired token");
        }
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    private AuthResponse generateAuthResponse(User user) {
        Set<String> roles = Set.of(user.getRole().name());
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), roles);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        saveRefreshToken(user.getId(), refreshToken);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
            .userId(user.getId())
            .email(user.getEmail())
            .roles(roles)
            .build();
    }

    private void saveRefreshToken(UUID userId, String token) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUserId(userId);
        refreshToken.setExpiresAt(
            LocalDateTime.ofInstant(Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpiration()), java.time.ZoneId.systemDefault()));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);
    }
}
