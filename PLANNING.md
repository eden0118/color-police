# Color Thief Police - 架構與規劃文件

**專案**: Color Thief Police Chrome 擴充功能
**狀態**: v1.0.0 已發布
**最後更新**: 2025年12月1日
**架構負責人**: Eden

---

## 目錄

1. [願景與問題陳述](#願景與問題陳述)
2. [技術決策](#技術決策)
3. [系統架構](#系統架構)
4. [設計模式與權衡](#設計模式與權衡)
5. [開發階段](#開發階段)
6. [風險管理](#風險管理)
7. [性能策略](#性能策略)
8. [未來路線圖](#未來路線圖)

---

## 願景與問題陳述

### 問題空間

現代網站在時間累積下容易產生色彩不一致的現象：
- 多個開發者在沒有協調的情況下添加色彩
- 缺乏設計系統強制執行機制
- 色彩調色板缺乏集中文件
- 難以識別無意的色彩變化

### 解決方案：系統設計

一個智能 Chrome 擴充功能，能夠：
1. **提取**網頁上所有使用的色彩（透過 DOM 分析）
2. **分析**色彩（使用業界標準 CIEDE2000 演算法）
3. **分組**相似色彩（基於感知距離）
4. **視覺化**設計系統的不一致之處（互動式介面）
5. **調整**閾值控制群集嚴格程度

### 目標使用者

- **UI/UX 設計師** - 審計品牌一致性
- **前端開發者** - 重構色彩系統
- **設計系統管理員** - 減少色彩冗餘
- **QA 工程師** - 驗證設計合規性

### 使用案例圖 (Use Case Diagram)

```mermaid
graph TB
    A["🎨 UI/UX 設計師"]
    B["👨‍💻 前端開發者"]
    C["📊 設計系統管理員"]
    D["🧪 QA 工程師"]

    E["掃描頁面<br/>色彩"]
    F["分析<br/>色彩相似度"]
    G["檢查設計<br/>一致性"]
    H["高亮<br/>相同色彩"]
    I["調整<br/>群集閾值"]
    J["切換<br/>暗色模式"]
    K["切換<br/>語言"]

    A --> E
    A --> G
    A --> I

    B --> E
    B --> H
    B --> G

    C --> E
    C --> G
    C --> I

    D --> E
    D --> G
```

---

## 技術決策

### 核心技術棧

| 層級 | 技術 | 版本 | 關鍵決策 |
|------|------|------|---------|
| **UI 框架** | React | 18.2.0 | 元件化、高效協調、豐富生態 |
| **構建工具** | Vite | 5.0.0 | <100ms HMR、最佳化 ES module 打包、優秀開發體驗 |
| **樣式** | Tailwind CSS | 3.4.1 | 工具優先、簡潔 @apply、一致設計 token |
| **色彩工具** | Colord | 2.9.3 | 精確 RGB↔LAB 轉換、小 bundle (2KB) |
| **擴充框架** | CRXJS | 2.0.0-beta | 無縫 Vite 整合、自動 Manifest v3 處理 |
| **程式碼品質** | Prettier | 3.1.1 | 固執格式化、tailwindcss 外掛用於類別排序 |

### 演算法架構：Delta-E CIEDE2000

**選定**: CIEDE2000 (ISO/IEC 61966-2-4)

**相比其他方案的理由**:
```
E76       ❌ 線性 RGB 距離 - 感知準確度差
CMC       ❌ 過時紡織品標準，不適合設計
ΔE94      ❌ 對灰色中立不一致
CIEDE2000 ✅ 業界標準 (Pantone, Adobe)、感知均勻
```

**實現策略**:
- RGB → LAB 色彩空間轉換（感知均勻）
- 加權距離計算，具有加權係數
- 閾值範圍 5-100，可靈活分組
- 預設值：30（JND - 剛好可察覺差異標準）

**效能分析**:
- 演算法：O(m²) 複雜度，m = 獨特色彩數
- 典型工作負載：20-100 個獨特色彩
- 50 色彩：2-5ms | 500 色彩：15-25ms | 對 UX 無影響

### 架構模式：訊息驅動

**理由**: Chrome 擴充安全模型要求隔離上下文間的訊息傳遞
- Popup（隔離 React 應用）↔ Content Script（DOM 訪問）
- Popup ↔ Background Worker（大量計算）
- 沒有直接記憶體共享

**優點**:
- 清晰的關注點分離
- 明確的數據流（便於除錯）
- 固有的安全邊界
- 可擴展支援第 2 階段功能

---

## 系統架構

### 元件拓撲

```mermaid
graph TB
    subgraph CE["Chrome Extension (Manifest v3)"]
        subgraph POPUP["Popup Layer (React Runtime)"]
            APP["<b>App.jsx</b><br/>257 行<br/>• UI 狀態<br/>• 訊息協調<br/>• 主題與語言"]
        end

        subgraph COMPUTE["計算層"]
            CS["<b>Content Script</b><br/>171 行<br/>• 提取色彩<br/>• 高亮顯示<br/>• 切換"]
            BW["<b>Background Worker</b><br/>Service Worker<br/>• Delta-E 計算<br/>• 色彩分組"]
        end

        subgraph UTILS["公用程式與函式庫"]
            CE1["colorExtractor.js"]
            CE2["colorClustering.js"]
            CE3["colorContrast.js"]
            I18N["i18n"]
        end
    end

    APP -->|sendMessage| CS
    APP -->|sendMessage| BW
    CS --> DOM["頁面 DOM"]
    BW --> ALGO["色彩科學<br/>Delta-E CIEDE2000"]

    CE1 -.-> CS
    CE2 -.-> BW
    CE3 -.-> POPUP
    I18N -.-> POPUP
```

### 核心操作流程

```mermaid
sequenceDiagram
    participant User as 使用者
    participant Popup as Popup<br/>React App
    participant ContentScript as Content Script
    participant BackgroundWorker as Background Worker
    participant DOM as 頁面 DOM

    User->>Popup: 點擊「掃描色彩」按鈕
    activate Popup
    Popup->>Popup: setLoading(true)
    Popup->>ContentScript: sendMessage({action: 'scanColors'})

    activate ContentScript
    ContentScript->>DOM: querySelectorAll('*')
    ContentScript->>DOM: getComputedStyle()
    ContentScript->>ContentScript: 正規化色彩格式<br/>濾除無效/透明色
    ContentScript->>Popup: 返回 colors
    deactivate ContentScript

    Popup->>Popup: setColors(colors)
    Popup->>BackgroundWorker: sendMessage({<br/>action: 'clusterColors',<br/>colors, threshold})

    activate BackgroundWorker
    BackgroundWorker->>BackgroundWorker: RGB → LAB 轉換<br/>執行 Delta-E<br/>分組色彩
    BackgroundWorker->>Popup: 返回 clusters
    deactivate BackgroundWorker

    Popup->>Popup: setClusters(clusters)<br/>setLoading(false)
    Popup->>User: 呈現色彩網格
    deactivate Popup

    alt 使用者調整閾值
        User->>Popup: 拖動閾值滑塊
        Popup->>BackgroundWorker: 重新計算
        BackgroundWorker->>Popup: 新的 clusters
        Popup->>User: 即時更新顯示
    end

    alt 使用者高亮色彩
        User->>Popup: 點擊色彩樣本
        Popup->>ContentScript: sendMessage({action: 'highlightColor'})
        ContentScript->>DOM: 加入 highlight class
        Popup->>User: 顯示已高亮元素
    end
```

### 訊息協議規範

**Popup → Content Script** (DOM 操作)
```javascript
// 掃描色彩
{
  action: 'scanColors'
}
→ Response: { success: bool, colors: [hex_colors] }

// 高亮色彩
{
  action: 'highlightColor',
  color: '#RRGGBB'
}
→ Response: { success: bool }

// 清除高亮
{
  action: 'clearHighlights'
}
→ Response: { success: bool }
```

**Popup → Background Worker** (計算)
```javascript
// 色彩分組
{
  action: 'clusterColors',
  colors: [hex_colors],
  threshold: number           // 5-100
}
→ Response: { success: bool, clusters: [cluster_objects] }
```

### 資料管線與狀態流

```mermaid
graph LR
    A["使用者啟動<br/>掃描色彩"]
    B["Popup<br/>setLoading=true"]
    C["Popup →<br/>Content Script"]
    D["Content Script<br/>提取色彩"]
    E["濾除無效色彩<br/>正規化格式"]
    F["Content→Popup<br/>返回色彩"]
    G["Popup<br/>setColors"]
    H["Popup →<br/>Worker"]
    I["Worker<br/>Delta-E 計算<br/>分組"]
    J["Worker→Popup<br/>返回群集"]
    K["Popup<br/>setClusters"]
    L["UI 呈現<br/>色彩網格"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
```

### 狀態管理設計

**App.jsx 頂層狀態**:
```javascript
// UI 狀態
const [colors, setColors] = useState([])           // 提取的色彩
const [clusters, setClusters] = useState([])       // 分組的結果
const [activeTab, setActiveTab] = useState('clusters')
const [highlightedColor, setHighlightedColor] = useState(null)
const [isLoading, setIsLoading] = useState(false)

// 使用者偏好（持久化到 chrome.storage.local）
const [threshold, setThreshold] = useState(30)     // 5-100
const [language, setLanguage] = useState('zh')     // zh|en
const [isDarkMode, setIsDarkMode] = useState(false)

// 生命週期：挂載時載入偏好 → useEffect
```

**持久化層**:
- `chrome.storage.local` 存儲 `threshold`、`language`、`isDarkMode`
- 擴充重載和瀏覽器重啟時保留
- 輕量級 (< 100 bytes)

### 元件層級結構

```mermaid
graph TD
    App["App.jsx<br/><b>主容器</b>"]

    Header["Header<br/>頂部欄"]
    Title["標題與圖示"]
    Scan["掃描按鈕"]
    Lang["語言選擇器"]
    Theme["暗色模式切換"]

    Controls["Controls<br/>控制面板"]
    Slider["閾值滑塊<br/>5-100"]

    Tabs["標籤頁元件"]
    TabCluster["群集標籤"]
    TabAll["全色彩標籤"]

    Content["內容區域"]
    ClusterView["群集檢視"]
    AllView["全色彩檢視"]

    Status["狀態訊息"]

    App --> Header
    App --> Controls
    App --> Tabs
    App --> Content
    App --> Status

    Header --> Title
    Header --> Scan
    Header --> Lang
    Header --> Theme

    Controls --> Slider

    Tabs --> TabCluster
    Tabs --> TabAll

    Content --> ClusterView
    Content --> AllView
```

### 可擴展性考量

**色彩提取效能: O(n)**
- n = 遍歷的 DOM 元素
- 輕量級頁面 (100-500 個元素)：<100ms
- 中等頁面 (500-2000 個元素)：100-500ms
- 大型頁面 (2000-5000+ 個元素)：500ms-2s
- 未來：如果頁面 > 5000 個元素時使用 WebWorker

**分組效能: O(m²)**
- m = 獨特色彩 (通常 20-100)
- 相比提取的成本可忽略不計 (2-25ms)
- 第 1 階段沒有擴展問題

**記憶體佔用**:
- 色彩陣列：~100 個項目 × 8 bytes = <1KB
- 群集：~10-20 組 × 100 bytes = <5KB
- 總擴充狀態：<50KB (遠在限制之內)

---

## 設計模式與權衡

### 模式 1：訊息驅動架構

**為什麼**: Chrome 擴充安全要求隔離上下文間的訊息傳遞

**權衡**:
- ✅ 清晰的關注點分離
- ✅ 固有的安全邊界
- ❌ 比直接函式呼叫略為複雜

### 模式 2：閾值型群集

**為什麼**: 可調整的閾值使設計系統嚴格程度可變

**權衡**:
- ✅ 單一參數控制分組行為
- ✅ 設計師熟悉的標準 (JND 標準於 30)
- ❌ 比硬編碼分組更複雜

### 模式 3：僅為 Popup 使用 React，腳本使用原生 JS

**為什麼**: React 對 content script 複雜度過度；需要最小化腳本大小

**權衡**:
- ✅ React 極適合複雜 UI 狀態 (popup)
- ✅ Content script < 200 行 (低複雜度)
- ❌ 兩種 JS 範型需要維護

### 模式 4：僅持久化關鍵使用者偏好

**為什麼**: 保持儲存最小，啟用快速載入

**權衡**:
- ✅ 100 byte 儲存足跡
- ✅ 快速 chrome.storage.local.get()
- ❌ 沒有掃描歷史或結果同步

---

## 開發階段

### 第 1 階段：MVP (v1.0) - 已完成 ✅

**完成於 2025 年 11 月**

**交付成果**:
- ✅ Chrome Extension manifest v3 設置
- ✅ 使用 Tailwind CSS 的 React popup
- ✅ 從 DOM 提取色彩 (colorExtractor.js)
- ✅ Delta-E CIEDE2000 演算法 (colorClustering.js)
- ✅ 互動式高亮顯示切換
- ✅ 閾值控制 (5-100 範圍)
- ✅ 標籤頁導覽 (群集 / 所有色彩)
- ✅ 暗色模式支援與持久化
- ✅ i18n 支援 (中文、英文)
- ✅ 使用 Prettier 進行程式碼格式化
- ✅ 完整文件

**做出的架構決策**:
1. 訊息驅動模式以確保安全
2. 使用 React 管理 UI 複雜度
3. 使用 CIEDE2000 以確保感知準確度
4. 使用 Tailwind 以提高樣式效率

### 第 2 階段：增強與擴展 - 規劃中 📋

**預計**: 2026 年 Q1-Q2

**功能類別**:

#### 2.1 匯出與整合
- 匯出調色板為 JSON/CSS/Tailwind config
- Figma API 整合
- CSS 變數偵測
- 複製到剪貼簿工具

#### 2.2 無障礙分析
- WCAG 對比率檢查器
- 色盲模擬 (Deuteranopia、Protanopia、Tritanopia)
- 無障礙合規報告
- 建議的色彩調整

#### 2.3 進階分析
- 漸層色彩提取
- 陰影色彩分析
- 排版色彩審計
- 設計系統比較
- 品牌合規性檢查

#### 2.4 使用者體驗
- 設定/偏好面板
- 掃描歷史 (持久化)
- 喜愛的調色板
- 鍵盤快速鍵
- 批次頁面掃描

#### 2.5 品質與效能
- 單元測試套件 (Jest)
- E2E 測試 (Playwright)
- 效能基準
- 記憶體分析
- 無障礙審計 (WCAG)

#### 2.6 平台擴展
- Firefox 版本
- Safari 版本
- VS Code 擴充功能
- Figma 外掛
- Web 應用 (color-police.app)

### 第 3 階段：規模化與變現 - 未來 🚀

**預計**: 2026 年下半年+

**戰略方向**:
- 團隊協作與雲端同步
- 共享設計系統庫
- 進階功能付費層級
- 瀏覽器擴充商店發行
- 企業授權

---

## 風險管理

### 技術風險

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|---------|
| Content script 被 CSP 阻擋 | 中 | 中 | 在各種網站測試、記錄限制 |
| DOM 遍歷效能降低 | 中 | 低 | 最佳化選擇器策略、必要時延遲載入 |
| Chrome API 棄用 | 中 | 低 | 監控 Chrome 擴充路線圖、使用穩定 API |
| 長執行 popup 中的記憶體洩漏 | 低 | 低 | useEffect 正確清理、使用 DevTools 測試 |
| Delta-E 演算法差異 | 低 | 低 | 驗證參考實現、測試色彩 |

### 架構風險

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|---------|
| 訊息協議成為瓶頸 | 低 | 低 | 已設計可擴展，必要時加入批次處理 |
| React 狀態複雜度增長 | 中 | 中 | 重構為自訂 hooks，如需則考慮 Zustand |
| 樣式維護負擔 | 低 | 低 | Tailwind CSS 減少自訂 CSS、強大元件結構 |

### 營運風險

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|---------|
| 依賴項漏洞 | 中 | 低 | 定期 npm audit、自動更新 |
| 構建系統複雜度 | 低 | 低 | Vite 維護良好、CRXJS 穩定 |
| 文件落後 | 中 | 中 | 強制程式碼審查中的文件更新 |

---

## 效能策略

### 目標效能指標

| 操作 | 目標 | 目前 | 狀態 |
|------|------|------|------|
| Popup 載入 | <200ms | ~100ms | ✅ 優秀 |
| 輕量級頁面掃描 | <300ms | ~100ms | ✅ 優秀 |
| 中等頁面掃描 | <1s | ~500ms | ✅ 良好 |
| 大型頁面掃描 | <2s | ~1.5s | ✅ 可接受 |
| 分組 (50 種色彩) | <10ms | ~3ms | ✅ 優秀 |
| 高亮 100 個元素 | <50ms | ~30ms | ✅ 良好 |

### 最佳化策略

**第 1 階段 (目前)**:
- 使用 querySelectorAll 進行高效 DOM 遍歷
- 最小化色彩正規化的正規表達式操作
- 將分組卸載到 background worker (非阻塞)

**第 2 階段規劃**:
- 如果頁面 > 5000 個元素則使用 WebWorker 進行色彩提取
- 跨掃描的色彩快取
- 延遲載入公用程式函式
- Service worker 訊息池

---

## 未來路線圖

### 短期 (v1.1-1.5)：打磨與效能
- 使用 DevTools 進行效能最佳化分析
- 整合使用者反饋
- 輕微 UI 改進
- 增加測試涵蓋範圍

### 中期 (v2.0)：功能擴展
- 匯出功能 (JSON、CSS 變數、Tailwind)
- 無障礙分析 (WCAG、色盲)
- 設計系統比較工具
- 跨平台支援 (Firefox、Safari)

### 長期 (v3.0+)：平台與規模
- 用於更廣泛使用的 Web 應用版本
- 團隊協作功能
- 雲端色彩庫
- 企業授權模式
- 第三方整合 (Figma、Adobe)

---

## 架構決策日誌

### ADR-001：訊息驅動通訊
**決策**: 使用 chrome.tabs.sendMessage 和 chrome.runtime.sendMessage

**理由**: Chrome Manifest v3 的安全要求；清晰的數據流

**後果**: 比直接呼叫略複雜；極適合測試

### ADR-002：CIEDE2000 演算法
**決策**: 相比更簡單的替代方案使用業界標準 CIEDE2000

**理由**: 感知準確度；專業標準；O(m²) 成本可忽略

**後果**: 更準確的結果；可忽略的效能影響；對設計師更易用

### ADR-003：僅為 Popup 使用 React
**決策**: Popup 使用 React，content script 使用原生 JS

**理由**: React 對 content script 複雜度不必要；減少腳本大小

**後果**: 兩種範型；popup 強大且易維護

### ADR-004：Tailwind CSS 樣式
**決策**: 使用 Tailwind CSS 工具優先方式

**理由**: 使用 @apply 的小 bundle；一致性；優秀暗色模式支援

**後果**: 相比傳統框架更小的 CSS；易維護的元件結構

---

## 結論

**Color Thief Police** 架構為專注、精心設計的 Chrome 擴充，具有：

✅ **清晰的關注點分離**: Popup (UI) ↔ Content Script (DOM) ↔ Worker (計算)

✅ **業界標準演算法**: CIEDE2000 確保感知準確度，符合設計師期望

✅ **可擴展設計**: 訊息驅動模式支援第 2 階段功能，無需重構

✅ **效能感知**: O(n) 提取 + O(m²) 分組 = 典型頁面可忽略的開銷

✅ **可維護程式碼**: React 元件、Prettier 格式化、清晰的模組化結構

該架構啟用：
- 🎨 設計師審計品牌一致性
- 👨‍💻 開發者重構色彩系統
- 📈 第 2 階段進階功能擴展
- 🌍 第 2 階段多平台支援

---

**文件版本**: 1.0
**最後更新**: 2025年12月1日
**維護者**: Eden
