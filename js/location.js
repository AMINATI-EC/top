// ====================================
// location.js - 立地・店舗拡張システム
// ====================================

const Location = {
    // 現在の立地
    current: 'suburb',
    
    // 店舗数
    storeCount: 1,
    
    // 累計移転/出店回数
    expansions: 0,
    
    // 立地定義
    locations: [
        {
            id: 'suburb',
            name: '郊外',
            icon: '🏘️',
            description: '住宅街の外れ。家賃は安いが人通りは少ない',
            rent: 5000,
            baseCustomers: 80,
            unlocked: true,
            moveCost: 0,
            personaEffect: { housewife: 1.5, senior: 1.3, student: 0.7, salaryman: 0.5 },
        },
        {
            id: 'residential',
            name: '住宅街',
            icon: '🏠',
            description: 'ファミリー層が多い。朝夕が特に混む',
            rent: 15000,
            baseCustomers: 120,
            unlocked: false,
            unlockCost: 100000,
            moveCost: 50000,
            personaEffect: { housewife: 2.0, senior: 1.5, student: 1.2, salaryman: 0.8 },
        },
        {
            id: 'station',
            name: '駅前',
            icon: '🚉',
            description: '人通りが多く売上が見込める。競争も激しい',
            rent: 30000,
            baseCustomers: 200,
            unlocked: false,
            unlockCost: 300000,
            moveCost: 150000,
            personaEffect: { salaryman: 2.0, ol: 2.0, student: 1.5, housewife: 0.5 },
        },
        {
            id: 'office',
            name: 'オフィス街',
            icon: '🏢',
            description: 'ビジネスマンが多い。平日のランチが稼ぎ時',
            rent: 40000,
            baseCustomers: 180,
            unlocked: false,
            unlockCost: 400000,
            moveCost: 200000,
            personaEffect: { salaryman: 2.5, ol: 2.5, nightworker: 0.3, housewife: 0.2 },
        },
        {
            id: 'entertainment',
            name: '繁華街',
            icon: '🎰',
            description: '夜が本番。客単価は高いが家賃も高い',
            rent: 50000,
            baseCustomers: 250,
            unlocked: false,
            unlockCost: 500000,
            moveCost: 250000,
            personaEffect: { nightworker: 2.0, student: 1.5, salaryman: 1.2, senior: 0.2 },
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.current = 'suburb';
        this.storeCount = 1;
        this.expansions = 0;
        
        // 初期立地以外をロック
        this.locations.forEach(loc => {
            loc.unlocked = (loc.id === 'suburb');
        });
    },
    
    // ====================================
    // 立地情報取得
    // ====================================
    
    getCurrentLocation() {
        return this.locations.find(l => l.id === this.current);
    },
    
    getLocation(id) {
        return this.locations.find(l => l.id === id);
    },
    
    // ====================================
    // 立地の解放
    // ====================================
    
    unlockLocation(locationId) {
        const loc = this.getLocation(locationId);
        if (!loc) return { success: false, message: '立地が見つかりません' };
        if (loc.unlocked) return { success: false, message: '既に解放済みです' };
        if (GameState.cash < loc.unlockCost) {
            return { success: false, message: `資金不足（必要: ¥${loc.unlockCost.toLocaleString()}）` };
        }
        
        GameState.cash -= loc.unlockCost;
        loc.unlocked = true;
        
        return {
            success: true,
            message: `${loc.icon} ${loc.name}を解放しました！`,
        };
    },
    
    // ====================================
    // 移転
    // ====================================
    
    moveTo(locationId) {
        const loc = this.getLocation(locationId);
        if (!loc) return { success: false, message: '立地が見つかりません' };
        if (!loc.unlocked) return { success: false, message: 'まだ解放されていません' };
        if (loc.id === this.current) return { success: false, message: '現在の立地です' };
        if (GameState.cash < loc.moveCost) {
            return { success: false, message: `移転資金不足（必要: ¥${loc.moveCost.toLocaleString()}）` };
        }
        
        const oldLoc = this.getCurrentLocation();
        GameState.cash -= loc.moveCost;
        this.current = locationId;
        this.expansions++;
        
        // 客層を更新
        Personas.init();
        Personas.applyLocationEffect(locationId);
        
        return {
            success: true,
            message: `${oldLoc.icon}${oldLoc.name} → ${loc.icon}${loc.name} に移転しました！`,
        };
    },
    
    // ====================================
    // 2号店出店
    // ====================================
    
    openBranch(locationId) {
        const loc = this.getLocation(locationId);
        if (!loc) return { success: false, message: '立地が見つかりません' };
        if (!loc.unlocked) return { success: false, message: 'まだ解放されていません' };
        
        const branchCost = loc.moveCost * 2;  // 出店は移転の2倍
        if (GameState.cash < branchCost) {
            return { success: false, message: `出店資金不足（必要: ¥${branchCost.toLocaleString()}）` };
        }
        
        GameState.cash -= branchCost;
        this.storeCount++;
        this.expansions++;
        
        return {
            success: true,
            message: `${loc.icon}${loc.name}に${this.storeCount}号店をオープン！`,
            storeCount: this.storeCount,
        };
    },
    
    // ====================================
    // 来客数への影響
    // ====================================
    
    getCustomerMultiplier() {
        const loc = this.getCurrentLocation();
        // 店舗数ボーナス（2号店で+50%、3号店で+80%...）
        const storeBonus = 1 + (this.storeCount - 1) * 0.5;
        return (loc.baseCustomers / 100) * storeBonus;
    },
    
    // ====================================
    // 家賃計算
    // ====================================
    
    getDailyRent() {
        const loc = this.getCurrentLocation();
        return loc.rent * this.storeCount;
    },
    
    // ====================================
    // 客層への影響
    // ====================================
    
    getPersonaEffect(locationId) {
        const loc = this.getLocation(locationId || this.current);
        return loc ? loc.personaEffect : {};
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        const current = this.getCurrentLocation();
        return {
            current,
            storeCount: this.storeCount,
            dailyRent: this.getDailyRent(),
            available: this.locations.filter(l => l.unlocked && l.id !== this.current),
            locked: this.locations.filter(l => !l.unlocked),
        };
    },
};
