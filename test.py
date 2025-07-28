#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🛒 AMINATI_EC 注文確定ボタン動作テスト（最終ステップ）
================================================================================
問題: 配送先情報入力後の「注文を確定する」ボタンが押せない
対象URL: blob:http://localhost:8000/[動的生成されたID]
テストフロー:
1. 注文ボタン → ✅ 動作確認済み
2. 注文内容確認 → ✅ 動作確認済み  
3. 配送先入力 → ❌ 「注文を確定する」が押せない ← 今回のターゲット
================================================================================
"""

import time
import json
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

class OrderFinalStepTester:
    """注文確定ボタンテスト"""
    
    def __init__(self):
        self.driver = None
        
    def setup_driver(self):
        """WebDriverセットアップ"""
        try:
            options = Options()
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--window-size=375,812')  # モバイルサイズ
            
            self.driver = webdriver.Chrome(options=options)
            self.driver.set_page_load_timeout(30)
            return True
        except Exception as e:
            logger.error(f"❌ WebDriverセットアップ失敗: {e}")
            return False
    
    def cleanup(self):
        if self.driver:
            self.driver.quit()
    
    def test_with_blob_url(self, blob_url):
        """🧪 パターン1: 指定されたBlobURLで直接テスト"""
        logger.info("🧪 パターン1: 指定BlobURLで直接テスト")
        
        try:
            logger.info(f"   🌐 アクセス: {blob_url}")
            self.driver.get(blob_url)
            time.sleep(3)
            
            # ページ構造確認
            page_info = self.driver.execute_script("""
                return {
                    title: document.title,
                    hasOrderButton: document.querySelector('.btn-add-cart') !== null,
                    orderButtonText: document.querySelector('.btn-add-cart')?.textContent,
                    hasSubmitOrder: typeof submitOrder !== 'undefined',
                    hasSaveOrder: typeof saveOrder !== 'undefined',
                    hasEmailNotification: typeof sendOrderNotification !== 'undefined'
                };
            """)
            
            logger.info(f"   📄 ページ情報: {page_info}")
            
            return self.complete_order_flow_test()
            
        except Exception as e:
            logger.error(f"   ❌ エラー: {e}")
            return False
    
    def test_from_admin_indexeddb(self):
        """🧪 パターン2: 管理画面のIndexedDBから商品を取得してテスト"""
        logger.info("🧪 パターン2: IndexedDBから商品HTMLを取得してテスト")
        
        try:
            # 管理画面にアクセス
            self.driver.get("http://localhost:8000/admin.html")
            time.sleep(3)
            
            # IndexedDBから商品を取得
            product_html = self.driver.execute_script("""
                return new Promise((resolve) => {
                    const request = indexedDB.open('AminatiECProducts', 1);
                    
                    request.onsuccess = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains('products')) {
                            resolve(null);
                            return;
                        }
                        
                        const transaction = db.transaction(['products'], 'readonly');
                        const store = transaction.objectStore('products');
                        const getAllRequest = store.getAll();
                        
                        getAllRequest.onsuccess = () => {
                            const products = getAllRequest.result || [];
                            if (products.length > 0) {
                                resolve(products[0].html);
                            } else {
                                resolve(null);
                            }
                        };
                        
                        getAllRequest.onerror = () => resolve(null);
                    };
                    
                    request.onerror = () => resolve(null);
                });
            """)
            
            if not product_html:
                logger.info("   ⚠️ IndexedDBに商品がありません")
                return False
            
            logger.info(f"   💾 商品HTML取得成功: {len(product_html)} 文字")
            
            # BlobURLで商品ページを開く
            blob_url = self.driver.execute_script("""
                const html = arguments[0];
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                return url;
            """, product_html)
            
            logger.info(f"   🌐 生成されたBlobURL: {blob_url}")
            
            # 新しいタブに切り替え
            time.sleep(2)
            self.driver.switch_to.window(self.driver.window_handles[-1])
            time.sleep(3)
            
            return self.complete_order_flow_test()
            
        except Exception as e:
            logger.error(f"   ❌ エラー: {e}")
            return False
    
    def complete_order_flow_test(self):
        """完全な注文フローテスト"""
        logger.info("   🛒 完全注文フローテスト開始")
        
        try:
            # ステップ1: 注文ボタンクリック
            logger.info("   📍 ステップ1: 注文ボタンクリック")
            order_btn = self.driver.find_element(By.CSS_SELECTOR, '.btn-add-cart')
            self.driver.execute_script("arguments[0].click();", order_btn)
            time.sleep(2)
            
            # 概算確認モーダルの確認
            estimate_modal = self.driver.find_element(By.CSS_SELECTOR, '#estimateModal')
            if estimate_modal:
                logger.info("   ✅ 概算確認モーダル表示成功")
                
                # ステップ2: 「この内容で注文する」クリック
                logger.info("   📍 ステップ2: 注文内容確認")
                proceed_btn = self.driver.find_element(By.CSS_SELECTOR, '.btn-primary')
                self.driver.execute_script("arguments[0].click();", proceed_btn)
                time.sleep(2)
                
                # 配送先入力フォームの確認
                shipping_modal = self.driver.find_element(By.CSS_SELECTOR, '#shippingModal')
                if shipping_modal:
                    logger.info("   ✅ 配送先入力フォーム表示成功")
                    
                    # ステップ3: 配送先情報入力
                    logger.info("   📍 ステップ3: 配送先情報入力")
                    return self.fill_shipping_form_and_test_submit()
                else:
                    logger.info("   ❌ 配送先入力フォーム未表示")
                    return False
            else:
                logger.info("   ❌ 概算確認モーダル未表示")
                return False
                
        except NoSuchElementException as e:
            logger.error(f"   ❌ 要素が見つからない: {e}")
            return False
        except Exception as e:
            logger.error(f"   ❌ エラー: {e}")
            return False
    
    def fill_shipping_form_and_test_submit(self):
        """配送先フォーム入力と送信テスト"""
        logger.info("   📝 配送先フォーム入力テスト")
        
        try:
            # テストデータ入力
            test_data = {
                'customerName': 'テスト太郎',
                'customerKana': 'テストタロウ',
                'customerPhone': '090-1234-5678',
                'customerEmail': 'test@example.com',
                'customerZip': '123-4567',
                'customerAddress': '東京都渋谷区テスト1-2-3'
            }
            
            # フォーム入力
            for field_name, value in test_data.items():
                try:
                    field = self.driver.find_element(By.ID, field_name)
                    field.clear()
                    field.send_keys(value)
                    logger.info(f"      ✅ {field_name}: {value}")
                except NoSuchElementException:
                    logger.info(f"      ⚠️ {field_name}: フィールドが見つからない")
            
            time.sleep(1)
            
            # submitOrder関数の存在確認
            submit_function_check = self.driver.execute_script("""
                return {
                    submitOrderExists: typeof submitOrder !== 'undefined',
                    saveOrderExists: typeof saveOrder !== 'undefined',
                    sendOrderNotificationExists: typeof sendOrderNotification !== 'undefined',
                    indexedDBSupport: typeof indexedDB !== 'undefined'
                };
            """)
            
            logger.info(f"   🔧 関数チェック: {submit_function_check}")
            
            # 注文確定ボタンの状態確認
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, 'button[onclick*="submitOrder"]')
            btn_info = {
                'text': submit_btn.text,
                'enabled': submit_btn.is_enabled(),
                'displayed': submit_btn.is_displayed(),
                'onclick': submit_btn.get_attribute('onclick')
            }
            
            logger.info(f"   🔘 注文確定ボタン状態: {btn_info}")
            
            # フォーム検証チェック
            validation_result = self.driver.execute_script("""
                const form = document.getElementById('shippingForm');
                const requiredFields = ['customerName', 'customerKana', 'customerPhone', 'customerZip', 'customerAddress'];
                
                let validation = {valid: true, errors: []};
                
                requiredFields.forEach(field => {
                    const element = document.getElementById(field);
                    if (!element || !element.value.trim()) {
                        validation.valid = false;
                        validation.errors.push(field + ' is empty');
                    }
                });
                
                return validation;
            """)
            
            logger.info(f"   ✅ フォーム検証: {validation_result}")
            
            # 実際に注文確定ボタンをクリック
            logger.info("   🖱️ 注文確定ボタンクリック実行")
            
            # クリック前のエラーリスナー設定
            self.driver.execute_script("""
                window.submitOrderErrors = [];
                window.addEventListener('error', function(e) {
                    window.submitOrderErrors.push(e.message);
                });
            """)
            
            # ボタンクリック
            self.driver.execute_script("arguments[0].click();", submit_btn)
            time.sleep(3)
            
            # クリック後の状態確認
            post_click_state = self.driver.execute_script("""
                return {
                    errors: window.submitOrderErrors || [],
                    hasCompleteModal: document.getElementById('completeModal') !== null,
                    hasShippingModal: document.getElementById('shippingModal') !== null,
                    alertShown: false // アラートは取得困難
                };
            """)
            
            logger.info(f"   📊 クリック後状態: {post_click_state}")
            
            # 成功判定
            if post_click_state['hasCompleteModal']:
                logger.info("   ✅ 注文完了モーダル表示 - 注文確定成功！")
                return True
            elif len(post_click_state['errors']) > 0:
                logger.info(f"   ❌ JavaScript エラー発生: {post_click_state['errors']}")
                return False
            else:
                logger.info("   ❌ 注文確定ボタンが反応しない")
                return False
                
        except Exception as e:
            logger.error(f"   ❌ エラー: {e}")
            return False
    
    def test_submit_order_function_directly(self):
        """🧪 パターン3: submitOrder関数の直接テスト"""
        logger.info("🧪 パターン3: submitOrder関数直接テスト")
        
        try:
            # submitOrder関数を直接実行
            result = self.driver.execute_script("""
                try {
                    // テスト用フォームデータ作成
                    const testFormData = new FormData();
                    testFormData.set('customerName', 'テスト太郎');
                    testFormData.set('customerKana', 'テストタロウ');
                    testFormData.set('customerPhone', '090-1234-5678');
                    testFormData.set('customerEmail', 'test@example.com');
                    testFormData.set('customerZip', '123-4567');
                    testFormData.set('customerAddress', '東京都渋谷区テスト1-2-3');
                    
                    // フォーム要素を一時的に作成
                    const tempForm = document.createElement('form');
                    tempForm.id = 'shippingForm';
                    
                    Object.keys(Object.fromEntries(testFormData)).forEach(key => {
                        const input = document.createElement('input');
                        input.id = key;
                        input.name = key;
                        input.value = testFormData.get(key);
                        tempForm.appendChild(input);
                    });
                    
                    document.body.appendChild(tempForm);
                    
                    // submitOrder関数実行
                    if (typeof submitOrder !== 'undefined') {
                        submitOrder();
                        return {success: true, message: 'submitOrder実行成功'};
                    } else {
                        return {success: false, message: 'submitOrder関数が未定義'};
                    }
                } catch (error) {
                    return {success: false, message: error.toString()};
                }
            """)
            
            logger.info(f"   🔧 直接実行結果: {result}")
            
            if result['success']:
                # 完了モーダルの確認
                time.sleep(2)
                complete_modal = self.driver.find_elements(By.CSS_SELECTOR, '#completeModal')
                if complete_modal:
                    logger.info("   ✅ submitOrder直接実行 - 完了モーダル表示成功！")
                    return True
                else:
                    logger.info("   ⚠️ submitOrder実行後、完了モーダル未表示")
                    return False
            else:
                logger.info(f"   ❌ submitOrder実行失敗: {result['message']}")
                return False
                
        except Exception as e:
            logger.error(f"   ❌ エラー: {e}")
            return False
    
    def run_tests(self, blob_url=None):
        """テスト実行"""
        logger.info("🛒 AMINATI_EC 注文確定ボタン動作テスト")
        logger.info("=" * 80)
        logger.info("🎯 問題: 配送先情報入力後の「注文を確定する」ボタンが押せない")
        logger.info("📱 テスト対象: 最終ステップの注文確定処理")
        logger.info("=" * 80)
        
        if not self.setup_driver():
            return False
        
        try:
            results = []
            
            # パターン1: 指定されたBlobURLでテスト
            if blob_url:
                logger.info(f"\n📍 指定URL: {blob_url}")
                result1 = self.test_with_blob_url(blob_url)
                results.append(("指定BlobURL", result1))
            
            # パターン2: IndexedDBから取得してテスト
            result2 = self.test_from_admin_indexeddb()
            results.append(("IndexedDB取得", result2))
            
            # パターン3: submitOrder関数直接テスト
            if any(r[1] for r in results):  # 前のテストで商品ページが開けた場合
                result3 = self.test_submit_order_function_directly()
                results.append(("submitOrder直接実行", result3))
            
            # 結果サマリー
            logger.info("\n📊 テスト結果サマリー")
            logger.info("=" * 80)
            
            success_count = 0
            for test_name, success in results:
                status = "✅ 成功" if success else "❌ 失敗"
                logger.info(f"🔍 {test_name}: {status}")
                if success:
                    success_count += 1
            
            if success_count > 0:
                logger.info(f"\n🎉 {success_count}個のパターンで注文確定が成功しました！")
                logger.info("💡 問題は特定の条件やタイミングにある可能性があります")
            else:
                logger.info("\n❌ 全てのパターンで注文確定が失敗しました")
                logger.info("💡 修正提案:")
                logger.info("   1. submitOrder関数の定義を確認")
                logger.info("   2. フォームバリデーションロジックを確認") 
                logger.info("   3. IndexedDB保存処理を確認")
                logger.info("   4. sendOrderNotification関数を確認")
            
            return success_count > 0
            
        finally:
            self.cleanup()

def main():
    """メイン実行"""
    logger.info("💡 使用方法:")
    logger.info("   1. 特定のBlobURLでテスト: python test.py [BlobURL]")
    logger.info("   2. 自動テスト: python test.py")
    logger.info("")
    
    blob_url = None
    if len(sys.argv) > 1:
        blob_url = sys.argv[1]
        logger.info(f"📍 指定されたURL: {blob_url}")
    
    tester = OrderFinalStepTester()
    success = tester.run_tests(blob_url)
    
    if success:
        logger.info("\n🎊 テスト完了：注文確定ボタンの動作を確認しました！")
    else:
        logger.info("\n💔 テスト完了：注文確定ボタンに問題があります")

if __name__ == "__main__":
    main()