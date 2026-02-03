# モバイルレスポンシブ対応計画

## 1. 概要

本計画書は、ポーカーブラインドタイマーのモバイル（スマートフォン）対応を実現するための実装計画を定義します。

### 1.1 目的

- スマートフォン（320px〜640px）でも快適に操作できるUIの実現
- タブレット縦向き（641px〜767px）の操作性向上
- タッチ操作への最適化

### 1.2 背景

現在の仕様では「PCブラウザのみ」「最小解像度1280x720px」と定義されており、モバイル対応は「優先度：低（将来的に検討）」とされています。PWA対応が完了した今、モバイルでの利用ニーズに応えるため本対応を計画します。

---

## 2. 現状分析

### 2.1 仕様の定義状況

| ドキュメント | 現在の定義 |
|-------------|-----------|
| requirements.md | プラットフォーム: PCブラウザのみ（モバイルは対象外） |
| requirements.md | 最小解像度: 1280x720px |
| requirements.md | モバイル対応: 優先度：低（将来的に検討） |
| 03-design-system.md | 最小解像度: 1280x720px |
| 03-design-system.md | 768px未満: 「最小サポート外」と明記 |

### 2.2 CSS実装の現状

| ブレークポイント | デバイス | 対応状況 |
|-----------------|---------|---------|
| 1920px+ | 大型ディスプレイ | ✅ 完全対応 |
| 1280px〜1919px | デスクトップ | ✅ 完全対応（基準） |
| 1024px〜1279px | ノートPC | ✅ 対応 |
| 768px〜1023px | タブレット横 | ✅ 対応 |
| 641px〜767px | タブレット縦 | ⚠️ 部分対応 |
| 320px〜640px | スマートフォン | ❌ 未対応 |

### 2.3 既存のレスポンシブ実装

以下は既に実装されている内容です：

#### viewport設定（index.html）
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
→ ✅ 正しく設定済み

#### CSS変数（index.css）
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```
→ ✅ モバイル向けブレークポイントも定義済み

#### メディアクエリ
- 43個のメディアクエリが20以上のコンポーネントに実装済み
- 主に768px以上を対象としたスタイル調整
- 768px未満は基本的なフォントサイズ縮小のみ

### 2.4 モバイル対応における課題

#### 2.4.1 レイアウトの課題

| コンポーネント | 課題 |
|---------------|------|
| AppHeader | タイトル・ストラクチャセレクタ・設定ボタンが横並びで窮屈 |
| TimerControls | ボタンが縦並びになるが、タッチターゲットが小さい |
| BlindEditor | テーブル形式が狭い画面で見づらい |
| StructureManagementModal | サイドバー＋コンテンツの2カラム構成がスマホで破綻 |
| NextLevelInfo | 情報量が多く、狭い画面で読みにくい |

#### 2.4.2 タッチ操作の課題

- `@media (hover: none)` 未対応
- ホバー効果がタッチデバイスで機能しない
- タッチターゲットサイズが44px未満の箇所あり
- スワイプジェスチャー未実装

#### 2.4.3 視認性の課題

- タイマー表示（72px @ 768px未満）がスマホでは大きすぎる場合あり
- ブラインド情報のフォントサイズがスマホで適切でない
- 経過時間やレベル情報が見づらい

---

## 3. 対応方針

### 3.1 基本方針

1. **Mobile-First ではなく、既存PCデザインからの拡張**
   - 既存の1280px+向けデザインを維持
   - 768px未満向けのスタイルを追加・強化

2. **段階的対応**
   - Phase 1: クリティカルなUIコンポーネントのモバイル対応
   - Phase 2: タッチ操作の最適化
   - Phase 3: UXの洗練

3. **既存コードへの影響最小化**
   - 新しいメディアクエリの追加
   - 既存スタイルの上書きは最小限

### 3.2 ターゲットデバイス

| カテゴリ | 画面幅 | 優先度 |
|---------|--------|--------|
| スマートフォン（小） | 320px〜374px | 中 |
| スマートフォン（標準） | 375px〜413px | 高 |
| スマートフォン（大） | 414px〜639px | 高 |
| タブレット縦 | 640px〜767px | 中 |

### 3.3 新規ブレークポイント

既存のCSS変数を活用し、以下のブレークポイントでスタイルを追加します：

```css
/* スマートフォン */
@media (max-width: 639px) { /* --breakpoint-sm未満 */ }

