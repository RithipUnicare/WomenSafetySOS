package com.womensafetysos

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.Locale
import kotlin.coroutines.resume

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val address: String,
    val locationUrl: String
)

class LocationHelper(private val context: Context) {

    companion object {
        private const val TAG = "LocationHelper"
    }

    /**
     * Check if location permission is granted
     */
    fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Get current location synchronously
     */
    suspend fun getCurrentLocation(): LocationData? {
        if (!hasLocationPermission()) {
            Log.e(TAG, "Location permission not granted")
            return null
        }

        return try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            // Try to get last known location first (faster)
            val location = getLastKnownLocation(locationManager)
                ?: getLocationFromProvider(locationManager)
            
            if (location != null) {
                val address = getAddressFromLocation(location.latitude, location.longitude)
                val locationUrl = createGoogleMapsUrl(location.latitude, location.longitude)
                
                LocationData(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    address = address,
                    locationUrl = locationUrl
                )
            } else {
                Log.e(TAG, "Could not get location")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting location", e)
            null
        }
    }

    /**
     * Get last known location from providers
     */
    private fun getLastKnownLocation(locationManager: LocationManager): Location? {
        if (!hasLocationPermission()) return null

        return try {
            val providers = listOf(
                LocationManager.GPS_PROVIDER,
                LocationManager.NETWORK_PROVIDER
            )

            var bestLocation: Location? = null
            for (provider in providers) {
                try {
                    val location = locationManager.getLastKnownLocation(provider)
                    if (location != null) {
                        if (bestLocation == null || location.accuracy < bestLocation.accuracy) {
                            bestLocation = location
                        }
                    }
                } catch (e: SecurityException) {
                    Log.e(TAG, "Security exception for provider: $provider", e)
                }
            }
            bestLocation
        } catch (e: Exception) {
            Log.e(TAG, "Error getting last known location", e)
            null
        }
    }

    /**
     * Request fresh location from GPS provider
     */
    private suspend fun getLocationFromProvider(locationManager: LocationManager): Location? {
        if (!hasLocationPermission()) return null

        return suspendCancellableCoroutine { continuation ->
            try {
                val locationListener = object : android.location.LocationListener {
                    override fun onLocationChanged(location: Location) {
                        locationManager.removeUpdates(this)
                        continuation.resume(location)
                    }

                    override fun onProviderEnabled(provider: String) {}
                    override fun onProviderDisabled(provider: String) {}
                    @Deprecated("Deprecated in Java")
                    override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
                }

                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    0L,
                    0f,
                    locationListener
                )

                // Set a timeout
                continuation.invokeOnCancellation {
                    locationManager.removeUpdates(locationListener)
                }
            } catch (e: SecurityException) {
                Log.e(TAG, "Security exception requesting location updates", e)
                continuation.resume(null)
            }
        }
    }

    /**
     * Reverse geocode coordinates to address
     * IMPORTANT: Always returns a non-null, non-empty string
     */
    private fun getAddressFromLocation(latitude: Double, longitude: Double): String {
        return try {
            val geocoder = Geocoder(context, Locale.getDefault())
            
            val addresses = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // For Android 13+, use async API (but we'll use the sync fallback for simplicity)
                geocoder.getFromLocation(latitude, longitude, 1)
            } else {
                @Suppress("DEPRECATION")
                geocoder.getFromLocation(latitude, longitude, 1)
            }
            
            val formattedAddress = formatAddress(addresses?.firstOrNull())
            
            // Ensure we never return empty or "Address not found"
            if (formattedAddress.isNotEmpty() && formattedAddress != "Address not found") {
                formattedAddress
            } else {
                // Fallback to coordinates if no address found
                "Location: ${String.format("%.6f", latitude)}, ${String.format("%.6f", longitude)}"
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting address", e)
            // Always return coordinates as fallback
            "Location: ${String.format("%.6f", latitude)}, ${String.format("%.6f", longitude)}"
        }
    }

    /**
     * Format address from Geocoder result
     * Returns best available address information
     */
    private fun formatAddress(address: Address?): String {
        if (address == null) {
            return ""
        }

        // Try to build address from components
        val addressParts = mutableListOf<String>()
        
        address.featureName?.let { addressParts.add(it) }
        address.thoroughfare?.let { addressParts.add(it) }
        address.subLocality?.let { addressParts.add(it) }
        address.locality?.let { addressParts.add(it) }
        address.adminArea?.let { addressParts.add(it) }
        address.countryName?.let { addressParts.add(it) }

        if (addressParts.isNotEmpty()) {
            return addressParts.joinToString(", ")
        }

        // Try full address line
        address.getAddressLine(0)?.let { 
            if (it.isNotEmpty()) return it
        }

        // Last resort - return empty to trigger fallback
        return ""
    }

    /**
     * Create Google Maps URL from coordinates
     */
    private fun createGoogleMapsUrl(latitude: Double, longitude: Double): String {
        return "https://www.google.com/maps?q=$latitude,$longitude"
    }
}
