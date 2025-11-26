// ====================================
// calendar.js - 季節・曜日システム
// ====================================

const Calendar = {
    // 曜日名
    dayNames: ['月', '火', '水', '木', '金', '土', '日'],
    
    // 季節名
    seasonNames: ['春', '夏', '秋', '冬'],
    
    // 季節ごとの日数（ゲーム内）
    daysPerSeason: 8, // 8日で1季節、32日で1年
    
    // ====================================
    // 日付計算
    // ====================================
    
    // 曜日を取得（0=月, 6=日）
    getDayOfWeek(day) {
        return (day - 1) % 7;
    },
    
    getDayOfWeekName(day) {
        return this.dayNames[this.getDayOfWeek(day)];
    },
    
    // 週末かどうか
    isWeekend(day) {
        const dow = this.getDayOfWeek(day);
        return dow === 5 || dow === 6; // 土日
    },
    
    // 金曜日かどうか
    isFriday(day) {
        return this.getDayOfWeek(day) === 4;
    },
    
    // ====================================
    // 季節計算
    // ====================================
    
    // 季節を取得（0=春, 1=夏, 2=秋, 3=冬）
    getSeason(day) {
        return Math.floor((day - 1) / this.daysPerSeason) % 4;
    },
    
    getSeasonName(day) {
        return this.seasonNames[this.getSeason(day)];
    },
    
    // ====================================
    // 曜日による来客倍率
    // ====================================
    
    getCustomerMultiplier(day) {
        const dow = this.getDayOfWeek(day);
        
        // 曜日別倍率
        const multipliers = {
            0: 1.0,   // 月
            1: 0.95,  // 火（週で一番少ない）
            2: 1.0,   // 水
            3: 1.05,  // 木
            4: 1.15,  // 金（週末前）
            5: 1.4,   // 土（多い）
            6: 1.3,   // 日（多いけど土よりは少ない）
        };
        
        return multipliers[dow] || 1.0;
    },
    
    // ====================================
    // 季節による需要変動
    // ====================================
    
    getSeasonalDemand(day) {
        const season = this.getSeason(day);
        
        // 季節ごとの商品需要倍率
        const demands = {
            // 春
            0: {
                ice: 0.8,
                drink: 1.1,
                bento: 1.1,
                cup_noodle: 0.9,
            },
            // 夏
            1: {
                ice: 2.0,       // アイス爆売れ
                drink: 1.5,    // 飲料も売れる
                bento: 0.9,    // 弁当やや減
                cup_noodle: 0.6, // カップ麺減
            },
            // 秋
            2: {
                ice: 0.7,
                drink: 1.0,
                bento: 1.2,    // 行楽シーズン
                snack: 1.2,
            },
            // 冬
            3: {
                ice: 0.4,      // アイス激減
                drink: 0.8,
                cup_noodle: 1.8, // カップ麺爆売れ
                coffee: 1.5,   // ホット需要
                bento: 1.1,
            },
        };
        
        return demands[season] || {};
    },
    
    // ====================================
    // 季節イベント
    // ====================================
    
    getSeasonalEvent(day) {
        const season = this.getSeason(day);
        const dayInSeason = ((day - 1) % this.daysPerSeason) + 1;
        
        // 各季節の特定日にイベント
        const events = {
            // 春：5日目に花見
            0: dayInSeason === 5 ? {
                name: '🌸 お花見シーズン',
                effect: 'おにぎり・弁当の需要2倍',
                demand: { onigiri: 2.0, bento: 2.0, drink: 1.5 },
                customerBonus: 1.2,
            } : null,
            
            // 夏：6日目に花火大会
            1: dayInSeason === 6 ? {
                name: '🎆 花火大会',
                effect: '夜の来客3倍、飲料・アイス爆売れ',
                demand: { drink: 2.5, ice: 2.5, snack: 2.0 },
                customerBonus: 1.5,
                timeSlotBonus: { night: 3.0 },
            } : null,
            
            // 秋：4日目にハロウィン
            2: dayInSeason === 4 ? {
                name: '🎃 ハロウィン',
                effect: 'お菓子の需要3倍',
                demand: { snack: 3.0 },
                customerBonus: 1.3,
            } : null,
            
            // 冬：7日目にクリスマス
            3: dayInSeason === 7 ? {
                name: '🎄 クリスマス',
                effect: '全商品の需要1.5倍',
                demand: { bento: 1.5, snack: 2.0, drink: 1.5, cake: 3.0 },
                customerBonus: 1.8,
            } : null,
        };
        
        return events[season];
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getDateDisplay(day) {
        const dow = this.getDayOfWeekName(day);
        const season = this.getSeasonName(day);
        const isWeekend = this.isWeekend(day);
        
        return {
            day,
            dayOfWeek: dow,
            season,
            isWeekend,
            display: `${day}日目（${dow}）`,
            seasonDisplay: `${season}`,
        };
    },
};
