// ====================================
// comments.js - バイトからのコメント生成
// ====================================

const Comments = {
    
    // ====================================
    // メインコメント生成
    // ====================================
    
    generate(report) {
        const comments = [];
        
        // 働いているスタッフがいない場合
        const workingStaff = Staff.getWorkingStaffToday();
        if (workingStaff.length === 0) {
            return [{
                staff: { name: 'システム', personality: { commentStyle: 'formal' } },
                text: '今日は誰もシフトに入っていませんでした...',
                type: 'warning',
            }];
        }
        
        // 各種コメントを生成
        const stockoutComment = this.generateStockoutComment(report);
        const wasteComment = this.generateWasteComment(report);
        const staffComment = this.generateStaffComment(report);
        const salesComment = this.generateSalesComment(report);
        const busyComment = this.generateBusyComment(report);
        
        // 優先度順に追加（最大3つ）
        if (staffComment) comments.push(staffComment);
        if (stockoutComment) comments.push(stockoutComment);
        if (wasteComment) comments.push(wasteComment);
        if (busyComment) comments.push(busyComment);
        if (salesComment) comments.push(salesComment);
        
        // 最大3つに制限
        return comments.slice(0, 3);
    },
    
    // ====================================
    // 品切れコメント
    // ====================================
    
    generateStockoutComment(report) {
        const topStockout = Simulation.getTopStockout(report);
        if (!topStockout || topStockout.count < 3) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const templates = this.getStockoutTemplates(staff.personality.commentStyle);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template
                .replace('{product}', topStockout.productName)
                .replace('{count}', topStockout.count),
            type: 'warning',
        };
    },
    
    getStockoutTemplates(style) {
        const templates = {
            formal: [
                '{product}が{count}回も品切れでした。発注量を増やした方がよいかと思います。',
                '{product}の在庫が足りず、お客様にご迷惑をおかけしました。',
            ],
            energetic: [
                '{product}めっちゃ売れてます！でも{count}回も品切れになっちゃいました〜！',
                'うわー！{product}足りなかったです！{count}人のお客さんに謝りました！',
            ],
            relaxed: [
                '{product}、なくなっちゃいましたね...{count}回くらい。',
                'あー、{product}もうちょい欲しかったかもですね。',
            ],
            analytical: [
                '{product}の需要が供給を上回っています。{count}件の機会損失がありました。',
                'データを見ると{product}は{count}個分足りなかったようです。発注量の見直しを提案します。',
            ],
            friendly: [
                '{product}人気ですね！でも{count}回くらい「ないの？」って聞かれちゃいました。',
                'お客さん{product}探してる人多かったです！もっとあるといいかも！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 廃棄コメント
    // ====================================
    
    generateWasteComment(report) {
        const topWaste = Simulation.getTopWaste(report);
        if (!topWaste || topWaste.qty < 5) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const templates = this.getWasteTemplates(staff.personality.commentStyle);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template
                .replace('{product}', topWaste.name)
                .replace('{count}', topWaste.qty),
            type: 'warning',
        };
    },
    
    getWasteTemplates(style) {
        const templates = {
            formal: [
                '{product}を{count}個廃棄しました。発注量を調整した方がよろしいかと。',
                '{product}が{count}個余ってしまいました。もったいないですね...',
            ],
            energetic: [
                'えー！{product}{count}個も捨てることになっちゃいました！もったいない！',
                '{product}余っちゃった...{count}個も！次は減らしましょう！',
            ],
            relaxed: [
                '{product}、けっこう余りましたね。{count}個くらい。',
                'んー、{product}ちょっと多かったかも。{count}個捨てました。',
            ],
            analytical: [
                '{product}の廃棄が{count}個発生。需要予測と発注量の見直しが必要です。',
                '廃棄コスト削減のため、{product}の発注を{count}個程度減らすことを推奨します。',
            ],
            friendly: [
                '{product}、{count}個も余っちゃいました。お客さんあんまり買わなかったかな？',
                'ちょっと{product}多すぎたかも？{count}個廃棄になっちゃった。',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 人手不足コメント
    // ====================================
    
    generateStaffComment(report) {
        const understaffed = Simulation.getUnderstaffedSlots(report);
        if (understaffed.length === 0) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const slot = understaffed[0];
        const templates = this.getStaffTemplates(staff.personality.commentStyle, slot.busy);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template.replace('{slot}', slot.slotName),
            type: 'alert',
        };
    },
    
    getStaffTemplates(style, busy = false) {
        if (busy) {
            // 忙しかったけど人が少なかった
            const templates = {
                formal: [
                    '{slot}は大変混雑しました。もう一人いると助かります。',
                    '{slot}の時間帯、一人では厳しかったです。',
                ],
                energetic: [
                    '{slot}めっちゃ忙しかった！誰かヘルプほしかったです！',
                    'うひゃー！{slot}一人は大変でした！',
                ],
                relaxed: [
                    '{slot}、けっこう忙しかったですね...誰かいると楽だったかも。',
                    'んー、{slot}一人はちょっときつかったかな。',
                ],
                analytical: [
                    '{slot}の人員配置を見直すべきです。客数に対してスタッフが不足しています。',
                    'データ上、{slot}のスタッフ増員で売上向上が見込めます。',
                ],
                friendly: [
                    '{slot}忙しかったー！誰かと一緒だったらもっと楽しかったのに！',
                    '{slot}バタバタでした！仲間がほしいです！',
                ],
            };
            return templates[style] || templates.formal;
        } else {
            // 誰もいなかった
            const templates = {
                formal: [
                    '{slot}は誰もシフトに入っていませんでした...大丈夫でしょうか。',
                ],
                energetic: [
                    'えっ！{slot}誰もいなかったんですか！？',
                ],
                relaxed: [
                    '{slot}、誰もいなかったみたいですね...。',
                ],
                analytical: [
                    '{slot}の人員配置がゼロです。機会損失が発生しています。',
                ],
                friendly: [
                    '{slot}誰もいなかったんですね...お店大丈夫だったかな？',
                ],
            };
            return templates[style] || templates.formal;
        }
    },
    
    // ====================================
    // 売上コメント
    // ====================================
    
    generateSalesComment(report) {
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const topSelling = Simulation.getTopSellingProduct(report);
        if (!topSelling) return null;
        
        const templates = this.getSalesTemplates(staff.personality.commentStyle);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template
                .replace('{product}', topSelling.product.name)
                .replace('{count}', topSelling.qty),
            type: 'info',
        };
    },
    
    getSalesTemplates(style) {
        const templates = {
            formal: [
                '本日は{product}が{count}個売れました。好調ですね。',
                '{product}がよく売れていました。{count}個です。',
            ],
            energetic: [
                '{product}バカ売れ！{count}個も売れたよ！やったー！',
                'すごい！{product}が{count}個も！今日はいい日！',
            ],
            relaxed: [
                '{product}けっこう売れましたね。{count}個くらい。',
                'あ、{product}人気でしたね。{count}個かな。',
            ],
            analytical: [
                '{product}が本日のトップセラーです。{count}個を販売。この傾向は継続すると予測されます。',
                'データ分析の結果、{product}の需要が高いことが確認されました。{count}個販売。',
            ],
            friendly: [
                '{product}みんな買ってった！{count}個も売れたよ！',
                'お客さん{product}好きな人多いんですね！{count}個売れました！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 忙しさコメント
    // ====================================
    
    generateBusyComment(report) {
        const busiest = Simulation.getBusiestSlot(report);
        if (!busiest || busiest.customers < 50) return null;
        
        const staffOnShift = Staff.getStaffOnShift(busiest.slotId);
        const staff = staffOnShift.length > 0 ? staffOnShift[0] : Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const templates = this.getBusyTemplates(staff.personality.commentStyle);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template
                .replace('{slot}', busiest.slotName)
                .replace('{count}', busiest.customers),
            type: 'info',
        };
    },
    
    getBusyTemplates(style) {
        const templates = {
            formal: [
                '{slot}は{count}人のお客様がご来店されました。大変忙しかったです。',
                '{slot}の時間帯が最も忙しく、{count}名様にご来店いただきました。',
            ],
            energetic: [
                '{slot}マジ忙しかった！{count}人も来たんですよ！',
                'うわー{slot}すごかった！{count}人！足パンパン！',
            ],
            relaxed: [
                '{slot}はけっこう人来ましたね...{count}人くらい。',
                'んー、{slot}忙しかったかな。{count}人。',
            ],
            analytical: [
                '{slot}のピーク時に{count}名の来客を記録。人員配置の最適化を検討してください。',
                '本日の最繁時間帯は{slot}、来客数{count}名でした。',
            ],
            friendly: [
                '{slot}はお客さんいっぱいでした！{count}人くらい来てくれたかな？',
                '{slot}賑やかでしたね！{count}人も！嬉しいな！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // HTML生成
    // ====================================
    
    renderComments(comments) {
        if (comments.length === 0) {
            return '<div class="no-comments">今日は特にコメントはありません。</div>';
        }
        
        let html = '<div class="staff-comments-title">💬 バイトからの報告</div>';
        
        comments.forEach(c => {
            const typeClass = c.type === 'warning' ? 'comment-warning' : 
                             c.type === 'alert' ? 'comment-alert' : 'comment-info';
            
            const spriteAttr = c.staff.sprite ? `data-sprite="${c.staff.sprite}"` : '';
            
            html += `
                <div class="staff-comment ${typeClass}">
                    <div class="comment-header">
                        <canvas class="comment-sprite" ${spriteAttr} width="48" height="48"></canvas>
                        <div class="comment-staff-name">${c.staff.name}</div>
                    </div>
                    <div class="comment-text">${c.text}</div>
                </div>
            `;
        });
        
        // スプライト描画用のフラグを設定
        setTimeout(() => this.renderCommentSprites(), 10);
        
        return html;
    },
    
    renderCommentSprites() {
        document.querySelectorAll('.comment-sprite').forEach(canvas => {
            const spriteName = canvas.dataset.sprite;
            if (spriteName && SPRITES[spriteName]) {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, 48, 48);
                SPRITES.drawSprite(ctx, spriteName, 0, 0, 1.5);
            }
        });
    },
};
