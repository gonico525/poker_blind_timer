# モバイルレスポンシブ対応計画

## 1. 概要

本計画書は、ポーカーブラインドタイマーのモバイル（スマートフォン）対応を実現するための実装計画を定義します。

### 1.1 目的

- スマートフォン（320px〜640px）でも快適に操作できるUIの実現
- タブレット縦向き（641px〜767px）の操作性向上
- タッチ操作への最適化

### 1.2 背景

現在の仕様では「PCブラウザのみ」「最小解像度1280x720px」と定義されており、モバイル対応は「優先度：低（将来的に検討）」とされています。PWA対応が完了した今、モバイルでの利用ニーズに応えるため本対応を計画します。

### 1.3 実装方針

**仕様書先行の開発プロセス:**

1. **Phase 1 で仕様書を先に更新**し、モバイル対応の設計基準を確定する
2. 更新された仕様書（requirements.md, 03-design-system.md）と本計画書を**正として**実装を進める
3. 実装時に仕様との乖離が発生した場合は、仕様書を更新してから実装を継続する

---

## 2. 現状分析

### 2.1 仕様の定義状況

| ドキュメント        | 現在の定義                                           |
| ------------------- | ---------------------------------------------------- |
| requirements.md     | プラットフォーム: PCブラウザのみ（モバイルは対象外） |
| requirements.md     | 最小解像度: 1280x720px                               |
| requirements.md     | モバイル対応: 優先度：低（将来的に検討）             |
| 03-design-system.md | 最小解像度: 1280x720px                               |
| 03-design-system.md | 768px未満: 「最小サポート外」と明記                  |

### 2.2 CSS実装の現状

| ブレークポイント | デバイス         | 対応状況            |
| ---------------- | ---------------- | ------------------- |
| 1920px+          | 大型ディスプレイ | ✅ 完全対応         |
| 1280px〜1919px   | デスクトップ     | ✅ 完全対応（基準） |
| 1024px〜1279px   | ノートPC         | ✅ 対応             |
| 768px〜1023px    | タブレット横     | ✅ 対応             |
| 641px〜767px     | タブレット縦     | ⚠️ 部分対応         |
| 320px〜640px     | スマートフォン   | ❌ 未対応           |

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

| コンポーネント           | 課題                                                     |
| ------------------------ | -------------------------------------------------------- |
| AppHeader                | タイトル・ストラクチャセレクタ・設定ボタンが横並びで窮屈 |
| TimerControls            | ボタンが縦並びになるが、タッチターゲットが小さい         |
| BlindEditor              | テーブル形式が狭い画面で見づらい                         |
| StructureManagementModal | サイドバー＋コンテンツの2カラム構成がスマホで破綻        |
| NextLevelInfo            | 情報量が多く、狭い画面で読みにくい                       |

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

1. **仕様書先行**
   - Phase 1 で仕様書（requirements.md, 03-design-system.md）を更新
   - 更新された仕様書を正として実装を進行

2. **Mobile-First ではなく、既存PCデザインからの拡張**
   - 既存の1280px+向けデザインを維持
   - 768px未満向けのスタイルを追加・強化

3. **段階的対応**
   - Phase 1: 仕様書更新
   - Phase 2: コアUIのモバイル対応
   - Phase 3: モーダル・設定画面対応
   - Phase 4: タッチ操作最適化

4. **既存コードへの影響最小化**
   - 新しいメディアクエリの追加
   - 既存スタイルの上書きは最小限

### 3.2 ターゲットデバイス

| カテゴリ               | 画面幅       | 優先度 |
| ---------------------- | ------------ | ------ |
| スマートフォン（小）   | 320px〜374px | 中     |
| スマートフォン（標準） | 375px〜413px | 高     |
| スマートフォン（大）   | 414px〜639px | 高     |
| タブレット縦           | 640px〜767px | 中     |

### 3.3 新規ブレークポイント

既存のCSS変数を活用し、以下のブレークポイントでスタイルを追加します：

```css
/* スマートフォン */
@media (max-width: 639px) {
  /* --breakpoint-sm未満 */
}

/* 小型スマートフォン */
@media (max-width: 374px) {
}
```

---

## 4. 実装計画

### Phase 1: 仕様書更新（優先度: 最高）

**実装に先立ち、仕様書を更新してモバイル対応の設計基準を確定します。**

#### 4.1.1 requirements.md の更新

**更新箇所:**

1. **対応プラットフォームの変更**

```diff
- プラットフォーム: PCブラウザのみ (モバイルは対象外)
+ プラットフォーム: モダンブラウザ（PC、タブレット、スマートフォン）
```

2. **非機能要件のレスポンシブ対応セクション更新**

