// ====================================
// bank.js - 銀行融資システム
// ====================================

const Bank = {
    // 借入金
    debt: 0,
    
    // 日利率
    dailyInterestRate: 0.002,  // 0.2%/日（年利約73%、高利貸し風）
    
    // 累計利息
    totalInterestPaid: 0,
    
    // 融資プラン
    plans: [
        {
            id: 'small',
            name: '少額融資',
            amount: 50000,
            description: '手軽に借りられる少額プラン',
        },
        {
            id: 'medium',
            name: '中規模融資',
            amount: 150000,
            description: '設備投資向けプラン',
        },
        {
            id: 'large',
            name: '大口融資',
            amount: 300000,
            description: '大規模な資金調達に',
        },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.debt = 0;
        this.totalInterestPaid = 0;
    },
    
    // ====================================
    // 借入
    // ====================================
    
    borrow(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return { success: false, message: 'プランが見つかりません' };
        
        // 借入上限チェック（資産の3倍まで）
        const maxDebt = Math.max(500000, GameState.cash * 3);
        if (this.debt + plan.amount > maxDebt) {
            return { 
                success: false, 
                message: `借入上限（¥${maxDebt.toLocaleString()}）を超えています` 
            };
        }
        
        this.debt += plan.amount;
        GameState.cash += plan.amount;
        
        return {
            success: true,
            message: `¥${plan.amount.toLocaleString()}を借り入れました`,
            newDebt: this.debt,
        };
    },
    
    // ====================================
    // 返済
    // ====================================
    
    repay(amount) {
        if (amount <= 0) return { success: false, message: '返済額を入力してください' };
        if (amount > GameState.cash) return { success: false, message: '資金が不足しています' };
        if (amount > this.debt) amount = this.debt;
        
        GameState.cash -= amount;
        this.debt -= amount;
        
        return {
            success: true,
            message: `¥${amount.toLocaleString()}を返済しました`,
            remainingDebt: this.debt,
        };
    },
    
    // 全額返済
    repayAll() {
        return this.repay(this.debt);
    },
    
    // ====================================
    // 日次利息処理
    // ====================================
    
    processDailyInterest() {
        if (this.debt <= 0) return 0;
        
        const interest = Math.floor(this.debt * this.dailyInterestRate);
        this.debt += interest;
        this.totalInterestPaid += interest;
        
        return interest;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getStatus() {
        const dailyInterest = Math.floor(this.debt * this.dailyInterestRate);
        
        return {
            debt: this.debt,
            dailyInterest,
            totalInterestPaid: this.totalInterestPaid,
            hasDebt: this.debt > 0,
            debtLevel: this.debt > 200000 ? 'high' : this.debt > 50000 ? 'medium' : 'low',
        };
    },
    
    // 借入可能額
    getMaxBorrowable() {
        const maxDebt = Math.max(500000, GameState.cash * 3);
        return Math.max(0, maxDebt - this.debt);
    },
};
