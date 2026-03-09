package com.womensafetysos

import android.content.Context
import android.content.pm.PackageManager
import android.Manifest
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.SurfaceTexture
import android.hardware.Camera
import android.media.MediaRecorder
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

@Suppress("DEPRECATION") // Camera API is deprecated but is the only way to capture from a background service
class MediaHelper(private val context: Context) {

    companion object {
        private const val TAG = "MediaHelper"
        private const val AUDIO_SAMPLING_RATE = 44100
        private const val AUDIO_BIT_RATE = 128000
        private const val AUDIO_CHANNELS = 1
    }

    data class MediaFiles(
        val photoPath: String?,
        val audioPath: String?
    )

    // ────────────────────────────────────────────────────────────────────────
    // Permission helpers
    // ────────────────────────────────────────────────────────────────────────

    fun hasRequiredPermissions(): Boolean {
        val required = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            required += Manifest.permission.READ_MEDIA_IMAGES
            required += Manifest.permission.READ_MEDIA_AUDIO
        } else {
            required += Manifest.permission.READ_EXTERNAL_STORAGE
        }
        return required.all { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Audio recording (1 minute)
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Records audio for [durationMs] milliseconds and returns the file path.
     * Must be called from a coroutine (suspends while recording).
     */
    suspend fun startVoiceRecording(durationMs: Long = 60_000L): String? =
        withContext(Dispatchers.IO) {
            val audioFile = createAudioFile()
            Log.d(TAG, "🎤 Starting voice recording → ${audioFile.absolutePath}")

            val recorder = createMediaRecorder()
            try {
                recorder.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    // Android does not natively support encoding to MP3. The modern standard is AAC inside an M4A container.
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioSamplingRate(AUDIO_SAMPLING_RATE)
                    setAudioEncodingBitRate(AUDIO_BIT_RATE)
                    setAudioChannels(AUDIO_CHANNELS)
                    setOutputFile(audioFile.absolutePath)
                    prepare()
                    start()
                }

                Log.d(TAG, "🎙️ Recording… (${durationMs / 1000}s)")
                delay(durationMs)

                recorder.stop()
                recorder.release()

                Log.d(TAG, "✅ Recording done: ${audioFile.absolutePath}")
                audioFile.absolutePath
            } catch (e: Exception) {
                Log.e(TAG, "❌ Voice recording failed", e)
                try { recorder.release() } catch (_: Exception) {}
                null
            }
        }

    /** Factory that picks the right MediaRecorder constructor for the API level. */
    private fun createMediaRecorder(): MediaRecorder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }

    // ────────────────────────────────────────────────────────────────────────
    // Photo capture (real camera, background-safe via deprecated Camera API)
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Opens the back camera, takes one JPEG picture, saves it, releases the camera.
     * Returns the file path or null on failure.
     */
    suspend fun capturePhoto(): String? = withContext(Dispatchers.IO) {
        Log.d(TAG, "📸 Capturing photo…")
        var camera: Camera? = null
        var surfaceTexture: SurfaceTexture? = null
        return@withContext try {
            camera = Camera.open(0) // 0 = rear camera
            
            // Modern devices require a preview surface even for headless photo capture.
            surfaceTexture = SurfaceTexture(10)
            camera.setPreviewTexture(surfaceTexture)
            camera.startPreview()

            // Use a CountDownLatch so we can wait synchronously for the callback
            val latch = java.util.concurrent.CountDownLatch(1)
            var photoPath: String? = null

            camera.takePicture(null, null) { data, _ ->
                try {
                    val originalBitmap = BitmapFactory.decodeByteArray(data, 0, data.size)
                    // Scale down by 50% to reduce file size and avoid 413 Request Entity Too Large
                    val targetWidth = originalBitmap.width / 2
                    val targetHeight = originalBitmap.height / 2
                    val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, targetWidth, targetHeight, true)
                    
                    val file = createImageFile()
                    FileOutputStream(file).use { out ->
                        scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 50, out)
                    }
                    
                    if (scaledBitmap != originalBitmap) {
                        scaledBitmap.recycle()
                    }
                    originalBitmap.recycle()
                    
                    photoPath = file.absolutePath
                    Log.d(TAG, "✅ Photo saved: $photoPath")
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Error saving photo", e)
                } finally {
                    latch.countDown()
                }
            }

            // Wait up to 10 seconds for the picture callback
            latch.await(10, java.util.concurrent.TimeUnit.SECONDS)
            photoPath
        } catch (e: Exception) {
            Log.e(TAG, "❌ Camera capture failed", e)
            null
        } finally {
            try {
                camera?.stopPreview()
                camera?.release()
                surfaceTexture?.release()
            } catch (_: Exception) {}
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Combined capture (used by Stage-2 service)
    // Returns only the audio path; photos are taken in a separate coroutine
    // and uploaded directly via ApiHelper.
    // ────────────────────────────────────────────────────────────────────────

    /** Backward-compat wrapper used internally by the service. */
    suspend fun captureMedia(): MediaFiles {
        Log.d(TAG, "🚀 captureMedia() — capturing audio only (photos handled separately)")
        val audioPath = startVoiceRecording(60_000L)
        return MediaFiles(photoPath = null, audioPath = audioPath)
    }

    // ────────────────────────────────────────────────────────────────────────
    // File helpers
    // ────────────────────────────────────────────────────────────────────────

    private fun createImageFile(): File {
        val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val dir = File(context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "SOS_Media")
        dir.mkdirs()
        return File(dir, "SOS_Photo_$ts.jpg")
    }

    private fun createAudioFile(): File {
        val ts = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val dir = File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "SOS_Media")
        dir.mkdirs()
        // Save as .m4a since we use MPEG_4 output format with AAC codec
        return File(dir, "SOS_Audio_$ts.m4a")
    }

    // ────────────────────────────────────────────────────────────────────────
    // Cleanup
    // ────────────────────────────────────────────────────────────────────────

    fun cleanupOldFiles() {
        val cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
        for (subDir in listOf("SOS_Media")) {
            File(context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), subDir)
                .listFiles()?.filter { it.lastModified() < cutoff }?.forEach { it.delete() }

            File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), subDir)
                .listFiles()?.filter { it.lastModified() < cutoff }?.forEach { it.delete() }
        }
    }
}
