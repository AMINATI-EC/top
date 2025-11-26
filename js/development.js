// ====================================
// development.js - 新商品開発システム
// ====================================

const Development = {
    // 開発中の商品
    inProgress: null,
    
    // 開発済み商品
    developed: [],
    
    // 残り開発日数
    daysRemaining: 0,
    
    // ====================================
    // 開発可能な新商品
    // ====================================
    
    newProducts: [
        {
            id: 'premium_bento',
            name: '特製弁当',
            icon: '🍱✨',
            category: 'food',
            cost: 450,
            price: 750,
            expiry: 1,
            developCost: 80000,
            developDays: 3,
            successRate: 0.7,
            description: '高級食材を使った特製弁当',
        },
        {
            id: 'original_coffee',
            name: 'オリジナルコーヒー',
            icon: '☕✨',
            category: 'drink',
            cost: 80,
            price: 180,
            expiry: 30,
            developCost: 50000,
            developDays: 2,
            successRate: 0.8,
            description: '自家焙煎のオリジナルブレンド',
        },
        {
            id: 'healthy_salad',
            name: 'ヘルシーサラダ',
            icon: '🥗',
            category: 'food',
            cost: 200,
            price: 380,
            expiry: 1,
            developCost: 60000,
            developDays: 2,
            successRate: 0.75,
            description: '健康志向の人に人気',
        },
        {
            id: 'hot_snack',
            name: 'ホットスナック',
            icon: '🍗',
            category: 'food',
            cost: 80,
            price: 180,
            expiry: 1,
            developCost: 100000,
            developDays: 4,
            successRate: 0.6,
            description: 'レジ横で販売する揚げ物',
        },
        {
            id: 'seasonal_sweet',
            name: '季節のスイーツ',
            icon: '🍰',
            category: 'snack',
            cost: 180,
            price: 350,
            expiry: 2,
            developCost: 70000,
            developDays: 3,
            successRate: 0.65,
            description: '季節限定の特別なデザート',
        },
        {
            id: 'energy_drink',
            name: 'オリジナルエナジー',
            icon: '⚡',
            category: 'drink',
            cost: 100,
            price: 220,
            expiry: 90,
            developCost: 90000,
            developDays: 3,
            successRate: 0.7,
            description: '疲れた現代人のためのドリンク',
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.inProgress = null;
        this.developed = [];
        this.daysRemaining = 0;
    },
    
    // ====================================
    // 開発開始
    // ====================================
    
    startDevelopment(productId) {
        if (this.inProgress) {
            return { success: false, message: '既に開発中の商品があります' };
        }
        
        const product = this.newProducts.find(p => p.id === productId);
        if (!product) {
            return { success: false, message: '商品が見つかりません' };
        }
        
        if (this.developed.includes(productId)) {
            return { success: false, message: '既に開発済みです' };
        }
        
        if (GameState.cash < product.developCost) {
            return { success: false, message: '開発資金が不足しています' };
        }
        
        GameState.cash -= product.developCost;
        this.inProgress = product;
        this.daysRemaining = product.developDays;
        
        return {
            success: true,
            message: `${product.name}の開発を開始しました（${product.developDays}日後に完成）`,
        };
    },
    
    // ====================================
    // 日次処理
    // ====================================
    
    processDailyProgress() {
        if (!this.inProgress) return null;
        
        this.daysRemaining--;
        
        if (this.daysRemaining <= 0) {
            // 開発完了
            const product = this.inProgress;
            const success = Math.random() < product.successRate;
            
            this.inProgress = null;
            
            if (success) {
                // 成功！商品を追加
                this.developed.push(product.id);
                this.addToProducts(product);
                
                return {
                    completed: true,
                    success: true,
                    product: product,
                    message: `🎉 ${product.name}の開発に成功！販売を開始します`,
                };
            } else {
                // 失敗...
                return {
                    completed: true,
                    success: false,
                    product: product,
                    message: `😢 ${product.name}の開発に失敗...投資は失われました`,
                };
            }
        }
        
        return {
            completed: false,
            daysRemaining: this.daysRemaining,
            product: this.inProgress,
            message: `${this.inProgress.name}開発中...残り${this.daysRemaining}日`,
        };
    },
    
    // ====================================
    // 商品をCONFIGに追加
    // ====================================
    
    addToProducts(product) {
        // CONFIGに新商品を追加
        CONFIG.products.push({
            id: product.id,
            name: product.name,
            icon: product.icon,
            category: product.category,
            cost: product.cost,
            price: product.price,
            expiry: product.expiry,
        });
        
        // 需要を設定（全時間帯で平均的な需要）
        Object.keys(CONFIG.demand).forEach(slot => {
            CONFIG.demand[slot][product.id] = 1.2;  // やや高めの需要
        });
        
        // 初期在庫を追加
        GameState.inventory[product.id] = [{ qty: 10, expiry: product.expiry }];
        GameState.orders[product.id] = 0;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        return {
            inProgress: this.inProgress,
            daysRemaining: this.daysRemaining,
            developed: this.developed,
            available: this.newProducts.filter(p => 
                !this.developed.includes(p.id) && 
                (!this.inProgress || this.inProgress.id !== p.id)
            ),
        };
    },
};
