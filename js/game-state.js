// ====================================
// game-state.js - ゲーム状態管理
// ====================================

const GameState = {
    // 基本状態
    day: 1,
    cash: 0,
    yesterdaySales: 0,
    yesterdayProfit: 0,
    
    // 在庫 { productId: [{ qty, expiry }] }
    inventory: {},
    
    // 発注数 { productId: qty }
    orders: {},
    
    // バイトリスト
    staff: [],
    nextStaffId: 1,
    
    // 購入済み設備 { investId: true/false }
    purchasedInvestments: {},
    
    // 統計
    stats: {
        totalSales: 0,
        totalProfit: 0,
        totalWaste: 0,
        totalWages: 0,
        totalCustomers: 0,
        daysInRed: 0,        // 赤字日数
    },
    
    // 直近のレポート（コメント生成用）
    lastReport: null,
    
    // ゲーム開始フラグ
    isStarted: false,
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.day = 1;
        this.cash = CONFIG.game.initialCash;
        this.yesterdaySales = 0;
        this.yesterdayProfit = 0;
        this.inventory = {};
        this.orders = {};
        this.staff = [];
        this.nextStaffId = 1;
        this.purchasedInvestments = {};
        this.lastReport = null;
        this.isStarted = true;
        
        this.stats = {
            totalSales: 0,
            totalProfit: 0,
            totalWaste: 0,
            totalWages: 0,
            totalCustomers: 0,
            daysInRed: 0,
        };
        
        this.initInventory();
        this.initStaff();
    },
    
    initInventory() {
        CONFIG.products.forEach(p => {
            const initialQty = CONFIG.initialStock[p.category] || 20;
            this.inventory[p.id] = [{ qty: initialQty, expiry: p.expiry }];
            this.orders[p.id] = 0;
        });
    },
    
    initStaff() {
        // 初期バイト2人
        const staff1 = Staff.generate();
        const staff2 = Staff.generate();
        
        // 初期シフト設定
        staff1.shifts = { morning: true, noon: true, evening: false, night: false, midnight: false };
        staff2.shifts = { morning: false, noon: true, evening: true, night: false, midnight: false };
        
        this.staff.push(staff1);
        this.staff.push(staff2);
    },
    
    // ====================================
    // 在庫操作
    // ====================================
    
    getInventoryQty(productId) {
        const batches = this.inventory[productId] || [];
        return batches.reduce((sum, batch) => sum + batch.qty, 0);
    },
    
    getTotalInventoryValue() {
        let total = 0;
        CONFIG.products.forEach(p => {
            total += this.getInventoryQty(p.id) * p.cost;
        });
        return total;
    },
    
    // 在庫から1つ販売（古いものから）
    sellOne(productId) {
        const batches = this.inventory[productId];
        if (!batches || batches.length === 0) return false;
        
        for (const batch of batches) {
            if (batch.qty > 0) {
                batch.qty--;
                return true;
            }
        }
        return false;
    },
    
    // 発注品を在庫に追加
    receiveOrders() {
        let totalCost = 0;
        
        CONFIG.products.forEach(p => {
            const orderQty = this.orders[p.id] || 0;
            if (orderQty > 0) {
                this.inventory[p.id].push({ qty: orderQty, expiry: p.expiry });
                totalCost += orderQty * p.cost;
            }
        });
        
        this.cash -= totalCost;
        return totalCost;
    },
    
    // 発注リセット
    resetOrders() {
        CONFIG.products.forEach(p => {
            this.orders[p.id] = 0;
        });
    },
    
    // 消費期限処理
    processExpiry() {
        const waste = { items: [], totalLoss: 0 };
        
        CONFIG.products.forEach(p => {
            const batches = this.inventory[p.id];
            let wastedQty = 0;
            
            this.inventory[p.id] = batches.filter(batch => {
                batch.expiry--;
                if (batch.expiry <= 0) {
                    wastedQty += batch.qty;
                    return false;
                }
                return batch.qty > 0;
            });
            
            if (wastedQty > 0) {
                const loss = wastedQty * p.cost;
                waste.items.push({ 
                    productId: p.id,
                    name: p.name, 
                    qty: wastedQty, 
                    loss 
                });
                waste.totalLoss += loss;
            }
        });
        
        this.stats.totalWaste += waste.totalLoss;
        return waste;
    },
    
    // ====================================
    // 設備
    // ====================================
    
    isInvestmentPurchased(investId) {
        return this.purchasedInvestments[investId] === true;
    },
    
    purchaseInvestment(investId) {
        const invest = CONFIG.getInvestment(investId);
        if (!invest) return false;
        if (this.isInvestmentPurchased(investId)) return false;
        if (this.cash < invest.cost) return false;
        
        this.cash -= invest.cost;
        this.purchasedInvestments[investId] = true;
        return true;
    },
    
    getCustomerMultiplier() {
        let multiplier = 1;
        CONFIG.investments.forEach(inv => {
            if (this.isInvestmentPurchased(inv.id) && inv.multiplier.customers) {
                multiplier *= inv.multiplier.customers;
            }
        });
        return multiplier;
    },
    
    getATMIncome() {
        const atm = CONFIG.investments.find(i => i.id === 'atm');
        if (this.isInvestmentPurchased('atm') && atm.multiplier.atmIncome) {
            return atm.multiplier.atmIncome;
        }
        return 0;
    },
    
    // ====================================
    // 日次処理
    // ====================================
    
    advanceDay() {
        this.day++;
        this.resetOrders();
    },
    
    updateStats(report) {
        this.stats.totalSales += report.totalSales;
        this.stats.totalProfit += report.profit;
        this.stats.totalCustomers += report.totalCustomers;
        this.stats.totalWages += report.wages;
        
        if (report.profit < 0) {
            this.stats.daysInRed++;
        }
        
        this.yesterdaySales = report.totalSales;
        this.yesterdayProfit = report.profit;
        this.lastReport = report;
    },
    
    // ====================================
    // ゲーム終了判定
    // ====================================
    
    isGameOver() {
        return this.cash < 0;
    },
    
    isGameComplete() {
        return this.day > CONFIG.game.maxDays;
    },
    
    isWin() {
        return this.cash >= CONFIG.game.targetCash;
    },
};