/* 小型スマートフォン */
@media (max-width: 374px) { }
```

---

## 4. 実装計画

### Phase 1: コアUI対応（優先度: 高）

タイマー画面の基本的なモバイル対応を実現します。

#### 4.1.1 AppHeader のモバイル対応

**現状の問題:**
- 3カラムレイアウト（ロゴ・セレクタ・設定）が狭い画面で破綻
- ストラクチャセレクタが操作しにくい

**対応内容:**
```css
@media (max-width: 639px) {
  .header {
    flex-wrap: wrap;
    /* または2行レイアウト */
  }
  .title { display: none; } /* ロゴのみ表示 */
  .center { width: 100%; order: 2; }
}
```

**ファイル:** `src/components/AppHeader/AppHeader.module.css`

#### 4.1.2 TimerDisplay のモバイル最適化

**現状の問題:**
- 72px（768px未満）は375pxスマホでは適切だが、320pxでは大きすぎる

**対応内容:**
```css
@media (max-width: 639px) {
  .timer {
    font-size: clamp(48px, 15vw, 72px);
  }
}

@media (max-width: 374px) {
  .timer {
    font-size: 48px;
  }
}
```

**ファイル:** `src/components/TimerDisplay/TimerDisplay.module.css`

#### 4.1.3 BlindInfo のモバイル最適化

**現状の問題:**
- SB/BB/Ante が横並びで読みにくい

**対応内容:**
```css
@media (max-width: 639px) {
  .blinds {
    flex-direction: column;
    gap: var(--spacing-1);
    font-size: var(--font-size-h4);
  }
  .separator { display: none; }
  .blindLabels {
    flex-direction: column;
  }
}
```

**ファイル:** `src/components/BlindInfo/BlindInfo.module.css`

#### 4.1.4 TimerControls のモバイル最適化

**現状の問題:**
- ボタンのタッチターゲットが小さい
- 縦並びになるが間隔が狭い

**対応内容:**
```css
@media (max-width: 639px) {
  .button {
    min-height: 48px; /* タッチターゲット拡大 */
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
  }
  .mainButtons, .levelButtons {
    gap: var(--spacing-2);
  }
}
```

**ファイル:** `src/components/TimerControls/TimerControls.module.css`

#### 4.1.5 NextLevelInfo のモバイル対応

**現状の問題:**
- 情報量が多く横幅に収まらない

**対応内容:**
```css
@media (max-width: 639px) {
  .nextLevelInfo {
    padding: var(--spacing-2);
  }
  .label, .value {
    font-size: var(--font-size-sm);
  }
}
```

**ファイル:** `src/components/NextLevelInfo/NextLevelInfo.module.css`

---

### Phase 2: モーダル・設定画面対応（優先度: 中）

#### 4.2.1 Modal のモバイル対応

**現状の問題:**
- width: 95%（768px未満）は適切だが、高さが画面をはみ出す場合あり
- 閉じるボタンが小さい

**対応内容:**
```css
@media (max-width: 639px) {
  .modal {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  .closeButton {
    min-width: 44px;
    min-height: 44px;
  }
}
```

**ファイル:** `src/components/common/Modal/Modal.module.css`

#### 4.2.2 StructureManagementModal の対応

**現状の問題:**
- 2カラムレイアウトが破綻
- サイドバーとコンテンツの切り替えが困難

**対応内容:**
```css
@media (max-width: 639px) {
  .layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh;
  }
  .content {
    height: 60vh;
  }
}
```

**ファイル:** `src/components/StructureManagement/StructureManagementModal.module.css`

#### 4.2.3 BlindEditor のモバイル対応

**現状の問題:**
- テーブル形式が狭い画面で使いにくい
- 入力フィールドが小さい

**対応内容:**
- カード形式への変更またはスクロール可能なテーブル
- 入力フィールドのタッチターゲット拡大

**ファイル:** `src/components/BlindEditor/BlindEditor.module.css`

#### 4.2.4 NumberInput のタッチ対応

**対応内容:**
```css
@media (max-width: 639px) {
  .input {
    min-height: 44px;
    font-size: 16px; /* iOSズーム防止 */
  }
  .button {
    min-width: 44px;
    min-height: 44px;
  }
}
```

**ファイル:** `src/components/common/NumberInput/NumberInput.module.css`

---

### Phase 3: タッチ操作最適化（優先度: 中）

#### 4.3.1 ホバー効果のタッチ対応

**対応内容:**
```css
/* タッチデバイスではホバー効果を無効化 */
@media (hover: none) {
  .button:hover {
    background-color: inherit;
    transform: none;
  }
}

/* タッチ時のアクティブ状態を強調 */
@media (hover: none) {
  .button:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}
