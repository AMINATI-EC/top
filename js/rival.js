// ====================================
// rival.js - 競合店システム
// ====================================

const Rival = {
    // 競合店リスト
    stores: [],
    
    // 競合店が出現する日
    appearDay: 5,
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.stores = [];
    },
    
    // ====================================
    // 競合店定義
    // ====================================
    
    templates: [
        {
            id: 'discount',
            name: '激安マート',
            icon: '🏪',
            type: '価格重視',
            customerSteal: 0.15,  // 15%の客を奪う
            weakness: 'quality',   // 品質が弱点
            description: '安さが売りの店。品揃えはイマイチ',
        },
        {
            id: 'premium',
            name: 'プレミアムストア',
            icon: '🏬',
            type: '高級路線',
            customerSteal: 0.10,
            weakness: 'price',
            description: '高品質だが価格が高い',
        },
        {
            id: 'chain',
            name: '全国チェーン24',
            icon: '🏣',
            type: '大手チェーン',
            customerSteal: 0.20,
            weakness: 'service',
            description: '資本力があるが接客は機械的',
        },
    ],
    
    // ====================================
    // 競合店出現チェック
    // ====================================
    
    checkAppearance(day) {
        // 5日目に最初の競合店
        if (day === this.appearDay && this.stores.length === 0) {
            return this.addRival();
        }
        
        // 15日目に2店舗目
        if (day === 15 && this.stores.length === 1) {
            return this.addRival();
        }
        
        return null;
    },
    
    addRival() {
        const available = this.templates.filter(t => 
            !this.stores.find(s => s.id === t.id)
        );
        
        if (available.length === 0) return null;
        
        const template = available[Math.floor(Math.random() * available.length)];
        const rival = {
            ...template,
            power: 1.0,        // 競争力（変動する）
            dayAppeared: GameState.day,
        };
        
        this.stores.push(rival);
        return rival;
    },
    
    // ====================================
    // 競合の影響計算
    // ====================================
    
    getCustomerLoss() {
        if (this.stores.length === 0) return 0;
        
        let totalLoss = 0;
        
        this.stores.forEach(rival => {
            let loss = rival.customerSteal * rival.power;
            
            // 評判が高いと競合の影響を軽減
            if (Reputation.score >= 70) {
                loss *= 0.7;
            } else if (Reputation.score >= 50) {
                loss *= 0.85;
            }
            
            // 設備が充実していると軽減
            if (GameState.isInvestmentPurchased('signboard')) {
                loss *= 0.9;
            }
            if (GameState.isInvestmentPurchased('parking')) {
                loss *= 0.85;
            }
            
            totalLoss += loss;
        });
        
        // 最大40%まで
        return Math.min(0.4, totalLoss);
    },
    
    getCustomerMultiplier() {
        return 1 - this.getCustomerLoss();
    },
    
    // ====================================
    // 競合店の動向（日次処理）
    // ====================================
    
    dailyUpdate() {
        const events = [];
        
        this.stores.forEach(rival => {
            // ランダムで競合の動き
            const roll = Math.random();
            
            if (roll < 0.05) {
                // セール開始
                rival.power = 1.3;
                events.push({
                    type: 'rival_sale',
                    rival: rival,
                    message: `${rival.icon} ${rival.name}がセールを開始！客足に影響`,
                });
            } else if (roll < 0.1) {
                // 競合が弱体化
                rival.power = 0.7;
                events.push({
                    type: 'rival_trouble',
                    rival: rival,
                    message: `${rival.icon} ${rival.name}で問題発生？客足が戻ってきた`,
                });
            } else {
                // 通常に戻る
                rival.power = Math.max(0.8, Math.min(1.2, rival.power + (Math.random() - 0.5) * 0.2));
            }
        });
        
        return events;
    },
    
    // ====================================
    // 対抗策
    // ====================================
    
    // セールを実施（1日限定で競合の影響を無効化、コストがかかる）
    runSale() {
        const cost = 10000;
        if (GameState.cash < cost) return false;
        
        GameState.cash -= cost;
        this.saleActive = true;
        return true;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getRivalInfo() {
        return this.stores.map(r => ({
            ...r,
            threat: r.customerSteal * r.power,
            status: r.power > 1.1 ? '攻勢' : r.power < 0.9 ? '低調' : '通常',
        }));
    },
};
