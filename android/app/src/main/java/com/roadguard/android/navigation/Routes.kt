package com.roadguard.android.navigation

sealed class Route(val route: String) {
    data object Splash : Route("splash")
    data object Login : Route("login")
    data object Register : Route("register")
    data object Dashboard : Route("dashboard")
    data object TripActive : Route("trip/{tripId}") {
        fun createRoute(tripId: String) = "trip/$tripId"
    }
    data object RouteAnalysis : Route("route-analysis/{routeId}") {
        fun createRoute(routeId: String) = "route-analysis/$routeId"
    }
    data object HazardReport : Route("hazard-report")
    data object HazardDetail : Route("hazard/{hazardId}") {
        fun createRoute(hazardId: String) = "hazard/$hazardId"
    }
    data object Map : Route("map")
    data object Notifications : Route("notifications")
    data object Settings : Route("settings")
    data object Profile : Route("profile")
}
