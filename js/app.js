// メインアプリケーションクラス
class AdminApp {
    constructor() {
        this.productData = {};
        this.thumbnailImages = {};
        this.detailImages = {};
        
        // ハンドラーの初期化
        this.excelHandler = new ExcelHandler(this);
        this.imageHandler = new ImageHandler(this);
        this.urlHandler = new UrlHandler(this);
        this.productGenerator = new ProductGenerator(this);
        this.uiManager = new UIManager(this);
        
        this.initialize();
    }
    
    initialize() {
        addLog('管理画面を初期化しています...', 'info');
        this.setupDropZones();
        this.setupEventListeners();
        addLog('初期化完了', 'success');
    }
    
    setupDropZones() {
        // Excel ドロップゾーン
        setupDropZone('excelDropZone', (files) => {
            this.excelHandler.handleFiles(files);
        });
        
        // サムネイル画像ドロップゾーン
        setupDropZone('thumbnailDropZone', (files) => {
            this.imageHandler.handleThumbnailFiles(files);
        });
        
        // 詳細画像ドロップゾーン
        setupDropZone('detailDropZone', (files) => {
            this.imageHandler.handleDetailFiles(files);
        });
        
        // サムネイルURLドロップゾーン
        setupDropZone('thumbnailUrlDropZone', (files) => {
            this.urlHandler.handleFiles(files, 'thumbnail');
        });
        
        // 詳細URLドロップゾーン
        setupDropZone('detailUrlDropZone', (files) => {
            this.urlHandler.handleFiles(files, 'detail');
        });
    }
    
    setupEventListeners() {
        // 生成ボタンのチェック
        this.checkGenerateButton();
    }
    
    // データ更新メソッド
    updateProductData(newData) {
        this.productData = { ...this.productData, ...newData };
        this.uiManager.updateProductDisplay();
        this.checkGenerateButton();
    }
    
    addThumbnailImage(productNumber, imageData) {
        this.thumbnailImages[productNumber] = imageData;
        this.uiManager.updateImageDisplay();
        this.checkGenerateButton();
    }
    
    addDetailImage(productNumber, imageData) {
        if (!this.detailImages[productNumber]) {
            this.detailImages[productNumber] = [];
        }
        
        if (this.detailImages[productNumber].length >= CONFIG.IMAGE.MAX_DETAIL_IMAGES) {
            addLog(`商品番号 ${productNumber} の詳細画像は既に${CONFIG.IMAGE.MAX_DETAIL_IMAGES}枚です`, 'error');
            return false;
        }
        
        this.detailImages[productNumber].push(imageData);
        this.uiManager.updateImageDisplay();
        this.checkGenerateButton();
        return true;
    }
    
    removeThumbnailImage(productNumber) {
        delete this.thumbnailImages[productNumber];
        this.uiManager.updateImageDisplay();
        this.checkGenerateButton();
    }
    
    removeDetailImage(productNumber, index) {
        if (this.detailImages[productNumber]) {
            this.detailImages[productNumber].splice(index, 1);
            if (this.detailImages[productNumber].length === 0) {
                delete this.detailImages[productNumber];
            }
            this.uiManager.updateImageDisplay();
            this.checkGenerateButton();
        }
    }
    
    // 生成ボタンの有効/無効を制御
    checkGenerateButton() {
        const hasProducts = Object.keys(this.productData).length > 0;
        document.getElementById('generateBtn').disabled = !hasProducts;
    }
    
    // 商品ページ生成
    async generateProducts() {
        try {
            await this.productGenerator.generateAll();
        } catch (error) {
            addLog(`エラーが発生しました: ${error.message}`, 'error');
            showErrorMessage('商品ページの生成に失敗しました');
        }
    }
    
    // すべてクリア
    clearAll() {
        if (!confirm('すべてのデータをクリアしますか？')) {
            return;
        }
        
        this.productData = {};
        this.thumbnailImages = {};
        this.detailImages = {};
        
        this.uiManager.clearAllDisplays();
        
        addLog('すべてのデータをクリアしました', 'info');
    }
}

// アプリケーション初期化
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new AdminApp();
    
    // グローバル関数として公開（HTMLから呼び出すため）
    window.app = app;
    window.removeThumbnail = (productNumber) => app.removeThumbnailImage(productNumber);
    window.removeDetail = (productNumber, index) => app.removeDetailImage(productNumber, index);
});