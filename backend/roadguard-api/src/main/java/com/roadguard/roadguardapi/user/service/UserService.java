package com.roadguard.roadguardapi.user.service;

import com.roadguard.roadguardapi.common.exception.BadRequestException;
import com.roadguard.roadguardapi.common.exception.ResourceNotFoundException;
import com.roadguard.roadguardapi.user.dto.ChangePasswordRequest;
import com.roadguard.roadguardapi.user.dto.UpdateUserRequest;
import com.roadguard.roadguardapi.user.dto.UserDTO;
import com.roadguard.roadguardapi.user.entity.User;
import com.roadguard.roadguardapi.user.entity.UserRole;
import com.roadguard.roadguardapi.user.mapper.UserMapper;
import com.roadguard.roadguardapi.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO getCurrentUser(UUID userId) {
        User user = findActiveUserById(userId);
        return userMapper.toDto(user);
    }

    public UserDTO getUserById(UUID id) {
        User user = findActiveUserById(id);
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDTO updateUser(UUID userId, UpdateUserRequest request) {
        User user = findActiveUserById(userId);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getVehicleInfo() != null) {
            user.setVehicleInfo(request.getVehicleInfo());
        }
        if (request.getRegion() != null) {
            user.setRegion(request.getRegion());
        }

        User saved = userRepository.save(user);
        return userMapper.toDto(saved);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findActiveUserById(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.softDelete();
        user.setActive(false);
        userRepository.save(user);
    }

    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(userMapper::toDto);
    }

    public Page<UserDTO> getUsersByRole(UserRole role, Pageable pageable) {
        return userRepository.findByRoleAndIsActiveTrue(role, pageable)
            .map(userMapper::toDto);
    }

    private User findActiveUserById(UUID id) {
        return userRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
}
