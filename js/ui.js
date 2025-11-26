// ====================================
// ui.js - UI描画
// ====================================

const UI = {
    
    // ====================================
    // 全体更新
    // ====================================
    
    renderAll() {
        this.renderHeader();
        this.renderProducts();
        this.renderStaff();
        this.renderInvestments();
        this.renderMissions();
        this.renderDevelopment();
        this.renderBank();
        this.renderInfo();
    },
    
    // ====================================
    // ヘッダー
    // ====================================
    
    renderHeader() {
        document.getElementById('current-day').textContent = GameState.day;
        document.getElementById('stat-cash').textContent = '¥' + GameState.cash.toLocaleString();
        document.getElementById('stat-sales').textContent = '¥' + GameState.yesterdaySales.toLocaleString();
        
        const profitEl = document.getElementById('stat-profit');
        const profit = GameState.yesterdayProfit;
        profitEl.textContent = (profit >= 0 ? '+' : '') + '¥' + profit.toLocaleString();
        profitEl.className = 'stat-value ' + (profit >= 0 ? 'positive' : 'negative');
        
        // 曜日・季節
        const dateInfo = Calendar.getDateDisplay(GameState.day);
        document.getElementById('day-of-week').textContent = `（${dateInfo.dayOfWeek}）`;
        document.getElementById('day-of-week').className = 'dow-badge' + (dateInfo.isWeekend ? ' weekend' : '');
        document.getElementById('season-display').textContent = dateInfo.season;
        
        // 天候
        const weather = Weather.getCurrentWeather();
        document.getElementById('weather-icon').textContent = weather.name.split(' ')[0];
        document.getElementById('weather-name').textContent = weather.name.split(' ')[1] || '';
        
        // イベント
        const eventBadge = document.getElementById('event-badge');
        const seasonalEvent = Calendar.getSeasonalEvent(GameState.day);
        const randomEvent = Weather.todayEvent;
        
        if (seasonalEvent) {
            eventBadge.textContent = seasonalEvent.name;
            eventBadge.style.display = 'inline-block';
        } else if (randomEvent) {
            eventBadge.textContent = randomEvent.name;
            eventBadge.style.display = 'inline-block';
        } else {
            eventBadge.style.display = 'none';
        }
        
        // 評判
        const rep = Reputation.getDisplay();
        document.getElementById('reputation-fill').style.width = rep.progressPercent + '%';
        document.getElementById('reputation-fill').style.background = Reputation.getBarColor();
        document.getElementById('reputation-icon').textContent = rep.icon;
    },
    
    // ====================================
    // 商品リスト
    // ====================================
    
    renderProducts() {
        let html = '';
        
        CONFIG.products.forEach(p => {
            const stock = GameState.getInventoryQty(p.id);
            const order = GameState.orders[p.id] || 0;
            const orderCost = order * p.cost;
            
            html += `
                <div class="product-item">
                    <div class="product-info">
                        <h4>${p.icon} ${p.name}</h4>
                        <div class="product-meta">
                            <span>原価¥${p.cost}</span>
                            <span>売価¥${p.price}</span>
                            <span>在庫${stock}</span>
                            <span>期限${p.expiry === 999 ? '∞' : p.expiry + '日'}</span>
                        </div>
                    </div>
                    <div class="product-controls">
                        <button class="qty-btn" data-product="${p.id}" data-action="sub">−</button>
                        <div class="qty-value">${order}</div>
                        <button class="qty-btn" data-product="${p.id}" data-action="add">＋</button>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('product-list').innerHTML = html;
    },
    
    // ====================================
    // バイトリスト
    // ====================================
    
    renderStaff() {
        let html = '';
        
        if (GameState.staff.length === 0) {
            html = '<div class="no-staff">バイトがいません。募集しましょう！</div>';
        } else {
            GameState.staff.forEach(s => {
                html += `
                    <div class="staff-item">
                        <div class="staff-item-main">
                            <canvas class="staff-sprite" data-sprite="${s.sprite}" width="64" height="64"></canvas>
                            <div class="staff-details">
                                <div class="staff-header">
                                    <span class="staff-name">${s.name}</span>
                                    <span class="staff-personality">${s.personality.name}</span>
                                    <span class="staff-wage">時給¥${s.wage}</span>
                                </div>
                                <div class="staff-skills">
                                    <span class="skill">レジ${Staff.getSkillStars(s.skills.register)}</span>
                                    <span class="skill">品出${Staff.getSkillStars(s.skills.stock)}</span>
                                    <span class="skill">清掃${Staff.getSkillStars(s.skills.clean)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="shift-toggles">
                            ${CONFIG.timeSlots.map(slot => `
                                <button class="shift-toggle ${s.shifts[slot.id] ? 'active' : ''}" 
                                        data-staff="${s.id}" data-slot="${slot.id}">
                                    ${slot.name}<br>${slot.hours}h
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }
        
        document.getElementById('staff-list').innerHTML = html;
        
        // スプライト描画
        this.renderStaffSprites();
    },
    
    renderStaffSprites() {
        document.querySelectorAll('.staff-sprite').forEach(canvas => {
            const spriteName = canvas.dataset.sprite;
            if (spriteName && SPRITES[spriteName]) {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, 64, 64);
                SPRITES.drawSprite(ctx, spriteName, 0, 0, 2);
            }
        });
    },
    
    // ====================================
    // 設備リスト
    // ====================================
    
    renderInvestments() {
        let html = '';
        
        CONFIG.investments.forEach(inv => {
            const purchased = GameState.isInvestmentPurchased(inv.id);
            const canBuy = !purchased && GameState.cash >= inv.cost;
            
            html += `
                <div class="invest-item">
                    <div class="invest-header">
                        <span class="invest-name">${inv.name}</span>
                        <span class="invest-cost">¥${inv.cost.toLocaleString()}</span>
                    </div>
                    <div class="invest-desc">${inv.effect}</div>
                    <button class="invest-btn ${purchased ? 'purchased' : ''}" 
                            data-invest="${inv.id}" 
                            ${!canBuy && !purchased ? 'disabled' : ''}>
                        ${purchased ? '✓ 導入済み' : '導入する'}
                    </button>
                </div>
            `;
        });
        
        document.getElementById('invest-list').innerHTML = html;
    },
    
    // ====================================
    // ミッション表示
    // ====================================
    
    renderMissions() {
        // アクティブミッション
        const activeMissions = Missions.getActiveMissions();
        let activeHtml = '';
        
        if (activeMissions.length === 0) {
            activeHtml = '<div class="no-missions">新しい目標を準備中...</div>';
        } else {
            activeMissions.forEach(m => {
                const stars = Missions.getDifficultyStars(m.difficulty);
                activeHtml += `
                    <div class="mission-item">
                        <div class="mission-header">
                            <span class="mission-name">${m.name}</span>
                            <span class="mission-difficulty">${stars}</span>
                        </div>
                        <div class="mission-desc">${m.description}</div>
                        ${m.progressText ? `<div class="mission-progress">進捗: ${m.progressText}</div>` : ''}
                        <div class="mission-reward">報酬: ¥${m.reward.toLocaleString()}</div>
                    </div>
                `;
            });
        }
        document.getElementById('missions-list').innerHTML = activeHtml;
        
        // 完了済みミッション
        let completedHtml = '';
        if (Missions.completed.length === 0) {
            completedHtml = '<div class="no-missions">まだ達成した目標はありません</div>';
        } else {
            Missions.completed.slice(-5).reverse().forEach(m => {
                completedHtml += `
                    <div class="mission-item completed">
                        <div class="mission-header">
                            <span class="mission-name">✅ ${m.name}</span>
                            <span class="mission-reward-earned">+¥${m.reward.toLocaleString()}</span>
                        </div>
                    </div>
                `;
            });
        }
        document.getElementById('completed-missions').innerHTML = completedHtml;
    },

    // ====================================
    // 開発タブ
    // ====================================
    
    renderDevelopment() {
        const status = Development.getStatus();
        let statusHtml = '';
        
        if (status.inProgress) {
            statusHtml = `
                <div class="develop-progress">
                    <div class="develop-progress-title">🔬 開発中: ${status.inProgress.name}</div>
                    <div class="develop-progress-days">残り${status.daysRemaining}日</div>
                    <div class="develop-progress-bar">
                        <div class="develop-progress-fill" style="width: ${((status.inProgress.developDays - status.daysRemaining) / status.inProgress.developDays) * 100}%"></div>
                    </div>
                </div>
            `;
        } else {
            statusHtml = '<div class="no-develop">開発中の商品はありません</div>';
        }
        document.getElementById('develop-status').innerHTML = statusHtml;
        
        let listHtml = '';
        if (status.available.length === 0) {
            listHtml = '<div class="no-develop">開発可能な商品がありません</div>';
        } else {
            status.available.forEach(p => {
                const canDevelop = GameState.cash >= p.developCost && !status.inProgress;
                listHtml += `
                    <div class="develop-item">
                        <div class="develop-header">
                            <span class="develop-name">${p.icon} ${p.name}</span>
                            <span class="develop-cost">開発費: ¥${p.developCost.toLocaleString()}</span>
                        </div>
                        <div class="develop-desc">${p.description}</div>
                        <div class="develop-stats">
                            <span>原価¥${p.cost} → 売価¥${p.price}</span>
                            <span>成功率: ${Math.floor(p.successRate * 100)}%</span>
                            <span>開発日数: ${p.developDays}日</span>
                        </div>
                        <button class="develop-btn" data-product="${p.id}" ${!canDevelop ? 'disabled' : ''}>
                            開発開始
                        </button>
                    </div>
                `;
            });
        }
        document.getElementById('develop-list').innerHTML = listHtml;
    },
    
    // ====================================
    // 銀行タブ
    // ====================================
    
    renderBank() {
        const bankStatus = Bank.getStatus();
        let statusHtml = `
            <div class="bank-status-box ${bankStatus.debtLevel}">
                <div class="bank-debt">
                    <span class="label">借入金</span>
                    <span class="value ${bankStatus.hasDebt ? 'negative' : ''}">¥${bankStatus.debt.toLocaleString()}</span>
                </div>
                ${bankStatus.hasDebt ? `
                <div class="bank-interest">
                    <span class="label">日利息</span>
                    <span class="value negative">¥${bankStatus.dailyInterest.toLocaleString()}/日</span>
                </div>
                <button class="repay-btn" id="repay-all-btn">全額返済</button>
                ` : ''}
            </div>
        `;
        document.getElementById('bank-status').innerHTML = statusHtml;
        
        let plansHtml = '';
        Bank.plans.forEach(plan => {
            const canBorrow = Bank.getMaxBorrowable() >= plan.amount;
            plansHtml += `
                <div class="bank-plan">
                    <div class="plan-header">
                        <span class="plan-name">${plan.name}</span>
                        <span class="plan-amount">¥${plan.amount.toLocaleString()}</span>
                    </div>
                    <div class="plan-desc">${plan.description}</div>
                    <button class="borrow-btn" data-plan="${plan.id}" ${!canBorrow ? 'disabled' : ''}>
                        借りる
                    </button>
                </div>
            `;
        });
        document.getElementById('bank-plans').innerHTML = plansHtml;
        
        // セキュリティ
        const secStatus = Security.getStatus();
        let secHtml = `
            <div class="security-level">
                <span class="label">セキュリティLv</span>
                <span class="value">${secStatus.level}/${secStatus.maxLevel}</span>
            </div>
            <div class="security-loss">
                <span class="label">累計被害額</span>
                <span class="value negative">¥${secStatus.totalLoss.toLocaleString()}</span>
            </div>
        `;
        
        if (secStatus.availableUpgrades.length > 0) {
            secHtml += '<div class="security-upgrades">';
            secStatus.availableUpgrades.forEach(u => {
                const canBuy = GameState.cash >= u.cost;
                secHtml += `
                    <div class="security-upgrade">
                        <span class="upgrade-name">${u.name}</span>
                        <span class="upgrade-cost">¥${u.cost.toLocaleString()}</span>
                        <button class="upgrade-btn" data-upgrade="${u.id}" ${!canBuy ? 'disabled' : ''}>導入</button>
                    </div>
                `;
            });
            secHtml += '</div>';
        }
        document.getElementById('security-status').innerHTML = secHtml;
    },

    // ====================================
    // 情報タブ
    // ====================================
    
    renderInfo() {
        // 在庫情報
        let invHtml = '';
        CONFIG.products.forEach(p => {
            const qty = GameState.getInventoryQty(p.id);
            const qtyClass = qty === 0 ? 'stock-zero' : qty < 10 ? 'stock-low' : '';
            invHtml += `
                <div class="report-row">
                    <span class="label">${p.icon} ${p.name}</span>
                    <span class="value ${qtyClass}">${qty}個</span>
                </div>
            `;
        });
        document.getElementById('inventory-info').innerHTML = invHtml;
        
        // 競合店情報
        let rivalHtml = '';
        if (Rival.stores.length === 0) {
            rivalHtml = '<div class="report-row"><span class="label hint-text">まだ競合店はありません</span></div>';
        } else {
            Rival.stores.forEach(r => {
                const threat = Math.floor(r.customerSteal * r.power * 100);
                rivalHtml += `
                    <div class="report-row">
                        <span class="label">${r.icon} ${r.name}</span>
                        <span class="value warning">客-${threat}%</span>
                    </div>
                `;
            });
        }
        document.getElementById('rival-info').innerHTML = rivalHtml;
        
        // 常連客情報
        const regularSummary = Customers.getRegularsSummary();
        let regularHtml = `
            <div class="report-row">
                <span class="label">常連客数</span>
                <span class="value">${regularSummary.total}人</span>
            </div>
            <div class="report-row">
                <span class="label">予想安定収入</span>
                <span class="value positive">¥${regularSummary.expectedIncome.toLocaleString()}/日</span>
            </div>
        `;
        document.getElementById('regular-info').innerHTML = regularHtml;
        
        // 需要傾向（季節考慮）
        const season = Calendar.getSeasonName(GameState.day);
        const hints = [
            '☀️ 朝: おにぎり、コーヒーが人気',
            '🌞 昼: 弁当、サンドイッチがよく売れる',
            '🌆 夕: 弁当、飲料、日用品',
            '🌙 夜: お菓子、アイスが人気',
            '🌃 深夜: カップ麺、弁当が売れる',
        ];
        
        // 季節別ヒント
        const seasonHints = {
            '春': '🌸 春: お花見需要でおにぎり・弁当↑',
            '夏': '🏖️ 夏: アイス・飲料が爆売れ！',
            '秋': '🍂 秋: 行楽シーズン、弁当需要↑',
            '冬': '❄️ 冬: カップ麺・ホットコーヒー↑',
        };
        
        let demandHtml = `<div class="report-row"><span class="label hint-text season-hint">${seasonHints[season]}</span></div>`;
        hints.forEach(h => {
            demandHtml += `<div class="report-row"><span class="label hint-text">${h}</span></div>`;
        });
        document.getElementById('demand-info').innerHTML = demandHtml;
        
        // 評判詳細
        const rep = Reputation.getDisplay();
        let repHtml = `
            <div class="report-row">
                <span class="label">現在の評判</span>
                <span class="value">${rep.icon} ${rep.rankName} (${rep.score}/100)</span>
            </div>
            <div class="report-row">
                <span class="label">来客ボーナス</span>
                <span class="value">×${rep.multiplier.toFixed(2)}</span>
            </div>
        `;
        rep.effects.forEach(e => {
            repHtml += `<div class="report-row"><span class="label hint-text">${e}</span></div>`;
        });
        document.getElementById('reputation-info').innerHTML = repHtml;
    },
    
    // ====================================
    // デイリーレポート
    // ====================================
    
    showReport(report) {
        document.getElementById('report-day').textContent = `${report.day}日目の結果`;
        
        let html = '';
        
        // 天候・イベント表示
        html += '<div class="report-section report-weather">';
        html += `<span class="weather-display">${report.weather?.name || '☁️ 曇り'}</span>`;
        if (report.event) {
            html += `<span class="event-display">${report.event.name}</span>`;
        }
        const seasonalEvent = Calendar.getSeasonalEvent(report.day);
        if (seasonalEvent) {
            html += `<span class="event-display seasonal">${seasonalEvent.name}</span>`;
        }
        html += '</div>';
        
        // 時間帯別売上
        html += '<div class="report-section"><div class="report-title">時間帯別売上</div>';
        html += '<div class="time-breakdown">';
        CONFIG.timeSlots.forEach(slot => {
            const data = report.byTimeSlot[slot.id];
            const staffIcon = data.staffCount === 0 ? '⚠️' : '👤'.repeat(Math.min(data.staffCount, 3));
            html += `
                <div class="time-slot">
                    <div class="time-slot-name">${slot.name}</div>
                    <div class="time-slot-value">¥${data.sales.toLocaleString()}</div>
                    <div class="time-slot-customers">${data.customers}人</div>
                    <div class="time-slot-staff">${staffIcon}</div>
                </div>
            `;
        });
        html += '</div></div>';
        
        // 収支
        html += '<div class="report-section"><div class="report-title">収支</div><div class="report-rows">';
        html += `<div class="report-row"><span class="label">売上</span><span class="value positive">+¥${report.totalSales.toLocaleString()}</span></div>`;
        
        if (report.atmIncome > 0) {
            html += `<div class="report-row"><span class="label">ATM手数料</span><span class="value positive">+¥${report.atmIncome.toLocaleString()}</span></div>`;
        }
        
        if (report.missionReward > 0) {
            html += `<div class="report-row"><span class="label">🎯 ミッション報酬</span><span class="value positive">+¥${report.missionReward.toLocaleString()}</span></div>`;
        }
        
        html += `<div class="report-row"><span class="label">原価</span><span class="value negative">-¥${report.totalCost.toLocaleString()}</span></div>`;
        html += `<div class="report-row"><span class="label">人件費</span><span class="value negative">-¥${report.wages.toLocaleString()}</span></div>`;
        html += `<div class="report-row"><span class="label">光熱費</span><span class="value negative">-¥${report.fixedCosts.toLocaleString()}</span></div>`;
        html += `<div class="report-row"><span class="label">廃棄ロス</span><span class="value negative">-¥${report.waste.totalLoss.toLocaleString()}</span></div>`;
        
        const profitClass = report.profit >= 0 ? 'positive' : 'negative';
        const profitSign = report.profit >= 0 ? '+' : '';
        html += `<div class="report-row total"><span class="label">純利益</span><span class="value ${profitClass}">${profitSign}¥${report.profit.toLocaleString()}</span></div>`;
        html += '</div></div>';
        
        // 評判変動
        if (report.reputation) {
            const rep = report.reputation;
            html += '<div class="report-section"><div class="report-title">評判</div><div class="report-rows">';
            const changeSign = rep.change >= 0 ? '+' : '';
            const changeClass = rep.change >= 0 ? 'positive' : 'negative';
            html += `<div class="report-row"><span class="label">評判変動</span><span class="value ${changeClass}">${changeSign}${rep.change}</span></div>`;
            html += `<div class="report-row"><span class="label">現在の評判</span><span class="value">${rep.rank.icon} ${rep.rank.name} (${rep.newScore})</span></div>`;
            rep.reasons.forEach(r => {
                const rClass = r.value >= 0 ? 'positive' : 'negative';
                const rSign = r.value >= 0 ? '+' : '';
                html += `<div class="report-row"><span class="label hint-text">${r.text}</span><span class="value ${rClass}">${rSign}${r.value}</span></div>`;
            });
            html += '</div></div>';
        }
        
        // ミッション結果
        if (report.missions && report.missions.completed.length > 0) {
            html += '<div class="report-section mission-complete"><div class="report-title">🎯 ミッション達成！</div><div class="report-rows">';
            report.missions.completed.forEach(m => {
                html += `<div class="report-row"><span class="label">✅ ${m.name}</span><span class="value positive">+¥${m.reward.toLocaleString()}</span></div>`;
            });
            html += '</div></div>';
        }
        
        // 廃棄詳細
        if (report.waste.items.length > 0) {
            html += '<div class="report-section"><div class="report-title">廃棄詳細</div><div class="report-rows">';
            report.waste.items.forEach(w => {
                html += `<div class="report-row"><span class="label">${w.name} ×${w.qty}</span><span class="value negative">-¥${w.loss.toLocaleString()}</span></div>`;
            });
            html += '</div></div>';
        }
        
        // 品切れ情報
        if (report.stockouts.length > 0) {
            html += '<div class="report-section"><div class="report-title">品切れ発生</div><div class="report-rows">';
            report.stockouts.slice(0, 5).forEach(so => {
                html += `<div class="report-row"><span class="label">${so.productName}</span><span class="value warning">${so.count}回</span></div>`;
            });
            html += '</div></div>';
        }
        
        document.getElementById('report-content').innerHTML = html;
        
        // バイトからのコメント
        const comments = Comments.generate(report);
        document.getElementById('staff-comments').innerHTML = Comments.renderComments(comments);
        
        document.getElementById('daily-report').classList.add('active');
    },
    
    hideReport() {
        document.getElementById('daily-report').classList.remove('active');
    },
    
    // ====================================
    // 雇用モーダル
    // ====================================
    
    showHireModal(candidates) {
        let html = '';
        
        candidates.forEach((c, i) => {
            const hireCost = Staff.getHiringCost(c);
            const canHire = GameState.cash >= hireCost;
            
            html += `
                <div class="hire-candidate">
                    <div class="hire-candidate-main">
                        <canvas class="hire-sprite" data-sprite="${c.sprite}" width="64" height="64"></canvas>
                        <div class="hire-details">
                            <div class="staff-header">
                                <span class="staff-name">${c.name}</span>
                                <span class="staff-personality">${c.personality.name}</span>
                                <span class="staff-wage">時給¥${c.wage}</span>
                            </div>
                            <div class="staff-skills">
                                <span class="skill">レジ${Staff.getSkillStars(c.skills.register)}</span>
                                <span class="skill">品出${Staff.getSkillStars(c.skills.stock)}</span>
                                <span class="skill">清掃${Staff.getSkillStars(c.skills.clean)}</span>
                            </div>
                        </div>
                    </div>
                    <button class="hire-btn" data-index="${i}" ${!canHire ? 'disabled' : ''}>
                        採用する（研修費 ¥${hireCost.toLocaleString()}）
                    </button>
                </div>
            `;
        });
        
        document.getElementById('hire-candidates').innerHTML = html;
        document.getElementById('hire-modal').classList.add('active');
        
        // スプライト描画
        document.querySelectorAll('.hire-sprite').forEach(canvas => {
            const spriteName = canvas.dataset.sprite;
            if (spriteName && SPRITES[spriteName]) {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, 64, 64);
                SPRITES.drawSprite(ctx, spriteName, 0, 0, 2);
            }
        });
        
        return candidates;
    },
    
    hideHireModal() {
        document.getElementById('hire-modal').classList.remove('active');
    },
    
    // ====================================
    // ゲームオーバー
    // ====================================
    
    showGameOver() {
        const isWin = GameState.isWin();
        const isBankrupt = GameState.cash < 0;
        
        const title = isBankrupt ? '倒産...' : (isWin ? '🎉 目標達成！' : 'ゲーム終了');
        const titleClass = isBankrupt ? 'lose' : (isWin ? 'win' : '');
        
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-title').className = 'gameover-title ' + titleClass;
        
        document.getElementById('gameover-stats').innerHTML = `
            最終資産: <span>¥${GameState.cash.toLocaleString()}</span><br>
            累計売上: <span>¥${GameState.stats.totalSales.toLocaleString()}</span><br>
            累計利益: <span>¥${GameState.stats.totalProfit.toLocaleString()}</span><br>
            廃棄ロス: <span>¥${GameState.stats.totalWaste.toLocaleString()}</span><br>
            人件費合計: <span>¥${GameState.stats.totalWages.toLocaleString()}</span><br>
            来客数合計: <span>${GameState.stats.totalCustomers.toLocaleString()}人</span>
        `;
        
        document.getElementById('game-over').classList.add('active');
    },
    
    hideGameOver() {
        document.getElementById('game-over').classList.remove('active');
    },
    
    // ====================================
    // タイトル画面
    // ====================================
    
    hideTitle() {
        document.getElementById('title-screen').classList.add('hidden');
    },
    
    showTitle() {
        document.getElementById('title-screen').classList.remove('hidden');
    },
    
    // ====================================
    // タブ切り替え
    // ====================================
    
    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
        
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
    },
};
