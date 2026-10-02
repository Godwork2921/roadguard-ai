package com.roadguard.roadguardapi.notification.mapper;

import com.roadguard.roadguardapi.notification.dto.NotificationDTO;
import com.roadguard.roadguardapi.notification.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "isRead", expression = "java(notification.isRead())")
    @Mapping(target = "createdAt", source = "createdAt")
    NotificationDTO toDto(Notification notification);

    List<NotificationDTO> toDtoList(List<Notification> notifications);
}