```diff
  3.1.3 レスポンシブデザイン
- - PC画面サイズに最適化
+ - PC・タブレット・スマートフォンに対応
  - フルスクリーン表示対応
- - 最小解像度: 1280x720px
+ - 最小画面幅: 320px（スマートフォン）
+ - 推奨解像度: 1280x720px以上（PC）
```

3. **将来拡張からモバイル対応を削除**

```diff
  8.2 優先度：低（将来的に検討）
- - モバイル対応
  - マルチデバイス同期
```

**ファイル:** `docs/urs/requirements.md`

#### 4.1.2 03-design-system.md の更新

**追加・更新内容:**

1. **解像度サポートの更新**

```diff
  ### 解像度サポート
- - 最小解像度: 1280x720px (HD)
+ - 最小画面幅: 320px（スマートフォン）
+ - 最小解像度（PC）: 1280x720px (HD)
  - 推奨解像度: 1920x1080px (Full HD)
  - 大画面対応: 2560x1440px以上
```

2. **モバイル向けブレークポイントの明示**

| ブレークポイント | 対象デバイス       | 用途           |
| ---------------- | ------------------ | -------------- |
| 320px〜374px     | 小型スマートフォン | 最小サポート   |
| 375px〜639px     | 標準スマートフォン | モバイル基準   |
| 640px〜767px     | タブレット縦       | タブレット対応 |
| 768px〜1023px    | タブレット横       | タブレット対応 |
| 1024px〜1279px   | ノートPC           | PC対応         |
| 1280px〜1919px   | デスクトップ       | PC基準         |
| 1920px+          | 大型ディスプレイ   | 拡張対応       |

3. **タッチ操作ガイドラインの追加**

```markdown
### タッチ操作ガイドライン

#### タップターゲットサイズ

- 最小サイズ: 44×44px（WCAG 2.1準拠）
- 推奨サイズ: 48×48px
- ターゲット間の間隔: 8px以上

#### タッチフィードバック

- ホバー効果: タッチデバイスでは無効化（@media (hover: none)）
- アクティブ状態: タップ時にスケール縮小（0.98）と透明度変化

#### 入力フィールド

- フォントサイズ: 16px以上（iOSズーム防止）
- 高さ: 44px以上
```

4. **モバイル向けフォントサイズの追加**

| 要素       | PC (1280px+) | タブレット (768px-1279px) | スマホ (< 640px)        |
| ---------- | ------------ | ------------------------- | ----------------------- |
| タイマー   | 120px        | 96px                      | clamp(48px, 15vw, 72px) |
| ブラインド | 48px         | 36px                      | 24px                    |
| レベル番号 | 36px         | 28px                      | 20px                    |
| 本文       | 16px         | 16px                      | 14px                    |

5. **モバイルレイアウトパターンの追加**

```markdown
### モバイルレイアウトパターン

#### ヘッダー（< 640px）

- 2行レイアウト: 上段にロゴ＋設定、下段にストラクチャセレクタ
- タイトルテキストは非表示（ロゴのみ）

#### モーダル（< 640px）

- フルスクリーン表示
- border-radius: 0
- 閉じるボタン: 44×44px

#### 2カラムレイアウト（< 640px）

- 1カラムに変更（縦積み）
- サイドバー: 上部に配置、高さ40vh
- コンテンツ: 下部に配置、高さ60vh
```

**ファイル:** `docs/specs/03-design-system.md`

#### 4.1.3 Phase 1 完了条件

- [ ] requirements.md のプラットフォーム定義更新
- [ ] requirements.md のレスポンシブ要件更新
- [ ] 03-design-system.md の解像度サポート更新
- [ ] 03-design-system.md にタッチ操作ガイドライン追加
- [ ] 03-design-system.md にモバイルフォントサイズ追加
- [ ] 03-design-system.md にモバイルレイアウトパターン追加
- [ ] レビュー完了

---

### Phase 2: コアUI対応（優先度: 高）

**Phase 1 で更新された仕様書を正として、タイマー画面の基本的なモバイル対応を実装します。**

#### 4.2.1 AppHeader のモバイル対応

**仕様書参照:** 03-design-system.md「モバイルレイアウトパターン > ヘッダー」

**対応内容:**

```css
@media (max-width: 639px) {
  .header {
    flex-wrap: wrap;
    /* 2行レイアウト */
  }
  .title {
    display: none;
  } /* ロゴのみ表示 */
  .center {
    width: 100%;
    order: 2;
  }
}
```

**ファイル:** `src/components/AppHeader/AppHeader.module.css`

#### 4.2.2 TimerDisplay のモバイル最適化

