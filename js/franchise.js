// ====================================
// franchise.js - 本部・フランチャイズ要素
// ====================================

const Franchise = {
    // フランチャイズ加盟状態
    isJoined: true,  // 最初は加盟店
    
    // 独立状態
    isIndependent: false,
    
    // 本部との関係値
    relationship: 50,  // 0-100
    
    // 累計ロイヤリティ支払い
    totalRoyalties: 0,
    
    // 今月のノルマ達成状況
    quotaProgress: {},
    
    // ====================================
    // ノルマ定義
    // ====================================
    
    quotas: [
        {
            id: 'sales',
            name: '売上ノルマ',
            icon: '💰',
            baseTarget: 30000,  // 1日あたり
            scaling: 1.05,      // 日ごとに5%増加
            reward: 5000,
            penalty: -10,       // 関係値-10
        },
        {
            id: 'new_product',
            name: '新商品販売',
            icon: '🆕',
            description: '本部指定の新商品を仕入れる',
            requiredQty: 20,
            reward: 3000,
            penalty: -5,
        },
    ],
    
    // 本部からの指令
    directives: [
        {
            id: 'seasonal_campaign',
            name: '季節キャンペーン実施',
            icon: '🎪',
            description: '本部指定のキャンペーンを実施',
            cost: 10000,
            reward: 15000,
            relationshipBonus: 10,
            triggerSeason: ['summer', 'winter'],
        },
        {
            id: 'store_renovation',
            name: '店舗改装',
            icon: '🏗️',
            description: '本部基準に合わせた改装',
            cost: 100000,
            reward: 50000,
            relationshipBonus: 20,
            triggerDay: [15, 30],  // 15日目か30日目
        },
        {
            id: 'staff_training',
            name: 'スタッフ研修',
            icon: '📚',
            description: '本部主催の研修に参加',
            cost: 5000,
            reward: 0,
            relationshipBonus: 5,
            staffBonus: { allSkills: 1 },
            random: true,
            probability: 0.1,
        },
    ],
    
    // 今日のアクティブな指令
    activeDirective: null,
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.isJoined = true;
        this.isIndependent = false;
        this.relationship = 50;
        this.totalRoyalties = 0;
        this.quotaProgress = {};
        this.activeDirective = null;
    },
    
    // ====================================
    // ロイヤリティ計算
    // ====================================
    
    getDailyRoyalty(sales) {
        if (this.isIndependent) return 0;
        
        // 売上の5%がロイヤリティ
        const royalty = Math.floor(sales * 0.05);
        return royalty;
    },
    
    payRoyalty(amount) {
        if (amount <= 0) return;
        GameState.cash -= amount;
        this.totalRoyalties += amount;
    },
    
    // ====================================
    // ノルマチェック
    // ====================================
    
    checkQuota(report) {
        if (this.isIndependent) return { passed: true, results: [] };
        
        const results = [];
        
        // 売上ノルマ
        const salesTarget = this.quotas[0].baseTarget * Math.pow(this.quotas[0].scaling, GameState.day - 1);
        const salesPassed = report.sales >= salesTarget;
        
        results.push({
            ...this.quotas[0],
            target: salesTarget,
            actual: report.sales,
            passed: salesPassed,
        });
        
        if (salesPassed) {
            this.relationship = Math.min(100, this.relationship + 2);
        } else {
            this.relationship = Math.max(0, this.relationship + this.quotas[0].penalty);
        }
        
        return {
            passed: results.every(r => r.passed),
            results,
        };
    },
    
    // ====================================
    // 指令チェック
    // ====================================
    
    checkDirectives() {
        if (this.isIndependent || this.activeDirective) return null;
        
        const season = Calendar.getSeason(GameState.day);
        const day = GameState.day;
        
        for (const directive of this.directives) {
            // 季節トリガー
            if (directive.triggerSeason && directive.triggerSeason.includes(season)) {
                if (Math.random() < 0.3) {
                    this.activeDirective = { ...directive, deadline: day + 3 };
                    return this.activeDirective;
                }
            }
            
            // 日付トリガー
            if (directive.triggerDay && directive.triggerDay.includes(day)) {
                this.activeDirective = { ...directive, deadline: day + 5 };
                return this.activeDirective;
            }
            
            // ランダムトリガー
            if (directive.random && Math.random() < directive.probability) {
                this.activeDirective = { ...directive, deadline: day + 2 };
                return this.activeDirective;
            }
        }
        
        return null;
    },
    
    // ====================================
    // 指令対応
    // ====================================
    
    acceptDirective() {
        if (!this.activeDirective) return { success: false, message: '指令がありません' };
        if (GameState.cash < this.activeDirective.cost) {
            return { success: false, message: '資金が不足しています' };
        }
        
        GameState.cash -= this.activeDirective.cost;
        GameState.cash += this.activeDirective.reward;
        this.relationship = Math.min(100, this.relationship + this.activeDirective.relationshipBonus);
        
        // スタッフボーナス
        if (this.activeDirective.staffBonus?.allSkills) {
            GameState.staff.forEach(s => {
                s.skills.register = Math.min(5, s.skills.register + 1);
                s.skills.stock = Math.min(5, s.skills.stock + 1);
                s.skills.clean = Math.min(5, s.skills.clean + 1);
            });
        }
        
        const result = {
            success: true,
            message: `${this.activeDirective.icon} ${this.activeDirective.name}を実施しました`,
            reward: this.activeDirective.reward - this.activeDirective.cost,
        };
        
        this.activeDirective = null;
        return result;
    },
    
    rejectDirective() {
        if (!this.activeDirective) return { success: false, message: '指令がありません' };
        
        this.relationship = Math.max(0, this.relationship - 15);
        
        const result = {
            success: true,
            message: `${this.activeDirective.name}を拒否しました（本部との関係悪化）`,
        };
        
        this.activeDirective = null;
        return result;
    },
    
    // ====================================
    // 独立
    // ====================================
    
    goIndependent() {
        if (this.isIndependent) return { success: false, message: '既に独立しています' };
        
        const independenceCost = 500000;  // 独立費用
        if (GameState.cash < independenceCost) {
            return { success: false, message: `独立には¥${independenceCost.toLocaleString()}が必要です` };
        }
        
        if (this.relationship > 30) {
            return { success: false, message: '本部との関係が良すぎて独立できません（関係値30以下で可能）' };
        }
        
        GameState.cash -= independenceCost;
        this.isJoined = false;
        this.isIndependent = true;
        
        return {
            success: true,
            message: '🎊 フランチャイズから独立しました！ロイヤリティ不要に！',
        };
    },
    
    // ====================================
    // 本部特典
    // ====================================
    
    getBenefits() {
        if (this.isIndependent) return {};
        
        const benefits = {
            supplierDiscount: 0,
            advertisingBoost: 0,
        };
        
        // 関係が良いと特典
        if (this.relationship >= 70) {
            benefits.supplierDiscount = 0.1;  // 仕入れ10%OFF
            benefits.advertisingBoost = 1.2;  // 広告効果20%UP
        } else if (this.relationship >= 50) {
            benefits.supplierDiscount = 0.05;
        }
        
        return benefits;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        return {
            isJoined: this.isJoined,
            isIndependent: this.isIndependent,
            relationship: this.relationship,
            relationshipLevel: this.relationship >= 70 ? '良好' : this.relationship >= 40 ? '普通' : '悪化',
            totalRoyalties: this.totalRoyalties,
            activeDirective: this.activeDirective,
            benefits: this.getBenefits(),
            canGoIndependent: !this.isIndependent && this.relationship <= 30 && GameState.cash >= 500000,
        };
    },
};
