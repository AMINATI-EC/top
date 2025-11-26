// ====================================
// missions.js - ミッション・目標システム
// ====================================

const Missions = {
    // アクティブなミッション
    active: [],
    
    // 完了したミッション
    completed: [],
    
    // ミッション定義
    definitions: [
        // ===== 売上系 =====
        {
            id: 'sales_30000',
            name: '1日売上3万円',
            description: '1日の売上を3万円以上にする',
            type: 'daily',
            condition: (report) => report.totalSales >= 30000,
            reward: 5000,
            difficulty: 1,
        },
        {
            id: 'sales_50000',
            name: '1日売上5万円',
            description: '1日の売上を5万円以上にする',
            type: 'daily',
            condition: (report) => report.totalSales >= 50000,
            reward: 10000,
            difficulty: 2,
        },
        {
            id: 'sales_80000',
            name: '1日売上8万円',
            description: '1日の売上を8万円以上にする',
            type: 'daily',
            condition: (report) => report.totalSales >= 80000,
            reward: 20000,
            difficulty: 3,
        },
        
        // ===== 利益系 =====
        {
            id: 'profit_10000',
            name: '1日利益1万円',
            description: '1日の純利益を1万円以上にする',
            type: 'daily',
            condition: (report) => report.profit >= 10000,
            reward: 5000,
            difficulty: 1,
        },
        {
            id: 'profit_20000',
            name: '1日利益2万円',
            description: '1日の純利益を2万円以上にする',
            type: 'daily',
            condition: (report) => report.profit >= 20000,
            reward: 12000,
            difficulty: 2,
        },
        {
            id: 'profit_streak_3',
            name: '3日連続黒字',
            description: '3日連続で黒字を達成する',
            type: 'streak',
            streakRequired: 3,
            condition: (report) => report.profit > 0,
            reward: 15000,
            difficulty: 2,
            progress: 0,
        },
        {
            id: 'profit_streak_5',
            name: '5日連続黒字',
            description: '5日連続で黒字を達成する',
            type: 'streak',
            streakRequired: 5,
            condition: (report) => report.profit > 0,
            reward: 30000,
            difficulty: 3,
            progress: 0,
        },
        
        // ===== 商品系 =====
        {
            id: 'bento_30',
            name: '弁当30個販売',
            description: '1日で弁当を30個以上販売する',
            type: 'daily',
            condition: (report) => (report.byProduct.bento?.qty || 0) >= 30,
            reward: 8000,
            difficulty: 2,
        },
        {
            id: 'no_waste',
            name: '廃棄ゼロ',
            description: '1日の廃棄を0にする',
            type: 'daily',
            condition: (report) => report.waste.totalLoss === 0,
            reward: 10000,
            difficulty: 2,
        },
        {
            id: 'no_stockout',
            name: '品切れゼロ',
            description: '1日の品切れを0にする',
            type: 'daily',
            condition: (report) => report.stockouts.length === 0,
            reward: 8000,
            difficulty: 2,
        },
        
        // ===== 来客系 =====
        {
            id: 'customers_200',
            name: '来客200人',
            description: '1日の来客を200人以上にする',
            type: 'daily',
            condition: (report) => report.totalCustomers >= 200,
            reward: 10000,
            difficulty: 2,
        },
        {
            id: 'customers_300',
            name: '来客300人',
            description: '1日の来客を300人以上にする',
            type: 'daily',
            condition: (report) => report.totalCustomers >= 300,
            reward: 20000,
            difficulty: 3,
        },
        
        // ===== スタッフ系 =====
        {
            id: 'full_shift',
            name: 'フルシフト',
            description: '全時間帯にスタッフを配置する',
            type: 'daily',
            condition: (report) => {
                return Object.values(report.byTimeSlot).every(slot => slot.staffCount > 0);
            },
            reward: 5000,
            difficulty: 1,
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.active = [];
        this.completed = [];
        this.assignNewMissions();
    },
    
    // ====================================
    // ミッション割り当て
    // ====================================
    
    assignNewMissions() {
        // 既にアクティブなミッションのIDを取得
        const activeIds = this.active.map(m => m.id);
        const completedIds = this.completed.map(m => m.id);
        
        // 利用可能なミッションを取得
        const available = this.definitions.filter(m => 
            !activeIds.includes(m.id) && !completedIds.includes(m.id)
        );
        
        // 3つまでアクティブにする
        while (this.active.length < 3 && available.length > 0) {
            const index = Math.floor(Math.random() * available.length);
            const mission = { ...available[index] };
            
            // streak系はprogressを初期化
            if (mission.type === 'streak') {
                mission.progress = 0;
            }
            
            this.active.push(mission);
            available.splice(index, 1);
        }
    },
    
    // ====================================
    // ミッションチェック
    // ====================================
    
    checkMissions(report) {
        const results = {
            completed: [],
            failed: [],
            progress: [],
        };
        
        for (let i = this.active.length - 1; i >= 0; i--) {
            const mission = this.active[i];
            const passed = mission.condition(report);
            
            if (mission.type === 'daily') {
                if (passed) {
                    // 達成
                    results.completed.push(mission);
                    this.completed.push(mission);
                    this.active.splice(i, 1);
                }
            } else if (mission.type === 'streak') {
                if (passed) {
                    mission.progress++;
                    if (mission.progress >= mission.streakRequired) {
                        // 達成
                        results.completed.push(mission);
                        this.completed.push(mission);
                        this.active.splice(i, 1);
                    } else {
                        results.progress.push({
                            mission,
                            current: mission.progress,
                            required: mission.streakRequired,
                        });
                    }
                } else {
                    // 連続途切れ
                    if (mission.progress > 0) {
                        results.failed.push(mission);
                    }
                    mission.progress = 0;
                }
            }
        }
        
        // 新しいミッションを補充
        this.assignNewMissions();
        
        return results;
    },
    
    // ====================================
    // 報酬付与
    // ====================================
    
    claimRewards(completedMissions) {
        let totalReward = 0;
        
        for (const mission of completedMissions) {
            totalReward += mission.reward;
        }
        
        GameState.cash += totalReward;
        return totalReward;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getActiveMissions() {
        return this.active.map(m => {
            const info = {
                ...m,
                progressText: '',
            };
            
            if (m.type === 'streak') {
                info.progressText = `${m.progress}/${m.streakRequired}`;
            }
            
            return info;
        });
    },
    
    getDifficultyStars(difficulty) {
        return '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
    },
};
