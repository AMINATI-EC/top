// ====================================
// endgame.js - エンドコンテンツ・周回要素
// ====================================

const Endgame = {
    // クリア回数
    clearCount: 0,
    
    // 最高記録
    records: {
        highestCash: 0,
        fastestClear: 999,
        bestRating: '',
    },
    
    // 解放済みモード
    unlockedModes: ['normal'],
    
    // 現在のモード
    currentMode: 'normal',
    
    // ゲームモード定義
    modes: [
        {
            id: 'normal',
            name: 'ノーマル',
            icon: '🎮',
            description: '標準的な難易度',
            unlocked: true,
            modifiers: {},
        },
        {
            id: 'hard',
            name: 'ハードモード',
            icon: '💀',
            description: '来客-20%、競合店が早く出現',
            unlocked: false,
            unlockCondition: 'クリア1回',
            modifiers: {
                customerMultiplier: 0.8,
                rivalAppearDay: 3,
                startingCash: 200000,
            },
        },
        {
            id: 'debt_start',
            name: '借金スタート',
            icon: '💸',
            description: '50万円の借金からスタート',
            unlocked: false,
            unlockCondition: '借金完済実績',
            modifiers: {
                startingCash: 200000,
                startingDebt: 500000,
            },
        },
        {
            id: 'rival_rush',
            name: 'ライバルラッシュ',
            icon: '⚔️',
            description: '競合店が3店舗同時出現',
            unlocked: false,
            unlockCondition: 'ハードクリア',
            modifiers: {
                rivalCount: 3,
                rivalAppearDay: 1,
            },
        },
        {
            id: 'speedrun',
            name: 'スピードラン',
            icon: '⏱️',
            description: '15日で100万円達成を目指す',
            unlocked: false,
            unlockCondition: '資産200万達成',
            modifiers: {
                maxDays: 15,
                targetCash: 1000000,
            },
        },
        {
            id: 'no_staff',
            name: 'ワンオペ地獄',
            icon: '😱',
            description: 'バイトを雇えない',
            unlocked: false,
            unlockCondition: '5回クリア',
            modifiers: {
                canHireStaff: false,
                customerMultiplier: 0.7,
            },
        },
        {
            id: 'chaos',
            name: 'カオスモード',
            icon: '🌀',
            description: 'トラブル発生率3倍、イベント毎日',
            unlocked: false,
            unlockCondition: '全実績50%解除',
            modifiers: {
                troubleMultiplier: 3,
                dailyEvent: true,
            },
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.currentMode = 'normal';
        // セーブデータから復元（将来実装）
    },
    
    // ====================================
    // モード選択
    // ====================================
    
    selectMode(modeId) {
        const mode = this.modes.find(m => m.id === modeId);
        if (!mode) return { success: false, message: 'モードが見つかりません' };
        if (!this.unlockedModes.includes(modeId)) {
            return { success: false, message: `未解放（条件: ${mode.unlockCondition}）` };
        }
        
        this.currentMode = modeId;
        return { success: true, message: `${mode.icon} ${mode.name}を選択` };
    },
    
    // ====================================
    // モード修正値を取得
    // ====================================
    
    getModifiers() {
        const mode = this.modes.find(m => m.id === this.currentMode);
        return mode?.modifiers || {};
    },
    
    getCustomerMultiplier() {
        return this.getModifiers().customerMultiplier || 1.0;
    },
    
    getStartingCash() {
        return this.getModifiers().startingCash || 300000;
    },
    
    getStartingDebt() {
        return this.getModifiers().startingDebt || 0;
    },
    
    getMaxDays() {
        return this.getModifiers().maxDays || 30;
    },
    
    getTargetCash() {
        return this.getModifiers().targetCash || 1000000;
    },
    
    canHireStaff() {
        return this.getModifiers().canHireStaff !== false;
    },
    
    getTroubleMultiplier() {
        return this.getModifiers().troubleMultiplier || 1.0;
    },
    
    // ====================================
    // クリア処理
    // ====================================
    
    processClear(finalCash, days) {
        this.clearCount++;
        
        // 記録更新
        if (finalCash > this.records.highestCash) {
            this.records.highestCash = finalCash;
        }
        if (days < this.records.fastestClear) {
            this.records.fastestClear = days;
        }
        
        // レーティング計算
        const rating = this.calculateRating(finalCash, days);
        if (this.compareRating(rating, this.records.bestRating) > 0) {
            this.records.bestRating = rating;
        }
        
        // モード解放チェック
        this.checkModeUnlocks();
        
        return {
            clearCount: this.clearCount,
            rating,
            newRecords: {
                cash: finalCash > this.records.highestCash,
                time: days < this.records.fastestClear,
            },
        };
    },
    
    calculateRating(cash, days) {
        // 資産と日数でレーティング
        let score = cash / 10000;  // 1万円 = 1ポイント
        score += (30 - days) * 5;  // 早くクリアするほどボーナス
        
        if (score >= 300) return 'SSS';
        if (score >= 250) return 'SS';
        if (score >= 200) return 'S';
        if (score >= 150) return 'A';
        if (score >= 100) return 'B';
        if (score >= 50) return 'C';
        return 'D';
    },
    
    compareRating(a, b) {
        const order = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
        return order.indexOf(a) - order.indexOf(b);
    },
    
    // ====================================
    // モード解放チェック
    // ====================================
    
    checkModeUnlocks() {
        // ハードモード: 1回クリア
        if (this.clearCount >= 1 && !this.unlockedModes.includes('hard')) {
            this.unlockedModes.push('hard');
        }
        
        // 借金スタート: 借金完済実績
        if (Achievements.unlocked.includes('debt_free') && !this.unlockedModes.includes('debt_start')) {
            this.unlockedModes.push('debt_start');
        }
        
        // ライバルラッシュ: ハードクリア（将来実装）
        
        // スピードラン: 資産200万達成
        if (Achievements.unlocked.includes('cash_2m') && !this.unlockedModes.includes('speedrun')) {
            this.unlockedModes.push('speedrun');
        }
        
        // ワンオペ地獄: 5回クリア
        if (this.clearCount >= 5 && !this.unlockedModes.includes('no_staff')) {
            this.unlockedModes.push('no_staff');
        }
        
        // カオスモード: 実績50%
        const achievementPercent = Achievements.unlocked.length / Achievements.list.length;
        if (achievementPercent >= 0.5 && !this.unlockedModes.includes('chaos')) {
            this.unlockedModes.push('chaos');
        }
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        return {
            currentMode: this.modes.find(m => m.id === this.currentMode),
            clearCount: this.clearCount,
            records: this.records,
            modes: this.modes.map(m => ({
                ...m,
                unlocked: this.unlockedModes.includes(m.id),
            })),
        };
    },
};
