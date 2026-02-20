package com.womensafetysos

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileInputStream
import java.io.InputStreamReader
import java.io.OutputStream
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
            Log.d(TAG, "🔐 Getting auth token from SharedPreferences...")
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val token = prefs.getString(TOKEN_KEY, null)
            
            if (token != null) {
                Log.d(TAG, "✅ Auth token found (length: ${token.length})")
                Log.d(TAG, "🔑 Token preview: ${token.take(20)}...")
            } else {
                Log.e(TAG, "❌ No auth token found in SharedPreferences")
                Log.e(TAG, "🔑 Available keys: ${prefs.all.keys}")
            }
            
            token
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error getting auth token", e)
            null
        }
    }

    /**
     * Send location data to backend
     */
    suspend fun sendLocation(locationData: LocationData): Boolean {
        Log.d(TAG, "📍 sendLocation() called")
        Log.d(TAG, "📍 Location data: lat=${locationData.latitude}, lng=${locationData.longitude}")
        Log.d(TAG, "📍 Address: ${locationData.address}")
        
        val token = getAuthToken()
        if (token == null) {
            Log.e(TAG, "❌ Cannot send location - no auth token")
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
            Log.d(TAG, "📋 Request JSON: ${json.toString()}")
            
            val response = makeRequest(
                endpoint = "/location",
                method = "POST",
                token = token,
                body = json.toString()
            )

            val success = response != null
            if (success) {
                Log.d(TAG, "✅ Location sent successfully")
                Log.d(TAG, "📋 Response: $response")
            } else {
                Log.e(TAG, "❌ Failed to send location - response is null")
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
    suspend fun startEmergency(): Long? {
        Log.d(TAG, "🚨 startEmergency() called")
        
        val token = getAuthToken()
        if (token == null) {
            Log.e(TAG, "❌ Cannot start emergency - no auth token")
            return null
        }

        return try {
            Log.d(TAG, "🚨 Starting emergency...")
            Log.d(TAG, "🌐 Calling /emergency/start endpoint...")
            
            val response = makeRequest(
                endpoint = "/emergency/start",
                method = "POST",
                token = token,
                body = null
            )

            Log.d(TAG, "📋 Emergency API response: $response")

            if (response != null) {
                Log.d(TAG, "✅ Emergency started successfully")
                // Parse response to get emergency ID
                try {
                    val jsonResponse = JSONObject(response)
                    val emergencyId = jsonResponse.optLong("id", -1)
                    
                    if (emergencyId != -1L) {
                        Log.d(TAG, "📋 Emergency ID extracted: $emergencyId")
                        return emergencyId
                    } else {
                        Log.e(TAG, "❌ Emergency ID not found in response")
                        Log.e(TAG, "📋 Available keys: ${jsonResponse.keys()}")
                        Log.e(TAG, "📋 Full response: $response")
                        return null
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Failed to parse emergency response", e)
                    Log.e(TAG, "📋 Raw response: $response")
                    return null
                }
            } else {
                Log.e(TAG, "❌ Failed to start emergency - response is null")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error starting emergency", e)
            null
        }
    }

    /**
     * Upload media file to backend
     */
    suspend fun uploadMedia(filePath: String, emergencyId: Long): Boolean {
        Log.d(TAG, "📤 uploadMedia() called")
        Log.d(TAG, "📤 File path: $filePath")
        Log.d(TAG, "📤 Emergency ID: $emergencyId")
        
        val token = getAuthToken()
        if (token == null) {
            Log.e(TAG, "❌ Cannot upload media - no auth token")
            return false
        }

        return try {
            Log.d(TAG, "📤 Uploading media: $filePath for emergency ID: $emergencyId")
            
            val file = File(filePath)
            if (!file.exists()) {
                Log.e(TAG, "❌ Media file not found: $filePath")
                return false
            }
            
            Log.d(TAG, "📤 File exists, size: ${file.length()} bytes")

            val response = uploadFileRequest(
                endpoint = "/media/upload",
                token = token,
                file = file,
                emergencyId = emergencyId
            )

            Log.d(TAG, "📤 Upload response: $response")
            Log.d(TAG, "📤 Response type: ${response?.javaClass?.simpleName}")
            
            val success = response != null
            if (success) {
                Log.d(TAG, "✅ Media uploaded successfully")
                Log.d(TAG, "📤 Full response: $response")
            } else {
                Log.e(TAG, "❌ Failed to upload media - response is null")
            }
            success
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error uploading media", e)
            Log.e(TAG, "❌ Error details: ${e.message}")
            false
        }
    }

    /**
     * Upload multiple media files
     */
    suspend fun uploadMultipleMedia(photoPath: String?, audioPath: String?, emergencyId: Long): Boolean {
        var photoUploaded = true
        var audioUploaded = true

        if (photoPath != null) {
            photoUploaded = uploadMedia(photoPath, emergencyId)
        }

        if (audioPath != null) {
            audioUploaded = uploadMedia(audioPath, emergencyId)
        }

        return photoUploaded && audioUploaded
    }

    /**
     * Make file upload request with multipart/form-data
     */
    private fun uploadFileRequest(
        endpoint: String,
        token: String,
        file: File,
        emergencyId: Long
    ): String? {
        var connection: HttpURLConnection? = null
        
        return try {
            Log.d(TAG, "🌐 uploadFileRequest() called")
            Log.d(TAG, "📤 Endpoint: $endpoint")
            Log.d(TAG, "📤 File: ${file.name} (${file.length()} bytes)")
            Log.d(TAG, "📤 Emergency ID: $emergencyId")
            
            val url = URL("$BASE_URL$endpoint?emergencyId=$emergencyId")
            Log.d(TAG, "🌐 Full URL: $url")
            connection = url.openConnection() as HttpURLConnection
            
            val boundary = "----Boundary${System.currentTimeMillis()}"
            val lineEnd = "\r\n"
            val twoHyphens = "--"
            
            connection.apply {
                requestMethod = "POST"
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                setRequestProperty("Authorization", "Bearer $token")
                doInput = true
                doOutput = true
                useCaches = false
            }

            Log.d(TAG, "🌐 Request headers set, starting file upload...")

            // Write multipart form data
            connection.outputStream.use { outputStream ->
                Log.d(TAG, "📤 Writing multipart data...")
                
                // File part
                outputStream.write("$twoHyphens$boundary$lineEnd".toByteArray())
                outputStream.write("Content-Disposition: form-data; name=\"file\"; filename=\"${file.name}\"$lineEnd".toByteArray())
                outputStream.write("Content-Type: application/octet-stream$lineEnd$lineEnd".toByteArray())

                // Write file content
                FileInputStream(file).use { inputStream ->
                    val buffer = ByteArray(4096)
                    var bytesRead: Int
                    var totalBytes = 0
                    while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                        outputStream.write(buffer, 0, bytesRead)
                        totalBytes += bytesRead
                    }
                    Log.d(TAG, "📤 File written: $totalBytes bytes")
                }

                outputStream.write("$lineEnd".toByteArray())
                outputStream.write("$twoHyphens$boundary$twoHyphens$lineEnd".toByteArray())
                outputStream.flush()
            }

            val responseCode = connection.responseCode
            Log.d(TAG, "📋 HTTP Response Code: $responseCode")

            if (responseCode in 200..299) {
                // Read response
                BufferedReader(InputStreamReader(connection.inputStream)).use { reader ->
                    val response = StringBuilder()
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        response.append(line)
                    }
                    val responseString = response.toString()
                    Log.d(TAG, "✅ Upload successful")
                    Log.d(TAG, "📋 Response body: $responseString")
                    responseString
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
                        Log.e(TAG, "❌ HTTP Error Response: ${error.toString()}")
                    }
                }
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Upload request failed", e)
            Log.e(TAG, "❌ Error details: ${e.message}")
            Log.e(TAG, "❌ Stack trace: ${e.stackTraceToString()}")
            null
        } finally {
            connection?.disconnect()
            Log.d(TAG, "🔌 Connection closed")
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
