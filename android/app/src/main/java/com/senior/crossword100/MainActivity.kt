package com.senior.crossword100

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var backPressedTime: Long = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 상단 상태표시줄 로열 블루 색상 및 하단 네비게이션 바 설정
        window.statusBarColor = Color.parseColor("#1D4ED8")
        window.navigationBarColor = Color.parseColor("#FAF8F5")

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true
            }

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }
            }
            webChromeClient = WebChromeClient()

            setBackgroundColor(Color.parseColor("#FAF8F5"))
            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView)

        // 시니어 친화적 뒤로가기 제어:
        // 현황판 또는 설정 모달이 열려있으면 먼저 닫고,
        // 메인 퍼즐에서는 2초 내에 2번 터치해야 종료 (실수 종료 방지)
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
