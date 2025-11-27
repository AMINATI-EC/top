// ====================================
// comments.js - バイトからのコメント生成（大幅拡張版）
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
        const weatherComment = this.generateWeatherComment(report);
        const customerComment = this.generateCustomerComment(report);
        const timeComment = this.generateTimeComment(report);
        const randomComment = this.generateRandomComment(report);
        
        // 優先度順に追加
        if (staffComment) comments.push(staffComment);
        if (stockoutComment) comments.push(stockoutComment);
        if (wasteComment) comments.push(wasteComment);
        if (busyComment) comments.push(busyComment);
        if (weatherComment) comments.push(weatherComment);
        if (customerComment) comments.push(customerComment);
        if (salesComment) comments.push(salesComment);
        if (timeComment) comments.push(timeComment);
        if (randomComment) comments.push(randomComment);
        
        // 最大3つに制限
        return comments.slice(0, 3);
    },
    
    // ====================================
    // 品切れコメント
    // ====================================
    
    generateStockoutComment(report) {
        if (!report.stockouts || report.stockouts.length === 0) return null;
        
        const topStockout = report.stockouts.reduce((max, s) => s.count > max.count ? s : max, report.stockouts[0]);
        if (topStockout.count < 3) return null;
        
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
                '{product}を求めるお客様が{count}名いらっしゃいましたが、お応えできませんでした。',
                '本日{product}の品切れが発生し、{count}件の機会損失がございました。',
                '{product}の発注数が不足しておりました。{count}名のお客様にお詫び申し上げました。',
                '在庫管理の観点から、{product}は{count}個以上の追加発注をお勧めいたします。',
                '{product}へのお問い合わせが{count}件ありました。需要が高まっているようです。',
                'お客様から「{product}はないの？」と{count}回聞かれました。申し訳なく思います。',
                '{product}の売れ行きが想定以上で、{count}名様にご迷惑をおかけしました。',
                '発注ミスにより{product}が不足。{count}件の販売機会を逃しました。反省しております。',
            ],
            energetic: [
                '{product}めっちゃ売れてます！でも{count}回も品切れになっちゃいました〜！',
                'うわー！{product}足りなかったです！{count}人のお客さんに謝りました！',
                '{product}人気すぎ！{count}回も「ないの？」って！もっと仕入れよう！',
                'ヤバい！{product}が足りない！{count}人に「すいませーん」って言いました！',
                '{product}バカ売れなのに在庫なくて{count}回謝りました！悔しい！',
                'えー！{product}もっと欲しかった！お客さん{count}人ガッカリしてた！',
                '{product}の棚がスカスカ！{count}人に謝ったよ！次は大量に頼も！',
                'マジで{product}人気！{count}回「また来ます」って言われた！在庫ほしい！',
                '{product}完売！嬉しいけど{count}人に売れなかった！もったいなーい！',
                'うおー！{product}争奪戦でした！{count}人が買えなかった！ごめんね！',
            ],
            relaxed: [
                '{product}、なくなっちゃいましたね...{count}回くらい。',
                'あー、{product}もうちょい欲しかったかもですね。',
                '{product}売り切れちゃいましたねー。{count}人くらい残念そうでした。',
                'んー、{product}なかったです。{count}回聞かれたかな。',
                '{product}、また品切れでしたね...{count}人くらいに謝りました。',
                'あらら、{product}足りなかったですね。{count}人くらいかな。',
                '{product}ないですって{count}回言いましたね...まあ、しょうがないか。',
                'のんびりしてたら{product}なくなっちゃった。{count}人に悪いことしたな。',
                '{product}...売り切れ...{count}回...まあ、明日入れましょう。',
                'あー、{product}切らしちゃいましたね。{count}人くらい。次は多めに。',
            ],
            analytical: [
                '{product}の需要が供給を上回っています。{count}件の機会損失がありました。',
                'データを見ると{product}は{count}個分足りなかったようです。発注量の見直しを提案します。',
                '{product}の品切れ頻度が高い。{count}回の販売機会を逸失。需要予測の精度向上が必要です。',
                '本日の{product}品切れ回数: {count}回。過去平均と比較して需要増加傾向にあります。',
                '{product}の需給バランスが崩れています。{count}件のデータから、20%増の発注を推奨。',
                'ログ分析の結果、{product}は{count}回の品切れ。顧客満足度への影響が懸念されます。',
                '{product}の在庫回転率が想定を超過。{count}件の欠品。安全在庫の見直しを。',
                '統計的に{product}の需要は{count}個程度過小評価されています。補正が必要です。',
                '{product}の品切れコスト: 推定{count}×単価。利益率を考慮すると発注増が合理的です。',
                'AIによる需要予測: {product}は{count}個の追加発注で品切れリスクを90%削減可能。',
            ],
            friendly: [
                '{product}人気ですね！でも{count}回くらい「ないの？」って聞かれちゃいました。',
                'お客さん{product}探してる人多かったです！もっとあるといいかも！',
                '{product}欲しそうな顔してた人が{count}人いました。かわいそうだったな。',
                'ねえねえ、{product}足りなかったよ！{count}人に「ごめんね」って言った！',
                '{product}大人気！でも{count}人買えなくて残念そうだった...。',
                'あのー、{product}もっと欲しいです！{count}人のお客さんが探してました！',
                '{product}求めてた人{count}人いたんですよ！次は多めにしません？',
                'お客さんが「{product}ないの？」って。{count}回聞かれて心苦しかったです。',
                '{product}ファン多いですね！{count}人に「また入りますよ」って言いました！',
                'みんな{product}好きなんだなあ。{count}人に売れなくてごめんねって思った。',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 廃棄コメント
    // ====================================
    
    generateWasteComment(report) {
        if (!report.waste || !report.waste.items || report.waste.items.length === 0) return null;
        
        const topWaste = report.waste.items.reduce((max, w) => w.qty > max.qty ? w : max, report.waste.items[0]);
        if (topWaste.qty < 5) return null;
        
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
                '本日{product}を{count}個廃棄処分いたしました。発注の見直しをご検討ください。',
                '{product}の賞味期限切れが{count}個発生。コスト管理の観点から問題です。',
                '残念ながら{product}が{count}個無駄になりました。需要予測が外れたようです。',
                '{product}を{count}個処分。食品ロス削減のため、発注量の調整をお願いします。',
                '廃棄処理: {product}{count}個。環境面でも経営面でも改善が必要です。',
                '{product}が{count}個売れ残り。仕入れ過多の傾向が見られます。',
                '本日の廃棄: {product}{count}個。利益を圧迫しております。',
                '{product}の{count}個廃棄は想定外でした。市場動向の再分析が必要です。',
            ],
            energetic: [
                'えー！{product}{count}個も捨てることになっちゃいました！もったいない！',
                '{product}余っちゃった...{count}個も！次は減らしましょう！',
                'うわーん！{product}が{count}個もダメになっちゃった！悲しい！',
                '{product}{count}個廃棄！もったいないオバケが出ちゃう！',
                'ヤバい！{product}が{count}個余った！発注しすぎたかも！',
                '{product}...{count}個...捨てるの辛かった...！次は気をつけます！',
                'えー！{product}{count}個も！お客さんもっと買ってくれたらよかったのに！',
                '{product}の山が...{count}個全部廃棄...泣ける！',
                'ショック！{product}が{count}個余っちゃった！学びました！',
                '{product}{count}個サヨナラ...ごめんね食べてあげられなくて！',
            ],
            relaxed: [
                '{product}、けっこう余りましたね。{count}個くらい。',
                'んー、{product}ちょっと多かったかも。{count}個捨てました。',
                '{product}...{count}個余っちゃいましたね...まあ、こういう日もある。',
                'あー、{product}が{count}個。しょうがないですね。',
                '{product}の{count}個、期限切れでした。次は少なめで。',
                'のんびりしてたら{product}が{count}個ダメになってた。あらら。',
                '{product}ね、{count}個余っちゃった。予想より売れなかったな。',
                'まあ、{product}が{count}個くらいなら...許容範囲？...いや、多いか。',
                '{product}{count}個か...まあ、明日は減らしましょ。',
                'あー、{product}ね...{count}個ね...うん、次から気をつけよ。',
            ],
            analytical: [
                '{product}の廃棄が{count}個発生。需要予測と発注量の見直しが必要です。',
                '廃棄コスト削減のため、{product}の発注を{count}個程度減らすことを推奨します。',
                '{product}の廃棄率が上昇。{count}個の損失は利益率に0.3%の影響。',
                'データ分析: {product}は{count}個の過剰在庫。適正在庫量の再計算を。',
                '{product}の{count}個廃棄は、季節変動を考慮していなかった可能性。',
                '廃棄ログ: {product}{count}個。曜日別需要パターンとの乖離を確認。',
                '{product}の廃棄コスト: {count}×原価。ROIの観点から発注アルゴリズム修正を。',
                '統計的に{product}の需要は{count}個程度過大評価されています。',
                '{product}の売上と廃棄の相関分析: {count}個の削減で最適化可能。',
                'KPI報告: {product}廃棄{count}個。月間目標に対し23%オーバー。',
            ],
            friendly: [
                '{product}、{count}個も余っちゃいました。お客さんあんまり買わなかったかな？',
                'ちょっと{product}多すぎたかも？{count}個廃棄になっちゃった。',
                '{product}が{count}個...もったいないね。次は気をつけようね！',
                'あのね、{product}が{count}個余っちゃったの。ちょっと悲しい。',
                '{product}ちゃん{count}個さよなら...買ってあげられなくてごめんね。',
                'ねえ、{product}{count}個も余っちゃった。発注多かったのかな？',
                '{product}の{count}個、誰も買わなかったんだね...寂しいな。',
                'えへへ、{product}頼みすぎたかも。{count}個余っちゃった。てへ。',
                '{product}が{count}個余り。お客さん、もっと買ってくれたらよかったのに！',
                'ちょっとー、{product}{count}個も余ってるよー。どうしよー。',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 人手不足コメント
    // ====================================
    
    generateStaffComment(report) {
        if (!report.byTimeSlot) return null;
        
        // 人手不足スロットを探す
        const understaffed = [];
        CONFIG.timeSlots.forEach(slot => {
            const data = report.byTimeSlot[slot.id];
            if (data && data.staffCount === 0 && data.customers > 0) {
                understaffed.push({ slotName: slot.name, busy: false });
            } else if (data && data.staffCount === 1 && data.customers > 30) {
                understaffed.push({ slotName: slot.name, busy: true });
            }
        });
        
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
            const templates = {
                formal: [
                    '{slot}は大変混雑しました。もう一人いると助かります。',
                    '{slot}の時間帯、一人では厳しかったです。',
                    '{slot}の業務量が過多でした。人員の補充をお願いいたします。',
                    '{slot}は想定以上の来客があり、対応に苦慮いたしました。',
                    'お客様をお待たせする場面が{slot}に多発。増員をご検討ください。',
                ],
                energetic: [
                    '{slot}めっちゃ忙しかった！誰かヘルプほしかったです！',
                    'うひゃー！{slot}一人は大変でした！',
                    '{slot}ヤバかった！てんてこ舞い！仲間がほしい！',
                    'ぜーはー！{slot}走り回りました！誰か来てー！',
                    '{slot}戦場でした！一人じゃ無理！ヘルプ求む！',
                ],
                relaxed: [
                    '{slot}、けっこう忙しかったですね...誰かいると楽だったかも。',
                    'んー、{slot}一人はちょっときつかったかな。',
                    '{slot}...疲れましたね...ヘルプあると嬉しいな。',
                    'あー、{slot}バタバタでした。誰かいればよかったのに。',
                    '{slot}忙しかったな...一人じゃ大変だった...。',
                ],
                analytical: [
                    '{slot}の人員配置を見直すべきです。客数に対してスタッフが不足しています。',
                    'データ上、{slot}のスタッフ増員で売上向上が見込めます。',
                    '{slot}の労働負荷が閾値を超過。パフォーマンス低下の要因に。',
                    '効率性分析: {slot}に1名追加で、顧客待ち時間を40%削減可能。',
                    '{slot}のオペレーション効率が低下。人的リソースの再配分を提案。',
                ],
                friendly: [
                    '{slot}忙しかったー！誰かと一緒だったらもっと楽しかったのに！',
                    '{slot}バタバタでした！仲間がほしいです！',
                    'ねえねえ、{slot}大変だったよ！一緒に働く人ほしい！',
                    '{slot}一人で頑張ったけど、誰かいたらよかったな〜。',
                    'えーん、{slot}忙しかった！助けてくれる人がほしかった！',
                ],
            };
            return templates[style] || templates.formal;
        } else {
            const templates = {
                formal: [
                    '{slot}は誰もシフトに入っていませんでした...大丈夫でしょうか。',
                    '{slot}の人員配置が空白でした。機会損失が懸念されます。',
                ],
                energetic: [
                    'えっ！{slot}誰もいなかったんですか！？',
                    'ウソ！{slot}無人！？ヤバくない！？',
                ],
                relaxed: [
                    '{slot}、誰もいなかったみたいですね...。',
                    'あー、{slot}無人だったんだ...まあ、なんとかなったのかな。',
                ],
                analytical: [
                    '{slot}の人員配置がゼロです。機会損失が発生しています。',
                    'クリティカルエラー: {slot}のシフトが空。売上と安全性に影響。',
                ],
                friendly: [
                    '{slot}誰もいなかったんですね...お店大丈夫だったかな？',
                    'えー、{slot}一人もいなかったの？寂しいね...。',
                ],
            };
            return templates[style] || templates.formal;
        }
    },
    
    // ====================================
    // 売上コメント
    // ====================================
    
    generateSalesComment(report) {
        if (!report.salesByProduct || report.salesByProduct.length === 0) return null;
        
        const topSelling = report.salesByProduct.reduce((max, s) => s.qty > max.qty ? s : max, report.salesByProduct[0]);
        if (topSelling.qty < 5) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
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
                '{product}の販売数が{count}個に達しました。人気商品ですね。',
                '売上報告: {product}が{count}個。本日のトップセラーです。',
                '{product}は{count}個の売上を記録。安定した需要がございます。',
                '本日最も売れた商品は{product}で、{count}個でございました。',
                '{product}の動きが良好です。{count}個を販売いたしました。',
                '特筆すべきは{product}の{count}個という売上です。',
            ],
            energetic: [
                '{product}バカ売れ！{count}個も売れたよ！やったー！',
                'すごい！{product}が{count}個も！今日はいい日！',
                '{product}めっちゃ売れた！{count}個！最高！',
                'うおー！{product}{count}個！新記録じゃない！？',
                '{product}飛ぶように売れた！{count}個！嬉しい！',
                'イエーイ！{product}が{count}個！この調子！',
                '{product}大人気！{count}個売れて気持ちいい！',
                'キター！{product}{count}個！やったやった！',
            ],
            relaxed: [
                '{product}けっこう売れましたね。{count}個くらい。',
                'あ、{product}人気でしたね。{count}個かな。',
                '{product}...{count}個売れたんだ...へー。',
                'のんびり見てたら{product}が{count}個売れてた。',
                '{product}ね、{count}個。まあまあですね。',
                'あー、{product}売れてたな。{count}個くらい。',
                '{product}が{count}個か...いい感じですね。',
                'ふーん、{product}{count}個ね。よかったね。',
            ],
            analytical: [
                '{product}が本日のトップセラーです。{count}個を販売。この傾向は継続すると予測されます。',
                'データ分析の結果、{product}の需要が高いことが確認されました。{count}個販売。',
                '{product}の売上{count}個は前週比+15%。トレンドに乗っています。',
                '統計: {product}が{count}個。来週も同水準の需要が見込まれます。',
                '{product}の販売データ: {count}個。客単価向上に寄与。',
                'ベストセラー分析: {product}が{count}個で1位。在庫確保を推奨。',
            ],
            friendly: [
                '{product}みんな買ってった！{count}個も売れたよ！',
                'お客さん{product}好きな人多いんですね！{count}個売れました！',
                '{product}人気だね！{count}個も売れてびっくり！',
                'ねえねえ、{product}が{count}個も売れたの！すごくない？',
                '{product}みんな買ってくれた！{count}個！嬉しいな！',
                'あのね、{product}が{count}個売れたんだよ！よかったね！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 忙しさコメント
    // ====================================
    
    generateBusyComment(report) {
        if (!report.byTimeSlot) return null;
        
        let busiest = null;
        let maxCustomers = 0;
        CONFIG.timeSlots.forEach(slot => {
            const data = report.byTimeSlot[slot.id];
            if (data && data.customers > maxCustomers) {
                maxCustomers = data.customers;
                busiest = { slotName: slot.name, customers: data.customers };
            }
        });
        
        if (!busiest || busiest.customers < 50) return null;
        
        const staff = Staff.getRandomWorkingStaff();
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
                '{slot}に{count}名のお客様。ピークタイムでございました。',
                '本日のピーク: {slot}、来客{count}名。効率的に対応できました。',
                '{slot}が繁忙時間帯となり、{count}人のお客様をお迎えしました。',
            ],
            energetic: [
                '{slot}マジ忙しかった！{count}人も来たんですよ！',
                'うわー{slot}すごかった！{count}人！足パンパン！',
                '{slot}怒涛の{count}人！走り回った！',
                'ヒャー！{slot}が{count}人！息つく暇なかった！',
                '{slot}戦争でした！{count}人と戦った！勝った！',
            ],
            relaxed: [
                '{slot}はけっこう人来ましたね...{count}人くらい。',
                'んー、{slot}忙しかったかな。{count}人。',
                '{slot}...{count}人か...まあまあ忙しかったね。',
                'あー、{slot}混んでたな。{count}人くらいかな。',
                '{slot}ね、{count}人。そこそこでしたね。',
            ],
            analytical: [
                '{slot}のピーク時に{count}名の来客を記録。人員配置の最適化を検討してください。',
                '本日の最繁時間帯は{slot}、来客数{count}名でした。',
                'データ: {slot}に{count}人。平均滞在時間3.5分、回転率良好。',
                '{slot}の{count}人はオペレーション限界値の85%。余裕あり。',
                'トラフィック分析: {slot}が{count}名でピーク。予測精度98%。',
            ],
            friendly: [
                '{slot}はお客さんいっぱいでした！{count}人くらい来てくれたかな？',
                '{slot}賑やかでしたね！{count}人も！嬉しいな！',
                'ねえ聞いて！{slot}に{count}人も来たの！大盛況！',
                '{slot}すごかったよ！{count}人！みんな来てくれた！',
                'わあ、{slot}に{count}人も！お店が賑わって嬉しい！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 天候コメント
    // ====================================
    
    generateWeatherComment(report) {
        if (!report.weather || Math.random() > 0.4) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const weather = report.weather;
        // 天気名から天候IDを判定
        let weatherId = 'cloudy';
        if (weather.name && weather.name.includes('晴')) weatherId = 'sunny';
        else if (weather.name && (weather.name.includes('雨') || weather.name.includes('⛈'))) weatherId = 'rain';
        else if (weather.name && (weather.name.includes('猛暑') || weather.name.includes('🥵'))) weatherId = 'hot';
        else if (weather.name && (weather.name.includes('寒') || weather.name.includes('🥶'))) weatherId = 'cold';
        
        const templates = this.getWeatherTemplates(staff.personality.commentStyle, weatherId);
        if (!templates || templates.length === 0) return null;
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template,
            type: 'info',
        };
    },
    
    getWeatherTemplates(style, weatherId) {
        const weatherTemplates = {
            sunny: {
                formal: [
                    '本日は晴天で、お客様の足取りも軽やかでした。',
                    '好天に恵まれ、来店数が伸びたように感じます。',
                    '晴れの日は気持ちがいいですね。お客様も多かったです。',
                ],
                energetic: [
                    '今日めっちゃ晴れ！お客さんもいっぱい！サイコー！',
                    '晴れてるとテンション上がる！お客さんもニコニコ！',
                    'ピカピカのお天気！アイス売れまくり！',
                ],
                relaxed: [
                    '晴れてましたね...気持ちよかった...。',
                    'いい天気でしたねー。のんびりした気分。',
                    '晴れの日はいいですね...ふふ。',
                ],
                analytical: [
                    '晴天により来客数が平均+12%。アイス・飲料の需要増を確認。',
                    '天候データ: 晴れ。外出増加に伴い客足好調。',
                ],
                friendly: [
                    '今日いい天気だったね！お客さんも元気そうだった！',
                    '晴れてて気持ちよかったー！みんな来てくれた！',
                ],
            },
            rain: {
                formal: [
                    '雨天のため、来店数がやや減少したように思います。',
                    '本日は雨でしたが、傘を持たないお客様も多くいらっしゃいました。',
                ],
                energetic: [
                    '雨だー！でもお客さん来てくれた！傘立て大活躍！',
                    'ザーザー降ってたけど頑張った！',
                ],
                relaxed: [
                    '雨でしたね...静かでした...。',
                    'しとしと雨...のんびりできた...。',
                ],
                analytical: [
                    '降雨により来客数-18%。傘・レインコートの需要データを取得。',
                ],
                friendly: [
                    '雨だったね...お客さん濡れて大変そうだった。',
                    '雨の中来てくれてありがとう！って思った！',
                ],
            },
            hot: {
                formal: [
                    '猛暑日でした。冷たい飲み物とアイスが大変好評でした。',
                    '暑さ厳しい一日でした。熱中症対策商品の需要増を感じました。',
                ],
                energetic: [
                    '暑っつ！！アイス売れすぎ！冷凍庫空っぽ！',
                    'めちゃくちゃ暑かった！お客さんみんな汗だく！',
                ],
                relaxed: [
                    '暑かったですね...エアコンありがたい...。',
                    'あつい...お客さんも暑そう...。',
                ],
                analytical: [
                    '気温35度超。冷菓・飲料の売上が前日比+45%。',
                ],
                friendly: [
                    '今日すっごく暑かったね！みんなアイス買ってった！',
                ],
            },
            cold: {
                formal: [
                    '冷え込みが厳しい一日でした。温かい飲み物が好評でした。',
                ],
                energetic: [
                    'さっむ！！ホット缶コーヒーばか売れ！',
                ],
                relaxed: [
                    '寒かったですね...暖房ありがたい...。',
                ],
                analytical: [
                    '気温5度以下。ホット飲料・おでんの売上+38%。',
                ],
                friendly: [
                    '今日すっごく寒かったね！みんな温まりに来てくれた！',
                ],
            },
            cloudy: {
                formal: [
                    '曇りの一日でした。来客数は平均的でした。',
                ],
                energetic: [
                    '曇りだったけど元気に営業！',
                ],
                relaxed: [
                    '曇り...まあまあの天気でしたね...。',
                ],
                analytical: [
                    '天候: 曇り。来客数は標準値の±5%以内。',
                ],
                friendly: [
                    '曇りだったね。涼しくてよかったかも！',
                ],
            },
        };
        
        return weatherTemplates[weatherId]?.[style] || null;
    },
    
    // ====================================
    // お客さんコメント
    // ====================================
    
    generateCustomerComment(report) {
        if (Math.random() > 0.3) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const templates = this.getCustomerTemplates(staff.personality.commentStyle);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template,
            type: 'info',
        };
    },
    
    getCustomerTemplates(style) {
        const templates = {
            formal: [
                '常連のお客様に「いつもありがとう」と言っていただけました。',
                'お客様から接客を褒めていただき、大変嬉しく思います。',
                '「この店は雰囲気がいい」とのお声をいただきました。',
                'ご年配のお客様のお買い物をお手伝いいたしました。',
                'お客様が商品の場所を尋ねてこられたので、ご案内しました。',
                '「品揃えがいいね」とお褒めの言葉をいただきました。',
                '小さなお子様連れのお客様に喜んでいただけました。',
                'レジでお客様と少しお話しする機会がありました。',
                'お客様のお探しの商品が見つかり、安心いたしました。',
                '「また来るね」と言ってくださるお客様がいて嬉しかったです。',
            ],
            energetic: [
                '常連さんが「いつもありがとね！」って！嬉しい！',
                'お客さんに「元気いいね！」って言われた！やったー！',
                '子供が「お姉ちゃんバイバイ！」って！かわいい！',
                'おばあちゃんに「あなたいい子ね」って言われた！照れる！',
                'お客さんと話が盛り上がっちゃった！楽しかった！',
                '「この店好き！」って言ってくれた人いた！最高！',
                '常連さんが差し入れくれた！神！',
                'お客さんに道聞かれて教えてあげた！役に立てた！',
                '「笑顔がいいね」って！ニコニコ接客の成果！',
                '帰り際に「ありがとう」って言ってもらえた！元気出る！',
            ],
            relaxed: [
                '常連さんと少し話しました...のんびり...。',
                'お客さんに「ありがとう」って言われた...嬉しいな...。',
                'おじいちゃんがゆっくり買い物してた...平和だ...。',
                '子供が棚を見上げてた...かわいい...。',
                '「いい店だね」って言ってもらえた...よかった...。',
                'お客さん少なくて、のんびりできました...。',
                '常連さんの顔を覚えてきた...なんかいいな...。',
                '「また来るわ」って...嬉しいですね...。',
                'お客さんと目が合って会釈...平和な時間...。',
                '静かな時間帯は落ち着きますね...ふう...。',
            ],
            analytical: [
                '顧客満足度調査: 本日の接客評価は良好と推定。',
                'リピーター率の向上が見込まれる接客ができました。',
                '常連客との関係構築がLTV向上に寄与すると分析。',
                '顧客の動線を観察。棚配置の改善点を発見。',
                '客層分析: 本日は主婦層が多い傾向。時間帯による変動あり。',
                '接客データ: 声かけにより追加購入が2件発生。',
                '顧客行動: 迷っている様子のお客様へのアプローチが有効。',
                'NPS向上施策として、笑顔での接客を継続。',
                '常連客の来店頻度データを更新。週2回ペースを確認。',
                '顧客フィードバック: 品揃えに関する好意的な意見を取得。',
            ],
            friendly: [
                '常連さんに「いつもありがとね！」って言われた！嬉しい！',
                'お客さんと楽しくお話しできた！また来てほしいな！',
                '子供が手を振ってくれた！かわいかったー！',
                'おばあちゃんに「優しいね」って言われてほっこり！',
                '「この店いいね！」って言ってくれる人がいて嬉しかった！',
                'お客さんの探し物見つけてあげられた！よかった！',
                '常連さんの名前覚えたよ！仲良くなれるといいな！',
                '「ありがとう」の一言が嬉しいんだよね！',
                'お客さんと目が合うと笑顔になっちゃう！',
                'みんなが喜んでくれると、働いてる甲斐がある！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // 時間帯コメント
    // ====================================
    
    generateTimeComment(report) {
        if (Math.random() > 0.25) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        // 深夜シフトかどうかチェック
        const midnightStaff = GameState.staff.filter(s => s.shifts && s.shifts.midnight);
        const isMidnight = midnightStaff.length > 0;
        
        const templates = isMidnight 
            ? this.getMidnightTemplates(staff.personality.commentStyle)
            : this.getTimeTemplates(staff.personality.commentStyle);
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template,
            type: 'info',
        };
    },
    
    getMidnightTemplates(style) {
        const templates = {
            formal: [
                '深夜帯は独特の静けさがございました。',
                '深夜のお客様は目的買いの方が多い印象です。',
                '夜勤のお客様が多くいらっしゃいました。',
                '深夜は品出しや清掃に集中できました。',
                '終電後のお客様がちらほらいらっしゃいました。',
            ],
            energetic: [
                '深夜でも元気に営業！夜型人間の本領発揮！',
                '夜中でもテンション落とさないよ！',
                '深夜帯、静かだけど楽しかった！',
                '夜勤さんたちが来てくれて嬉しい！仲間！',
                '深夜の静けさ...逆に燃える！',
            ],
            relaxed: [
                '深夜は静か...落ち着く...。',
                '夜中は人少なくて...のんびり...。',
                '深夜帯...眠い...けど頑張った...。',
                '静かな夜...いい時間だった...。',
                '深夜は自分のペースで働ける...好き...。',
            ],
            analytical: [
                '深夜帯の来客パターン: タクシー運転手、夜勤労働者が中心。',
                '深夜の客単価は日中比+23%。目的買いが多い。',
                '深夜帯のオペレーション効率を分析中。品出し適時。',
                '深夜の防犯データ: 本日異常なし。セキュリティ良好。',
                '夜間来客数は予測値の±5%以内。安定傾向。',
            ],
            friendly: [
                '深夜でもお客さん来てくれて嬉しい！',
                '夜中のお客さんって、なんか仲間意識感じる！',
                '深夜帯、静かだけど寂しくないよ！',
                '夜勤の人たちお疲れ様！って思いながら接客！',
                '深夜の常連さんと顔なじみになってきた！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    getTimeTemplates(style) {
        const templates = {
            formal: [
                '朝のラッシュを無事に乗り越えました。',
                '昼食時は特に忙しかったです。',
                '夕方の帰宅ラッシュ、対応できました。',
                '時間帯によってお客様の層が変わりますね。',
                '本日も一日、滞りなく営業できました。',
            ],
            energetic: [
                '朝から全開！気持ちいい！',
                'ランチタイム乗り切った！達成感！',
                '夕方のラッシュ、燃えた！',
                '一日あっという間！充実！',
                '今日も頑張った！自分えらい！',
            ],
            relaxed: [
                '朝は忙しかったけど...なんとか...。',
                'お昼過ぎたら落ち着いたね...ふう...。',
                '夕方バタバタ...でも終わった...。',
                '一日終わった...おつかれ...。',
                'まあまあの一日でした...うん...。',
            ],
            analytical: [
                '時間帯別来客数は予測モデルと一致。',
                'ピークタイムのオペレーション効率は良好。',
                '時間帯別売上データを更新完了。',
                '本日の時間帯別KPIは目標達成。',
                '時系列分析: 来客パターンは典型的。',
            ],
            friendly: [
                '朝から元気に頑張れた！いい一日！',
                'お昼忙しかったけど楽しかったね！',
                '夕方のお客さんお疲れ様！って思った！',
                '今日も一日ありがとう！って気持ち！',
                'いい一日だったなあ！また明日！',
            ],
        };
        return templates[style] || templates.formal;
    },
    
    // ====================================
    // ランダムコメント
    // ====================================
    
    generateRandomComment(report) {
        if (Math.random() > 0.2) return null;
        
        const staff = Staff.getRandomWorkingStaff();
        if (!staff) return null;
        
        const templates = this.getRandomTemplates(staff.personality.commentStyle);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return {
            staff,
            text: template,
            type: 'info',
        };
    },
    
    getRandomTemplates(style) {
        const templates = {
            formal: [
                '本日も無事に業務を終えることができました。',
                '明日も精一杯頑張ります。よろしくお願いいたします。',
                '清掃も完了し、店内は清潔な状態です。',
                '在庫の整理を行いました。棚も綺麗になっております。',
                '何事もなく平穏な一日でした。',
                'スタッフ間の連携も良好でした。',
                '本日学んだことを明日に活かしたいと思います。',
                '業務改善の提案がございましたら、お聞かせください。',
                '体調管理に気をつけて、明日も出勤いたします。',
                '本日もお店を守れたことを嬉しく思います。',
            ],
            energetic: [
                '今日も楽しかったー！また明日！',
                'お店の仕事、やっぱ好きだわ！',
                '疲れたけど充実！いい汗かいた！',
                '明日も頑張るぞー！おー！',
                '今日の自分に花マル！',
                '仕事終わりのご飯が楽しみ！',
                'コンビニバイト最高！',
                '今日も一日ありがとうございました！',
                '成長してる気がする！嬉しい！',
                'もっと上手くなりたい！頑張る！',
            ],
            relaxed: [
                '今日も終わりましたね...おつかれ...。',
                'まあ、平和な一日でした...。',
                'のんびりできる時間もあってよかった...。',
                '明日も頑張りましょう...ゆるく...。',
                'ふう...疲れた...でもいい疲れ...。',
                '家帰ったら何しよう...。',
                '今日もなんとかなりました...。',
                '明日は早番...ねむい...。',
                'いい一日でした...たぶん...。',
                'コンビニの仕事...けっこう好きかも...。',
            ],
            analytical: [
                '本日のオペレーション効率は標準値。改善余地あり。',
                '業務フローの最適化案を検討中。提案予定。',
                '本日のデータは次回の需要予測に活用します。',
                'スタッフ間のコミュニケーション効率は良好。',
                '明日の予測: 来客数は本日比+5%の見込み。',
                '在庫回転率の改善が見られます。継続監視。',
                '本日の学びをナレッジベースに記録完了。',
                '業務効率化のためのデータ収集は継続中。',
                '本日のログは分析済み。異常値なし。',
                '明日の最適人員配置を計算中。',
            ],
            friendly: [
                '今日も楽しく働けたよ！ありがとう！',
                'みんなお疲れ様！また明日ね！',
                'いい一日だったなあ！幸せ！',
                'お店の仕事、楽しいね！',
                '明日もみんなと働けるの楽しみ！',
                'お客さんもスタッフも大好き！',
                '今日もありがとう！感謝！',
                'コンビニっていいところだよね！',
                'みんなで頑張れて嬉しい！',
                'また明日！元気に来るね！',
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
        
        setTimeout(() => this.renderCommentSprites(), 10);
        
        return html;
    },
    
    renderCommentSprites() {
        document.querySelectorAll('.comment-sprite').forEach(canvas => {
            const spriteName = canvas.dataset.sprite;
            if (spriteName && typeof SPRITES !== 'undefined' && SPRITES[spriteName]) {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, 48, 48);
                SPRITES.drawSprite(ctx, spriteName, 0, 0, 1.5);
            }
        });
    },
};
