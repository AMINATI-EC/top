// ====================================
// staff.js - バイト関連ロジック
// ====================================

const Staff = {
    
    // ====================================
    // バイト生成
    // ====================================
    
    // スプライト名リスト
    spriteNames: ['staffMaleA', 'staffFemaleA', 'staffMaleB', 'staffFemaleB'],
    spriteIndex: 0,

    generate(customName = null) {
        const name = customName || this.getRandomName();
        const personality = this.getRandomPersonality();
        
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
        
        return staff;
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
