// ====================================
// achievements.js - 実績・アチーブメント
// ====================================

const Achievements = {
    // 解除済み実績
    unlocked: [],
    
    // 実績定義
    list: [
        // === 基本系 ===
        {
            id: 'first_profit',
            name: '初めての黒字',
            icon: '💹',
            description: '1日の利益がプラスになった',
            reward: 1000,
            condition: (report) => report && report.profit > 0,
            category: 'basic',
        },
        {
            id: 'first_10k',
            name: '売上1万円突破',
            icon: '📈',
            description: '1日の売上が1万円を超えた',
            reward: 2000,
            condition: (report) => report && report.sales >= 10000,
            category: 'basic',
        },
        {
            id: 'first_50k',
            name: '売上5万円の壁',
            icon: '📊',
            description: '1日の売上が5万円を超えた',
            reward: 10000,
            condition: (report) => report && report.sales >= 50000,
            category: 'basic',
        },
        {
            id: 'first_100k',
            name: '売上10万円達成',
            icon: '🏆',
            description: '1日の売上が10万円を超えた',
            reward: 30000,
            condition: (report) => report && report.sales >= 100000,
            category: 'basic',
        },
        
        // === 経営系 ===
        {
            id: 'zero_waste',
            name: '廃棄ゼロデー',
            icon: '♻️',
            description: '1日の廃棄がゼロだった',
            reward: 5000,
            condition: (report) => report && report.waste === 0,
            category: 'management',
        },
        {
            id: 'no_stockout',
            name: '品切れなし',
            icon: '📦',
            description: '品切れが一度も発生しなかった',
            reward: 5000,
            condition: (report) => report && report.stockouts === 0,
            category: 'management',
        },
        {
            id: 'full_staff',
            name: 'フル稼働',
            icon: '👥',
            description: '全時間帯でスタッフを配置した',
            reward: 3000,
            condition: (report) => report && report.unstaffedSlots === 0,
            category: 'management',
        },
        
        // === 資産系 ===
        {
            id: 'cash_500k',
            name: '資産50万円',
            icon: '💰',
            description: '資産が50万円を超えた',
            reward: 10000,
            condition: () => GameState.cash >= 500000,
            category: 'wealth',
        },
        {
            id: 'cash_1m',
            name: 'ミリオネア',
            icon: '💎',
            description: '資産が100万円を超えた',
            reward: 50000,
            condition: () => GameState.cash >= 1000000,
            category: 'wealth',
        },
        {
            id: 'cash_2m',
            name: 'ダブルミリオン',
            icon: '👑',
            description: '資産が200万円を超えた',
            reward: 100000,
            condition: () => GameState.cash >= 2000000,
            category: 'wealth',
        },
        {
            id: 'debt_free',
            name: '借金完済',
            icon: '🆓',
            description: '借金を完済した',
            reward: 20000,
            condition: () => Bank.totalInterestPaid > 0 && Bank.debt === 0,
            category: 'wealth',
        },
        
        // === 常連・評判系 ===
        {
            id: 'regulars_5',
            name: '常連5人',
            icon: '😊',
            description: '常連客が5人になった',
            reward: 5000,
            condition: () => Customers.regulars.length >= 5,
            category: 'reputation',
        },
        {
            id: 'regulars_10',
            name: '常連10人',
            icon: '🤗',
            description: '常連客が10人になった',
            reward: 15000,
            condition: () => Customers.regulars.length >= 10,
            category: 'reputation',
        },
        {
            id: 'max_reputation',
            name: '超人気店',
            icon: '🌟',
            description: '評判が最高ランクになった',
            reward: 30000,
            condition: () => Reputation.score >= 80,
            category: 'reputation',
        },
        
        // === 拡大系 ===
        {
            id: 'first_hire',
            name: '初めての採用',
            icon: '🤝',
            description: 'バイトを採用した',
            reward: 1000,
            condition: () => GameState.staff.length >= 1,
            category: 'expansion',
        },
        {
            id: 'full_team',
            name: 'フルチーム',
            icon: '👨‍👩‍👧‍👦',
            description: 'バイトを5人以上採用した',
            reward: 10000,
            condition: () => GameState.staff.length >= 5,
            category: 'expansion',
        },
        {
            id: 'first_investment',
            name: '初めての設備投資',
            icon: '🔧',
            description: '設備を購入した',
            reward: 2000,
            condition: () => GameState.investments.length >= 1,
            category: 'expansion',
        },
        {
            id: 'first_development',
            name: '開発者魂',
            icon: '🔬',
            description: '新商品を開発した',
            reward: 10000,
            condition: () => Development.developed.length >= 1,
            category: 'expansion',
        },
        {
            id: 'location_upgrade',
            name: '引っ越し',
            icon: '🚚',
            description: '新しい立地に移転した',
            reward: 20000,
            condition: () => Location.expansions >= 1,
            category: 'expansion',
        },
        {
            id: 'multi_store',
            name: 'チェーン展開',
            icon: '🏪🏪',
            description: '2号店を出店した',
            reward: 50000,
            condition: () => Location.storeCount >= 2,
            category: 'expansion',
        },
        
        // === 特殊系 ===
        {
            id: 'survive_rival',
            name: 'ライバルに勝つ',
            icon: '⚔️',
            description: '競合店出現後も評判を維持した',
            reward: 15000,
            condition: () => Rival.stores.length > 0 && Reputation.score >= 60,
            category: 'special',
        },
        {
            id: 'campaign_master',
            name: 'キャンペーンマスター',
            icon: '📢',
            description: 'キャンペーンを5回実施した',
            reward: 10000,
            condition: () => Campaign.history.length >= 5,
            category: 'special',
        },
        {
            id: 'security_max',
            name: '鉄壁の守り',
            icon: '🛡️',
            description: 'セキュリティレベルを最大にした',
            reward: 20000,
            condition: () => Security.level >= 5,
            category: 'special',
        },
        {
            id: 'week_streak',
            name: '7日連続黒字',
            icon: '🔥',
            description: '7日連続で黒字を達成した',
            reward: 30000,
            condition: () => GameState.stats.profitStreak >= 7,
            category: 'special',
        },
        {
            id: 'perfect_day',
            name: 'パーフェクトデー',
            icon: '✨',
            description: '廃棄ゼロ・品切れゼロ・フル稼働を同時達成',
            reward: 50000,
            condition: (report) => report && report.waste === 0 && report.stockouts === 0 && report.unstaffedSlots === 0,
            category: 'special',
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.unlocked = [];
    },
    
    // ====================================
    // 実績チェック
    // ====================================
    
    checkAchievements(report = null) {
        const newlyUnlocked = [];
        
        this.list.forEach(achievement => {
            // 既に解除済みはスキップ
            if (this.unlocked.includes(achievement.id)) return;
            
            try {
                if (achievement.condition(report)) {
                    this.unlocked.push(achievement.id);
                    newlyUnlocked.push(achievement);
                }
            } catch (e) {
                // 条件チェックでエラーが出ても無視
            }
        });
        
        return newlyUnlocked;
    },
    
    // ====================================
    // 報酬受け取り
    // ====================================
    
    claimRewards(achievements) {
        let total = 0;
        achievements.forEach(a => {
            total += a.reward;
        });
        GameState.cash += total;
        return total;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        const categories = {
            basic: { name: '基本', achievements: [] },
            management: { name: '経営', achievements: [] },
            wealth: { name: '資産', achievements: [] },
            reputation: { name: '評判', achievements: [] },
            expansion: { name: '拡大', achievements: [] },
            special: { name: '特殊', achievements: [] },
        };
        
        this.list.forEach(a => {
            const category = categories[a.category] || categories.special;
            category.achievements.push({
                ...a,
                unlocked: this.unlocked.includes(a.id),
            });
        });
        
        return {
            categories,
            unlockedCount: this.unlocked.length,
            totalCount: this.list.length,
            percentage: Math.round(this.unlocked.length / this.list.length * 100),
        };
    },
};