**仕様書参照:** 03-design-system.md「モバイル向けフォントサイズ > タイマー」

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

#### 4.2.3 BlindInfo のモバイル最適化

**仕様書参照:** 03-design-system.md「モバイル向けフォントサイズ > ブラインド」

**対応内容:**

```css
@media (max-width: 639px) {
  .blinds {
    flex-direction: column;
    gap: var(--spacing-1);
    font-size: var(--font-size-h4);
  }
  .separator {
    display: none;
  }
  .blindLabels {
    flex-direction: column;
  }
}
```

**ファイル:** `src/components/BlindInfo/BlindInfo.module.css`

#### 4.2.4 TimerControls のモバイル最適化

**仕様書参照:** 03-design-system.md「タッチ操作ガイドライン > タップターゲットサイズ」

**対応内容:**

```css
@media (max-width: 639px) {
  .button {
    min-height: 48px; /* 推奨タッチターゲット */
    font-size: var(--font-size-base);
    padding: var(--spacing-3) var(--spacing-4);
  }
  .mainButtons,
  .levelButtons {
    gap: var(--spacing-2);
  }
}
```

**ファイル:** `src/components/TimerControls/TimerControls.module.css`

#### 4.2.5 NextLevelInfo のモバイル対応

**対応内容:**

```css
@media (max-width: 639px) {
  .nextLevelInfo {
    padding: var(--spacing-2);
  }
  .label,
  .value {
    font-size: var(--font-size-sm);
  }
}
```

**ファイル:** `src/components/NextLevelInfo/NextLevelInfo.module.css`

#### 4.2.6 BreakDisplay のモバイル対応

**対応内容:**

```css
@media (max-width: 639px) {
  .breakTitle {
    font-size: var(--font-size-h2);
  }
}
```

**ファイル:** `src/components/BreakDisplay/BreakDisplay.module.css`

#### 4.2.7 Phase 2 完了条件

- [ ] AppHeader.module.css のモバイル対応
- [ ] TimerDisplay.module.css のモバイル対応
- [ ] BlindInfo.module.css のモバイル対応
- [ ] TimerControls.module.css のモバイル対応
- [ ] NextLevelInfo.module.css のモバイル対応
- [ ] BreakDisplay.module.css のモバイル対応
- [ ] タイマー画面がスマホで正常表示されることを確認
- [ ] 既存PC表示に影響がないことを確認

---

### Phase 3: モーダル・設定画面対応（優先度: 中）

**Phase 1 で更新された仕様書を正として、モーダルと設定画面のモバイル対応を実装します。**

#### 4.3.1 Modal のモバイル対応

**仕様書参照:** 03-design-system.md「モバイルレイアウトパターン > モーダル」

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

#### 4.3.2 StructureManagementModal の対応

**仕様書参照:** 03-design-system.md「モバイルレイアウトパターン > 2カラムレイアウト」

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

#### 4.3.3 BlindEditor のモバイル対応

**対応内容:**

- テーブルを横スクロール可能に
- 入力フィールドのタッチターゲット拡大

**ファイル:** `src/components/BlindEditor/BlindEditor.module.css`

#### 4.3.4 NumberInput のタッチ対応

**仕様書参照:** 03-design-system.md「タッチ操作ガイドライン > 入力フィールド」

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

#### 4.3.5 その他コンポーネント

以下のコンポーネントも同様にモバイル対応を実施：

- `StructureList.module.css` - リスト項目タッチ対応
- `StructureEditor.module.css` - フォーム最適化
- `Dropdown.module.css` - タッチ操作対応
- `Toggle.module.css` - タッチターゲット拡大
- `Slider.module.css` - スライダー操作改善
- `VolumeControl.module.css` - タッチ操作対応

#### 4.3.6 Phase 3 完了条件

- [x] Modal.module.css のモバイル対応
- [x] StructureManagementModal.module.css のモバイル対応
- [x] BlindEditor.module.css のモバイル対応
- [x] NumberInput.module.css のモバイル対応
- [x] その他コンポーネントのモバイル対応（Dropdown, Toggle, Slider）
- [x] すべてのモーダルがスマホで正常動作することを確認
- [x] 既存PC表示に影響がないことを確認（テスト490件パス）

---

### Phase 4: タッチ操作最適化（優先度: 中）

**Phase 1 で更新された仕様書を正として、タッチ操作の最適化を実装します。**

#### 4.4.1 ホバー効果のタッチ対応

**仕様書参照:** 03-design-system.md「タッチ操作ガイドライン > タッチフィードバック」

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
- `src/components/common/Button/Button.module.css`
- その他ボタンを含むコンポーネント

#### 4.4.2 スクロール動作の最適化

**対応内容:**

