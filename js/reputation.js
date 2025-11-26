// ====================================
// reputation.js - 評判システム
// ====================================

const Reputation = {
    // 現在の評判（0-100）
    score: 50,
    
    // 評判のランク
    ranks: [
        { min: 0, max: 19, name: '最悪', icon: '😰', multiplier: 0.6 },
        { min: 20, max: 39, name: '悪い', icon: '😟', multiplier: 0.8 },
        { min: 40, max: 59, name: '普通', icon: '😐', multiplier: 1.0 },
        { min: 60, max: 79, name: '良い', icon: '😊', multiplier: 1.15 },
        { min: 80, max: 100, name: '最高', icon: '🤩', multiplier: 1.3 },
    ],
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.score = 50;
    },
    
    // ====================================
    // 評判の変動
    // ====================================
    
    update(report) {
        let change = 0;
        const reasons = [];
        
        // 品切れによるマイナス
        if (report.stockouts.length > 0) {
            const stockoutCount = report.stockouts.reduce((sum, s) => sum + s.count, 0);
            if (stockoutCount > 20) {
                change -= 5;
                reasons.push({ text: '品切れ多発', value: -5 });
            } else if (stockoutCount > 10) {
                change -= 3;
                reasons.push({ text: '品切れあり', value: -3 });
            } else if (stockoutCount > 5) {
                change -= 1;
                reasons.push({ text: '軽微な品切れ', value: -1 });
            }
        }
        
        // 人手不足によるマイナス
        const understaffedSlots = Object.values(report.byTimeSlot).filter(s => s.staffCount === 0);
        if (understaffedSlots.length > 0) {
            change -= understaffedSlots.length * 2;
            reasons.push({ text: `無人営業${understaffedSlots.length}回`, value: -understaffedSlots.length * 2 });
        }
        
        // 待ち時間（来客多すぎてスタッフ少ない）
        Object.values(report.byTimeSlot).forEach(slot => {
            if (slot.staffCount > 0 && slot.customers / slot.staffCount > 50) {
                change -= 2;
                reasons.push({ text: '待ち時間長い', value: -2 });
            }
        });
        
        // 廃棄が少ないとプラス（新鮮な商品が多い印象）
        if (report.waste.totalLoss === 0) {
            change += 2;
            reasons.push({ text: '品質管理◎', value: +2 });
        }
        
        // 売上が良いとプラス（活気がある）
        if (report.totalSales >= 50000) {
            change += 2;
            reasons.push({ text: '繁盛店', value: +2 });
        } else if (report.totalSales >= 30000) {
            change += 1;
            reasons.push({ text: '順調な営業', value: +1 });
        }
        
        // 全時間帯にスタッフがいるとプラス
        const allStaffed = Object.values(report.byTimeSlot).every(s => s.staffCount > 0);
        if (allStaffed) {
            change += 1;
            reasons.push({ text: 'フル営業', value: +1 });
        }
        
        // 変動を適用（-10〜+10の範囲に制限）
        change = Math.max(-10, Math.min(10, change));
        this.score = Math.max(0, Math.min(100, this.score + change));
        
        return {
            change,
            newScore: this.score,
            reasons,
            rank: this.getRank(),
        };
    },
    
    // ====================================
    // ランク取得
    // ====================================
    
    getRank() {
        for (const rank of this.ranks) {
            if (this.score >= rank.min && this.score <= rank.max) {
                return rank;
            }
        }
        return this.ranks[2]; // デフォルト: 普通
    },
    
    // ====================================
    // 来客倍率
    // ====================================
    
    getCustomerMultiplier() {
        return this.getRank().multiplier;
    },
    
    // ====================================
    // 評判による特殊効果
    // ====================================
    
    getEffects() {
        const effects = [];
        const rank = this.getRank();
        
        if (this.score >= 80) {
            effects.push('🌟 口コミで新規客が増加');
            effects.push('🌟 高評価で単価アップ');
        } else if (this.score >= 60) {
            effects.push('😊 リピーター増加中');
        } else if (this.score <= 20) {
            effects.push('😰 悪評が広まっている...');
            effects.push('😰 客足が遠のいている');
        } else if (this.score <= 40) {
            effects.push('😟 評判を改善しましょう');
        }
        
        return effects;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getDisplay() {
        const rank = this.getRank();
        return {
            score: this.score,
            rankName: rank.name,
            icon: rank.icon,
            multiplier: rank.multiplier,
            effects: this.getEffects(),
            progressPercent: this.score,
        };
    },
    
    // 評判バーの色
    getBarColor() {
        if (this.score >= 80) return '#4ade80';
        if (this.score >= 60) return '#a3e635';
        if (this.score >= 40) return '#facc15';
        if (this.score >= 20) return '#fb923c';
        return '#f87171';
    },
};
