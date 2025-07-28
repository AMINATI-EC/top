# 最もシンプルなメール送信テスト
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_test_email():
    # ===== 設定（ここを変更してください） =====
    GMAIL_USER = "your-gmail@gmail.com"  # あなたのGmailアドレス
    GMAIL_PASSWORD = "your-app-password"  # 16文字のアプリパスワード
    TEST_EMAIL = "pt.tsato@gmail.com"     # テスト送信先
    
    print("📧 AMINATI_EC メール送信テスト開始")
    print(f"送信者: {GMAIL_USER}")
    print(f"送信先: {TEST_EMAIL}")
    print("-" * 40)
    
    try:
        # メール作成
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = TEST_EMAIL
        msg['Subject'] = "[AMINATI_EC] メール送信テスト"
        
        # メール本文
        body = """
AMINATI_EC メール送信テストです。

このメールが届いていれば、メール送信機能は正常に動作しています。

次のステップ：
1. ✅ 基本テスト成功
2. 🔄 注文データでのテスト
3. 🚀 HTMLシステムとの連携

AMINATI_EC 開発チーム
        """
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Gmail SMTP接続
        print("🔄 Gmail SMTPに接続中...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        
        print("🔐 ログイン中...")
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        
        print("📤 メール送信中...")
        text = msg.as_string()
        server.sendmail(GMAIL_USER, TEST_EMAIL, text)
        server.quit()
        
        print("✅ メール送信成功！")
        print(f"📧 {TEST_EMAIL} を確認してください")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("❌ 認証エラー:")
        print("   - Gmailアドレスが正しいか確認")
        print("   - アプリパスワードが正しいか確認")
        print("   - 2段階認証が有効になっているか確認")
        return False
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def check_requirements():
    """必要な準備ができているかチェック"""
    print("🔍 事前準備チェック:")
    print("1. ✅ Googleアカウントで2段階認証は有効ですか？")
    print("2. ✅ アプリパスワード（16文字）は生成済みですか？")
    print("3. ✅ 上記のGMAIL_USERとGMAIL_PASSWORDを設定しましたか？")
    print("")
    
    response = input("上記の準備は完了していますか？ (y/n): ")
    return response.lower() == 'y'

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 AMINATI_EC メール送信テスト")
    print("=" * 50)
    
    if check_requirements():
        print("\n🚀 テスト開始...")
        success = send_test_email()
        
        if success:
            print("\n🎉 テスト完了！")
            print("次のステップ: 注文データでのテスト")
        else:
            print("\n⚠️  設定を確認して再度お試しください")
    else:
        print("\n📋 事前準備ガイド:")
        print("1. Googleアカウント設定 → セキュリティ → 2段階認証を有効化")
        print("2. アプリパスワード生成:")
        print("   https://myaccount.google.com/apppasswords")
        print("3. アプリを選択: メール")
        print("4. デバイスを選択: その他")
        print("5. 16文字のパスワードをコピー")
