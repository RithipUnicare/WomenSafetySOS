package com.womensafetysos

import android.content.Context
import android.content.pm.PackageManager
import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.hardware.Camera
import android.media.MediaRecorder
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class MediaHelper(private val context: Context) {

    companion object {
        private const val TAG = "MediaHelper"
        private const val AUDIO_SAMPLING_RATE = 44100
        private const val AUDIO_BIT_RATE = 128000
        private const val AUDIO_CHANNELS = 1
        private const val AUDIO_FORMAT = MediaRecorder.OutputFormat.THREE_GPP
        private const val AUDIO_ENCODER = MediaRecorder.AudioEncoder.AMR_NB
    }

    data class MediaFiles(
        val photoPath: String?,
        val audioPath: String?
    )

    /**
     * Check if required permissions are granted
     */
    fun hasRequiredPermissions(): Boolean {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_AUDIO
            )
        } else {
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        }

        return permissions.all { permission ->
            ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Capture photo using camera
     */
    suspend fun capturePhoto(): String? {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "📸 Capturing photo...")
                
                // Create a temporary image file
                val photoFile = createImageFile()
                
                // For simplicity, we'll create a dummy image
                // In a real implementation, you'd use Camera2 API or CameraX
                val bitmap = createDummyBitmap()
                
                FileOutputStream(photoFile).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
                }
                
                Log.d(TAG, "✅ Photo captured: ${photoFile.absolutePath}")
                photoFile.absolutePath
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to capture photo", e)
                null
            }
        }
    }

    /**
     * Start voice recording for specified duration
     */
    suspend fun startVoiceRecording(durationMs: Long = 60000): String? {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "🎤 Starting voice recording for ${durationMs}ms...")
                
                val audioFile = createAudioFile()
                val mediaRecorder = MediaRecorder()
                
                mediaRecorder.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    setOutputFormat(AUDIO_FORMAT)
                    setAudioEncoder(AUDIO_ENCODER)
                    setAudioSamplingRate(AUDIO_SAMPLING_RATE)
                    setAudioEncodingBitRate(AUDIO_BIT_RATE)
                    setAudioChannels(AUDIO_CHANNELS)
                    setOutputFile(audioFile.absolutePath)
                    
                    prepare()
                    start()
                }
                
                Log.d(TAG, "🎙️ Recording started...")
                
                // Wait for the specified duration
                kotlinx.coroutines.delay(durationMs)
                
                mediaRecorder.apply {
                    stop()
                    release()
                }
                
                Log.d(TAG, "✅ Voice recording completed: ${audioFile.absolutePath}")
                audioFile.absolutePath
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to record voice", e)
                null
            }
        }
    }

    /**
     * Capture photo and record voice simultaneously
     */
    suspend fun captureMedia(): MediaFiles {
        Log.d(TAG, "🚀 Starting media capture...")
        
        // Capture photo immediately
        val photoPath = capturePhoto()
        
        // Start voice recording for 1 minute
        val audioPath = startVoiceRecording(60000) // 1 minute
        
        return MediaFiles(photoPath, audioPath)
    }

    /**
     * Create image file
     */
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir = File(context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "SOS_Media")
        if (!storageDir.exists()) {
            storageDir.mkdirs()
        }
        return File(storageDir, "SOS_Photo_${timeStamp}.jpg")
    }

    /**
     * Create audio file
     */
    private fun createAudioFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir = File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "SOS_Media")
        if (!storageDir.exists()) {
            storageDir.mkdirs()
        }
        return File(storageDir, "SOS_Audio_${timeStamp}.3gp")
    }

    /**
     * Create a dummy bitmap for testing
     * In production, replace with actual camera capture
     */
    private fun createDummyBitmap(): Bitmap {
        return Bitmap.createBitmap(640, 480, Bitmap.Config.ARGB_8888).apply {
            // Create a simple test pattern
            for (x in 0 until 640) {
                for (y in 0 until 480) {
                    setPixel(x, y, 0xFF0000FF.toInt()) // Blue color
                }
            }
        }
    }

    /**
     * Clean up old media files
     */
    fun cleanupOldFiles() {
        try {
            val photoDir = File(context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "SOS_Media")
            val audioDir = File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "SOS_Media")
            
            val cutoffTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000) // 24 hours ago
            
            photoDir.listFiles()?.forEach { file ->
                if (file.lastModified() < cutoffTime) {
                    file.delete()
                    Log.d(TAG, "🗑️ Deleted old photo: ${file.name}")
                }
            }
            
            audioDir.listFiles()?.forEach { file ->
                if (file.lastModified() < cutoffTime) {
                    file.delete()
                    Log.d(TAG, "🗑️ Deleted old audio: ${file.name}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to cleanup old files", e)
        }
    }
}
