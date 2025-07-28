#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import threading
import webbrowser
import time
import os
import sys
from pathlib import Path

# 設定
PORT = 8000
HOST = "localhost"
BROWSER_DELAY = 1.5  # ブラウザを開くまでの待機時間（秒）

class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """静かなHTTPリクエストハンドラー（ログを最小限に）"""
    def log_message(self, format, *args):
        # 通常のアクセスログを表示しない
        pass
    
    def log_error(self, format, *args):
        # エラーのみ表示
        print(f"エラー: {format % args}")

def find_free_port(start_port=8000):
    """使用可能なポートを探す"""
    port = start_port
    while port < 65535:
        try:
            with socketserver.TCPServer(("", port), None) as s:
                return port
        except:
            port += 1
    return None

def start_server():
    """HTTPサーバーを起動"""
    global PORT
    
    # 現在のディレクトリを取得
    current_dir = Path.cwd()
    
    # debug-dropzone.htmlが存在するか確認
    if not (current_dir / "debug-dropzone.html").exists():
        print("❌ エラー: debug-dropzone.htmlが見つかりません！")
        print(f"📁 現在のディレクトリ: {current_dir}")
        print("\n以下を確認してください：")
        print("1. このスクリプトをプロジェクトのルートフォルダに配置")
        print("2. debug-dropzone.htmlが同じフォルダに存在すること")
        input("\nEnterキーを押して終了...")
        sys.exit(1)
    
    # 利用可能なポートを探す
    PORT = find_free_port(PORT)
    if not PORT:
        print("❌ エラー: 利用可能なポートが見つかりません")
        input("\nEnterキーを押して終了...")
        sys.exit(1)
    
    # サーバー設定
    Handler = QuietHTTPRequestHandler
    
    try:
        with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
            print("=" * 50)
            print("🚀 AMINATI_EC ローカルサーバー")
            print("=" * 50)
            print(f"✅ サーバー起動成功！")
            print(f"📁 ディレクトリ: {current_dir}")
            print(f"🌐 URL: http://{HOST}:{PORT}/")
            print("=" * 50)
            print("📝 アクセス可能なページ:")
            print(f"  • トップページ: http://{HOST}:{PORT}/debug-dropzone.html")
            print(f"  • 管理画面: http://{HOST}:{PORT}/debug-dropzone.html")
            print("=" * 50)
            print("\n⚠️  終了するには Ctrl+C を押してください\n")
            
            # サーバーを実行
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 サーバーを停止しました")
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        input("\nEnterキーを押して終了...")

def open_browser():
    """ブラウザを開く"""
    time.sleep(BROWSER_DELAY)
    url = f"http://{HOST}:{PORT}/debug-dropzone.html"
    
    # Chromeを優先的に開く
    chrome_opened = False
    
    # Windows
    if sys.platform == "win32":
        chrome_paths = [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            os.path.expandvars("%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe")
        ]
        for chrome_path in chrome_paths:
            if os.path.exists(chrome_path):
                try:
                    webbrowser.register('chrome', None, webbrowser.BackgroundBrowser(chrome_path))
                    webbrowser.get('chrome').open(url)
                    chrome_opened = True
                    print(f"🌐 Chrome でページを開きました: {url}")
                    break
                except:
                    pass
    
    # Mac
    elif sys.platform == "darwin":
        try:
            os.system(f'open -a "Google Chrome" {url}')
            chrome_opened = True
            print(f"🌐 Chrome でページを開きました: {url}")
        except:
            pass
    
    # Linux
    elif sys.platform.startswith("linux"):
        try:
            os.system(f'google-chrome {url} || chromium-browser {url}')
            chrome_opened = True
            print(f"🌐 Chrome でページを開きました: {url}")
        except:
            pass
    
    # Chromeが開けなかった場合はデフォルトブラウザで開く
    if not chrome_opened:
        webbrowser.open(url)
        print(f"🌐 デフォルトブラウザでページを開きました: {url}")

def main():
    """メイン処理"""
    # タイトル表示（Windowsのみ）
    if sys.platform == "win32":
        os.system("title AMINATI_EC Server")
    
    # ブラウザを別スレッドで開く
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # サーバーを起動
    start_server()

if __name__ == "__main__":
    main()