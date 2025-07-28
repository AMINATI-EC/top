// 📧 Email Notification Module (Gmail SMTP対応版)
// ローカルNode.jsサーバー連携

class EmailNotificationService {
    constructor() {
        this.apiUrl = 'http://localhost:8001/send-order-email';
        this.healthUrl = 'http://localhost:8001/health';
        this.testUrl = 'http://localhost:8001/test-email';
    }
    
    // 注文完了メール送信（Gmail SMTP版）
    async sendOrderNotification(orderData) {
        try {
            console.log('📧 Gmail メール送信開始...', orderData);
            
            // Admin設定からメールアドレスを取得
            let adminEmail = this.getAdminEmail();
            
            // 管理者メールアドレスが取得できない場合はデフォルトを使用
            if (!adminEmail) {
                console.warn('⚠️ 管理者メールアドレスが設定されていないため、デフォルトアドレスを使用します');
                adminEmail = 'aminati.ec@gmail.com';
            }
            
            // Node.jsサーバーが起動しているかチェック
            const healthCheck = await this.checkServerHealth();
            if (!healthCheck.success) {
                throw new Error('メールサーバーが起動していません。email-server.js を起動してください。');
            }
            
            // APIに送信するデータ形式に変換
            const emailData = this.formatEmailData(orderData, adminEmail);
            
            console.log('🌐 メールサーバー呼び出し:', this.apiUrl);
            console.log('📝 送信データ:', emailData);
            
            // Node.js Gmail サーバーを呼び出し
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            console.log('📊 レスポンス状態:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ メールサーバーエラーレスポンス:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Gmail メール送信成功:', result);
            
            this.showEmailSuccess(orderData, result);
            return { success: true, result };
            
        } catch (error) {
            console.error('❌ Gmail メール送信エラー:', error);
            this.showEmailFallback(orderData, error);
            return { success: false, error: error.message };
        }
    }
    
    // サーバーヘルスチェック
    async checkServerHealth() {
        try {
            const response = await fetch(this.healthUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ メールサーバー正常:', result);
                return { success: true, result };
            } else {
                return { success: false, error: `サーバーエラー: ${response.status}` };
            }
        } catch (error) {
            console.error('❌ サーバーヘルスチェック失敗:', error);
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
    
    // メールデータのフォーマット（Gmail サーバー用）
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
    
    // メール送信成功時の表示（Gmail版）
    showEmailSuccess(orderData, serverResult) {
        const results = serverResult.results || [];
        const adminResult = results.find(r => r.type === 'admin');
        const customerResult = results.find(r => r.type === 'customer');
        
        const successHtml = `
            <div class="modal-overlay" id="emailSuccessModal">
                <div class="modal-content">
                    <div class="success-icon">✅</div>
                    <h2>Gmail メール送信完了</h2>
                    
                    <div class="success-content">
                        <p><strong>以下にメールを送信しました：</strong></p>
                        <div class="email-sent-list">
                            ${adminResult && adminResult.success ? `
                            <div class="email-sent-item success">
                                <span class="email-icon">✅</span>
                                <span>管理者: ${adminResult.to}</span>
                                <small>ID: ${adminResult.messageId}</small>
                            </div>
                            ` : `
                            <div class="email-sent-item error">
                                <span class="email-icon">❌</span>
                                <span>管理者: 送信失敗</span>
                            </div>
                            `}
                            
                            ${customerResult ? (customerResult.success ? `
                            <div class="email-sent-item success">
                                <span class="email-icon">📧</span>
                                <span>お客様: ${customerResult.to}</span>
                                <small>ID: ${customerResult.messageId}</small>
                            </div>
                            ` : `
                            <div class="email-sent-item error">
                                <span class="email-icon">❌</span>
                                <span>お客様: ${customerResult.to} (送信失敗)</span>
                            </div>
                            `) : `
                            <div class="email-sent-item skip">
                                <span class="email-icon">⚪</span>
                                <span>お客様: メールアドレス未入力のためスキップ</span>
                            </div>
                            `}
                        </div>
                        
                        <div class="success-note">
                            <p>📨 Gmail SMTP経由で送信されました</p>
                            <p>🔔 店舗とお客様に注文通知が届きます</p>
                            <p>💌 送信完了: ${serverResult.message}</p>
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
                flex-direction: column;
                align-items: flex-start;
            }
            .email-sent-item:last-child {
                margin-bottom: 0;
            }
            .email-sent-item.success {
                color: #28a745;
            }
            .email-sent-item.error {
                color: #dc3545;
            }
            .email-sent-item.skip {
                color: #6c757d;
            }
            .email-sent-item small {
                font-size: 11px;
                color: #666;
                margin-left: 20px;
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
    
    // メール送信失敗時のフォールバック（Gmail版）
    showEmailFallback(orderData, error) {
        const isServerError = error.message.includes('メールサーバーが起動していません');
        
        const fallbackHtml = `
            <div class="modal-overlay" id="emailFallbackModal">
                <div class="modal-content">
                    <div class="error-icon">❌</div>
                    <h2>メール送信エラー</h2>
                    
                    <div class="error-content">
                        <p><strong>自動メール送信に失敗しました</strong></p>
                        
                        <div class="error-details">
                            <p><strong>エラー内容:</strong></p>
                            <code>${error.message}</code>
                        </div>
                        
                        ${isServerError ? `
                        <div class="server-help">
                            <h4>📋 解決方法:</h4>
                            <ol>
                                <li>コマンドプロンプトを開く</li>
                                <li>プロジェクトフォルダに移動</li>
                                <li><code>npm install</code> を実行</li>
                                <li><code>npm start</code> を実行</li>
                                <li>メールサーバーが起動したら再度お試しください</li>
                            </ol>
                        </div>
                        ` : ''}
                        
                        <div class="fallback-note">
                            <p>📝 注文データは正常に保存されています</p>
                            <p>🏪 管理画面で注文を確認してください</p>
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
                background: #dc3545;
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
                background: #f8d7da;
                border: 1px solid #f5c6cb;
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
            .server-help {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                text-align: left;
            }
            .server-help h4 {
                margin-bottom: 10px;
            }
            .server-help ol {
                margin-left: 20px;
            }
            .server-help code {
                background: #fff;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: monospace;
            }
            .fallback-note {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }
            .fallback-note p {
                margin-bottom: 8px;
                font-size: 14px;
                line-height: 1.4;
                color: #856404;
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
    
    // テストメール送信（新機能）
    async sendTestEmail() {
        try {
            console.log('📧 Gmail テストメール送信を開始...');
            
            const response = await fetch(this.testUrl, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Gmail テストメール送信成功:', result);
                alert(`✅ Gmail テストメール送信成功!\n\nメッセージID: ${result.messageId}`);
                return { success: true, result };
            } else {
                const error = await response.json();
                console.error('❌ Gmail テストメール送信失敗:', error);
                alert(`❌ Gmail テストメール送信失敗: ${error.error}`);
                return { success: false, error };
            }
        } catch (error) {
            console.error('❌ Gmail テストメール送信エラー:', error);
            alert(`❌ Gmail テストメール送信エラー: ${error.message}`);
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