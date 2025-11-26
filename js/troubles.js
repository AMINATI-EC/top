// ====================================
// troubles.js - トラブルイベント拡張
// ====================================

const Troubles = {
    // 今日発生したトラブル
    todayTroubles: [],
    
    // トラブル履歴
    history: [],
    
    // トラブル定義
    types: [
        {
            id: 'power_outage',
            name: '停電',
            icon: '⚡',
            description: '停電で冷蔵・冷凍商品が危機！',
            probability: 0.02,
            effect: { wasteMultiplier: { bento: 2, sandwich: 2, ice: 3 } },
            choices: [
                { id: 'wait', name: '復旧を待つ', cost: 0, successRate: 0.7, successEffect: {}, failEffect: { wasteLoss: 5000 } },
                { id: 'generator', name: '発電機レンタル', cost: 10000, successRate: 1.0, successEffect: {}, failEffect: {} },
            ],
        },
        {
            id: 'equipment_failure',
            name: '設備故障',
            icon: '🔧',
            description: 'レジが故障！修理が必要',
            probability: 0.03,
            effect: { customerMultiplier: 0.5 },
            choices: [
                { id: 'repair', name: '修理する', cost: 15000, successRate: 1.0, successEffect: {}, failEffect: {} },
                { id: 'manual', name: '手動で対応', cost: 0, successRate: 0.6, successEffect: { efficiencyLoss: 0.3 }, failEffect: { customerLoss: 0.5 } },
            ],
        },
        {
            id: 'staff_absent',
            name: 'バイト急欠',
            icon: '🤒',
            description: 'バイトが体調不良で欠勤！',
            probability: 0.05,
            effect: { staffAbsent: 1 },
            choices: [
                { id: 'cover', name: '自分でカバー', cost: 0, successRate: 1.0, successEffect: { exhaustion: true }, failEffect: {} },
                { id: 'agency', name: '派遣を呼ぶ', cost: 8000, successRate: 0.9, successEffect: {}, failEffect: { staffShortage: true } },
            ],
        },
        {
            id: 'complaint',
            name: 'クレーマー来店',
            icon: '😤',
            description: '理不尽なクレームを受けた！',
            probability: 0.04,
            effect: { reputationRisk: true },
            choices: [
                { id: 'apologize', name: '丁重に謝罪', cost: 0, successRate: 0.7, successEffect: { reputationChange: -1 }, failEffect: { reputationChange: -5 } },
                { id: 'compensate', name: '商品券で対応', cost: 2000, successRate: 0.95, successEffect: { reputationChange: 1 }, failEffect: { reputationChange: -3 } },
                { id: 'refuse', name: '毅然と対応', cost: 0, successRate: 0.5, successEffect: { reputationChange: 2 }, failEffect: { reputationChange: -10 } },
            ],
        },
        {
            id: 'food_poisoning_scare',
            name: '食中毒疑惑',
            icon: '🦠',
            description: '「お腹壊した」との連絡が...！',
            probability: 0.02,
            effect: { reputationRisk: true, salesStop: ['bento', 'sandwich', 'onigiri'] },
            choices: [
                { id: 'investigate', name: '調査して対応', cost: 5000, successRate: 0.8, successEffect: { reputationChange: 0 }, failEffect: { reputationChange: -15, productRecall: true } },
                { id: 'recall', name: '即座に回収', cost: 20000, successRate: 1.0, successEffect: { reputationChange: -5 }, failEffect: {} },
            ],
        },
        {
            id: 'delivery_delay',
            name: '配送遅延',
            icon: '🚚',
            description: '発注した商品が届かない！',
            probability: 0.04,
            effect: { deliveryFailed: true },
            choices: [
                { id: 'wait', name: '明日を待つ', cost: 0, successRate: 1.0, successEffect: { stockoutRisk: true }, failEffect: {} },
                { id: 'express', name: '緊急便で取り寄せ', cost: 10000, successRate: 0.9, successEffect: {}, failEffect: { partialDelivery: 0.5 } },
            ],
        },
        {
            id: 'robbery_attempt',
            name: '強盗未遂',
            icon: '🔫',
            description: '強盗が来た！（未遂で終わった）',
            probability: 0.01,
            effect: { staffMorale: -20 },
            choices: [
                { id: 'police', name: '警察に通報', cost: 0, successRate: 1.0, successEffect: { securityBoost: 1 }, failEffect: {} },
                { id: 'security', name: 'セキュリティ強化', cost: 30000, successRate: 1.0, successEffect: { securityBoost: 2, reputationChange: 5 }, failEffect: {} },
            ],
        },
        {
            id: 'viral_review',
            name: 'SNSで炎上',
            icon: '📱',
            description: '悪い口コミがバズってしまった！',
            probability: 0.02,
            effect: { reputationRisk: true },
            choices: [
                { id: 'ignore', name: '放置する', cost: 0, successRate: 0.3, successEffect: {}, failEffect: { reputationChange: -20, customerMultiplier: 0.7 } },
                { id: 'respond', name: '誠実に対応', cost: 0, successRate: 0.7, successEffect: { reputationChange: -5 }, failEffect: { reputationChange: -15 } },
                { id: 'pr', name: 'PR会社に依頼', cost: 50000, successRate: 0.9, successEffect: { reputationChange: 5 }, failEffect: { reputationChange: -10 } },
            ],
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.todayTroubles = [];
        this.history = [];
    },
    
    // ====================================
    // トラブル発生チェック
    // ====================================
    
    checkTroubles() {
        this.todayTroubles = [];
        
        this.types.forEach(trouble => {
            // セキュリティレベルで一部トラブル軽減
            let probability = trouble.probability;
            if (['robbery_attempt', 'theft'].includes(trouble.id)) {
                probability *= (1 - Security.level * 0.15);
            }
            
            if (Math.random() < probability) {
                this.todayTroubles.push({
                    ...trouble,
                    resolved: false,
                    choiceMade: null,
                    result: null,
                });
            }
        });
        
        return this.todayTroubles;
    },
    
    // ====================================
    // トラブル対応
    // ====================================
    
    resolveTouble(troubleId, choiceId) {
        const trouble = this.todayTroubles.find(t => t.id === troubleId);
        if (!trouble) return { success: false, message: 'トラブルが見つかりません' };
        if (trouble.resolved) return { success: false, message: '既に対応済みです' };
        
        const choice = trouble.choices.find(c => c.id === choiceId);
        if (!choice) return { success: false, message: '選択肢が見つかりません' };
        
        // コストチェック
        if (choice.cost > 0 && GameState.cash < choice.cost) {
            return { success: false, message: '資金が不足しています' };
        }
        
        // コスト支払い
        if (choice.cost > 0) {
            GameState.cash -= choice.cost;
        }
        
        // 成功判定
        const success = Math.random() < choice.successRate;
        const effect = success ? choice.successEffect : choice.failEffect;
        
        // 効果適用
        this.applyEffect(effect);
        
        trouble.resolved = true;
        trouble.choiceMade = choice;
        trouble.result = { success, effect };
        
        this.history.push({
            ...trouble,
            day: GameState.day,
        });
        
        return {
            success: true,
            troubleResolved: success,
            message: success 
                ? `${trouble.name}を解決しました！` 
                : `${trouble.name}の対応に失敗...`,
            effect,
        };
    },
    
    applyEffect(effect) {
        if (effect.reputationChange) {
            Reputation.score = Math.max(0, Math.min(100, Reputation.score + effect.reputationChange));
        }
        if (effect.securityBoost) {
            Security.level = Math.min(5, Security.level + effect.securityBoost);
        }
        if (effect.wasteLoss) {
            // 廃棄による損失（次のレポートに反映）
            GameState.cash -= effect.wasteLoss;
        }
        if (effect.customerLoss) {
            // 今日の来客減少（シミュレーションで使用）
            this.customerMultiplier = effect.customerLoss;
        }
    },
    
    // ====================================
    // 今日の効果を取得
    // ====================================
    
    getTodayEffects() {
        let effects = {
            customerMultiplier: 1.0,
            wasteMultiplier: {},
            staffAbsent: 0,
        };
        
        this.todayTroubles.forEach(t => {
            if (!t.resolved) {
                // 未解決トラブルの効果
                if (t.effect.customerMultiplier) {
                    effects.customerMultiplier *= t.effect.customerMultiplier;
                }
                if (t.effect.staffAbsent) {
                    effects.staffAbsent += t.effect.staffAbsent;
                }
            }
        });
        
        return effects;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        return {
            active: this.todayTroubles.filter(t => !t.resolved),
            resolved: this.todayTroubles.filter(t => t.resolved),
            history: this.history.slice(-10),
        };
    },
};
