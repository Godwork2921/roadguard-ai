package com.roadguard.roadguardapi.user.controller;

import com.roadguard.roadguardapi.common.response.ApiResponse;
import com.roadguard.roadguardapi.common.security.CurrentUser;
import com.roadguard.roadguardapi.user.dto.ChangePasswordRequest;
import com.roadguard.roadguardapi.user.dto.UpdateUserRequest;
import com.roadguard.roadguardapi.user.dto.UserDTO;
import com.roadguard.roadguardapi.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserDTO> getCurrentUser(@CurrentUser UUID userId) {
        return ApiResponse.success(userService.getCurrentUser(userId));
    }

    @PutMapping("/me")
    public ApiResponse<UserDTO> updateCurrentUser(
            @CurrentUser UUID userId,
            @Valid @RequestBody UpdateUserRequest request) {
        return ApiResponse.success(userService.updateUser(userId, request));
    }

    @PostMapping("/me/change-password")
    public ApiResponse<Void> changePassword(
            @CurrentUser UUID userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ApiResponse.success(null, "Password changed successfully");
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR') or #id == authentication.principal")
    public ApiResponse<UserDTO> getUserById(@PathVariable UUID id) {
        return ApiResponse.success(userService.getUserById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<Void> deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);
        return ApiResponse.success(null, "User deactivated successfully");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<Page<UserDTO>> getAllUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(userService.getAllUsers(pageable));
    }
}