```css
/* iOS のバウンススクロール対策 */
.scrollContainer {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

#### 4.4.3 Phase 4 完了条件

- [ ] すべてのボタンにタッチフィードバック追加
- [ ] ホバー効果のタッチデバイス対応
- [ ] スクロール動作の最適化
- [ ] 実機テストでタッチ操作が快適であることを確認

---

## 5. 影響を受けるファイル一覧

### 仕様書（Phase 1）

| ファイル                         | 変更内容                               |
| -------------------------------- | -------------------------------------- |
| `docs/urs/requirements.md`       | プラットフォーム・レスポンシブ要件更新 |
| `docs/specs/03-design-system.md` | モバイル対応セクション追加             |

### CSSファイル（Phase 2〜4）

| ファイル                              | Phase | 変更内容                                     |
| ------------------------------------- | ----- | -------------------------------------------- |
| `AppHeader.module.css`                | 2     | モバイルレイアウト追加                       |
| `TimerDisplay.module.css`             | 2     | フォントサイズ調整                           |
| `BlindInfo.module.css`                | 2     | 縦並びレイアウト追加                         |
| `TimerControls.module.css`            | 2, 4  | タッチターゲット拡大、タッチフィードバック   |
| `NextLevelInfo.module.css`            | 2     | コンパクトレイアウト                         |
| `BreakDisplay.module.css`             | 2     | フォントサイズ調整                           |
| `Modal.module.css`                    | 3, 4  | フルスクリーンモーダル、タッチフィードバック |
| `StructureManagementModal.module.css` | 3     | 1カラムレイアウト                            |
| `BlindEditor.module.css`              | 3     | テーブル最適化                               |
| `NumberInput.module.css`              | 3     | 入力フィールド拡大                           |
| `StructureList.module.css`            | 3     | リスト項目タッチ対応                         |
| `StructureEditor.module.css`          | 3     | フォーム最適化                               |
| `Dropdown.module.css`                 | 3     | タッチ操作対応                               |
| `Toggle.module.css`                   | 3     | タッチターゲット拡大                         |
| `Slider.module.css`                   | 3     | スライダー操作改善                           |
| `VolumeControl.module.css`            | 3     | タッチ操作対応                               |
| `Button.module.css`                   | 4     | タッチフィードバック                         |

---

## 6. テスト計画

### 6.1 対象デバイス・ブラウザ

| デバイス          | 画面サイズ | ブラウザ         |
| ----------------- | ---------- | ---------------- |
| iPhone SE         | 375×667    | Safari           |
| iPhone 14         | 390×844    | Safari           |
| iPhone 14 Pro Max | 430×932    | Safari           |
| Pixel 7           | 412×915    | Chrome           |
| Galaxy S21        | 360×800    | Samsung Internet |

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

| Phase   | 内容                   | 成果物                               |
| ------- | ---------------------- | ------------------------------------ |
| Phase 1 | 仕様書更新             | requirements.md, 03-design-system.md |
| Phase 2 | コアUI対応             | CSSファイル6個の修正                 |
| Phase 3 | モーダル・設定画面対応 | CSSファイル10個の修正                |
| Phase 4 | タッチ操作最適化       | 既存CSSへのメディアクエリ追加        |

---

## 8. リスクと対策

### 8.1 リスク一覧

| リスク                     | 影響度 | 対策                                  |
| -------------------------- | ------ | ------------------------------------- |
| 既存PCデザインへの影響     | 中     | メディアクエリで分離、テストで確認    |
| iOS Safari固有の問題       | 中     | `-webkit-` プレフィックス、実機テスト |
| タッチとマウスの両対応     | 低     | `@media (hover: none)` で分岐         |
| フォントサイズによるズーム | 低     | 入力フィールドは16px以上に設定        |
| 仕様と実装の乖離           | 中     | 実装前に仕様書を更新、レビュー実施    |

### 8.2 ロールバック計画

- すべての変更はメディアクエリ内に限定
- 問題発生時は該当メディアクエリを削除することで即座にロールバック可能

---

## 9. 完了条件

1. Phase 1 の仕様書更新が完了し、レビュー承認済み
2. Phase 2〜4 のすべてのCSSファイル修正が完了
3. テスト計画の全項目をパス
4. 既存のPC表示に影響がないことを確認
5. ビルド・lint・テストがすべて通過

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

| バージョン | 日付       | 変更内容                                   | 作成者              |
| ---------- | ---------- | ------------------------------------------ | ------------------- |
| 1.0        | 2026-02-03 | 初版作成                                   | AI Design Architect |
| 1.1        | 2026-02-03 | Phase順序変更（仕様書更新をPhase 1に移動） | AI Design Architect |
