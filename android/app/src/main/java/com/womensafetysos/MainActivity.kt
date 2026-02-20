package com.womensafetysos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    private val PERMISSIONS = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.SEND_SMS
    )

    private val PERMISSION_REQUEST_CODE = 1234

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("MainActivity", "🚀 MainActivity onCreate() called")
        
        // Check and request permissions
        checkAndRequestPermissions()
    }

    private fun checkAndRequestPermissions() {
        Log.d("MainActivity", "🔐 Checking permissions...")
        
        val permissionsToRequest = mutableListOf<String>()
        
        for (permission in PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
                Log.d("MainActivity", "❌ Permission not granted: $permission")
            } else {
                Log.d("MainActivity", "✅ Permission already granted: $permission")
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            Log.d("MainActivity", "📋 Requesting ${permissionsToRequest.size} permissions")
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        } else {
            Log.d("MainActivity", "✅ All permissions already granted")
            // All permissions granted, proceed with app
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            Log.d("MainActivity", "📋 Permission results received")
            
            var allGranted = true
            for (i in permissions.indices) {
                val permission = permissions[i]
                val granted = grantResults[i] == PackageManager.PERMISSION_GRANTED
                
                Log.d("MainActivity", "📋 Permission: $permission = $granted")
                
                if (!granted) {
                    allGranted = false
                    
                    // Special handling for location permission
                    if (permission == Manifest.permission.ACCESS_FINE_LOCATION) {
                        Log.w("MainActivity", "📍 Location permission denied - showing settings dialog")
                        showLocationPermissionDialog()
                    }
                }
            }
            
            if (allGranted) {
                Log.d("MainActivity", "✅ All permissions granted successfully")
            } else {
                Log.w("MainActivity", "⚠️ Some permissions were denied")
            }
        }
    }

    private fun showLocationPermissionDialog() {
        Log.d("MainActivity", "📍 Showing location permission dialog")
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Location Permission Required")
            .setMessage("This app needs location permission to send your location during emergencies. Please enable it in settings.")
            .setPositiveButton("Go to Settings") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", packageName, null)
                }
                startActivity(intent)
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
                Log.w("MainActivity", "⚠️ User cancelled location permission settings")
            }
            .show()
    }

    override fun getMainComponentName(): String = "WomenSafetySOS"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
