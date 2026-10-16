package com.senior.crossword100

import android.annotation.SuppressLint
import android.graphics.Color
import android.media.AudioManager
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var backPressedTime: Long = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. 어르신 장고를 위한 화면 자동 꺼짐 방지
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 2. 하드웨어 볼륨 버튼 누를 때 문제 듣기 미디어 음량 직접 제어
        volumeControlStream = AudioManager.STREAM_MUSIC

        // 3. 상태바/내비게이션바 색상 및 아이콘 명도 최적화
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.parseColor("#1D4ED8") // 상단 로열 블루
        @Suppress("DEPRECATION")
        window.navigationBarColor = Color.parseColor("#FAF8F5") // 하단 크림 베이지

        val insetsController = WindowInsetsControllerCompat(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = false // 상태바 흰색 글씨/아이콘
        insetsController.isAppearanceLightNavigationBars = true // 하단 소프트키 어두운 아이콘

        // 4. 루트 컨테이너 및 시스템 인셋(Safe Area) 자동 대응 레이아웃 구성
        val rootLayout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#1D4ED8")) // 상단 노치/상태바 영역 기본 배경
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                @Suppress("DEPRECATION")
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                @Suppress("DEPRECATION")
                allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                allowUniversalAccessFromFileURLs = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true

                // 시니어 오터치로 인한 화면 확대 방지
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
            }

            overScrollMode = View.OVER_SCROLL_NEVER
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }
            }
            webChromeClient = WebChromeClient()

            setBackgroundColor(Color.parseColor("#FAF8F5"))
            loadUrl("file:///android_asset/index.html")
        }

        rootLayout.addView(webView)
        setContentView(rootLayout)

        // 5. 핵심: 상태바 및 하단 소프트키 내비게이션 바 Inset 감지 및 안전 패딩 적용
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            // 상단 상태바 높이(top)와 하단 소프트키 높이(bottom)만큼 웹뷰에 마진을 주어 콘텐츠가 절대 겹치지 않도록 보호
            val params = webView.layoutParams as FrameLayout.LayoutParams
            params.topMargin = systemBars.top
            params.bottomMargin = systemBars.bottom
            webView.layoutParams = params

            WindowInsetsCompat.CONSUMED
        }

        // 6. 시니어 친화적 뒤로가기 제어:
        // 모달/현황판이 열려있으면 먼저 닫고, 메인에서는 2초 내 2회 터치 시 종료
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    "(function() {" +
                    "  const map = document.getElementById('stageMapScreen');" +
                    "  const setModal = document.getElementById('settingsModal');" +
                    "  const clearModal = document.getElementById('clearModal');" +
                    "  if (map && map.classList.contains('active')) { map.classList.remove('active'); return 'handled'; }" +
                    "  if (setModal && setModal.classList.contains('active')) { setModal.classList.remove('active'); return 'handled'; }" +
                    "  if (clearModal && clearModal.classList.contains('active')) { clearModal.classList.remove('active'); return 'handled'; }" +
                    "  return 'none';" +
                    "})()"
                ) { result ->
                    if (result != null && result.contains("handled")) {
                        return@evaluateJavascript
                    }
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        if (System.currentTimeMillis() - backPressedTime < 2000) {
                            finish()
                        } else {
                            backPressedTime = System.currentTimeMillis()
                            Toast.makeText(this@MainActivity, "뒤로가기 버튼을 한 번 더 누르면 종료됩니다.", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        })
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
