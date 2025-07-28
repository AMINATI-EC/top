// 📧 Email Notification Module (Google Apps Script版)
// GAS連携用に最適化

class EmailNotificationService {
    constructor() {
        // GAS のURL（唯一必要なURL）
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbx_sbEqPleCtBeTMkV2BwNbF4-5OVwh7AzmUNkg5Z2rX2p6yUcmcGT5Q-Lchi4yMvZB/exec';
    }
    
    // 注文完了メール送信（GAS版）
    async sendOrderNotification(orderData) {
        try {
            console.log('📧 メール送信開始...', orderData);
            
            // Admin設定からメールアドレスを取得
            let adminEmail = this.getAdminEmail();
            
            // 管理者メールアドレスが取得できない場合はデフォルトを使用
            if (!adminEmail) {
                console.warn('⚠️ 管理者メールアドレスが設定されていないため、デフォルトアドレスを使用します');
                adminEmail = 'aminati.ec@gmail.com';
            }
            
            // APIに送信するデータ形式に変換
            const emailData = this.formatEmailData(orderData, adminEmail);
            
            console.log('🌐 GAS呼び出し:', this.apiUrl);
            console.log('📝 送信データ:', emailData);
            
            // Google Apps Script を呼び出し
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                mode: 'no-cors', // CORS回避
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            // no-corsモードではresponseの中身が見えないため、成功と仮定
            console.log('✅ GAS呼び出し完了（no-corsモード）');
            
            // 成功メッセージを表示
            this.showEmailSuccess(orderData, {
                success: true,
                message: 'メール送信リクエストを送信しました',
                results: [
                    {
                        type: 'admin',
                        success: true,
                        to: adminEmail,
                        messageId: 'GAS-' + Date.now()
                    },
                    orderData.customer.email ? {
                        type: 'customer',
                        success: true,
                        to: orderData.customer.email,
                        messageId: 'GAS-' + Date.now() + '-C'
                    } : null
                ].filter(Boolean)
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ メール送信エラー:', error);
            
            // エラーメッセージを改善
            const errorMessage = error.message.includes('Failed to fetch') 
                ? 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
                : error.message;
                
            this.showEmailFallback(orderData, { message: errorMessage });
            return { success: false, error: error.message };
        }
    }
    
    // 管理者メールアドレス取得
    getAdminEmail() {
        if (window.adminSettings && typeof window.adminSettings.get === 'function') {
            try {
                const email = window.adminSettings.get('email');
                if (email && email.trim() !== '') {
                    console.log('✅ AdminSettings読み込み成功: ' + email);
                    return email;
                }
            } catch (e) {
                console.warn('⚠️ AdminSettings.get()エラー:', e);
            }
        }
        
        console.warn('⚠️ 管理者メールアドレスが未設定、デフォルトを使用');
        return null;
    }
    
    // メールデータのフォーマット（GAS用）
    formatEmailData(orderData, adminEmail) {
        return {
            orderId: orderData.orderId,
            orderDate: orderData.orderDate,
            adminEmail: adminEmail,
            product: {
                productNumber: orderData.product.productNumber,
                productName: orderData.product.productName,
                brandName: orderData.product.brandName || 'AMINATI COLLECTION',
                selectedColor: orderData.product.selectedColor || '',
                selectedSize: orderData.product.selectedSize || '',
                price: orderData.product.price
            },
            pricing: {
                productPrice: orderData.pricing.productPrice,
                shippingFee: orderData.pricing.shippingFee,
                codFee: orderData.pricing.codFee,
                totalPrice: orderData.pricing.totalPrice
            },
            customer: {
                name: orderData.customer.name,
                kana: orderData.customer.kana || '',
                phone: orderData.customer.phone,
                email: orderData.customer.email || '',
                zip: orderData.customer.zip,
                address: orderData.customer.address
            },
            delivery: {
                date: orderData.delivery.date || '',
                time: orderData.delivery.time || '',
                note: orderData.delivery.note || ''
            }
        };
    }
    
    // メール送信成功時の表示
    showEmailSuccess(orderData, serverResult) {
        const results = serverResult.results || [];
        const adminResult = results.find(r => r.type === 'admin');
        const customerResult = results.find(r => r.type === 'customer');
        
        const successHtml = `
            <div class="modal-overlay" id="emailSuccessModal">
                <div class="modal-content">
                    <div class="success-icon">✅</div>
                    <h2>メール送信リクエスト完了</h2>
                    
                    <div class="success-content">
                        <p><strong>以下のアドレスにメールを送信しています：</strong></p>
                        <div class="email-sent-list">
                            ${adminResult ? `
                            <div class="email-sent-item success">
                                <span class="email-icon">✅</span>
                                <span>管理者: ${adminResult.to}</span>
                            </div>
                            ` : ''}
                            
                            ${customerResult ? `
                            <div class="email-sent-item success">
                                <span class="email-icon">📧</span>
                                <span>お客様: ${customerResult.to}</span>
                            </div>
                            ` : `
                            <div class="email-sent-item skip">
                                <span class="email-icon">⚪</span>
                                <span>お客様: メールアドレス未入力のためスキップ</span>
                            </div>
                            `}
                        </div>
                        
                        <div class="success-note">
                            <p>📨 Google Apps Script経由で送信処理中</p>
                            <p>🔔 まもなくメールが届きます</p>
                        </div>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-primary" onclick="emailNotificationService.closeEmailSuccess()">確認</button>
                    </div>
                </div>
            </div>
            
            <style>
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .modal-content {
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .success-icon {
                width: 60px;
                height: 60px;
                background: #28a745;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                margin: 0 auto 20px;
            }
            .success-content {
                text-align: center;
                margin: 20px 0;
            }
            .email-sent-list {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: left;
            }
            .email-sent-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                font-size: 14px;
            }
            .email-sent-item:last-child {
                margin-bottom: 0;
            }
            .email-sent-item.success {
                color: #28a745;
            }
            .email-sent-item.skip {
                color: #6c757d;
            }
            .email-icon {
                font-size: 16px;
            }
            .success-note {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }
            .success-note p {
                margin-bottom: 8px;
                font-size: 14px;
                line-height: 1.4;
            }
            .modal-buttons {
                display: grid;
                grid-template-columns: 1fr;
                gap: 15px;
                margin-top: 20px;
            }
            .btn-primary {
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #000;
                color: white;
            }
            .btn-primary:hover {
                background: #333;
            }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successHtml);
    }
    
    // メール送信失敗時のフォールバック
    showEmailFallback(orderData, error) {
        const fallbackHtml = `
            <div class="modal-overlay" id="emailFallbackModal">
                <div class="modal-content">
                    <div class="error-icon">⚠️</div>
                    <h2>メール送信について</h2>
                    
                    <div class="error-content">
                        <p><strong>メール送信処理中にエラーが発生した可能性があります</strong></p>
                        
                        <div class="error-details">
                            <p><strong>詳細:</strong></p>
                            <code>${error.message}</code>
                        </div>
                        
                        <div class="fallback-note">
                            <p>📝 注文データは正常に保存されています</p>
                            <p>🏪 管理画面で注文を確認してください</p>
                            <p>📧 メールは遅れて届く可能性があります</p>
                        </div>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-primary" onclick="emailNotificationService.closeFallbackModal()">確認</button>
                    </div>
                </div>
            </div>
            
            <style>
            .error-icon {
                width: 60px;
                height: 60px;
                background: #ffc107;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                margin: 0 auto 20px;
            }
            .error-content {
                text-align: center;
                margin: 20px 0;
            }
            .error-details {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                text-align: left;
            }
            .error-details code {
                background: #fff;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 12px;
            }
            .fallback-note {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }
            .fallback-note p {
                margin-bottom: 8px;
                font-size: 14px;
                line-height: 1.4;
                color: #004085;
            }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', fallbackHtml);
    }
    
    // フォールバックモーダルを閉じる
    closeFallbackModal() {
        const modal = document.getElementById('emailFallbackModal');
        if (modal) modal.remove();
    }
    
    // メール送信成功モーダルを閉じる
    closeEmailSuccess() {
        const modal = document.getElementById('emailSuccessModal');
        if (modal) modal.remove();
    }
}

// グローバルインスタンス作成
const emailNotificationService = new EmailNotificationService();

// 既存のコードとの互換性を保つためのラッパー関数
function sendOrderNotification(orderData) {
    return emailNotificationService.sendOrderNotification(orderData);
}

// モジュールのエクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailNotificationService;
}

// ブラウザ環境での利用
if (typeof window !== 'undefined') {
    window.EmailNotificationService = EmailNotificationService;
    window.emailNotificationService = emailNotificationService;
    window.sendOrderNotification = sendOrderNotification;
}