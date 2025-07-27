// 📧 Email Notification Module (独立モジュール)
// CloudflareWorkers + Resend API連携

class EmailNotificationService {
    constructor() {
        this.apiUrl = 'https://ec-image-uploader.archiver0922.workers.dev/send-order-email';
    }
    
    // 注文完了メール送信（メイン機能）
    async sendOrderNotification(orderData) {
        try {
            console.log('📧 メール送信開始...', orderData);
            
            // Admin設定からメールアドレスを取得
            let adminEmail = this.getAdminEmail();
            
            // APIに送信するデータ形式に変換
            const emailData = this.formatEmailData(orderData, adminEmail);
            
            // CloudflareWorkers APIを呼び出し
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ メール送信成功:', result);
                this.showEmailSuccess(orderData, adminEmail);
                return { success: true, result };
            } else {
                console.error('❌ メール送信失敗:', result);
                this.showEmailFallback(orderData);
                return { success: false, error: result };
            }
            
        } catch (error) {
            console.error('❌ API接続エラー:', error);
            this.showEmailFallback(orderData);
            return { success: false, error: error.message };
        }
    }
    
    // 管理者メールアドレス取得
    getAdminEmail() {
        if (window.adminSettings) {
            const settingsEmail = window.adminSettings.get('email');
            if (settingsEmail && settingsEmail.trim() !== '') {
                return settingsEmail;
            }
        }
        
        console.warn('⚠️ 管理者メールアドレスが未設定です。管理画面で設定してください。');
        return null;
    }
    
    // メールデータのフォーマット
    formatEmailData(orderData, adminEmail) {
        return {
            customerEmail: orderData.customer.email,
            adminEmail: adminEmail, // 設定されている場合のみ送信、未設定ならnull
            orderId: orderData.orderId,
            customerName: orderData.customer.name,
            items: [
                {
                    name: orderData.product.productName,
                    brand: orderData.product.brandName,
                    color: orderData.product.selectedColor,
                    size: orderData.product.selectedSize,
                    price: orderData.pricing.productPrice,
                    quantity: 1
                }
            ],
            pricing: {
                productPrice: orderData.pricing.productPrice,
                shippingFee: orderData.pricing.shippingFee,
                codFee: orderData.pricing.codFee,
                totalPrice: orderData.pricing.totalPrice
            },
            customer: {
                name: orderData.customer.name,
                kana: orderData.customer.kana,
                phone: orderData.customer.phone,
                email: orderData.customer.email,
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
    
    // メール送信成功時の表示（修正版）
    showEmailSuccess(orderData, adminEmail) {
        const successHtml = `
            <div class="modal-overlay" id="emailSuccessModal">
                <div class="modal-content">
                    <div class="success-icon">✅</div>
                    <h2>メール送信完了</h2>
                    
                    <div class="success-content">
                        <p><strong>以下にメールを送信しました：</strong></p>
                        <div class="email-sent-list">
                            ${orderData.customer.email ? `
                            <div class="email-sent-item">
                                <span class="email-icon">📧</span>
                                <span>お客様: ${orderData.customer.email}</span>
                            </div>
                            ` : ''}
                            <div class="email-sent-item">
                                <span class="email-icon">✅</span>
                                <span>店舗への通知完了</span>
                            </div>
                        </div>
                        
                        <div class="success-note">
                            <p>📨 注文詳細は自動的にメールで送信されました</p>
                            <p>🔔 店舗に新規注文の通知が届きます</p>
                        </div>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-primary" onclick="emailNotificationService.closeEmailSuccess()">確認</button>
                    </div>
                </div>
            </div>
            
            <style>
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
            }
            .email-sent-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
                font-size: 14px;
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
    showEmailFallback(orderData) {
        alert('⚠️ 自動メール送信に失敗しました\n\n管理画面で注文を確認してください。\n注文データは正常に保存されています。');
    }
    
    // メール送信成功モーダルを閉じる
    closeEmailSuccess() {
        const modal = document.getElementById('emailSuccessModal');
        if (modal) modal.remove();
    }
    
    // API接続テスト
    async testConnection() {
        try {
            const testUrl = 'https://ec-image-uploader.archiver0922.workers.dev/test-email';
            const response = await fetch(testUrl);
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ API接続テスト成功:', result);
                return { success: true, result };
            } else {
                console.error('❌ API接続テスト失敗:', result);
                return { success: false, error: result };
            }
        } catch (error) {
            console.error('❌ API接続エラー:', error);
            return { success: false, error: error.message };
        }
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