// ====================================
// layout.js - 店内レイアウト・棚配置システム
// ====================================

const Layout = {
    // 棚の配置
    shelves: {},
    
    // 棚位置定義
    positions: [
        {
            id: 'entrance',
            name: '入口付近',
            icon: '🚪',
            description: '衝動買いを誘発。お菓子・雑誌向き',
            effect: { impulseBoost: 1.5 },
            bestFor: ['snack', 'magazine', 'ice'],
        },
        {
            id: 'register',
            name: 'レジ横',
            icon: '💳',
            description: 'ついで買い効果大。小物・ガムなど',
            effect: { addOnBoost: 1.8 },
            bestFor: ['snack', 'daily'],
        },
        {
            id: 'back',
            name: '奥の棚',
            icon: '📚',
            description: '目的買い商品向け。飲料・日用品',
            effect: { destinationBoost: 1.3 },
            bestFor: ['drink', 'daily', 'cup_noodle'],
        },
        {
            id: 'center',
            name: '中央島',
            icon: '🏝️',
            description: '目立つ位置。プロモーション向け',
            effect: { visibilityBoost: 1.4 },
            bestFor: ['bento', 'onigiri'],
        },
        {
            id: 'cooler',
            name: '冷蔵ケース',
            icon: '❄️',
            description: '飲料・弁当の定番位置',
            effect: { freshnessBoost: 1.2 },
            bestFor: ['drink', 'bento', 'sandwich', 'ice'],
        },
        {
            id: 'hotcase',
            name: 'ホットケース',
            icon: '🔥',
            description: 'ホットスナック専用。購入設備が必要',
            effect: { hotBoost: 2.0 },
            bestFor: ['hot_snack'],
            requiresInvestment: 'hot_case',
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        // デフォルト配置
        this.shelves = {
            bento: 'center',
            onigiri: 'center',
            sandwich: 'cooler',
            drink: 'back',
            coffee: 'register',
            snack: 'entrance',
            ice: 'cooler',
            cup_noodle: 'back',
            magazine: 'entrance',
            daily: 'back',
        };
    },
    
    // ====================================
    // 配置変更
    // ====================================
    
    moveProduct(productId, positionId) {
        const position = this.positions.find(p => p.id === positionId);
        if (!position) return { success: false, message: '配置場所が見つかりません' };
        
        // 設備要件チェック
        if (position.requiresInvestment) {
            if (!GameState.isInvestmentPurchased(position.requiresInvestment)) {
                return { success: false, message: `${position.name}には専用設備が必要です` };
            }
        }
        
        const oldPosition = this.shelves[productId];
        this.shelves[productId] = positionId;
        
        return {
            success: true,
            message: `${CONFIG.getProduct(productId)?.name}を${position.name}に配置しました`,
            oldPosition,
            newPosition: positionId,
        };
    },
    
    // ====================================
    // 効果計算
    // ====================================
    
    getProductMultiplier(productId) {
        const positionId = this.shelves[productId];
        const position = this.positions.find(p => p.id === positionId);
        
        if (!position) return 1.0;
        
        let multiplier = 1.0;
        
        // 最適配置ボーナス
        if (position.bestFor.includes(productId)) {
            multiplier *= 1.3;  // 最適配置で30%UP
        }
        
        // 位置効果
        const effect = position.effect;
        if (effect.impulseBoost && ['snack', 'magazine', 'ice'].includes(productId)) {
            multiplier *= effect.impulseBoost;
        }
        if (effect.addOnBoost && ['snack', 'daily'].includes(productId)) {
            multiplier *= effect.addOnBoost * 0.5;  // ついで買いは半分の効果
        }
        if (effect.freshnessBoost && ['drink', 'bento', 'sandwich', 'ice'].includes(productId)) {
            multiplier *= effect.freshnessBoost;
        }
        
        return multiplier;
    },
    
    // ====================================
    // 全体効率
    // ====================================
    
    getOverallEfficiency() {
        let total = 0;
        let count = 0;
        
        Object.keys(this.shelves).forEach(productId => {
            total += this.getProductMultiplier(productId);
            count++;
        });
        
        return count > 0 ? total / count : 1.0;
    },
    
    // ====================================
    // レイアウト提案
    // ====================================
    
    getSuggestions() {
        const suggestions = [];
        
        Object.keys(this.shelves).forEach(productId => {
            const currentPos = this.shelves[productId];
            const product = CONFIG.getProduct(productId);
            
            // 最適な位置を探す
            let bestPos = null;
            let bestScore = this.getProductMultiplier(productId);
            
            this.positions.forEach(pos => {
                if (pos.requiresInvestment && !GameState.isInvestmentPurchased(pos.requiresInvestment)) {
                    return;
                }
                
                const oldPos = this.shelves[productId];
                this.shelves[productId] = pos.id;
                const score = this.getProductMultiplier(productId);
                this.shelves[productId] = oldPos;
                
                if (score > bestScore * 1.1) {  // 10%以上改善なら提案
                    bestPos = pos;
                    bestScore = score;
                }
            });
            
            if (bestPos && bestPos.id !== currentPos) {
                suggestions.push({
                    productId,
                    productName: product?.name,
                    currentPosition: currentPos,
                    suggestedPosition: bestPos.id,
                    suggestedPositionName: bestPos.name,
                    improvement: Math.round((bestScore / this.getProductMultiplier(productId) - 1) * 100),
                });
            }
        });
        
        return suggestions;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        const byPosition = {};
        this.positions.forEach(p => {
            byPosition[p.id] = {
                ...p,
                products: [],
            };
        });
        
        Object.keys(this.shelves).forEach(productId => {
            const posId = this.shelves[productId];
            const product = CONFIG.getProduct(productId);
            if (byPosition[posId] && product) {
                byPosition[posId].products.push({
                    id: productId,
                    name: product.name,
                    icon: product.icon,
                    multiplier: this.getProductMultiplier(productId),
                });
            }
        });
        
        return {
            positions: Object.values(byPosition),
            efficiency: this.getOverallEfficiency(),
            suggestions: this.getSuggestions(),
        };
    },
};
