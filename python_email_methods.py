# Python メール送信 5つの方法
# テストアドレス: pt.tsato@gmail.com (管理者・購入者共通)

import smtplib
import requests
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime

# 共通設定
TEST_EMAIL = "pt.tsato@gmail.com"
ORDER_DATA = {
    "orderId": "ORD-1735286400000",
    "orderDate": "2024-12-27T12:00:00",
    "product": {
        "productNumber": "21765",
        "productName": "リラックスルーズベーシックT",
        "brandName": "AMINATI COLLECTION",
        "selectedColor": "ホワイト",
        "selectedSize": "M",
        "price": 5000
    },
    "pricing": {
        "productPrice": 5000,
        "shippingFee": 500,
        "codFee": 330,
        "totalPrice": 5830
    },
    "customer": {
        "name": "山田太郎",
        "kana": "ヤマダタロウ",
        "phone": "090-1234-5678",
        "email": TEST_EMAIL,
        "zip": "123-4567",
        "address": "東京都渋谷区神南1-1-1"
    }
}

# ===============================
# 方法1: Gmail SMTP (アプリパスワード)
# ===============================
def method1_gmail_smtp():
    """
    Gmail SMTPを使用（最も確実）
    事前準備: Googleアカウントで2段階認証有効化 + アプリパスワード生成
    """
    print("=== 方法1: Gmail SMTP ===")
    
    # Gmail設定
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    GMAIL_USER = "your-gmail@gmail.com"  # 実際のGmailアドレス
    GMAIL_PASSWORD = "your-app-password"  # 16文字のアプリパスワード
    
    try:
        # メール作成
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = TEST_EMAIL
        msg['Subject'] = f"[AMINATI_EC] 新規注文: {ORDER_DATA['orderId']}"
        
        # メール本文
        body = f"""
新しい注文が入りました。

【注文情報】
注文番号: {ORDER_DATA['orderId']}
注文日時: {datetime.fromisoformat(ORDER_DATA['orderDate'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')}

【商品情報】
商品番号: {ORDER_DATA['product']['productNumber']}
商品名: {ORDER_DATA['product']['productName']}
ブランド: {ORDER_DATA['product']['brandName']}
カラー: {ORDER_DATA['product']['selectedColor']}
サイズ: {ORDER_DATA['product']['selectedSize']}

【金額】
商品代金: ¥{ORDER_DATA['pricing']['productPrice']:,}
配送料: ¥{ORDER_DATA['pricing']['shippingFee']:,}
代引き手数料: ¥{ORDER_DATA['pricing']['codFee']:,}
合計金額: ¥{ORDER_DATA['pricing']['totalPrice']:,}

【お客様情報】
お名前: {ORDER_DATA['customer']['name']}
フリガナ: {ORDER_DATA['customer']['kana']}
電話番号: {ORDER_DATA['customer']['phone']}
メールアドレス: {ORDER_DATA['customer']['email']}
郵便番号: {ORDER_DATA['customer']['zip']}
住所: {ORDER_DATA['customer']['address']}
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # SMTP接続・送信
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(GMAIL_USER, TEST_EMAIL, text)
        server.quit()
        
        print("✅ Gmail SMTP送信成功")
        return True
        
    except Exception as e:
        print(f"❌ Gmail SMTP送信失敗: {e}")
        return False

# ===============================
# 方法2: SendGrid API
# ===============================
def method2_sendgrid():
    """
    SendGrid API (無料プラン: 100通/日)
    事前準備: SendGridアカウント作成 + APIキー取得
    """
    print("=== 方法2: SendGrid API ===")
    
    SENDGRID_API_KEY = "YOUR_SENDGRID_API_KEY"  # SendGridのAPIキー
    
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message = Mail(
            from_email='noreply@aminati-ec.com',  # 送信者（ドメイン認証済み）
            to_emails=TEST_EMAIL,
            subject=f'[AMINATI_EC] 新規注文: {ORDER_DATA["orderId"]}',
            html_content=f'''
            <h2>新しい注文が入りました</h2>
            <p><strong>注文番号:</strong> {ORDER_DATA["orderId"]}</p>
            <p><strong>商品名:</strong> {ORDER_DATA["product"]["productName"]}</p>
            <p><strong>お客様:</strong> {ORDER_DATA["customer"]["name"]}</p>
            <p><strong>合計金額:</strong> ¥{ORDER_DATA["pricing"]["totalPrice"]:,}</p>
            '''
        )
        
        response = sg.send(message)
        print(f"✅ SendGrid送信成功: {response.status_code}")
        return True
        
    except Exception as e:
        print(f"❌ SendGrid送信失敗: {e}")
        return False

# ===============================
# 方法3: MailGun API
# ===============================
def method3_mailgun():
    """
    MailGun API (無料プラン: 5000通/月)
    事前準備: MailGunアカウント作成
    """
    print("=== 方法3: MailGun API ===")
    
    MAILGUN_DOMAIN = "sandbox-xxx.mailgun.org"  # MailGunドメイン
    MAILGUN_API_KEY = "key-xxx"  # MailGun APIキー
    
    try:
        response = requests.post(
            f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
            auth=("api", MAILGUN_API_KEY),
            data={
                "from": f"AMINATI_EC <mailgun@{MAILGUN_DOMAIN}>",
                "to": [TEST_EMAIL],
                "subject": f"[AMINATI_EC] 新規注文: {ORDER_DATA['orderId']}",
                "text": f"""
