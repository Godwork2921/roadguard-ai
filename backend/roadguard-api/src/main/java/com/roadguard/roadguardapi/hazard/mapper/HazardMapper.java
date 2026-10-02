package com.roadguard.roadguardapi.hazard.mapper;

import com.roadguard.roadguardapi.hazard.dto.HazardDTO;
import com.roadguard.roadguardapi.hazard.entity.Hazard;
import com.roadguard.roadguardapi.user.mapper.UserMapper;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mapstruct.InjectionStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring", injectionStrategy = InjectionStrategy.CONSTRUCTOR, uses = UserMapper.class)
public interface HazardMapper {

    GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Mapping(target = "hazardType", expression = "java(hazard.getHazardType() != null ? hazard.getHazardType().name() : null)")
    @Mapping(target = "severity", expression = "java(hazard.getSeverity() != null ? hazard.getSeverity().name() : null)")
    @Mapping(target = "status", expression = "java(hazard.getStatus() != null ? hazard.getStatus().name() : null)")
    @Mapping(target = "reportedById", source = "reportedBy.id")
    @Mapping(target = "reportedByName", expression = "java(hazard.getReportedBy() != null ? hazard.getReportedBy().getFirstName() + \" \" + hazard.getReportedBy().getLastName() : null)")
    @Mapping(target = "verifiedById", source = "verifiedBy.id")
    @Mapping(target = "verifiedByName", expression = "java(hazard.getVerifiedBy() != null ? hazard.getVerifiedBy().getFirstName() + \" \" + hazard.getVerifiedBy().getLastName() : null)")
    @Mapping(target = "isVerified", expression = "java(hazard.isVerified())")
    @Mapping(target = "isAIDetected", expression = "java(hazard.isAIDetected())")
    @Mapping(target = "imageUrls", expression = "java(hazard.getImages() != null ? hazard.getImages().stream().map(img -> img.getImageUrl()).toList() : java.util.Collections.emptyList())")
    HazardDTO toDto(Hazard hazard);

    List<HazardDTO> toDtoList(List<Hazard> hazards);

    default Point toPoint(double lat, double lng) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
        point.setSRID(4326);
        return point;
    }
}
