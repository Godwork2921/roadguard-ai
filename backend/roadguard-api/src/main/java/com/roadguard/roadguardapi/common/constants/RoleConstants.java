package com.roadguard.roadguardapi.common.constants;

public final class RoleConstants {

    private RoleConstants() {}

    public static final String ROLE_DRIVER = "DRIVER";
    public static final String ROLE_PASSENGER = "PASSENGER";
    public static final String ROLE_AUTHORITY_OFFICER = "AUTHORITY_OFFICER";
    public static final String ROLE_ADMINISTRATOR = "ADMINISTRATOR";

    public static final String HAS_ROLE_DRIVER = "hasRole('DRIVER')";
    public static final String HAS_ROLE_AUTHORITY = "hasRole('AUTHORITY_OFFICER')";
    public static final String HAS_ROLE_ADMIN = "hasRole('ADMINISTRATOR')";
    public static final String HAS_ROLE_ADMIN_OR_AUTHORITY = "hasAnyRole('ADMINISTRATOR', 'AUTHORITY_OFFICER')";
}
