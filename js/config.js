// ====================================
// config.js - マスタデータ・設定値
// ====================================

const CONFIG = {
    // ゲーム設定
    game: {
        maxDays: 30,
        initialCash: 500000,
        targetCash: 1000000,
        fixedCosts: 10000,      // 光熱費（少し下げた）
        orderUnit: 5,           // 発注単位
    },
    
    // 商品マスタ
    products: [
        { id: 'bento', name: '弁当', cost: 350, price: 550, expiry: 2, category: 'food', icon: '🍱' },
        { id: 'onigiri', name: 'おにぎり', cost: 80, price: 140, expiry: 2, category: 'food', icon: '🍙' },
        { id: 'sandwich', name: 'サンドイッチ', cost: 150, price: 280, expiry: 2, category: 'food', icon: '🥪' },
        { id: 'drink', name: '飲料', cost: 80, price: 150, expiry: 30, category: 'drink', icon: '🥤' },
        { id: 'coffee', name: 'コーヒー', cost: 60, price: 120, expiry: 30, category: 'drink', icon: '☕' },
        { id: 'snack', name: 'お菓子', cost: 60, price: 130, expiry: 30, category: 'snack', icon: '🍪' },
        { id: 'ice', name: 'アイス', cost: 70, price: 150, expiry: 30, category: 'snack', icon: '🍨' },
        { id: 'cup_noodle', name: 'カップ麺', cost: 100, price: 200, expiry: 90, category: 'food', icon: '🍜' },
        { id: 'daily', name: '日用品', cost: 150, price: 300, expiry: 999, category: 'daily', icon: '🧴' },
        { id: 'magazine', name: '雑誌', cost: 300, price: 500, expiry: 7, category: 'daily', icon: '📖' },
    ],
    
    // 時間帯マスタ
    timeSlots: [
        { id: 'morning', name: '朝', hours: 4, baseCustomers: 50 },
        { id: 'noon', name: '昼', hours: 4, baseCustomers: 70 },
        { id: 'evening', name: '夕', hours: 4, baseCustomers: 55 },
        { id: 'night', name: '夜', hours: 4, baseCustomers: 40 },
        { id: 'midnight', name: '深夜', hours: 8, baseCustomers: 20 },
    ],
    
    // 時間帯別需要倍率
    demand: {
        morning:  { onigiri: 2.0, coffee: 2.5, bento: 1.2, sandwich: 1.5, drink: 1.0, snack: 0.5, ice: 0.3, cup_noodle: 0.5, daily: 0.8, magazine: 1.5 },
        noon:     { bento: 2.5, sandwich: 2.0, onigiri: 1.5, drink: 1.5, coffee: 1.2, snack: 0.8, ice: 1.0, cup_noodle: 0.8, daily: 1.0, magazine: 0.8 },
        evening:  { bento: 2.0, drink: 1.5, onigiri: 1.2, sandwich: 1.0, snack: 1.2, ice: 1.5, coffee: 0.8, cup_noodle: 1.0, daily: 1.5, magazine: 0.5 },
        night:    { snack: 2.0, ice: 2.0, drink: 1.5, cup_noodle: 1.5, bento: 0.8, onigiri: 0.8, sandwich: 0.5, coffee: 0.5, daily: 0.5, magazine: 1.0 },
        midnight: { cup_noodle: 2.0, bento: 1.5, drink: 1.2, coffee: 1.5, onigiri: 1.0, snack: 1.0, ice: 0.5, sandwich: 0.5, daily: 0.3, magazine: 0.3 },
    },
    
    // 設備マスタ
    investments: [
        { id: 'register', name: 'レジ追加', cost: 80000, effect: '客捌き速度+20%', multiplier: { throughput: 1.2 } },
        { id: 'fridge', name: '冷蔵ケース拡張', cost: 120000, effect: '廃棄率-20%', multiplier: { wasteReduction: 0.8 } },
        { id: 'sign', name: '看板設置', cost: 60000, effect: '来客数+15%', multiplier: { customers: 1.15 } },
        { id: 'parking', name: '駐車場整備', cost: 150000, effect: '来客数+25%', multiplier: { customers: 1.25 } },
        { id: 'atm', name: 'ATM設置', cost: 100000, effect: '来客数+10%、手数料収入', multiplier: { customers: 1.1, atmIncome: 5000 } },
    ],
    
    // バイト名前リスト
    staffNames: ['佐藤', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '松本', '井上', '木村', '林', '斎藤', '清水', '山口', '橋本', '阿部', '石川'],
    
    // バイト性格リスト
    personalities: [
        { id: 'serious', name: '真面目', workBonus: 1.1, commentStyle: 'formal' },
        { id: 'cheerful', name: '元気', workBonus: 1.0, commentStyle: 'energetic' },
        { id: 'calm', name: 'マイペース', workBonus: 0.95, commentStyle: 'relaxed' },
        { id: 'reliable', name: 'しっかり者', workBonus: 1.15, commentStyle: 'analytical' },
        { id: 'friendly', name: 'ムードメーカー', workBonus: 1.0, commentStyle: 'friendly' },
    ],
    
    // バイト設定
    staff: {
        baseWage: 950,
        wageVariation: 150,
        trainingCostHours: 8,  // 研修費用 = 時給 × この時間
    },
    
    // 初期在庫数
    initialStock: {
        food: 25,
        drink: 35,
        snack: 30,
        daily: 20,
    },
};

// 商品IDから商品データを取得
CONFIG.getProduct = function(productId) {
    return this.products.find(p => p.id === productId);
};

// 時間帯IDから時間帯データを取得
CONFIG.getTimeSlot = function(slotId) {
    return this.timeSlots.find(s => s.id === slotId);
};

// 設備IDから設備データを取得
CONFIG.getInvestment = function(investId) {
    return this.investments.find(i => i.id === investId);
};
