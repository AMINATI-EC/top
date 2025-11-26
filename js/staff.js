// ====================================
// staff.js - バイト関連ロジック
// ====================================

const Staff = {
    
    // ====================================
    // 固有スキル定義
    // ====================================
    
    specialSkills: [
        {
            id: 'sales_master',
            name: '接客の神',
            icon: '🌟',
            description: '客単価が10%アップ',
            effect: { customerSpendBoost: 1.1 },
            rarity: 'rare',
        },
        {
            id: 'stock_master',
            name: '品出しマスター',
            icon: '📦',
            description: '廃棄が20%減少',
            effect: { wasteReduction: 0.8 },
            rarity: 'uncommon',
        },
        {
            id: 'night_owl',
            name: '夜型人間',
            icon: '🦉',
            description: '深夜帯の効率2倍',
            effect: { nightEfficiency: 2.0 },
            rarity: 'uncommon',
        },
        {
            id: 'morning_person',
            name: '朝型人間',
            icon: '🌅',
            description: '朝の時間帯の効率1.5倍',
            effect: { morningEfficiency: 1.5 },
            rarity: 'uncommon',
        },
        {
            id: 'speed_demon',
            name: 'スピードスター',
            icon: '⚡',
            description: 'レジ処理速度1.3倍',
            effect: { registerSpeed: 1.3 },
            rarity: 'uncommon',
        },
        {
            id: 'friendly',
            name: '愛されキャラ',
            icon: '💕',
            description: '常連客が増えやすい',
            effect: { regularBoost: 1.5 },
            rarity: 'rare',
        },
        {
            id: 'eagle_eye',
            name: '鷹の目',
            icon: '👁️',
            description: '万引き発見率UP',
            effect: { theftPrevention: 0.5 },
            rarity: 'uncommon',
        },
        {
            id: 'tireless',
            name: 'タフガイ',
            icon: '💪',
            description: 'モチベーションが下がりにくい',
            effect: { motivationDecay: 0.5 },
            rarity: 'uncommon',
        },
        {
            id: 'lucky',
            name: '幸運の持ち主',
            icon: '🍀',
            description: 'トラブル発生率-20%',
            effect: { troubleReduction: 0.8 },
            rarity: 'rare',
        },
        {
            id: 'genius',
            name: '天才',
            icon: '🧠',
            description: 'スキル成長2倍',
            effect: { skillGrowth: 2.0 },
            rarity: 'legendary',
        },
    ],
    
    // ====================================
    // バイト生成
    // ====================================
    
    // スプライト名リスト
    spriteNames: ['staffMaleA', 'staffFemaleA', 'staffMaleB', 'staffFemaleB'],
    spriteIndex: 0,

    generate(customName = null) {
        const name = customName || this.getRandomName();
        const personality = this.getRandomPersonality();
        const specialSkill = this.rollSpecialSkill();
        
        // スプライトを順番に割り当て（ランダムでもOK）
        const sprite = this.spriteNames[this.spriteIndex % this.spriteNames.length];
        this.spriteIndex++;
        
        const staff = {
            id: GameState.nextStaffId++,
            name: name,
            wage: CONFIG.staff.baseWage + Math.floor(Math.random() * CONFIG.staff.wageVariation),
            skills: {
                register: Math.floor(Math.random() * 3) + 1,  // 1-3
                stock: Math.floor(Math.random() * 3) + 1,
                clean: Math.floor(Math.random() * 3) + 1,
            },
            personality: personality,
            specialSkill: specialSkill,  // 固有スキル追加
            shifts: { 
                morning: false, 
                noon: false, 
                evening: false, 
                night: false, 
                midnight: false 
            },
            experience: 0,
            motivation: 70 + Math.floor(Math.random() * 30),
            daysWorked: 0,
            sprite: sprite,  // ドット絵スプライト名
        };
        
        // 固有スキルで時給調整
        if (specialSkill) {
            if (specialSkill.rarity === 'legendary') {
                staff.wage += 200;
            } else if (specialSkill.rarity === 'rare') {
                staff.wage += 100;
            }
        }
        
        return staff;
    },
    
    rollSpecialSkill() {
        const roll = Math.random();
        
        // 30%の確率で固有スキルなし
        if (roll < 0.3) return null;
        
        // レアリティ抽選
        let pool;
        if (roll < 0.35) {
            // 5%でレジェンダリー
            pool = this.specialSkills.filter(s => s.rarity === 'legendary');
        } else if (roll < 0.5) {
            // 15%でレア
            pool = this.specialSkills.filter(s => s.rarity === 'rare');
        } else {
            // 50%でアンコモン
            pool = this.specialSkills.filter(s => s.rarity === 'uncommon');
        }
        
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    },
    
    getRandomName() {
        const names = CONFIG.staffNames;
        return names[Math.floor(Math.random() * names.length)];
    },
    
    getRandomPersonality() {
        const personalities = CONFIG.personalities;
        return personalities[Math.floor(Math.random() * personalities.length)];
    },
    
    // ====================================
    // 採用
    // ====================================
    
    getHiringCost(staff) {
        return staff.wage * CONFIG.staff.trainingCostHours;
    },
    
    hire(staff) {
        const cost = this.getHiringCost(staff);
        if (GameState.cash < cost) return false;
        
        GameState.cash -= cost;
        GameState.staff.push(staff);
        return true;
    },
    
    // 採用候補を生成（3人）
    generateCandidates(count = 3) {
        const candidates = [];
        for (let i = 0; i < count; i++) {
            candidates.push(this.generate());
        }
        return candidates;
    },
    
    // ====================================
    // シフト管理
    // ====================================
    
    toggleShift(staffId, slotId) {
        const staff = GameState.staff.find(s => s.id === staffId);
        if (staff) {
            staff.shifts[slotId] = !staff.shifts[slotId];
        }
    },
    
    getStaffOnShift(slotId) {
        return GameState.staff.filter(s => s.shifts[slotId]);
    },
    
    getStaffCountOnShift(slotId) {
        return this.getStaffOnShift(slotId).length;
    },
    
    // ====================================
    // 人件費計算
    // ====================================
    
    calculateDailyWages() {
        let total = 0;
        
        GameState.staff.forEach(s => {
            let hours = 0;
            CONFIG.timeSlots.forEach(slot => {
                if (s.shifts[slot.id]) {
                    hours += slot.hours;
                }
            });
            total += hours * s.wage;
        });
        
        return total;
    },
    
    // ====================================
    // スタッフ効率計算
    // ====================================
    
    // その時間帯のスタッフ効率（0.1〜1.2）
    getShiftEfficiency(slotId) {
        const staffOnShift = this.getStaffOnShift(slotId);
        const count = staffOnShift.length;
        
        if (count === 0) return 0.1;  // 誰もいないとほぼ機能しない
        
        // 基本効率
        let efficiency = Math.min(1, 0.5 + count * 0.25);
        
        // スタッフのスキルと性格でボーナス
        staffOnShift.forEach(s => {
            const skillAvg = (s.skills.register + s.skills.stock + s.skills.clean) / 3;
            const personalityBonus = s.personality.workBonus || 1.0;
            efficiency += (skillAvg - 2) * 0.05 * personalityBonus;
        });
        
        return Math.min(1.2, Math.max(0.1, efficiency));
    },
    
    // ====================================
    // スキル表示用
    // ====================================
    
    getSkillStars(level) {
        return '★'.repeat(level) + '☆'.repeat(3 - level);
    },
    
    // ====================================
    // その日働いたスタッフを取得（コメント用）
    // ====================================
    
    getWorkingStaffToday() {
        return GameState.staff.filter(s => {
            return Object.values(s.shifts).some(v => v);
        });
    },
    
    // ランダムに1人選ぶ（コメント用）
    getRandomWorkingStaff() {
        const working = this.getWorkingStaffToday();
        if (working.length === 0) return null;
        return working[Math.floor(Math.random() * working.length)];
    },
    
    // ====================================
    // 成長・離職システム
    // ====================================
    
    processDailyGrowth() {
        const events = [];
        
        GameState.staff.forEach(staff => {
            // 今日働いたかチェック
            const workedToday = Object.values(staff.shifts).some(s => s);
            
            if (workedToday) {
                staff.daysWorked++;
                staff.experience++;
                
                // スキル成長（10日ごとにチャンス）
                if (staff.daysWorked % 10 === 0) {
                    const grewSkill = this.trySkillUp(staff);
                    if (grewSkill) {
                        events.push({
                            type: 'skill_up',
                            staff: staff,
                            skill: grewSkill,
                            message: `${staff.name}の${grewSkill}スキルが上がった！`,
                        });
                    }
                }
                
                // モチベーション変動
                const shiftCount = Object.values(staff.shifts).filter(s => s).length;
                if (shiftCount >= 4) {
                    staff.motivation = Math.max(0, staff.motivation - 5);
                } else if (shiftCount <= 2) {
                    staff.motivation = Math.min(100, staff.motivation + 2);
                }
            }
        });
        
        // 離職チェック
        const quitters = this.checkQuit();
        quitters.forEach(staff => {
            events.push({
                type: 'quit',
                staff: staff,
                message: `${staff.name}が辞めてしまった...`,
            });
        });
        
        return events;
    },
    
    trySkillUp(staff) {
        const skills = ['register', 'stock', 'clean'];
        const skill = skills[Math.floor(Math.random() * skills.length)];
        
        if (staff.skills[skill] < 5) {
            staff.skills[skill]++;
            const skillNames = { register: 'レジ', stock: '品出し', clean: '清掃' };
            return skillNames[skill];
        }
        return null;
    },
    
    checkQuit() {
        const quitters = [];
        
        GameState.staff = GameState.staff.filter(staff => {
            const quitChance = this.calculateQuitChance(staff);
            
            if (Math.random() < quitChance) {
                quitters.push(staff);
                return false;
            }
            return true;
        });
        
        return quitters;
    },
    
    calculateQuitChance(staff) {
        let chance = 0;
        
        if (staff.motivation < 30) {
            chance += 0.1;
        } else if (staff.motivation < 50) {
            chance += 0.03;
        }
        
        if (staff.daysWorked > 20) {
            chance *= 0.5;
        }
        
        if (staff.personality.id === 'serious') {
            chance *= 0.7;
        }
        
        return Math.min(0.15, chance);
    },
    
    giveBonus(staffId, amount = 5000) {
        const staff = GameState.staff.find(s => s.id === staffId);
        if (!staff) return { success: false, message: 'スタッフが見つかりません' };
        if (GameState.cash < amount) return { success: false, message: '資金不足です' };
        
        GameState.cash -= amount;
        staff.motivation = Math.min(100, staff.motivation + 20);
        
        return {
            success: true,
            message: `${staff.name}にボーナスを支給！モチベーションが上がった`,
        };
    },
};
