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
        
        // 初日の天候生成
        this.todayInfo = Weather.processDay(GameState.day);
        
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
        
        // シミュレーション実行
        const report = Simulation.runDay();
        
        // 評判更新
        const reputationResult = Reputation.update(report);
        report.reputation = reputationResult;
        
        // ミッションチェック
        const missionResult = Missions.checkMissions(report);
        report.missions = missionResult;
        
        // ミッション報酬
        if (missionResult.completed.length > 0) {
            report.missionReward = Missions.claimRewards(missionResult.completed);
        }
        
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
        if (GameState.isGameOver()) {
            console.log('ゲームオーバー: 倒産');
            UI.showGameOver();
            return;
        }
        
        if (GameState.isGameComplete()) {
            console.log('ゲーム終了: ' + (GameState.isWin() ? '目標達成' : '30日経過'));
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
