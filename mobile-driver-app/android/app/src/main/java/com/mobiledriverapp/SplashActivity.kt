package com.mobiledriverapp

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.content.Intent
import android.os.Bundle
import android.util.DisplayMetrics
import android.view.View
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val suv = findViewById<ImageView>(R.id.suv)
        val logo = findViewById<ImageView>(R.id.logo)
        
        // Hide logo initially
        logo.alpha = 0f

        // Get screen width
        val displayMetrics = DisplayMetrics()
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        val screenWidth = displayMetrics.widthPixels.toFloat()

        // Start position: off-screen left
        suv.translationX = -500f // Start well off-screen

        // Animation: Move SUV from left to right (off-screen)
        suv.animate()
            .translationX(screenWidth + 500f)
            .setDuration(1500) // Fast speed
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    super.onAnimationEnd(animation)
                    // Show Logo
                    logo.animate()
                        .alpha(1f)
                        .setDuration(800)
                        .setListener(object : AnimatorListenerAdapter() {
                            override fun onAnimationEnd(animation: Animator) {
                                super.onAnimationEnd(animation)
                                // Navigate to MainActivity after a delay
                                logo.postDelayed({
                                    startActivity(Intent(this@SplashActivity, LoginActivity::class.java))
                                    finish()
                                }, 1000)
                            }
                        })
                }
            })
    }
}
