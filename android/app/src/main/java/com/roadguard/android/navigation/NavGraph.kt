package com.roadguard.android.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.roadguard.android.ui.screens.dashboard.DashboardScreen
import com.roadguard.android.ui.screens.login.LoginScreen
import com.roadguard.android.ui.screens.register.RegisterScreen
import com.roadguard.android.ui.screens.splash.SplashScreen
import com.roadguard.android.ui.screens.trip.ActiveTripScreen

@Composable
fun RoadGuardNavGraph(navController: NavHostController = NavHostController(?? ?: return)) {
    NavHost(
        navController = navController,
        startDestination = Route.Splash.route
    ) {
        composable(Route.Splash.route) {
            SplashScreen(
                onNavigateToLogin = {
                    navController.navigate(Route.Login.route) {
                        popUpTo(Route.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    navController.navigate(Route.Dashboard.route) {
                        popUpTo(Route.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Route.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Route.Dashboard.route) {
                        popUpTo(Route.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Route.Register.route)
                }
            )
        }

        composable(Route.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Route.Dashboard.route) {
                        popUpTo(Route.Login.route) { inclusive = true }
                    }
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Route.Dashboard.route) {
            DashboardScreen(
                onStartTrip = { tripId ->
                    navController.navigate(Route.TripActive.createRoute(tripId))
                },
                onViewHazard = { hazardId ->
                    navController.navigate(Route.HazardDetail.createRoute(hazardId))
                },
                onReportHazard = {
                    navController.navigate(Route.HazardReport.route)
                },
                onNavigateToMap = {
                    navController.navigate(Route.Map.route)
                },
                onNavigateToNotifications = {
                    navController.navigate(Route.Notifications.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Route.Settings.route)
                },
                onNavigateToProfile = {
                    navController.navigate(Route.Profile.route)
                }
            )
        }

        composable(
            route = Route.TripActive.route,
            arguments = listOf(navArgument("tripId") { type = NavType.StringType })
        ) { backStackEntry ->
            val tripId = backStackEntry.arguments?.getString("tripId") ?: return@composable
            ActiveTripScreen(
                tripId = tripId,
                onEndTrip = {
                    navController.navigate(Route.Dashboard.route) {
                        popUpTo(Route.Dashboard.route) { inclusive = true }
                    }
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Route.RouteAnalysis.route,
            arguments = listOf(navArgument("routeId") { type = NavType.StringType })
        ) { backStackEntry ->
            val routeId = backStackEntry.arguments?.getString("routeId") ?: return@composable
            // RouteAnalysisScreen placeholder
            androidx.compose.material3.Text("Route Analysis: $routeId")
        }

        composable(Route.HazardReport.route) {
            // HazardReportScreen placeholder
            androidx.compose.material3.Text("Report Hazard")
        }

        composable(
            route = Route.HazardDetail.route,
            arguments = listOf(navArgument("hazardId") { type = NavType.StringType })
        ) { backStackEntry ->
            val hazardId = backStackEntry.arguments?.getString("hazardId") ?: return@composable
            // HazardDetailScreen placeholder
            androidx.compose.material3.Text("Hazard Detail: $hazardId")
        }

        composable(Route.Map.route) {
            // MapScreen placeholder
            androidx.compose.material3.Text("Map View")
        }

        composable(Route.Notifications.route) {
            // NotificationsScreen placeholder
            androidx.compose.material3.Text("Notifications")
        }

        composable(Route.Settings.route) {
            // SettingsScreen placeholder
            androidx.compose.material3.Text("Settings")
        }

        composable(Route.Profile.route) {
            // ProfileScreen placeholder
            androidx.compose.material3.Text("Profile")
        }
    }
}
