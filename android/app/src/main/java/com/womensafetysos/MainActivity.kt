package com.womensafetysos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    private val PERMISSION_REQUEST_CODE = 1234

    /** All permissions the app needs, split by API level */
    private fun requiredPermissions(): Array<String> {
        val base = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.SEND_SMS
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // API 33+ — scoped media permissions
            base += Manifest.permission.READ_MEDIA_IMAGES
            base += Manifest.permission.READ_MEDIA_AUDIO
        } else {
            // API 32 and below — legacy storage
            base += Manifest.permission.READ_EXTERNAL_STORAGE
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                base += Manifest.permission.WRITE_EXTERNAL_STORAGE
            }
        }
        return base.toTypedArray()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "🚀 MainActivity onCreate()")
        checkAndRequestPermissions()
    }

    private fun checkAndRequestPermissions() {
        val needed = requiredPermissions().filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isEmpty()) {
            Log.d(TAG, "✅ All permissions already granted")
            return
        }

        Log.d(TAG, "📋 Requesting ${needed.size} permissions: $needed")
        ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQUEST_CODE)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode != PERMISSION_REQUEST_CODE) return

        val denied = mutableListOf<String>()
        for (i in permissions.indices) {
            val granted = grantResults[i] == PackageManager.PERMISSION_GRANTED
            Log.d(TAG, "${if (granted) "✅" else "❌"} ${permissions[i]}")
            if (!granted) denied += permissions[i]
        }

        if (denied.isEmpty()) {
            Log.d(TAG, "✅ All permissions granted")
            return
        }

        Log.w(TAG, "⚠️ Denied: $denied")

        // If any critical permission was permanently denied, guide user to Settings
        val permanentlyDenied = denied.filter {
            !ActivityCompat.shouldShowRequestPermissionRationale(this, it)
        }
        if (permanentlyDenied.isNotEmpty()) {
            showSettingsDialog(permanentlyDenied)
        }
    }

    private fun showSettingsDialog(denied: List<String>) {
        val names = denied.joinToString("\n") { it.substringAfterLast('.') }
        AlertDialog.Builder(this)
            .setTitle("Permissions Required")
            .setMessage(
                "The following permissions are needed for SOS to work properly:\n\n$names\n\n" +
                "Please enable them in App Settings."
            )
            .setPositiveButton("Open Settings") { _, _ ->
                startActivity(
                    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.fromParts("package", packageName, null)
                    }
                )
            }
            .setNegativeButton("Cancel") { dialog, _ -> dialog.dismiss() }
            .show()
    }

    override fun getMainComponentName(): String = "WomenSafetySOS"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    companion object {
        private const val TAG = "MainActivity"
    }
}
