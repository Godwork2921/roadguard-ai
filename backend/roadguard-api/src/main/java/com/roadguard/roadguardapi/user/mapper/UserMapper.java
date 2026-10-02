package com.roadguard.roadguardapi.user.mapper;

import com.roadguard.roadguardapi.user.dto.UserDTO;
import com.roadguard.roadguardapi.user.entity.User;
import org.mapstruct.InjectionStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", injectionStrategy = InjectionStrategy.CONSTRUCTOR)
public interface UserMapper {

    @Mapping(target = "role", expression = "java(user.getRole() != null ? user.getRole().name() : null)")
    @Mapping(target = "isActive", expression = "java(user.isActive())")
    UserDTO toDto(User user);

    List<UserDTO> toDtoList(List<User> users);
}
