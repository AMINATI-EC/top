// ====================================
// weather.js - 天候・イベントシステム
// ====================================

const Weather = {
    // 天気の種類
    types: {
        sunny: {
            name: '☀️ 晴れ',
            customerMultiplier: 1.1,
            demand: {},
            description: '天気がいいのでお客さん多め',
        },
        cloudy: {
            name: '☁️ 曇り',
            customerMultiplier: 1.0,
            demand: {},
            description: '普通の天気',
        },
        rainy: {
            name: '🌧️ 雨',
            customerMultiplier: 0.7,
            demand: {
                daily: 2.0,  // 傘など
                cup_noodle: 1.3,
                magazine: 1.5,
            },
            description: '来客減、傘・日用品が売れる',
        },
        stormy: {
            name: '⛈️ 大雨',
            customerMultiplier: 0.4,
            demand: {
                daily: 2.5,
                cup_noodle: 1.5,
            },
            description: '来客激減、巣ごもり需要',
        },
        hot: {
            name: '🥵 猛暑',
            customerMultiplier: 0.9,
            demand: {
                ice: 2.5,
                drink: 2.0,
                bento: 0.7,
            },
            description: '飲料・アイス爆売れ',
        },
        cold: {
            name: '🥶 寒波',
            customerMultiplier: 0.85,
            demand: {
                cup_noodle: 2.0,
                coffee: 1.8,
                ice: 0.3,
            },
            description: '温かいもの需要増',
        },
    },
    
    // 現在の天気
    current: null,
    
    // ====================================
    // 天気生成
    // ====================================
    
    generate(day) {
        const season = Calendar.getSeason(day);
        
        // 季節ごとの天気確率
        const probabilities = {
            // 春
            0: { sunny: 40, cloudy: 35, rainy: 20, stormy: 5 },
            // 夏
            1: { sunny: 35, cloudy: 20, rainy: 15, stormy: 10, hot: 20 },
            // 秋
            2: { sunny: 35, cloudy: 40, rainy: 20, stormy: 5 },
            // 冬
            3: { sunny: 30, cloudy: 35, rainy: 10, stormy: 5, cold: 20 },
        };
        
        const probs = probabilities[season];
        const roll = Math.random() * 100;
        let cumulative = 0;
        
        for (const [type, prob] of Object.entries(probs)) {
            cumulative += prob;
            if (roll < cumulative) {
                this.current = type;
                return this.types[type];
            }
        }
        
        this.current = 'cloudy';
        return this.types.cloudy;
    },
    
    // ====================================
    // 天気の効果を取得
    // ====================================
    
    getCurrentWeather() {
        if (!this.current) return this.types.cloudy;
        return this.types[this.current];
    },
    
    getCustomerMultiplier() {
        return this.getCurrentWeather().customerMultiplier;
    },
    
    getDemandModifier() {
        return this.getCurrentWeather().demand || {};
    },
    
    // ====================================
    // ランダムイベント
    // ====================================
    
    events: [
        {
            id: 'nearby_concert',
            name: '🎤 近所でライブ',
            probability: 5,
            effect: '夕方〜夜の来客2倍',
            timeSlotBonus: { evening: 2.0, night: 2.0 },
            demand: { drink: 1.5, snack: 1.5 },
        },
        {
            id: 'sports_event',
            name: '⚽ スポーツ中継',
            probability: 8,
            effect: '夜の来客増、おつまみ需要増',
            timeSlotBonus: { night: 1.5 },
            demand: { snack: 2.0, drink: 1.8 },
        },
        {
            id: 'school_event',
            name: '🏫 学校行事',
            probability: 6,
            effect: '昼の来客増、弁当・おにぎり需要増',
            timeSlotBonus: { morning: 1.3, noon: 1.5 },
            demand: { bento: 1.8, onigiri: 1.8, drink: 1.3 },
        },
        {
            id: 'payday',
            name: '💰 給料日',
            probability: 4, // 月1回くらい
            effect: '全体の来客増、高めの商品も売れる',
            customerBonus: 1.3,
            demand: { bento: 1.3, magazine: 1.5 },
        },
        {
            id: 'power_outage',
            name: '⚡ 近所で停電',
            probability: 2,
            effect: '来客増、電池・懐中電灯需要（日用品）',
            customerBonus: 1.4,
            demand: { daily: 3.0, drink: 1.5 },
        },
        {
            id: 'tv_feature',
            name: '📺 TVで紹介',
            probability: 2,
            effect: '来客数大幅増！',
            customerBonus: 2.0,
            demand: {},
        },
        {
            id: 'road_work',
            name: '🚧 道路工事',
            probability: 5,
            effect: '来客減、作業員が来る',
            customerBonus: 0.8,
            timeSlotBonus: { noon: 1.5 }, // 作業員の昼飯
            demand: { bento: 1.5, drink: 1.5 },
        },
    ],
    
    // 今日のイベント
    todayEvent: null,
    
    // イベント抽選
    rollEvent() {
        this.todayEvent = null;
        
        for (const event of this.events) {
            if (Math.random() * 100 < event.probability) {
                this.todayEvent = event;
                return event;
            }
        }
        
        return null;
    },
    
    // ====================================
    // 日次処理
    // ====================================
    
    processDay(day) {
        const weather = this.generate(day);
        const event = this.rollEvent();
        
        return {
            weather,
            event,
        };
    },
};
