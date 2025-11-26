// ====================================
// main.js - メインゲームフロー
// ====================================

const Main = {
    
    // 今日の天候・イベント情報
    todayInfo: null,
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        console.log('コンビニ経営シミュレーション 初期化中...');
        Events.init();
        Endgame.init();
        console.log('準備完了！');
    },
    
    // ====================================
    // ゲーム開始
    // ====================================
    
    startGame() {
        console.log('ゲーム開始');
        
        // 状態初期化
        GameState.init();
        Reputation.init();
        Missions.init();
        Rival.init();
        Customers.init();
        Bank.init();
        Security.init();
        Development.init();
        Personas.init();
        Location.init();
        Campaign.init();
        Suppliers.init();
        Layout.init();
        Troubles.init();
        Franchise.init();
        Achievements.init();
        
        // エンドゲームモードの適用
        const modifiers = Endgame.getModifiers();
        if (modifiers.startingCash) {
            GameState.cash = modifiers.startingCash;
        }
        if (modifiers.startingDebt) {
            Bank.debt = modifiers.startingDebt;
        }
        
        // 初日の天候生成
        this.todayInfo = Weather.processDay(GameState.day);
        
        // 客層を立地に合わせる
        Personas.applyLocationEffect(Location.current);
        
        // UI更新
        UI.hideTitle();
        UI.hideGameOver();
        UI.renderAll();
        Events.bindDynamicEvents();
    },
    
    // ====================================
    // 翌日へ進む
    // ====================================
    
    nextDay() {
        console.log(`${GameState.day}日目終了、シミュレーション実行`);
        
        // トラブル発生チェック
        const troubles = Troubles.checkTroubles();
        
        // 競合店の動き
        const rivalEvents = Rival.dailyUpdate();
        
        // 競合店出現チェック
        const newRival = Rival.checkAppearance(GameState.day);
        
        // フランチャイズ指令チェック
        const directive = Franchise.checkDirectives();
        
        // シミュレーション実行
        const report = Simulation.runDay();
        
        // 家賃支払い
        const rent = Location.getDailyRent();
        GameState.cash -= rent;
        report.rent = rent;
        
        // ロイヤリティ支払い
        const royalty = Franchise.getDailyRoyalty(report.sales);
        Franchise.payRoyalty(royalty);
        report.royalty = royalty;
        
        // 常連客処理
        const customerResult = Customers.processDailyVisits(report);
        report.customers = customerResult;
        
        // 万引き処理
        const securityResult = Security.processDailyTheft(report);
        report.security = securityResult;
        
        // 銀行利息
        const interest = Bank.processDailyInterest();
        report.interest = interest;
        
        // 新商品開発進捗
        const devResult = Development.processDailyProgress();
        report.development = devResult;
        
        // キャンペーン処理
        const campaignResult = Campaign.processDailyEnd();
        report.campaign = campaignResult;
        
        // バイトの成長・離職
        const staffEvents = Staff.processDailyGrowth();
        report.staffEvents = staffEvents;
        
        // 仕入れ先信頼度UP
        Suppliers.addTrust(1);
        
        // 評判更新
        const reputationResult = Reputation.update(report);
        report.reputation = reputationResult;
        
        // フランチャイズノルマチェック
        const quotaResult = Franchise.checkQuota(report);
        report.quota = quotaResult;
        
        // ミッションチェック
        const missionResult = Missions.checkMissions(report);
        report.missions = missionResult;
        
        // ミッション報酬
        if (missionResult.completed.length > 0) {
            report.missionReward = Missions.claimRewards(missionResult.completed);
        }
        
        // 実績チェック
        const newAchievements = Achievements.checkAchievements(report);
        if (newAchievements.length > 0) {
            report.achievements = newAchievements;
            report.achievementReward = Achievements.claimRewards(newAchievements);
        }
        
        // 競合店情報
        report.rival = {
            events: rivalEvents,
            newRival: newRival,
            stores: Rival.stores,
        };
        
        // トラブル情報
        report.troubles = troubles;
        
        // 今日の情報を保存
        report.weather = Weather.getCurrentWeather();
        report.event = Weather.todayEvent;
        report.calendar = Calendar.getDateDisplay(GameState.day);
        
        // レポート表示
        UI.showReport(report);
    },
    
    // ====================================
    // レポートを閉じて次の日へ
    // ====================================
    
    closeReport() {
        UI.hideReport();
        
        // 日付を進める
        GameState.advanceDay();
        
        // ゲーム終了判定
        const maxDays = Endgame.getMaxDays();
        const targetCash = Endgame.getTargetCash();
        
        if (GameState.isGameOver()) {
            console.log('ゲームオーバー: 倒産');
            UI.showGameOver();
            return;
        }
        
        if (GameState.day > maxDays || GameState.cash >= targetCash) {
            console.log('ゲーム終了');
            // クリア処理
            if (GameState.cash >= targetCash) {
                Endgame.processClear(GameState.cash, GameState.day);
            }
            UI.showGameOver();
            return;
        }
        
        // 新しい日の天候生成
        this.todayInfo = Weather.processDay(GameState.day);
        
        // UI更新
        UI.renderAll();
        Events.bindDynamicEvents();
    },
};

// ====================================
// アプリ起動
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    Main.init();
});
