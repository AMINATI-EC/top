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
    },
    
    bindProductEvents() {
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.product;
                const action = btn.dataset.action;
                
                if (action === 'add') {
                    const product = CONFIG.getProduct(productId);
                    const orderCost = CONFIG.game.orderUnit * product.cost;
                    // 発注は予約なのでチェックは緩めに
                    GameState.orders[productId] = (GameState.orders[productId] || 0) + CONFIG.game.orderUnit;
                } else {
                    GameState.orders[productId] = Math.max(0, (GameState.orders[productId] || 0) - CONFIG.game.orderUnit);
                }
                
                UI.renderProducts();
                this.bindProductEvents();
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
    },
};
