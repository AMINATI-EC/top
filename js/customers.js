// ====================================
// customers.js - 常連客システム
// ====================================

const Customers = {
    // 常連客リスト
    regulars: [],
    
    // 常連客の名前
    names: [
        '田中さん', '鈴木さん', '佐藤さん', '山田さん', '高橋さん',
        '渡辺さん', '伊藤さん', '中村さん', '小林さん', '加藤さん',
        'OLの人', 'サラリーマン', '学生さん', 'おばあちゃん', '親子連れ',
        '常連のおじさん', '朝の人', '深夜の人', 'コーヒー好きな人',
    ],
    
    // 常連客タイプ
    types: [
        {
            id: 'morning_coffee',
            name: '朝のコーヒー派',
            timeSlot: 'morning',
            products: ['coffee'],
            buyCount: [1, 2],
            frequency: 0.8,  // 80%の確率で来店
        },
        {
            id: 'lunch_bento',
            name: 'ランチ弁当派',
            timeSlot: 'noon',
            products: ['bento', 'drink'],
            buyCount: [2, 3],
            frequency: 0.7,
        },
        {
            id: 'evening_shopper',
            name: '夕方の買い物客',
            timeSlot: 'evening',
            products: ['bento', 'onigiri', 'drink'],
            buyCount: [2, 4],
            frequency: 0.6,
        },
        {
            id: 'night_snacker',
            name: '夜のお菓子派',
            timeSlot: 'night',
            products: ['snack', 'ice', 'drink'],
            buyCount: [2, 3],
            frequency: 0.5,
        },
        {
            id: 'midnight_worker',
            name: '深夜の仕事人',
            timeSlot: 'midnight',
            products: ['cup_noodle', 'coffee', 'onigiri'],
            buyCount: [1, 3],
            frequency: 0.4,
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.regulars = [];
        // 初期常連客を2人生成
        this.addRegular();
        this.addRegular();
    },
    
    // ====================================
    // 常連客追加
    // ====================================
    
    addRegular() {
        if (this.regulars.length >= 15) return null;  // 最大15人
        
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        const name = this.names[Math.floor(Math.random() * this.names.length)];
        
        const regular = {
            id: Date.now() + Math.random(),
            name: name,
            type: type,
            loyalty: 50,       // 忠誠度（0-100）
            visitStreak: 0,    // 連続来店日数
            totalVisits: 0,    // 累計来店回数
            totalSpent: 0,     // 累計購入額
            disappointed: 0,   // がっかり回数（品切れなど）
        };
        
        this.regulars.push(regular);
        return regular;
    },
    
    // ====================================
    // 日次処理
    // ====================================
    
    processDailyVisits(salesReport) {
        const visits = [];
        const newRegulars = [];
        const lostRegulars = [];
        
        this.regulars.forEach(regular => {
            // 来店判定
            const willVisit = Math.random() < regular.type.frequency * (regular.loyalty / 100);
            
            if (willVisit) {
                // 来店
                const visit = this.processVisit(regular, salesReport);
                visits.push(visit);
                regular.visitStreak++;
                regular.totalVisits++;
                
                // 忠誠度上昇
                if (visit.satisfied) {
                    regular.loyalty = Math.min(100, regular.loyalty + 2);
                } else {
                    regular.loyalty = Math.max(0, regular.loyalty - 5);
                    regular.disappointed++;
                }
            } else {
                regular.visitStreak = 0;
            }
            
            // 常連離脱判定
            if (regular.disappointed >= 5 || regular.loyalty <= 10) {
                lostRegulars.push(regular);
            }
        });
        
        // 離脱した常連を削除
        lostRegulars.forEach(r => {
            const idx = this.regulars.indexOf(r);
            if (idx !== -1) this.regulars.splice(idx, 1);
        });
        
        // 評判が良いと新規常連獲得
        if (Reputation.score >= 60 && Math.random() < 0.15) {
            const newRegular = this.addRegular();
            if (newRegular) newRegulars.push(newRegular);
        }
        
        return {
            visits,
            newRegulars,
            lostRegulars,
            totalRegulars: this.regulars.length,
        };
    },
    
    processVisit(regular, salesReport) {
        const type = regular.type;
        let sales = 0;
        let satisfied = true;
        const purchased = [];
        
        // 購入数を決定
        const buyCount = type.buyCount[0] + Math.floor(Math.random() * (type.buyCount[1] - type.buyCount[0] + 1));
        
        // 商品を購入
        for (let i = 0; i < buyCount; i++) {
            const productId = type.products[Math.floor(Math.random() * type.products.length)];
            const product = CONFIG.getProduct(productId);
            
            if (product && GameState.getInventoryQty(productId) > 0) {
                // 購入成功
                const sold = GameState.sellOne(productId);
                if (sold) {
                    sales += product.price;
                    purchased.push(product.name);
                }
            } else {
                // 品切れでがっかり
                satisfied = false;
            }
        }
        
        regular.totalSpent += sales;
        
        return {
            regular,
            sales,
            satisfied,
            purchased,
        };
    },
    
    // ====================================
    // 常連客からの安定収入
    // ====================================
    
    getExpectedDailyIncome() {
        let expected = 0;
        
        this.regulars.forEach(r => {
            const avgBuy = (r.type.buyCount[0] + r.type.buyCount[1]) / 2;
            const avgPrice = 300;  // 平均単価の概算
            expected += avgBuy * avgPrice * r.type.frequency * (r.loyalty / 100);
        });
        
        return Math.floor(expected);
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getRegularsSummary() {
        const byType = {};
        this.types.forEach(t => byType[t.id] = 0);
        
        this.regulars.forEach(r => {
            byType[r.type.id] = (byType[r.type.id] || 0) + 1;
        });
        
        return {
            total: this.regulars.length,
            byType,
            expectedIncome: this.getExpectedDailyIncome(),
            topRegulars: this.regulars
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 5),
        };
    },
};
