package com.roadguard.roadguardapi.trip.mapper;

import com.roadguard.roadguardapi.trip.dto.TripDTO;
import com.roadguard.roadguardapi.trip.entity.Trip;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mapstruct.InjectionStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring", injectionStrategy = InjectionStrategy.CONSTRUCTOR, imports = {GeometryFactory.class, Coordinate.class, PrecisionModel.class})
public interface TripMapper {

    GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Mapping(target = "driverId", source = "driver.id")
    @Mapping(target = "driverName", expression = "java(trip.getDriver().getFirstName() + \" \" + trip.getDriver().getLastName())")
    @Mapping(target = "startLat", source = "startPoint", qualifiedByName = "pointToLat")
    @Mapping(target = "startLng", source = "startPoint", qualifiedByName = "pointToLng")
    @Mapping(target = "endLat", source = "endPoint", qualifiedByName = "pointToLat")
    @Mapping(target = "endLng", source = "endPoint", qualifiedByName = "pointToLng")
    @Mapping(target = "status", expression = "java(trip.getStatus() != null ? trip.getStatus().name() : null)")
    TripDTO toDto(Trip trip);

    List<TripDTO> toDtoList(List<Trip> trips);

    @Named("pointToLat")
    default Double pointToLat(Point point) {
        return point != null ? point.getY() : null;
    }

    @Named("pointToLng")
    default Double pointToLng(Point point) {
        return point != null ? point.getX() : null;
    }

    default Point toPoint(double lat, double lng) {
        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }
}