注文番号: {ORDER_DATA['orderId']}
商品名: {ORDER_DATA['product']['productName']}
お客様: {ORDER_DATA['customer']['name']}
合計金額: ¥{ORDER_DATA['pricing']['totalPrice']:,}
                """
            }
        )
        
        if response.status_code == 200:
            print("✅ MailGun送信成功")
            return True
        else:
            print(f"❌ MailGun送信失敗: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ MailGun送信失敗: {e}")
        return False

# ===============================
# 方法4: EmailJS (ブラウザ連携)
# ===============================
def method4_emailjs_setup():
    """
    EmailJS設定用（実際の送信はJavaScript）
    事前準備: EmailJSアカウント作成 + テンプレート設定
    """
    print("=== 方法4: EmailJS設定 ===")
    
    js_code = """
    // EmailJS JavaScript送信コード
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    <script>
        emailjs.init("YOUR_PUBLIC_KEY"); // EmailJSの公開キー
        
        function sendOrderEmail(orderData) {
            const templateParams = {
                to_email: 'pt.tsato@gmail.com',
                order_id: orderData.orderId,
                product_name: orderData.product.productName,
                customer_name: orderData.customer.name,
                total_price: orderData.pricing.totalPrice
            };
            
            emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
                .then(function(response) {
                    console.log('EmailJS送信成功:', response.status, response.text);
                }, function(error) {
                    console.log('EmailJS送信失敗:', error);
                });
        }
    </script>
    """
    
    print("EmailJS用JavaScriptコード:")
    print(js_code)
    return True

# ===============================
# 方法5: Flask + ローカルサーバー
# ===============================
def method5_flask_server():
    """
    Flask APIサーバーでメール送信
    事前準備: pip install flask
    """
    print("=== 方法5: Flask APIサーバー ===")
    
    flask_code = '''
from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)

@app.route('/send_order_email', methods=['POST'])
def send_order_email():
    try:
        order_data = request.json
        
        # Gmail SMTP設定
        SMTP_SERVER = "smtp.gmail.com"
        SMTP_PORT = 587
        GMAIL_USER = "your-gmail@gmail.com"
        GMAIL_PASSWORD = "your-app-password"
        
        # メール作成
        subject = f"[AMINATI_EC] 新規注文: {order_data['orderId']}"
        body = f"""
        注文番号: {order_data['orderId']}
        商品名: {order_data['product']['productName']}
        お客様: {order_data['customer']['name']}
        合計金額: ¥{order_data['pricing']['totalPrice']:,}
        """
        
        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = subject
        msg['From'] = GMAIL_USER
        msg['To'] = "pt.tsato@gmail.com"
        
        # 送信
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return jsonify({"status": "success"})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    '''
    
    print("Flask APIサーバーコード:")
    print(flask_code)
    
    print("\nJavaScriptから呼び出し:")
    print("""
    fetch('http://localhost:5000/send_order_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => console.log('メール送信結果:', data));
    """)
    
    return True

# ===============================
# テスト実行
# ===============================
def test_all_methods():
    """全ての方法をテスト"""
    print("🚀 AMINATI_EC メール送信テスト開始")
    print(f"📧 テスト送信先: {TEST_EMAIL}")
    print("=" * 50)
    
    methods = [
        ("Gmail SMTP", method1_gmail_smtp),
        ("SendGrid API", method2_sendgrid),
        ("MailGun API", method3_mailgun),
        ("EmailJS設定", method4_emailjs_setup),
        ("Flask API", method5_flask_server),
    ]
    
    results = {}
    for name, method in methods:
        try:
            results[name] = method()
        except Exception as e:
            print(f"❌ {name} 実行エラー: {e}")
            results[name] = False
        print("-" * 30)
    
    print("\n📊 テスト結果まとめ:")
    for method, success in results.items():
        status = "✅ 成功" if success else "❌ 失敗"
        print(f"  {method}: {status}")
    
    print(f"\n💡 推奨順序:")
    print("1. Gmail SMTP (最も確実)")
    print("2. SendGrid API (無料枠あり)")
    print("3. Flask API (ローカル開発)")

if __name__ == "__main__":
    test_all_methods()
