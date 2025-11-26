// ====================================
// simulation.js - 1日のシミュレーション
// ====================================

const Simulation = {
    
    // ====================================
    // メインシミュレーション
    // ====================================
    
    runDay() {
        // 1. 発注品を受け取り
        const orderCost = GameState.receiveOrders();
        
        // 2. 営業シミュレーション
        const salesReport = this.simulateSales();
        
        // 3. 消費期限処理
        const wasteReport = GameState.processExpiry();
        
        // 4. 人件費
        const wages = Staff.calculateDailyWages();
        
        // 5. 固定費
        const fixedCosts = CONFIG.game.fixedCosts;
        
        // 6. ATM収入
        const atmIncome = GameState.getATMIncome();
        
        // 7. 利益計算
        const totalRevenue = salesReport.totalSales + atmIncome;
        const totalCosts = salesReport.totalCost + wasteReport.totalLoss + wages + fixedCosts;
        const profit = totalRevenue - totalCosts;
        
        // 8. レポート作成
        const report = {
            ...salesReport,
            orderCost,
            waste: wasteReport,
            wages,
            fixedCosts,
            atmIncome,
            profit,
            day: GameState.day,
        };
        
        // 9. 資産更新
        GameState.cash += profit;
        
        // 10. 統計更新
        GameState.updateStats(report);
        
        return report;
    },
    
    // ====================================
    // 売上シミュレーション
    // ====================================
    
    simulateSales() {
        const report = {
            totalSales: 0,
            totalCost: 0,
            totalCustomers: 0,
            byTimeSlot: {},
            byProduct: {},
            stockouts: [],      // 品切れ情報
            staffShortage: [],  // 人手不足情報
        };
        
        // 各種倍率を計算
        const investMultiplier = GameState.getCustomerMultiplier();
        const calendarMultiplier = Calendar.getCustomerMultiplier(GameState.day);
        const weatherMultiplier = Weather.getCustomerMultiplier();
        const reputationMultiplier = Reputation.getCustomerMultiplier();
        
        // 季節イベント
        const seasonalEvent = Calendar.getSeasonalEvent(GameState.day);
        const seasonalBonus = seasonalEvent?.customerBonus || 1.0;
        
        // ランダムイベント
        const randomEvent = Weather.todayEvent;
        const eventBonus = randomEvent?.customerBonus || 1.0;
        
        // 総合倍率
        const baseMultiplier = investMultiplier * calendarMultiplier * weatherMultiplier * reputationMultiplier * seasonalBonus * eventBonus;
        
        CONFIG.timeSlots.forEach(slot => {
            // 時間帯別イベントボーナス
            let slotMultiplier = baseMultiplier;
            if (seasonalEvent?.timeSlotBonus?.[slot.id]) {
                slotMultiplier *= seasonalEvent.timeSlotBonus[slot.id];
            }
            if (randomEvent?.timeSlotBonus?.[slot.id]) {
                slotMultiplier *= randomEvent.timeSlotBonus[slot.id];
            }
            
            const slotReport = this.simulateTimeSlot(slot, slotMultiplier);
            
            report.byTimeSlot[slot.id] = slotReport;
            report.totalSales += slotReport.sales;
            report.totalCost += slotReport.cost;
            report.totalCustomers += slotReport.customers;
            
            // 品切れ記録
            slotReport.stockouts.forEach(so => {
                const existing = report.stockouts.find(s => s.productId === so.productId);
                if (existing) {
                    existing.count += so.count;
                } else {
                    report.stockouts.push({ ...so });
                }
            });
            
            // 人手不足記録
            if (slotReport.staffCount === 0) {
                report.staffShortage.push({
                    slotId: slot.id,
                    slotName: slot.name,
                });
            }
            
            // 商品別売上
            Object.entries(slotReport.byProduct).forEach(([productId, data]) => {
                if (!report.byProduct[productId]) {
                    report.byProduct[productId] = { qty: 0, sales: 0 };
                }
                report.byProduct[productId].qty += data.qty;
                report.byProduct[productId].sales += data.sales;
            });
        });
        
        return report;
    },
    
    // ====================================
    // 時間帯別シミュレーション
    // ====================================
    
    simulateTimeSlot(slot, customerMultiplier) {
        const staffCount = Staff.getStaffCountOnShift(slot.id);
        const staffEfficiency = Staff.getShiftEfficiency(slot.id);
        
        // 来客数計算
        const baseCustomers = slot.baseCustomers * customerMultiplier * staffEfficiency;
        const variance = Math.floor(Math.random() * 10) - 5;
        const customers = Math.max(0, Math.floor(baseCustomers + variance));
        
        const slotReport = {
            customers,
            sales: 0,
            cost: 0,
            staffCount,
            byProduct: {},
            stockouts: [],
        };
        
        // 各顧客の購入シミュレーション
        for (let i = 0; i < customers; i++) {
            const itemCount = 1 + Math.floor(Math.random() * 3);
            
            for (let j = 0; j < itemCount; j++) {
                const product = this.selectProductByDemand(slot.id);
                if (!product) continue;
                
                const stock = GameState.getInventoryQty(product.id);
                
                if (stock > 0 && GameState.sellOne(product.id)) {
                    slotReport.sales += product.price;
                    slotReport.cost += product.cost;
                    
                    if (!slotReport.byProduct[product.id]) {
                        slotReport.byProduct[product.id] = { qty: 0, sales: 0 };
                    }
                    slotReport.byProduct[product.id].qty++;
                    slotReport.byProduct[product.id].sales += product.price;
                } else {
                    // 品切れ
                    const existing = slotReport.stockouts.find(s => s.productId === product.id);
                    if (existing) {
                        existing.count++;
                    } else {
                        slotReport.stockouts.push({
                            productId: product.id,
                            productName: product.name,
                            count: 1,
                        });
                    }
                }
            }
        }
        
        return slotReport;
    },
    
    // ====================================
    // 需要に基づく商品選択
    // ====================================
    
    selectProductByDemand(slotId) {
        const baseDemands = CONFIG.demand[slotId];
        const seasonalDemand = Calendar.getSeasonalDemand(GameState.day);
        const weatherDemand = Weather.getDemandModifier();
        const seasonalEvent = Calendar.getSeasonalEvent(GameState.day);
        const randomEvent = Weather.todayEvent;
        
        const weights = [];
        let totalWeight = 0;
        
        CONFIG.products.forEach(p => {
            // 基本需要
            let demandMultiplier = baseDemands[p.id] || 1;
            
            // 季節補正
            if (seasonalDemand[p.id]) {
                demandMultiplier *= seasonalDemand[p.id];
            }
            
            // 天候補正
            if (weatherDemand[p.id]) {
                demandMultiplier *= weatherDemand[p.id];
            }
            
            // 季節イベント補正
            if (seasonalEvent?.demand?.[p.id]) {
                demandMultiplier *= seasonalEvent.demand[p.id];
            }
            
            // ランダムイベント補正
            if (randomEvent?.demand?.[p.id]) {
                demandMultiplier *= randomEvent.demand[p.id];
            }
            
            const stockFactor = GameState.getInventoryQty(p.id) > 0 ? 1 : 0.1;
            const weight = demandMultiplier * stockFactor;
            
            weights.push({ product: p, weight });
            totalWeight += weight;
        });
        
        if (totalWeight === 0) return null;
        
        let random = Math.random() * totalWeight;
        for (const w of weights) {
            random -= w.weight;
            if (random <= 0) return w.product;
        }
        
        return weights[0]?.product;
    },
    
    // ====================================
    // 分析用ヘルパー
    // ====================================
    
    // 最も売れた商品
    getTopSellingProduct(report) {
        let top = null;
        let maxQty = 0;
        
        Object.entries(report.byProduct).forEach(([productId, data]) => {
            if (data.qty > maxQty) {
                maxQty = data.qty;
                top = { productId, ...data, product: CONFIG.getProduct(productId) };
            }
        });
        
        return top;
    },
    
    // 最も品切れが多かった商品
    getTopStockout(report) {
        if (report.stockouts.length === 0) return null;
        return report.stockouts.reduce((max, so) => so.count > max.count ? so : max);
    },
    
    // 最も廃棄が多かった商品
    getTopWaste(report) {
        if (report.waste.items.length === 0) return null;
        return report.waste.items.reduce((max, w) => w.qty > max.qty ? w : max);
    },
    
    // 人手不足だった時間帯
    getUnderstaffedSlots(report) {
        const understaffed = [];
        
        Object.entries(report.byTimeSlot).forEach(([slotId, data]) => {
            if (data.staffCount === 0) {
                understaffed.push({
                    slotId,
                    slotName: CONFIG.getTimeSlot(slotId).name,
                });
            } else if (data.staffCount === 1 && data.customers > 30) {
                understaffed.push({
                    slotId,
                    slotName: CONFIG.getTimeSlot(slotId).name,
                    busy: true,
                });
            }
        });
        
        return understaffed;
    },
    
    // 最も忙しかった時間帯
    getBusiestSlot(report) {
        let busiest = null;
        let maxCustomers = 0;
        
        Object.entries(report.byTimeSlot).forEach(([slotId, data]) => {
            if (data.customers > maxCustomers) {
                maxCustomers = data.customers;
                busiest = { slotId, slotName: CONFIG.getTimeSlot(slotId).name, ...data };
            }
        });
        
        return busiest;
    },
};
