package com.roadguard.android.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.roadguard.android.data.remote.api.ApiClient
import com.roadguard.android.data.remote.dto.AuthResponse
import com.roadguard.android.data.remote.dto.LoginRequest
import com.roadguard.android.data.remote.dto.RegisterRequest
import com.roadguard.android.data.remote.dto.UserDTO
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

@Singleton
class AuthRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object PrefsKeys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_DATA = stringPreferencesKey("user_data")
    }

    val isLoggedIn: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PrefsKeys.ACCESS_TOKEN] != null
    }

    val currentUser: Flow<UserDTO?> = context.dataStore.data.map { prefs ->
        prefs[PrefsKeys.USER_DATA]?.let {
            try {
                Json.decodeFromString<UserDTO>(it)
            } catch (e: Exception) {
                null
            }
        }
    }

    val accessToken: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[PrefsKeys.ACCESS_TOKEN]
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = ApiClient.roadGuardApi.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val authResponse = response.body()!!
                saveAuthData(authResponse)
                Result.success(authResponse)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Login failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(
        email: String,
        password: String,
        fullName: String,
        phone: String = "",
        vehicleType: String = "car"
    ): Result<AuthResponse> {
        return try {
            val response = ApiClient.roadGuardApi.register(
                RegisterRequest(email, password, fullName, phone, vehicleType)
            )
            if (response.isSuccessful) {
                val authResponse = response.body()!!
                saveAuthData(authResponse)
                Result.success(authResponse)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Registration failed"
                Result.failure(Exception(errorBody))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshToken(): Result<AuthResponse> {
        return try {
            val prefs = context.dataStore.data.first()
            val currentRefreshToken = prefs[PrefsKeys.REFRESH_TOKEN] ?: return Result.failure(
                Exception("No refresh token available")
            )
            val response = ApiClient.roadGuardApi.refreshToken(
                mapOf("refresh_token" to currentRefreshToken)
            )
            if (response.isSuccessful) {
                val authResponse = response.body()!!
                saveAuthData(authResponse)
                Result.success(authResponse)
            } else {
                logout()
                Result.failure(Exception("Token refresh failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        try {
            ApiClient.roadGuardApi.logout()
        } catch (_: Exception) {}
        clearAuthData()
    }

    private suspend fun saveAuthData(authResponse: AuthResponse) {
        ApiClient.setAuthToken(authResponse.accessToken)
        context.dataStore.edit { prefs ->
            prefs[PrefsKeys.ACCESS_TOKEN] = authResponse.accessToken
            prefs[PrefsKeys.REFRESH_TOKEN] = authResponse.refreshToken
            prefs[PrefsKeys.USER_DATA] = Json.encodeToString(authResponse.user)
        }
    }

    private suspend fun clearAuthData() {
        ApiClient.setAuthToken(null)
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }

    suspend fun restoreSession() {
        val prefs = context.dataStore.data.first()
        prefs[PrefsKeys.ACCESS_TOKEN]?.let { token ->
            ApiClient.setAuthToken(token)
        }
    }
}
