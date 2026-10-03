package com.roadguard.android.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Navy400,
    onPrimary = White,
    primaryContainer = Navy700,
    onPrimaryContainer = Navy100,
    secondary = Teal400,
    onSecondary = Navy900,
    secondaryContainer = Teal600,
    onSecondaryContainer = Teal50,
    tertiary = Amber300,
    onTertiary = Navy900,
    tertiaryContainer = Amber700,
    onTertiaryContainer = Amber100,
    error = Error,
    onError = White,
    errorContainer = ErrorLight,
    onErrorContainer = Error,
    background = DarkSurface,
    onBackground = Gray100,
    surface = DarkSurface,
    onSurface = Gray100,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = Gray300,
    outline = Gray500,
    outlineVariant = Gray700
)

private val LightColorScheme = lightColorScheme(
    primary = Navy700,
    onPrimary = White,
    primaryContainer = Navy100,
    onPrimaryContainer = Navy900,
    secondary = Teal600,
    onSecondary = White,
    secondaryContainer = Teal50,
    onSecondaryContainer = Teal700,
    tertiary = Amber700,
    onTertiary = White,
    tertiaryContainer = Amber100,
    onTertiaryContainer = Amber700,
    error = Error,
    onError = White,
    errorContainer = ErrorLight,
    onErrorContainer = Error,
    background = LightSurface,
    onBackground = Gray900,
    surface = LightSurface,
    onSurface = Gray900,
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = Gray600,
    outline = Gray400,
    outlineVariant = Gray200
)

@Composable
fun RoadGuardAITheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = RoadGuardTypography,
        content = content
    )
}
