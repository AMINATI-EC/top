// ====================================
// suppliers.js - 仕入れ先・卸業者システム
// ====================================

const Suppliers = {
    // 現在の取引先
    current: 'standard',
    
    // 業者との信頼度
    trust: {},
    
    // 卸業者定義
    list: [
        {
            id: 'standard',
            name: '標準卸',
            icon: '📦',
            description: 'バランスの取れた標準的な業者',
            costMultiplier: 1.0,
            qualityVariance: 0.05,  // 品質のばらつき（5%）
            deliveryReliability: 0.95,  // 配送信頼度
            minOrderMultiplier: 1.0,
            unlocked: true,
            trustRequired: 0,
        },
        {
            id: 'discount',
            name: '激安問屋',
            icon: '💸',
            description: '安いが品質にばらつきあり。たまに欠品も',
            costMultiplier: 0.75,  // 25%安い
            qualityVariance: 0.2,   // 品質ばらつき大
            deliveryReliability: 0.8,  // 配送信頼度低め
            minOrderMultiplier: 1.5,  // 最小発注量多め
            unlocked: true,
            trustRequired: 0,
        },
        {
            id: 'premium',
            name: 'プレミアム食品',
            icon: '✨',
            description: '高品質で評判UP。価格は高め',
            costMultiplier: 1.3,
            qualityVariance: 0.02,
            deliveryReliability: 0.99,
            minOrderMultiplier: 0.5,  // 少量発注OK
            unlocked: false,
            trustRequired: 50,
            reputationBonus: 2,  // 毎日評判+2
        },
        {
            id: 'bulk',
            name: '大量卸センター',
            icon: '🏭',
            description: '大量発注で大幅割引。倉庫の圧迫に注意',
            costMultiplier: 0.6,  // 40%OFF
            qualityVariance: 0.08,
            deliveryReliability: 0.9,
            minOrderMultiplier: 3.0,  // 最小発注量3倍
            unlocked: false,
            trustRequired: 30,
        },
        {
            id: 'local',
            name: '地元農家直送',
            icon: '🌾',
            description: '新鮮で評判◎。弁当・おにぎりのみ対応',
            costMultiplier: 0.9,
            qualityVariance: 0.03,
            deliveryReliability: 0.85,
            minOrderMultiplier: 1.0,
            unlocked: false,
            trustRequired: 40,
            limitedProducts: ['bento', 'onigiri', 'sandwich'],
            reputationBonus: 3,
        },
        {
            id: 'express',
            name: 'エクスプレス便',
            icon: '🚀',
            description: '緊急発注OK。当日配送可能だが割高',
            costMultiplier: 1.5,
            qualityVariance: 0.05,
            deliveryReliability: 1.0,  // 100%確実
            minOrderMultiplier: 0.2,  // 超少量OK
            unlocked: false,
            trustRequired: 20,
            sameDayDelivery: true,
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.current = 'standard';
        this.trust = {};
        this.list.forEach(s => {
            this.trust[s.id] = 0;
            s.unlocked = (s.trustRequired === 0);
        });
    },
    
    // ====================================
    // 業者変更
    // ====================================
    
    switchSupplier(supplierId) {
        const supplier = this.list.find(s => s.id === supplierId);
        if (!supplier) return { success: false, message: '業者が見つかりません' };
        if (!supplier.unlocked) return { success: false, message: 'まだ取引できません' };
        
        this.current = supplierId;
        return {
            success: true,
            message: `${supplier.icon} ${supplier.name}に変更しました`,
        };
    },
    
    // ====================================
    // 信頼度更新
    // ====================================
    
    addTrust(amount = 1) {
        // 現在の業者との信頼度UP
        this.trust[this.current] = (this.trust[this.current] || 0) + amount;
        
        // 新規業者の解放チェック
        const newlyUnlocked = [];
        this.list.forEach(s => {
            if (!s.unlocked && this.trust[this.current] >= s.trustRequired) {
                s.unlocked = true;
                newlyUnlocked.push(s);
            }
        });
        
        return newlyUnlocked;
    },
    
    // ====================================
    // コスト計算
    // ====================================
    
    getCostMultiplier() {
        const supplier = this.list.find(s => s.id === this.current);
        return supplier ? supplier.costMultiplier : 1.0;
    },
    
    getMinOrderMultiplier() {
        const supplier = this.list.find(s => s.id === this.current);
        return supplier ? supplier.minOrderMultiplier : 1.0;
    },
    
    // ====================================
    // 配送処理
    // ====================================
    
    processDelivery(orders) {
        const supplier = this.list.find(s => s.id === this.current);
        const delivered = {};
        const failed = {};
        
        Object.keys(orders).forEach(productId => {
            const qty = orders[productId];
            if (qty <= 0) return;
            
            // 限定商品チェック
            if (supplier.limitedProducts && !supplier.limitedProducts.includes(productId)) {
                // この業者では扱っていない商品は標準業者から
                delivered[productId] = qty;
                return;
            }
            
            // 配送信頼度チェック
            if (Math.random() < supplier.deliveryReliability) {
                // 品質ばらつきによる廃棄リスク
                const qualityLoss = Math.floor(qty * supplier.qualityVariance * Math.random());
                delivered[productId] = qty - qualityLoss;
                if (qualityLoss > 0) {
                    failed[productId] = { qty: qualityLoss, reason: '品質不良' };
                }
            } else {
                // 配送失敗
                delivered[productId] = Math.floor(qty * 0.5);  // 半分だけ届く
                failed[productId] = { qty: qty - delivered[productId], reason: '配送遅延' };
            }
        });
        
        return { delivered, failed };
    },
    
    // ====================================
    // 評判ボーナス
    // ====================================
    
    getReputationBonus() {
        const supplier = this.list.find(s => s.id === this.current);
        return supplier?.reputationBonus || 0;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        const current = this.list.find(s => s.id === this.current);
        return {
            current,
            trust: this.trust[this.current] || 0,
            available: this.list.filter(s => s.unlocked),
            locked: this.list.filter(s => !s.unlocked),
        };
    },
};
