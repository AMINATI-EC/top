// ====================================
// personas.js - 客層・ペルソナシステム
// ====================================

const Personas = {
    // 客層定義
    types: [
        {
            id: 'student',
            name: '学生',
            icon: '🎒',
            timePreference: { morning: 0.3, noon: 1.5, evening: 1.2, night: 0.8, midnight: 0.2 },
            productPreference: { snack: 2.0, drink: 1.5, magazine: 1.8, onigiri: 1.5, ice: 1.5 },
            priceAware: true,      // 価格に敏感
            avgSpend: 400,
            traits: ['安さ重視', '友達と来店'],
        },
        {
            id: 'salaryman',
            name: 'サラリーマン',
            icon: '👔',
            timePreference: { morning: 1.8, noon: 1.5, evening: 1.2, night: 0.5, midnight: 0.3 },
            productPreference: { bento: 2.0, coffee: 2.0, onigiri: 1.5, magazine: 1.2 },
            priceAware: false,
            avgSpend: 800,
            traits: ['時間優先', '定番商品'],
        },
        {
            id: 'ol',
            name: 'OL',
            icon: '👩‍💼',
            timePreference: { morning: 1.5, noon: 1.8, evening: 1.0, night: 0.3, midnight: 0.1 },
            productPreference: { sandwich: 2.0, coffee: 1.8, snack: 1.5, daily: 1.3 },
            priceAware: false,
            avgSpend: 700,
            traits: ['健康志向', 'スイーツ好き'],
        },
        {
            id: 'housewife',
            name: '主婦',
            icon: '👩',
            timePreference: { morning: 1.2, noon: 1.0, evening: 2.0, night: 0.5, midnight: 0.1 },
            productPreference: { bento: 1.5, daily: 2.0, snack: 1.3, drink: 1.2 },
            priceAware: true,
            avgSpend: 1200,
            traits: ['まとめ買い', 'セール好き'],
        },
        {
            id: 'senior',
            name: 'シニア',
            icon: '👴',
            timePreference: { morning: 2.0, noon: 1.2, evening: 0.8, night: 0.2, midnight: 0.0 },
            productPreference: { bento: 1.5, daily: 1.8, magazine: 1.5 },
            priceAware: false,
            avgSpend: 600,
            traits: ['朝型', '常連になりやすい'],
        },
        {
            id: 'nightworker',
            name: '夜勤労働者',
            icon: '🦺',
            timePreference: { morning: 0.2, noon: 0.3, evening: 0.5, night: 1.5, midnight: 2.5 },
            productPreference: { cup_noodle: 2.0, bento: 1.8, coffee: 2.0, drink: 1.5 },
            priceAware: false,
            avgSpend: 900,
            traits: ['深夜常連', 'ガッツリ系'],
        },
    ],
    
    // 現在の客層分布
    distribution: {},
    
    // ====================================
    // 初期化
    // ====================================
    
    init() {
        this.distribution = {};
        this.types.forEach(t => {
            this.distribution[t.id] = 1.0;  // 初期は均等
        });
    },
    
    // ====================================
    // 立地による客層変化
    // ====================================
    
    applyLocationEffect(locationId) {
        const effects = Location.getPersonaEffect(locationId);
        if (effects) {
            Object.keys(effects).forEach(personaId => {
                this.distribution[personaId] = (this.distribution[personaId] || 1.0) * effects[personaId];
            });
        }
    },
    
    // ====================================
    // 時間帯の客層を取得
    // ====================================
    
    getTimeSlotPersonas(slotId) {
        const result = [];
        
        this.types.forEach(persona => {
            const timeMod = persona.timePreference[slotId] || 1.0;
            const distMod = this.distribution[persona.id] || 1.0;
            
            if (timeMod * distMod > 0.3) {
                result.push({
                    ...persona,
                    weight: timeMod * distMod,
                });
            }
        });
        
        return result.sort((a, b) => b.weight - a.weight);
    },
    
    // ====================================
    // 商品需要への影響
    // ====================================
    
    getProductDemandModifier(productId, slotId) {
        let modifier = 1.0;
        const personas = this.getTimeSlotPersonas(slotId);
        
        personas.forEach(p => {
            const pref = p.productPreference[productId] || 1.0;
            modifier += (pref - 1.0) * p.weight * 0.3;
        });
        
        return Math.max(0.5, Math.min(2.0, modifier));
    },
    
    // ====================================
    // セールへの反応
    // ====================================
    
    getSaleEffectiveness(slotId) {
        const personas = this.getTimeSlotPersonas(slotId);
        let effectiveness = 1.0;
        
        personas.forEach(p => {
            if (p.priceAware) {
                effectiveness += 0.2 * p.weight;
            }
        });
        
        return effectiveness;
    },
    
    // ====================================
    // 表示用
    // ====================================
    
    getDistributionDisplay() {
        return this.types.map(t => ({
            ...t,
            level: this.distribution[t.id] || 1.0,
            percentage: Math.round((this.distribution[t.id] || 1.0) * 100 / 
                Object.values(this.distribution).reduce((a, b) => a + b, 0) * 100),
        }));
    },
};
