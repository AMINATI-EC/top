// ====================================
// events.js - イベント処理
// ====================================

const Events = {
    
    // 雇用候補のキャッシュ
    hireCandidates: [],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.bindStaticEvents();
    },
    
    bindStaticEvents() {
        // スタートボタン
        document.getElementById('start-btn').addEventListener('click', () => {
            Main.startGame();
        });
        
        // リトライボタン
        document.getElementById('retry-btn').addEventListener('click', () => {
            Main.startGame();
        });
        
        // 翌日へ進む
        document.getElementById('next-day-btn').addEventListener('click', () => {
            Main.nextDay();
        });
        
        // レポート閉じる
        document.getElementById('close-report').addEventListener('click', () => {
            Main.closeReport();
        });
        
        // 雇用モーダル開く
        document.getElementById('open-hire').addEventListener('click', () => {
            this.openHireModal();
        });
        
        // 雇用モーダル閉じる
        document.getElementById('close-hire').addEventListener('click', () => {
            UI.hideHireModal();
        });
        
        // タブ切り替え
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                UI.switchTab(tab.dataset.tab);
            });
        });
    },
    
    // ====================================
    // 動的イベント（再バインド必要）
    // ====================================
    
    bindDynamicEvents() {
        this.bindProductEvents();
        this.bindStaffEvents();
        this.bindInvestEvents();
        this.bindDevelopEvents();
        this.bindBankEvents();
        this.bindCampaignEvents();
        this.bindLocationEvents();
    },
    
    bindProductEvents() {
        // スライダーイベント
        document.querySelectorAll('.order-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const productId = slider.dataset.product;
                const value = parseInt(e.target.value);
                const product = CONFIG.getProduct(productId);
                
                GameState.orders[productId] = value;
                
                // 表示更新（アニメーション付き）
                const valEl = document.getElementById(`order-val-${productId}`);
                const costEl = document.getElementById(`order-cost-${productId}`);
                valEl.textContent = value;
                valEl.classList.add('value-pop');
                setTimeout(() => valEl.classList.remove('value-pop'), 150);
                costEl.textContent = `（¥${(value * product.cost).toLocaleString()}）`;
                
                // 触覚フィードバック（10単位でカチッと）
                if (value % 10 === 0 && navigator.vibrate) {
                    navigator.vibrate(5);
                }
            });
            
            // スライダー範囲の動的拡張
            slider.addEventListener('change', (e) => {
                const productId = slider.dataset.product;
                const value = parseInt(e.target.value);
                const currentMax = parseInt(slider.max);
                
                // 上限に近づいたら拡張
                if (value >= currentMax - 20) {
                    slider.max = currentMax + 100;
                }
            });
        });
        
        // クイックボタンイベント
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.product;
                const action = btn.dataset.action;
                const product = CONFIG.getProduct(productId);
                const slider = document.getElementById(`slider-${productId}`);
                let newValue = GameState.orders[productId] || 0;
                
                if (action === 'clear') {
                    newValue = 0;
                } else if (action === 'add50') {
                    newValue += 50;
                } else if (action === 'add100') {
                    newValue += 100;
                } else if (action === 'max') {
                    // 所持金で買える最大数
                    newValue = Math.floor(GameState.cash / product.cost);
                }
                
                GameState.orders[productId] = newValue;
                slider.value = newValue;
                
                // スライダーmax拡張
                if (newValue >= parseInt(slider.max) - 20) {
                    slider.max = Math.ceil(newValue / 100) * 100 + 100;
                }
                
                // 表示更新
                const valEl = document.getElementById(`order-val-${productId}`);
                const costEl = document.getElementById(`order-cost-${productId}`);
                valEl.textContent = newValue;
                valEl.classList.add('value-pop');
                setTimeout(() => valEl.classList.remove('value-pop'), 150);
                costEl.textContent = `（¥${(newValue * product.cost).toLocaleString()}）`;
                
                // 触覚フィードバック
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            });
        });
    },
    
    bindStaffEvents() {
        document.querySelectorAll('.shift-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const staffId = parseInt(btn.dataset.staff);
                const slotId = btn.dataset.slot;
                
                Staff.toggleShift(staffId, slotId);
                
                UI.renderStaff();
                this.bindStaffEvents();
            });
        });
    },
    
    bindInvestEvents() {
        document.querySelectorAll('.invest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const investId = btn.dataset.invest;
                
                if (GameState.purchaseInvestment(investId)) {
                    UI.renderAll();
                    this.bindDynamicEvents();
                }
            });
        });
    },
    
    // ====================================
    // 雇用モーダル
    // ====================================
    
    openHireModal() {
        this.hireCandidates = Staff.generateCandidates(3);
        UI.showHireModal(this.hireCandidates);
        this.bindHireEvents();
    },
    
    bindHireEvents() {
        document.querySelectorAll('.hire-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const candidate = this.hireCandidates[index];
                
                if (candidate && Staff.hire(candidate)) {
                    UI.hideHireModal();
                    UI.renderAll();
                    this.bindDynamicEvents();
                }
            });
        });
    },
    
    // ====================================
    // 開発イベント
    // ====================================
    
    bindDevelopEvents() {
        document.querySelectorAll('.develop-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.product;
                const result = Development.startDevelopment(productId);
                if (result.success) {
                    UI.renderDevelopment();
                    UI.renderHeader();
                }
                alert(result.message);
            });
        });
    },
    
    // ====================================
    // 銀行イベント
    // ====================================
    
    bindBankEvents() {
        // 借入ボタン
        document.querySelectorAll('.borrow-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const planId = btn.dataset.plan;
                const result = Bank.borrow(planId);
                if (result.success) {
                    UI.renderBank();
                    UI.renderHeader();
                }
                alert(result.message);
            });
        });
        
        // 全額返済ボタン
        const repayBtn = document.getElementById('repay-all-btn');
        if (repayBtn) {
            repayBtn.addEventListener('click', () => {
                const result = Bank.repayAll();
                if (result.success) {
                    UI.renderBank();
                    UI.renderHeader();
                }
                alert(result.message);
            });
        }
        
        // セキュリティアップグレード
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const upgradeId = btn.dataset.upgrade;
                const result = Security.purchaseUpgrade(upgradeId);
                if (result.success) {
                    UI.renderBank();
                    UI.renderHeader();
                }
                alert(result.message);
            });
        });
        
        // 仕入れ先変更
        document.querySelectorAll('.supplier-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const supplierId = btn.dataset.supplier;
                const result = Suppliers.switchSupplier(supplierId);
                if (result.success) {
                    UI.renderBank();
                }
                alert(result.message);
            });
        });
    },
    
    // ====================================
    // キャンペーンイベント
    // ====================================
    
    bindCampaignEvents() {
        document.querySelectorAll('.campaign-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const campaignId = btn.dataset.campaign;
                const result = Campaign.startCampaign(campaignId);
                if (result.success) {
                    UI.renderCampaign();
                    UI.renderHeader();
                }
                alert(result.message);
            });
        });
    },
    
    // ====================================
    // 立地イベント
    // ====================================
    
    bindLocationEvents() {
        document.querySelectorAll('.location-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const locationId = btn.dataset.location;
                const action = btn.dataset.action;
                let result;
                
                if (action === 'unlock') {
                    result = Location.unlockLocation(locationId);
                } else if (action === 'move') {
                    result = Location.moveTo(locationId);
                }
                
                if (result && result.success) {
                    UI.renderLocation();
                    UI.renderHeader();
                    UI.renderInfo();
                }
                alert(result.message);
            });
        });
    },
};