```

**対象ファイル:**
- `src/components/TimerControls/TimerControls.module.css`
- `src/components/common/Modal/Modal.module.css`
- その他ボタンを含むコンポーネント

#### 4.3.2 スクロール動作の最適化

**対応内容:**
```css
/* iOS のバウンススクロール対策 */
.scrollContainer {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

---

### Phase 4: 仕様書更新（優先度: 低）

#### 4.4.1 requirements.md の更新

```diff
- プラットフォーム: PCブラウザのみ (モバイルは対象外)
+ プラットフォーム: モダンブラウザ（PC、タブレット、スマートフォン）
```

#### 4.4.2 03-design-system.md の更新

- モバイル向けブレークポイントの追加
- タッチ操作ガイドラインの追加
- 最小解像度の見直し

---

## 5. 影響を受けるファイル一覧

### CSSファイル（変更）

| ファイル | Phase | 変更内容 |
|---------|-------|---------|
| `AppHeader.module.css` | 1 | モバイルレイアウト追加 |
| `TimerDisplay.module.css` | 1 | フォントサイズ調整 |
| `BlindInfo.module.css` | 1 | 縦並びレイアウト追加 |
| `TimerControls.module.css` | 1 | タッチターゲット拡大 |
| `NextLevelInfo.module.css` | 1 | コンパクトレイアウト |
| `Modal.module.css` | 2 | フルスクリーンモーダル |
| `StructureManagementModal.module.css` | 2 | 1カラムレイアウト |
| `BlindEditor.module.css` | 2 | テーブル最適化 |
| `NumberInput.module.css` | 2 | 入力フィールド拡大 |
| `StructureList.module.css` | 2 | リスト項目タッチ対応 |
| `StructureEditor.module.css` | 2 | フォーム最適化 |
| `Dropdown.module.css` | 2 | タッチ操作対応 |
| `Toggle.module.css` | 2 | タッチターゲット拡大 |
| `Slider.module.css` | 2 | スライダー操作改善 |
| `BreakDisplay.module.css` | 1 | フォントサイズ調整 |
| `VolumeControl.module.css` | 2 | タッチ操作対応 |

### 仕様書（更新）

| ファイル | Phase | 変更内容 |
|---------|-------|---------|
| `docs/urs/requirements.md` | 4 | 対応プラットフォーム更新 |
| `docs/specs/03-design-system.md` | 4 | モバイル対応セクション追加 |

---

## 6. テスト計画

### 6.1 対象デバイス・ブラウザ

| デバイス | 画面サイズ | ブラウザ |
|---------|-----------|---------|
| iPhone SE | 375×667 | Safari |
| iPhone 14 | 390×844 | Safari |
| iPhone 14 Pro Max | 430×932 | Safari |
| Pixel 7 | 412×915 | Chrome |
| Galaxy S21 | 360×800 | Samsung Internet |

### 6.2 テスト項目

1. **レイアウト確認**
   - 各画面サイズでの表示崩れがないこと
   - 横スクロールが発生しないこと
   - 縦向き・横向き両方で確認

2. **タッチ操作確認**
   - すべてのボタンがタップ可能であること
   - タップターゲットが十分な大きさであること（44px以上）
   - 意図しないタップが発生しないこと

3. **機能確認**
   - タイマーの開始・停止・リセット
   - ブラインドレベルの変更
   - ストラクチャの選択・編集
   - 設定の変更

4. **パフォーマンス確認**
   - アニメーションがスムーズであること
   - スクロールが滑らかであること

---

## 7. 実装スケジュール

| Phase | 内容 | 工数目安 |
|-------|------|---------|
| Phase 1 | コアUI対応 | CSSファイル6個の修正 |
| Phase 2 | モーダル・設定画面対応 | CSSファイル10個の修正 |
| Phase 3 | タッチ操作最適化 | 既存CSSへのメディアクエリ追加 |
| Phase 4 | 仕様書更新 | ドキュメント2件の更新 |

---

## 8. リスクと対策

### 8.1 リスク一覧

| リスク | 影響度 | 対策 |
|--------|-------|------|
| 既存PCデザインへの影響 | 中 | メディアクエリで分離、テストで確認 |
| iOS Safari固有の問題 | 中 | `-webkit-` プレフィックス、実機テスト |
| タッチとマウスの両対応 | 低 | `@media (hover: none)` で分岐 |
| フォントサイズによるズーム | 低 | 入力フィールドは16px以上に設定 |

### 8.2 ロールバック計画

- すべての変更はメディアクエリ内に限定
- 問題発生時は該当メディアクエリを削除することで即座にロールバック可能

---

## 9. 完了条件

1. Phase 1〜3 のすべてのCSSファイル修正が完了
2. テスト計画の全項目をパス
3. 既存のPC表示に影響がないことを確認
4. ビルド・lint・テストがすべて通過

---

## 10. 備考

### 10.1 将来の検討事項

- ランドスケープモード（横向き）の専用レイアウト
- PWAのスプラッシュスクリーン最適化
- ジェスチャー操作（スワイプでレベル変更など）

### 10.2 参考資料

- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Google Web Fundamentals - Responsive Design](https://developers.google.com/web/fundamentals/design-and-ux/responsive)

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-02-03 | 初版作成 | AI Design Architect |
