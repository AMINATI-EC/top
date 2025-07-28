@echo off
chcp 65001 > nul
title AMINATI_EC Server

echo ====================================
echo    AMINATI_EC ローカルサーバー
echo ====================================
echo.

:: Pythonがインストールされているか確認
python --version > nul 2>&1
if errorlevel 1 (
    py --version > nul 2>&1
    if errorlevel 1 (
        echo ❌ エラー: Pythonがインストールされていません！
        echo.
        echo Pythonをインストールしてください:
        echo https://www.python.org/downloads/
        echo.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

:: スクリプトが存在するか確認
if not exist "start_server.py" (
    echo ❌ エラー: start_server.py が見つかりません！
    echo.
    echo このバッチファイルと同じフォルダに
    echo start_server.py を配置してください。
    echo.
    pause
    exit /b 1
)

:: Pythonスクリプトを実行
%PYTHON_CMD% start_server.py

:: エラーが発生した場合は一時停止
if errorlevel 1 (
    echo.
    echo ❌ エラーが発生しました
    pause
)