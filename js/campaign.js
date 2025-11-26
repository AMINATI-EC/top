// ====================================
// campaign.js - キャンペーン・セール機能
// ====================================

const Campaign = {
    // 実行中のキャンペーン
    active: null,
    
    // キャンペーン履歴
    history: [],
    
    // クールダウン（連続実施不可）
    cooldown: 0,
    
    // キャンペーン定義
    types: [
        {
            id: 'discount_bento',
            name: '弁当20%OFFセール',
            icon: '🍱💰',
            description: '弁当が20%OFFで大人気！',
            cost: 8000,
            duration: 1,
            effect: { productDiscount: { bento: 0.8 } },
            customerBoost: 1.3,
            targetProducts: ['bento'],
        },
        {
            id: 'discount_all',
            name: '全品10%OFFセール',
            icon: '🏷️',
            description: '全商品10%OFF！集客効果大',
            cost: 20000,
            duration: 1,
            effect: { allDiscount: 0.9 },
            customerBoost: 1.5,
            targetProducts: null,
        },
        {
            id: 'point_double',
            name: 'ポイント2倍デー',
            icon: '⭐×2',
            description: '常連客が喜ぶ！評判UP',
            cost: 5000,
            duration: 1,
            effect: { reputationBonus: 5 },
            customerBoost: 1.2,
            targetProducts: null,
        },
        {
            id: 'timesale_morning',
            name: '朝市タイムセール',
            icon: '🌅',
            description: '朝の時間帯限定！おにぎり・コーヒーが人気',
            cost: 3000,
            duration: 1,
            effect: { timeSlotBoost: { morning: 2.0 }, productBoost: { onigiri: 1.5, coffee: 1.5 } },
            customerBoost: 1.1,
            targetProducts: ['onigiri', 'coffee'],
        },
        {
            id: 'timesale_night',
            name: '夜のお得市',
            icon: '🌙',
            description: '夜の時間帯限定！お菓子・アイスが人気',
            cost: 4000,
            duration: 1,
            effect: { timeSlotBoost: { night: 2.0 }, productBoost: { snack: 1.5, ice: 1.5 } },
            customerBoost: 1.1,
            targetProducts: ['snack', 'ice'],
        },
        {
            id: 'grand_sale',
            name: '大感謝祭',
            icon: '🎉',
            description: '3日間の大型セール！全品15%OFF＋来客2倍',
            cost: 50000,
            duration: 3,
            effect: { allDiscount: 0.85 },
            customerBoost: 2.0,
            targetProducts: null,
        },
        {
            id: 'newproduct_push',
            name: '新商品キャンペーン',
            icon: '🆕',
            description: '開発した新商品をプッシュ！需要3倍',
            cost: 10000,
            duration: 2,
            effect: { newProductBoost: 3.0 },
            customerBoost: 1.2,
            targetProducts: null,
            requiresDevelopment: true,
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.active = null;
        this.history = [];
        this.cooldown = 0;
    },
    
    // ====================================
    // キャンペーン開始
    // ====================================
    
    startCampaign(campaignId) {
        if (this.active) {
            return { success: false, message: '既にキャンペーン実施中です' };
        }
        
        if (this.cooldown > 0) {
            return { success: false, message: `クールダウン中（残り${this.cooldown}日）` };
        }
        
        const campaign = this.types.find(c => c.id === campaignId);
        if (!campaign) {
            return { success: false, message: 'キャンペーンが見つかりません' };
        }
        
        if (campaign.requiresDevelopment && Development.developed.length === 0) {
            return { success: false, message: '新商品を開発してから実施してください' };
        }
        
        if (GameState.cash < campaign.cost) {
            return { success: false, message: '資金が不足しています' };
        }
        
        GameState.cash -= campaign.cost;
        this.active = {
            ...campaign,
            remainingDays: campaign.duration,
            startDay: GameState.day,
        };
        
        return {
            success: true,
            message: `${campaign.icon} ${campaign.name}を開始！`,
        };
    },
    
    // ====================================
    // 日次処理
    // ====================================
    
    processDailyEnd() {
        // クールダウン減少
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        
        // アクティブなキャンペーンの処理
        if (this.active) {
            this.active.remainingDays--;
            
            if (this.active.remainingDays <= 0) {
                // キャンペーン終了
                this.history.push({
                    ...this.active,
                    endDay: GameState.day,
                });
                
                const ended = this.active;
                this.active = null;
                this.cooldown = 1;  // 1日クールダウン
                
                return {
                    ended: true,
                    campaign: ended,
                    message: `${ended.icon} ${ended.name}が終了しました`,
                };
            }
        }
        
        return { ended: false };
    },
    
    // ====================================
    // 効果取得
    // ====================================
    
    getCustomerMultiplier() {
        if (!this.active) return 1.0;
        return this.active.customerBoost || 1.0;
    },
    
    getProductPriceMultiplier(productId) {
        if (!this.active) return 1.0;
        
        const effect = this.active.effect;
        
        // 全品割引
        if (effect.allDiscount) {
            return effect.allDiscount;
        }
        
        // 商品別割引
        if (effect.productDiscount && effect.productDiscount[productId]) {
            return effect.productDiscount[productId];
        }
        
        return 1.0;
    },
    
    getProductDemandMultiplier(productId) {
        if (!this.active) return 1.0;
        
        const effect = this.active.effect;
        
        // 商品ブースト
        if (effect.productBoost && effect.productBoost[productId]) {
            return effect.productBoost[productId];
        }
        
        // 新商品ブースト
        if (effect.newProductBoost && Development.developed.includes(productId)) {
            return effect.newProductBoost;
        }
        
        return 1.0;
    },
    
    getTimeSlotMultiplier(slotId) {
        if (!this.active) return 1.0;
        
        const effect = this.active.effect;
        if (effect.timeSlotBoost && effect.timeSlotBoost[slotId]) {
            return effect.timeSlotBoost[slotId];
        }
        
        return 1.0;
    },
    
    getReputationBonus() {
        if (!this.active) return 0;
        return this.active.effect.reputationBonus || 0;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        return {
            active: this.active,
            cooldown: this.cooldown,
            available: this.types.filter(c => {
                if (c.requiresDevelopment && Development.developed.length === 0) return false;
                return true;
            }),
            history: this.history.slice(-5),
        };
    },
};
