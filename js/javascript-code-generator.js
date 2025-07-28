// メール送信部分は分割版のコードを維持（動作確認済みのもの）
    getPurchaseFlowScript() {
        return `
        // EmailNotificationService（Google Apps Script版）
        class EmailNotificationService {
            constructor() {
                this.apiUrl = 'https://script.google.com/macros/s/AKfycbx_sbEqPleCtBeTMkV2BwNbF4-5OVwh7AzmUNkg5Z2rX2p6yUcmcGT5Q-Lchi4yMvZB/exec';
            }
            
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
                    
                    this.showEmailSuccess(orderData, adminEmail);
                    return { success: true };
                    
                } catch (error) {
                    console.error('❌ メール送信エラー:', error);
                    this.showEmailFallback(orderData, error);
                    return { success: false, error: error.message };
                }
            }
            
            // 管理者メールアドレスを取得
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
            
            showEmailSuccess(orderData, adminEmail) {
                const customerEmail = orderData.customer.email;
                
                const successHtml = \`
                    <div class="modal-overlay" id="emailSuccessModal">
                        <div class="modal-content">
                            <div class="success-icon">✅</div>
                            <h2>メール送信リクエスト完了</h2>
                            
                            <div class="success-content">
                                <p><strong>以下のアドレスにメールを送信しています：</strong></p>
                                <div class="email-sent-list">
                                    <div class="email-sent-item success">
                                        <span class="email-icon">✅</span>
                                        <span>管理者: \${adminEmail}</span>
                                    </div>
                                    
                                    \${customerEmail && customerEmail.trim() !== '' ? \`
                                    <div class="email-sent-item success">
                                        <span class="email-icon">📧</span>
                                        <span>お客様: \${customerEmail}</span>
                                    </div>
                                    \` : \`
                                    <div class="email-sent-item skip">
                                        <span class="email-icon">⚪</span>
                                        <span>お客様: メールアドレス未入力のためスキップ</span>
                                    </div>
                                    \`}
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
                \`;
                
                document.body.insertAdjacentHTML('beforeend', successHtml);
            }
            
            showEmailFallback(orderData, error) {
                const fallbackHtml = \`
                    <div class="modal-overlay" id="emailFallbackModal">
                        <div class="modal-content">
                            <div class="error-icon">⚠️</div>
                            <h2>メール送信について</h2>
                            
                            <div class="error-content">
                                <p><strong>メール送信処理中にエラーが発生した可能性があります</strong></p>
                                
                                <div class="error-details">
                                    <p><strong>詳細:</strong></p>
                                    <code>\${error.message}</code>
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
                \`;
                
                document.body.insertAdjacentHTML('beforeend', fallbackHtml);
            }
            
            closeFallbackModal() {
                const modal = document.getElementById('emailFallbackModal');
                if (modal) modal.remove();
            }
            
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
        
        // 購入フロー開始
        function startPurchaseFlow() {
            const selectedColor = document.querySelector('.color-option.active')?.dataset.value || '';
            const selectedSize = document.querySelector('.size-option.active')?.dataset.value || '';
            
            const purchaseData = {
                ...currentProduct,
                selectedColor: selectedColor,
                selectedSize: selectedSize,
                timestamp: new Date().toISOString()
            };
            
            sessionStorage.setItem('purchaseData', JSON.stringify(purchaseData));
            showEstimateModal(purchaseData);
        }
        
        // 概算確認モーダル
        function showEstimateModal(purchaseData) {
            const shippingFee = 500;
            const codFee = 330;
            const totalPrice = purchaseData.price + shippingFee + codFee;
            
            const modalHtml = \`
                <div class="modal-overlay" id="estimateModal">
                    <div class="modal-content">
                        <h2>ご注文内容の確認</h2>
                        
                        <div class="order-summary">
                            <div class="product-info">
                                <h3>\${purchaseData.productName}</h3>
                                <p>ブランド: \${purchaseData.brandName}</p>
                                <p>カラー: \${purchaseData.selectedColor}</p>
                                <p>サイズ: \${purchaseData.selectedSize}</p>
                            </div>
                            
                            <div class="price-breakdown">
                                <div class="price-item">
                                    <span>商品代金</span>
                                    <span>¥\${formatNumber(purchaseData.price)}</span>
                                </div>
                                <div class="price-item">
                                    <span>配送料</span>
                                    <span>¥\${formatNumber(shippingFee)}</span>
                                </div>
                                <div class="price-item">
                                    <span>代引き手数料</span>
                                    <span>¥\${formatNumber(codFee)}</span>
                                </div>
                                <div class="price-total">
                                    <span>合計金額</span>
                                    <span>¥\${formatNumber(totalPrice)}</span>
                                </div>
                            </div>
                            
                            <div class="payment-info">
                                <p><strong>お支払い方法:</strong> 代金引換（現金のみ）</p>
                                <p><small>※商品到着時に配達員にお支払いください</small></p>
                            </div>
                        </div>
                        
                        <div class="modal-buttons">
                            <button class="btn-secondary" onclick="closeEstimateModal()">戻る</button>
                            <button class="btn-primary" onclick="proceedToShipping()">この内容で注文する</button>
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
                    max-width: 400px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .modal-content h2 {
                    font-size: 20px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .order-summary {
                    margin-bottom: 25px;
                }
                .product-info {
                    padding: 15px;
                    background: #f8f8f8;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .product-info h3 {
                    font-size: 16px;
                    margin-bottom: 10px;
                }
                .product-info p {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }
                .price-breakdown {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                .price-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                .price-total {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    font-size: 16px;
                    padding-top: 10px;
                    border-top: 1px solid #e0e0e0;
                    margin-top: 10px;
                }
                .payment-info {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #ffeaa7;
                }
                .payment-info p {
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                .modal-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 20px;
                }
                .btn-primary, .btn-secondary {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-primary {
                    background: #000;
                    color: white;
                }
                .btn-secondary {
                    background: #f5f5f5;
                    color: #333;
                }
                .btn-primary:hover {
                    background: #333;
                }
                .btn-secondary:hover {
                    background: #e0e0e0;
                }
                </style>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const estimateData = {
                ...purchaseData,
                shippingFee: shippingFee,
                codFee: codFee,
                totalPrice: totalPrice
            };
            sessionStorage.setItem('estimateData', JSON.stringify(estimateData));
        }
        
        function closeEstimateModal() {
            const modal = document.getElementById('estimateModal');
            if (modal) modal.remove();
        }
        
        function proceedToShipping() {
            closeEstimateModal();
            showShippingForm();
        }
        
        // 配送先入力フォーム
        function showShippingForm() {
            const modalHtml = \`
                <div class="modal-overlay" id="shippingModal">
                    <div class="modal-content shipping-form">
                        <h2>配送先情報の入力</h2>
                        
                        <form id="shippingForm">
                            <div class="form-group">
                                <label for="customerName">お名前 <span class="required">*</span></label>
                                <input type="text" id="customerName" name="customerName" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerKana">お名前（フリガナ） <span class="required">*</span></label>
                                <input type="text" id="customerKana" name="customerKana" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="customerPhone">電話番号 <span class="required">*</span></label>
                                <input type="tel" id="customerPhone" name="customerPhone" required placeholder="例: 090-1234-5678">
                            </div>
                            
                            <div class="form-group">
                                <label for="customerEmail">メールアドレス</label>
                                <input type="email" id="customerEmail" name="customerEmail" placeholder="例: example@email.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="customerZip">郵便番号 <span class="required">*</span></label>
                                <input type="text" id="customerZip" name="customerZip" required placeholder="例: 123-4567">
                            </div>
                            
                            <div class="form-group">
                                <label for="customerAddress">住所 <span class="required">*</span></label>
                                <textarea id="customerAddress" name="customerAddress" required placeholder="都道府県市区町村番地"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="deliveryDate">希望配達日</label>
                                <input type="date" id="deliveryDate" name="deliveryDate">
                                <small>※最短5日後から指定可能</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="deliveryTime">希望配達時間</label>
                                <select id="deliveryTime" name="deliveryTime">
                                    <option value="">指定なし</option>
                                    <option value="午前中">午前中</option>
                                    <option value="12-14">12:00-14:00</option>
                                    <option value="14-16">14:00-16:00</option>
                                    <option value="16-18">16:00-18:00</option>
                                    <option value="18-20">18:00-20:00</option>
                                    <option value="19-21">19:00-21:00</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="orderNote">ご要望・備考</label>
                                <textarea id="orderNote" name="orderNote" placeholder="その他ご要望がございましたらご記入ください"></textarea>
                            </div>
                        </form>
                        
                        <div class="modal-buttons">
                            <button class="btn-secondary" onclick="closeShippingModal()">戻る</button>
                            <button class="btn-primary" onclick="submitOrder()">注文を確定する</button>
                        </div>
                    </div>
                </div>
                
                <style>
                .shipping-form {
                    max-width: 500px;
                    max-height: 90vh;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    font-size: 14px;
                }
                .required {
                    color: #ff0000;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .form-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                .form-group small {
                    display: block;
                    margin-top: 5px;
                    color: #666;
                    font-size: 12px;
                }
                </style>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const today = new Date();
            const minDate = new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000));
            document.getElementById('deliveryDate').min = minDate.toISOString().split('T')[0];
        }
        
        function closeShippingModal() {
            const modal = document.getElementById('shippingModal');
            if (modal) modal.remove();
        }
        
        function submitOrder() {
            const form = document.getElementById('shippingForm');
            const formData = new FormData(form);
            
            const requiredFields = ['customerName', 'customerKana', 'customerPhone', 'customerZip', 'customerAddress'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    isValid = false;
                    document.getElementById(field).style.borderColor = '#ff0000';
                } else {
                    document.getElementById(field).style.borderColor = '#ddd';
                }
            });
            
            if (!isValid) {
                alert('必須項目をすべて入力してください。');
                return;
            }
            
            const estimateData = JSON.parse(sessionStorage.getItem('estimateData'));
            const orderData = {
                orderId: 'ORD-' + Date.now(),
                orderDate: new Date().toISOString(),
                product: {
                    productNumber: estimateData.productNumber,
                    productName: estimateData.productName,
                    brandName: estimateData.brandName,
                    selectedColor: estimateData.selectedColor,
                    selectedSize: estimateData.selectedSize,
                    price: estimateData.price,
                    thumbnail: estimateData.thumbnail
                },
                pricing: {
                    productPrice: estimateData.price,
                    shippingFee: estimateData.shippingFee,
                    codFee: estimateData.codFee,
                    totalPrice: estimateData.totalPrice
                },
                customer: {
                    name: formData.get('customerName'),
                    kana: formData.get('customerKana'),
                    phone: formData.get('customerPhone'),
                    email: formData.get('customerEmail') || '',
                    zip: formData.get('customerZip'),
                    address: formData.get('customerAddress')
                },
                delivery: {
                    date: formData.get('deliveryDate') || '',
                    time: formData.get('deliveryTime') || '',
                    note: formData.get('orderNote') || ''
                },
                status: 'pending'
            };
            
            saveOrder(orderData);
        }
        
        function saveOrder(orderData) {
            const request = indexedDB.open('AminatiECOrders', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('orders')) {
                    const objectStore = db.createObjectStore('orders', { keyPath: 'orderId' });
                    objectStore.createIndex('orderDate', 'orderDate', { unique: false });
                    objectStore.createIndex('status', 'status', { unique: false });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['orders'], 'readwrite');
                const objectStore = transaction.objectStore('orders');
                
                objectStore.add(orderData).onsuccess = () => {
                    // メール通知送信
                    sendOrderNotification(orderData);
                    
                    showOrderComplete(orderData);
                    sessionStorage.removeItem('purchaseData');
                    sessionStorage.removeItem('estimateData');
                };
            };
        }
        
        function showOrderComplete(orderData) {
            closeShippingModal();
            
            const modalHtml = \`
                <div class="modal-overlay" id="completeModal">
                    <div class="modal-content">
                        <div class="complete-icon">✓</div>
                        <h2>ご注文ありがとうございました</h2>
                        
                        <div class="order-info">
                            <p><strong>注文番号:</strong> \${orderData.orderId}</p>
                            <p><strong>注文日時:</strong> \${new Date(orderData.orderDate).toLocaleString('ja-JP')}</p>
                            <p><strong>合計金額:</strong> ¥\${formatNumber(orderData.pricing.totalPrice)}</p>
                        </div>
                        
                        <div class="complete-message">
                            <p>ご注文を承りました。</p>
                            <p>商品は代金引換でお届けいたします。</p>
                            <p>配送について詳細をお電話にてご連絡する場合がございます。</p>
                        </div>
                        
                        <div class="modal-buttons">
                            <button class="btn-primary" onclick="closeCompleteModal()">閉じる</button>
                        </div>
                    </div>
                </div>
                
                <style>
                .complete-icon {
                    width: 60px;
                    height: 60px;
                    background: #28a745;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    font-weight: bold;
                    margin: 0 auto 20px;
                }
                .order-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .order-info p {
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                .complete-message {
                    text-align: center;
                    margin: 20px 0;
                }
                .complete-message p {
                    margin-bottom: 10px;
                    font-size: 14px;
                    line-height: 1.5;
                }
                </style>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        function closeCompleteModal() {
            const modal = document.getElementById('completeModal');
            if (modal) modal.remove();
        }`;
    }