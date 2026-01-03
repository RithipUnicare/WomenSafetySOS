package com.womensafetysos

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class ApiHelper(private val context: Context) {

    companion object {
        private const val TAG = "ApiHelper"
        private const val BASE_URL = "https://app.undefineddevelopers.online/womensafety"
        private const val TIMEOUT_MS = 30000
        
        // SharedPreferences key for auth token (same as React Native AsyncStorage)
        private const val PREFS_NAME = "RCTAsyncLocalStorage_V1"
        private const val TOKEN_KEY = "@womensafety_access_token"
    }

    /**
     * Get auth token from SharedPreferences
     */
    private fun getAuthToken(): String? {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.getString(TOKEN_KEY, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting auth token", e)
            null
        }
    }

    /**
     * Send location data to backend
     */
    suspend fun sendLocation(locationData: LocationData): Boolean {
        val token = getAuthToken()
        if (token == null) {
            Log.e(TAG, "❌ No auth token found - user not logged in")
            return false
        }

        return try {
            Log.d(TAG, "📍 Preparing to send location: ${locationData.latitude}, ${locationData.longitude}")
            Log.d(TAG, "📍 Address: ${locationData.address}")
            Log.d(TAG, "📍 Location URL: ${locationData.locationUrl}")
            
            val json = JSONObject().apply {
                put("latitude", locationData.latitude)
                put("longitude", locationData.longitude)
                put("address", locationData.address)
                put("locationUrl", locationData.locationUrl)
            }

            Log.d(TAG, "🌐 Sending location to /location endpoint...")
            val response = makeRequest(
                endpoint = "/location",
                method = "POST",
                token = token,
                body = json.toString()
            )

            val success = response != null
            if (success) {
                Log.d(TAG, "✅ Location sent successfully")
            } else {
                Log.e(TAG, "❌ Failed to send location")
            }
            success
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error sending location", e)
            false
        }
    }

    /**
     * Start emergency
     */
    suspend fun startEmergency(): Boolean {
        val token = getAuthToken()
        if (token == null) {
            Log.e(TAG, "❌ No auth token found - user not logged in")
            return false
        }

        return try {
            Log.d(TAG, "🚨 Starting emergency...")
            val response = makeRequest(
                endpoint = "/emergency/start",
                method = "POST",
                token = token,
                body = null
            )

            val success = response != null
            if (success) {
                Log.d(TAG, "✅ Emergency started successfully")
            } else {
                Log.e(TAG, "❌ Failed to start emergency")
            }
            success
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error starting emergency", e)
            false
        }
    }

    /**
     * Make HTTP request
     */
    private fun makeRequest(
        endpoint: String,
        method: String,
        token: String,
        body: String?
    ): String? {
        var connection: HttpURLConnection? = null
        
        return try {
            val url = URL(BASE_URL + endpoint)
            connection = url.openConnection() as HttpURLConnection
            
            connection.apply {
                requestMethod = method
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Authorization", "Bearer $token")
                doInput = true
                
                if (body != null) {
                    doOutput = true
                }
            }

            // Write request body if present
            if (body != null) {
                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(body)
                    writer.flush()
                }
            }

            val responseCode = connection.responseCode
            Log.d(TAG, "Response code for $endpoint: $responseCode")

            if (responseCode in 200..299) {
                // Read response
                BufferedReader(InputStreamReader(connection.inputStream)).use { reader ->
                    val response = StringBuilder()
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        response.append(line)
                    }
                    response.toString()
                }
            } else {
                // Read error response
                val errorStream = connection.errorStream
                if (errorStream != null) {
                    BufferedReader(InputStreamReader(errorStream)).use { reader ->
                        val error = StringBuilder()
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            error.append(line)
                        }
                        Log.e(TAG, "Error response: ${error.toString()}")
                    }
                }
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Request failed for $endpoint", e)
            null
        } finally {
            connection?.disconnect()
        }
    }
}
