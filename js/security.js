// ====================================
// security.js - 万引き・セキュリティシステム
// ====================================

const Security = {
    // 今日の被害
    todayLoss: 0,
    
    // 累計被害
    totalLoss: 0,
    
    // セキュリティレベル（設備で上がる）
    level: 0,
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.todayLoss = 0;
        this.totalLoss = 0;
        this.level = 0;
    },
    
    // ====================================
    // 万引き判定（時間帯ごとに呼ばれる）
    // ====================================
    
    checkTheft(timeSlot, staffCount) {
        const events = [];
        
        // 基本発生確率（時間帯による）
        let baseProbability = {
            morning: 0.02,
            noon: 0.03,
            evening: 0.05,
            night: 0.08,
            midnight: 0.12,  // 深夜が一番多い
        }[timeSlot] || 0.05;
        
        // スタッフがいないと確率上昇
        if (staffCount === 0) {
            baseProbability *= 3;
        } else if (staffCount === 1) {
            baseProbability *= 1.5;
        }
        
        // セキュリティレベルで軽減
        baseProbability *= (1 - this.level * 0.2);  // レベル5で完全防止
        
        // 判定
        if (Math.random() < baseProbability) {
            const theft = this.generateTheft();
            events.push(theft);
            this.todayLoss += theft.loss;
            this.totalLoss += theft.loss;
        }
        
        return events;
    },
    
    generateTheft() {
        // 盗まれやすい商品
        const targets = [
            { id: 'snack', name: 'お菓子', probability: 0.3 },
            { id: 'drink', name: '飲料', probability: 0.25 },
            { id: 'onigiri', name: 'おにぎり', probability: 0.2 },
            { id: 'magazine', name: '雑誌', probability: 0.15 },
            { id: 'daily', name: '日用品', probability: 0.1 },
        ];
        
        // 商品選択
        let roll = Math.random();
        let target = targets[0];
        for (const t of targets) {
            roll -= t.probability;
            if (roll <= 0) {
                target = t;
                break;
            }
        }
        
        const product = CONFIG.getProduct(target.id);
        const qty = Math.floor(Math.random() * 3) + 1;  // 1-3個
        const loss = product ? product.price * qty : 500;
        
        // 在庫から減らす（あれば）
        for (let i = 0; i < qty; i++) {
            if (GameState.getInventoryQty(target.id) > 0) {
                GameState.sellOne(target.id);  // 在庫から消す（売上は立たない）
            }
        }
        
        return {
            type: 'theft',
            productId: target.id,
            productName: target.name,
            qty,
            loss,
            message: `${target.name}が${qty}個盗まれた！（被害額: ¥${loss}）`,
        };
    },
    
    // ====================================
    // 日次処理
    // ====================================
    
    processDailyTheft(salesReport) {
        this.todayLoss = 0;
        const allEvents = [];
        
        CONFIG.timeSlots.forEach(slot => {
            const staffCount = salesReport.byTimeSlot[slot.id]?.staffCount || 0;
            const events = this.checkTheft(slot.id, staffCount);
            allEvents.push(...events);
        });
        
        return {
            events: allEvents,
            todayLoss: this.todayLoss,
            totalLoss: this.totalLoss,
        };
    },
    
    // ====================================
    // セキュリティ強化
    // ====================================
    
    upgrades: [
        {
            id: 'mirror',
            name: '防犯ミラー',
            cost: 20000,
            levelBonus: 1,
            description: '死角をなくす',
        },
        {
            id: 'camera',
            name: '防犯カメラ',
            cost: 50000,
            levelBonus: 2,
            description: '抑止力が高い',
        },
        {
            id: 'gate',
            name: '防犯ゲート',
            cost: 100000,
            levelBonus: 2,
            description: 'タグで商品を管理',
        },
    ],
    
    purchasedUpgrades: [],
    
    purchaseUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (!upgrade) return { success: false, message: '設備が見つかりません' };
        if (this.purchasedUpgrades.includes(upgradeId)) {
            return { success: false, message: '既に導入済みです' };
        }
        if (GameState.cash < upgrade.cost) {
            return { success: false, message: '資金が不足しています' };
        }
        
        GameState.cash -= upgrade.cost;
        this.purchasedUpgrades.push(upgradeId);
        this.level += upgrade.levelBonus;
        
        return {
            success: true,
            message: `${upgrade.name}を導入しました`,
            newLevel: this.level,
        };
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        return {
            level: this.level,
            maxLevel: 5,
            todayLoss: this.todayLoss,
            totalLoss: this.totalLoss,
            purchasedUpgrades: this.purchasedUpgrades,
            availableUpgrades: this.upgrades.filter(u => !this.purchasedUpgrades.includes(u.id)),
        };
    },
};
