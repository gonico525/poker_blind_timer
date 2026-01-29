# UI統合実装計画書（改訂版）

**作成日**: 2026-01-29
**改訂日**: 2026-01-29（UI設計改善）
**作成者**: リードエンジニア
**目的**: バックエンド実装済みだがUI未統合の機能を完全に統合する
**対象**: ポーカーブラインドタイマー UI統合

---

## エグゼクティブサマリー

### 現状の問題

レビュー報告書により、以下の重大な問題が判明：

- **バックエンド実装**: 98% 完成
- **UI統合**: 61% のみ
- **ギャップ**: 19機能がUIから全くアクセス不可能

### 実装目標

UI統合率を **61% → 95%** に引き上げ、ユーザーが以下の機能にアクセスできるようにする：

1. プリセットの素早い選択・切り替え
2. ブラインド構造のカスタマイズ（プリセット編集）
3. カスタムプリセットの作成・削除
4. 音声設定（ON/OFF、音量調整）
5. 休憩設定のカスタマイズ
6. レベル時間設定
7. データのインポート/エクスポート

---

## 1. UI設計：最終決定版

### 1.1 全体構造

```
┌────────────────────────────────────────────────────┐
│ ヘッダー                                            │
│  🎰 Poker Blind Timer                              │
│                                                    │
│  [Standard Tournament ▼] 🔊 🌓 [⚙ プリセット管理]  │
│   └─ プリセット選択                                  │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ メインビュー（タイマー画面）                          │
│  ・タイマー表示（大）                                │
│  ・ブラインド情報                                    │
│  ・次レベル情報                                      │
│  ・コントロールボタン                                │
└────────────────────────────────────────────────────┘
```

### 1.2 プリセット選択ドロップダウン

```
[Standard Tournament ▼] クリック
↓
┌──────────────────────┐
│ ✓ Standard Tournament│ ← 現在選択中（チェック表示）
│   Turbo Tournament   │
│   Deep Stack         │
│   Custom 1           │
├──────────────────────┤
│ ⚙ プリセット管理...   │ ← 管理モーダルを開く
└──────────────────────┘
```

**機能**：
- 現在のプリセット名を表示
- クリックでドロップダウン展開
- プリセット選択で即座に切り替え
- 最下部に「プリセット管理」へのショートカット

### 1.3 ヘッダーのクイックアクセス

```
🔊 音量アイコン
  ↓ ホバー or クリック
  ┌─────────────┐
  │ 音量        │
  │ [|||||||  ] │ ← スライダー（0-100%）
  │ [✓] 音声ON  │ ← トグル
  └─────────────┘

🌓 テーマトグル
  ↓ クリック
  ダークモード ⇄ ライトモード 切り替え
```

### 1.4 プリセット管理モーダル（全画面）

```
┌─────────────────────────────────────────────────────┐
│ プリセット管理                        [× 閉じる]      │
├──────────────┬──────────────────────────────────────┤
│ プリセット一覧 │ 編集エリア（常に編集可能）              │
│              │                                      │
│ Standard     │ プリセット名： [Standard Tournament]  │
│              │                                      │
│ Turbo        │ ┌──────────────────────────────┐    │
│              │ │ ブラインド構造                 │    │
│ Deep Stack   │ │ Level 1: SB 25  / BB 50      │    │
│              │ │ Level 2: SB 50  / BB 100     │    │
│ Custom 1     │ │ Level 3: SB 100 / BB 200     │    │
│ [削除]       │ │ ...                          │    │
│              │ │ [+ レベル追加] [レベル削除]    │    │
│              │ └──────────────────────────────┘    │
│              │                                      │
│ ──────────   │ トーナメント設定                      │
│ [+ 新規作成] │ レベル時間: [10] 分                   │
│              │ 休憩設定: [✓] 有効                   │
│              │   頻度: [4] レベルごと                │
│              │   時間: [10] 分                      │
│              │                                      │
│              │ データ管理                            │
│              │ [📥 インポート] [📤 エクスポート]     │
│              │                                      │
│              │ [保存] [このプリセットを使う]         │
└──────────────┴──────────────────────────────────────┘
```

**重要な設計決定**：
✅ **プリセットを選択すると常に編集可能な状態で右側に表示**
✅ **保存ボタンと「このプリセットを使う」ボタンを常に表示**
✅ **参照モードと編集モードの区別なし** → UIがシンプル

---

## 2. ユーザーフロー

### フロー1：プリセット選択（最頻出）
```
1. ヘッダーの [Standard ▼] をクリック
2. ドロップダウンから「Turbo」を選択
3. 即座にTurboプリセット適用、タイマー表示更新
```
**操作回数**: 2クリック ⚡

### フロー2：プレビューしながら選択
```
1. [⚙ プリセット管理] をクリック
2. 左側の「Deep Stack」をクリック
3. 右側にブラインド構造が表示される（閲覧可能）
4. 「いいね！」→ [このプリセットを使う] をクリック
5. モーダル閉じる、Deep Stack適用完了
```
**操作回数**: 3クリック

### フロー3：プリセットを編集して使う
```
1. [⚙ プリセット管理] をクリック
2. 左側の「Custom 1」をクリック
3. 右側でLevel 3のBBを200→300に変更
4. [保存] をクリック
5. [このプリセットを使う] をクリック
6. モーダル閉じる、Custom 1（修正版）適用完了
```
**操作回数**: 5クリック

### フロー4：新規プリセット作成
```
1. [⚙ プリセット管理] をクリック
2. 左側の [+ 新規作成] をクリック
3. 右側でプリセット名入力
4. ブラインドレベル編集
5. レベル時間・休憩設定を調整
6. [保存] をクリック
7. [このプリセットを使う] をクリック（オプション）
```

### フロー5：音量調整（トーナメント中）
```
1. ヘッダーの 🔊 アイコンをホバー/クリック
2. ポップアップでスライダー表示
3. スライダーで音量調整
4. 自動保存
```
**操作回数**: 1クリック ⚡

### フロー6：データエクスポート
```
1. [⚙ プリセット管理] をクリック
2. 右側の [📤 エクスポート] をクリック
3. JSONファイルダウンロード
```

---

## 3. 事前準備フェーズ

### 3.1 関連仕様・実装の確認

#### タスク 3.1.1: 仕様確認
**目的**: 実装の正確性を保証するため、関連する全ての仕様を確認する

**確認対象**:
- [ ] docs/urs/requirements.md（要求仕様書）
  - 2.1.2 カスタマイズ機能
  - 2.2.1 タイマー設定
  - 2.2.4 休憩時間
  - 2.4.1 音声通知
  - 2.5.2 プリセット管理
  - 2.6 インポート/エクスポート
- [ ] docs/specs/03-design-system.md（デザインシステム仕様）
  - カラーシステム
  - タイポグラフィ
  - スペーシングシステム
  - コンポーネントスタイル
- [ ] docs/specs/04-interface-definitions.md（インターフェース定義）

**成果物**: 仕様理解チェックリスト

---

#### タスク 3.1.2: 既存実装の確認
**目的**: 再利用可能なコンポーネントとロジックを把握し、重複実装を避ける

**確認対象**:
- [ ] src/components/BlindEditor/BlindEditor.tsx
  - 実装済み機能（レベル追加・削除・編集）
  - Props インターフェース
- [ ] src/components/PresetManager/PresetManager.tsx
  - 現在の実装範囲
  - 未接続のコールバック（onEdit, onDelete）
- [ ] src/hooks/usePresets.ts
  - addPreset()
  - updatePreset()
  - deletePreset()
  - loadPreset()
- [ ] src/contexts/SettingsContext.tsx
  - SET_SOUND_ENABLED
  - SET_VOLUME
- [ ] src/contexts/TournamentContext.tsx
  - UPDATE_BREAK_CONFIG
  - UPDATE_LEVEL_DURATION
  - UPDATE_BLIND_LEVELS

**成果物**: 既存機能リスト、再利用可能なAPI一覧

---

#### タスク 3.1.3: デザインシステムの理解
**目的**: 一貫したUIを実装するため、デザインシステムを理解する

**確認対象**:
- [ ] CSS変数の定義（docs/specs/03-design-system.md）
  - カラー：`--color-primary`, `--color-accent`, etc.
  - スペーシング：`--spacing-xs` ~ `--spacing-xxl`
  - フォント：`--font-size-*`, `--font-weight-*`
- [ ] ボタンスタイル（`.button`, `.button-primary`, `.button-secondary`）
- [ ] 入力フィールドスタイル（`.input`, `.input-group`）
- [ ] カード・モーダルスタイル
- [ ] トランジション（`--transition-base`）

**成果物**: デザインシステム適用チェックリスト

---

## 4. 基礎コンポーネント実装フェーズ

### 4.1 汎用UIコンポーネントの作成

#### タスク 4.1.1: Dropdown コンポーネント
**目的**: プリセット選択ドロップダウンのベースコンポーネント

**実装内容**:
- ファイル: `src/components/common/Dropdown/Dropdown.tsx`
- Props:
  - `value: string` - 現在選択中の値
  - `options: Array<{value: string, label: string, disabled?: boolean}>` - 選択肢
  - `onChange: (value: string) => void` - 選択ハンドラ
  - `placeholder?: string` - プレースホルダー
  - `className?: string` - 追加のCSSクラス
- 機能:
  - キーボード操作（上下矢印、Enter、Escape）
  - 選択中の項目にチェックマーク表示
  - disabled状態の項目はクリック不可
- スタイル: docs/specs/03-design-system.md に準拠
- テスト: `Dropdown.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- ドロップダウンボタン: `.dropdown-trigger`
- ドロップダウンメニュー: `.dropdown-menu`
- アクティブ項目: `--color-accent` のチェックマーク
- ホバー: `--color-bg-hover`

**成果物**:
- [ ] Dropdown.tsx
- [ ] Dropdown.module.css
- [ ] Dropdown.test.tsx

---

#### タスク 4.1.2: Toggle コンポーネント
**目的**: ON/OFF切り替えUI（音声ON/OFF、休憩有効/無効）

**実装内容**:
- ファイル: `src/components/common/Toggle/Toggle.tsx`
- Props:
  - `label: string` - ラベルテキスト
  - `value: boolean` - 現在の状態
  - `onChange: (value: boolean) => void` - 変更ハンドラ
  - `disabled?: boolean` - 無効化フラグ
- スタイル: docs/specs/03-design-system.md に準拠
- テスト: `Toggle.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- アクティブ時: `--color-accent` 背景
- 非アクティブ時: `--color-border` 背景
- トランジション: `var(--transition-base)`

**成果物**:
- [ ] Toggle.tsx
- [ ] Toggle.module.css
- [ ] Toggle.test.tsx

---

#### タスク 4.1.3: Slider コンポーネント
**目的**: 音量調整スライダー

**実装内容**:
- ファイル: `src/components/common/Slider/Slider.tsx`
- Props:
  - `label?: string` - ラベルテキスト（オプション）
  - `min: number` - 最小値
  - `max: number` - 最大値
  - `step?: number` - ステップ（デフォルト: 1）
  - `value: number` - 現在値
  - `onChange: (value: number) => void` - 変更ハンドラ
  - `showValue?: boolean` - 値を表示するか（デフォルト: true）
  - `disabled?: boolean` - 無効化フラグ
- スタイル: docs/specs/03-design-system.md に準拠
- テスト: `Slider.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- トラック色: `--color-border`
- アクティブトラック色: `--color-accent`
- つまみ色: `--color-accent`

**成果物**:
- [ ] Slider.tsx
- [ ] Slider.module.css
- [ ] Slider.test.tsx

---

#### タスク 4.1.4: NumberInput コンポーネント
**目的**: 数値入力UI（レベル時間、休憩頻度、休憩時間）

**実装内容**:
- ファイル: `src/components/common/NumberInput/NumberInput.tsx`
- Props:
  - `label: string` - ラベルテキスト
  - `value: number` - 現在値
  - `min?: number` - 最小値
  - `max?: number` - 最大値
  - `step?: number` - ステップ（デフォルト: 1）
  - `onChange: (value: number) => void` - 変更ハンドラ
  - `unit?: string` - 単位（例: "分", "レベル"）
  - `disabled?: boolean` - 無効化フラグ
- スタイル: docs/specs/03-design-system.md の入力フィールドスタイルに準拠
- テスト: `NumberInput.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- 入力フィールド: `.input` スタイル
- 単位表示: `--color-text-secondary`

**成果物**:
- [ ] NumberInput.tsx
- [ ] NumberInput.module.css
- [ ] NumberInput.test.tsx

---

#### タスク 4.1.5: Modal コンポーネント
**目的**: プリセット管理モーダルのベースコンポーネント

**実装内容**:
- ファイル: `src/components/common/Modal/Modal.tsx`
- Props:
  - `isOpen: boolean` - 表示状態
  - `onClose: () => void` - 閉じるハンドラ
  - `title: string` - タイトル
  - `children: ReactNode` - コンテンツ
  - `size?: 'small' | 'medium' | 'large' | 'fullscreen'` - サイズ（デフォルト: 'medium'）
- 機能:
  - オーバーレイクリックで閉じる
  - Escキーで閉じる
  - フォーカストラップ（モーダル内でのTABキー循環）
- スタイル: docs/specs/03-design-system.md のモーダルスタイルに準拠
- テスト: `Modal.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- オーバーレイ: `rgba(0, 0, 0, 0.6)`
- モーダル: `.modal` スタイル
- z-index: `var(--z-index-modal)`

**成果物**:
- [ ] Modal.tsx
- [ ] Modal.module.css
- [ ] Modal.test.tsx

---

#### タスク 4.1.6: ConfirmDialog コンポーネント
**目的**: プリセット削除確認ダイアログ

**実装内容**:
- ファイル: `src/components/common/ConfirmDialog/ConfirmDialog.tsx`
- Props:
  - `isOpen: boolean`
  - `title: string`
  - `message: string`
  - `onConfirm: () => void`
  - `onCancel: () => void`
  - `confirmText?: string`（デフォルト: "確認"）
  - `cancelText?: string`（デフォルト: "キャンセル"）
  - `variant?: 'danger' | 'warning' | 'info'`（デフォルト: 'info'）
- Modal コンポーネントを使用
- テスト: `ConfirmDialog.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- variant に応じたスタイリング
  - danger: `--color-error`
  - warning: `--color-warning`
  - info: `--color-info`

**成果物**:
- [ ] ConfirmDialog.tsx
- [ ] ConfirmDialog.module.css
- [ ] ConfirmDialog.test.tsx

---

### 4.2 機能特化コンポーネントの作成

#### タスク 4.2.1: VolumeControl コンポーネント
**目的**: ヘッダーの音量コントロール（アイコン + ポップアップ）

**実装内容**:
- ファイル: `src/components/VolumeControl/VolumeControl.tsx`
- Props:
  - `volume: number` - 音量（0-100）
  - `isSoundEnabled: boolean` - 音声ON/OFF
  - `onVolumeChange: (volume: number) => void`
  - `onSoundEnabledChange: (enabled: boolean) => void`
- 機能:
  - 🔊 アイコン（音量レベルで変化：🔇 🔈 🔉 🔊）
  - ホバーまたはクリックでポップアップ表示
  - ポップアップ内容：
    - Slider（音量調整）
    - Toggle（音声ON/OFF）
  - 自動保存（SettingsContext経由）
- テスト: `VolumeControl.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- ポップアップ: `.popover` スタイル
- z-index: `var(--z-index-popover)`

**成果物**:
- [ ] VolumeControl.tsx
- [ ] VolumeControl.module.css
- [ ] VolumeControl.test.tsx

---

#### タスク 4.2.2: PresetSelector コンポーネント
**目的**: ヘッダーのプリセット選択ドロップダウン

**実装内容**:
- ファイル: `src/components/PresetSelector/PresetSelector.tsx`
- Props:
  - `presets: Preset[]` - プリセット一覧
  - `currentPresetId: PresetId | null` - 現在のプリセットID
  - `onSelect: (presetId: PresetId) => void` - プリセット選択ハンドラ
  - `onManage: () => void` - 「プリセット管理」クリックハンドラ
- 機能:
  - Dropdown コンポーネントを使用
  - 現在のプリセット名を表示
  - 選択中のプリセットにチェックマーク
  - 最下部に「⚙ プリセット管理...」項目（セパレータあり）
- テスト: `PresetSelector.test.tsx` を作成（カバレッジ80%以上）

**成果物**:
- [ ] PresetSelector.tsx
- [ ] PresetSelector.module.css
- [ ] PresetSelector.test.tsx

---

#### タスク 4.2.3: ImportExport コンポーネント
**目的**: データのインポート/エクスポート機能

**実装内容**:
- ファイル: `src/components/ImportExport/ImportExport.tsx`
- 機能:
  - **エクスポート**:
    - 全プリセットをJSON形式でダウンロード
    - ファイル名: `poker-presets-{YYYY-MM-DD}.json`
  - **インポート**:
    - ファイルアップロード（JSON）
    - バリデーション（src/utils/validation.ts を使用）
    - エラーメッセージ表示
    - 成功時のフィードバック
- Props:
  - `presets: Preset[]`
  - `onImport: (presets: Preset[]) => void`
- テスト: `ImportExport.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- エクスポートボタン: `.button-secondary`
- インポートボタン: `.button-secondary`
- アイコン: 📥 📤

**成果物**:
- [ ] ImportExport.tsx
- [ ] ImportExport.module.css
- [ ] ImportExport.test.tsx

---

## 5. プリセット管理システム実装フェーズ

### 5.1 プリセット管理モーダルの構築

#### タスク 5.1.1: PresetList コンポーネント
**目的**: モーダル左側のプリセット一覧

**実装内容**:
- ファイル: `src/components/PresetManagement/PresetList.tsx`
- Props:
  - `presets: Preset[]`
  - `currentPresetId: PresetId | null` - タイマーで使用中のプリセット
  - `selectedPresetId: PresetId | null` - 編集エリアで表示中のプリセット
  - `onSelect: (presetId: PresetId) => void` - プリセット選択
  - `onCreate: () => void` - 新規作成
  - `onDelete: (presetId: PresetId) => void` - 削除
- 機能:
  - プリセット一覧表示
  - 使用中プリセットに ✓ マーク
  - 選択中プリセットをハイライト
  - カスタムプリセットに [削除] ボタン（デフォルトプリセットには非表示）
  - [+ 新規作成] ボタン（最下部）
- テスト: `PresetList.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- 選択中: `--color-bg-tertiary` 背景
- ホバー: `--color-bg-hover`
- 削除ボタン: `--color-error`

**成果物**:
- [ ] PresetList.tsx
- [ ] PresetList.module.css
- [ ] PresetList.test.tsx

---

#### タスク 5.1.2: PresetEditor コンポーネント
**目的**: モーダル右側の編集エリア（常に編集可能）

**実装内容**:
- ファイル: `src/components/PresetManagement/PresetEditor.tsx`
- Props:
  - `preset: Preset | null` - 編集中のプリセット
  - `onSave: (preset: Preset) => void` - 保存
  - `onUse: (preset: Preset) => void` - このプリセットを使う
  - `isDirty: boolean` - 未保存の変更があるか
- セクション構成:
  1. **プリセット名**
     - TextInput（1行）
  2. **ブラインド構造編集**
     - BlindEditor コンポーネント統合
  3. **トーナメント設定**
     - レベル時間（NumberInput、単位: 分、範囲: 1-60）
     - 休憩有効/無効（Toggle）
     - 休憩頻度（NumberInput、単位: レベル）
     - 休憩時間（NumberInput、単位: 分）
  4. **データ管理**
     - ImportExport コンポーネント統合
  5. **アクションボタン**
     - [保存] ボタン（isDirty=true時のみ有効）
     - [このプリセットを使う] ボタン（常に表示）
- バリデーション:
  - プリセット名: 必須（1文字以上）
  - 最低1つのブラインドレベル必須
  - レベル時間: 1-60分の範囲チェック
- テスト: `PresetEditor.test.tsx` を作成（カバレッジ80%以上）

**デザイン仕様**:
- セクションごとに視覚的に分離（余白、ボーダー）
- 保存ボタン: `.button-primary`（無効時はグレーアウト）
- このプリセットを使うボタン: `.button-accent`

**成果物**:
- [ ] PresetEditor.tsx
- [ ] PresetEditor.module.css
- [ ] PresetEditor.test.tsx

---

#### タスク 5.1.3: PresetManagementModal コンポーネント
**目的**: PresetList と PresetEditor を統合したモーダル

**実装内容**:
- ファイル: `src/components/PresetManagement/PresetManagementModal.tsx`
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `currentPresetId: PresetId | null` - タイマーで使用中のプリセット
- 状態管理:
  - `selectedPresetId: PresetId | null` - 編集エリアで表示中のプリセット
  - `editingPreset: Preset | null` - 編集中のプリセット（ローカルコピー）
  - `isDirty: boolean` - 未保存の変更フラグ
- 機能:
  - Modal（size='fullscreen'）を使用
  - 左右2カラムレイアウト
  - プリセット選択時、右側に表示
  - 編集時の未保存警告（別プリセット選択時、モーダルを閉じる時）
  - Context統合:
    - usePresets()（addPreset, updatePreset, deletePreset, loadPreset）
- テスト: `PresetManagementModal.test.tsx` を作成（カバレッジ80%以上）

**レイアウト**:
```
┌────────┬──────────────┐
│ 30%    │ 70%          │
│ List   │ Editor       │
│        │              │
└────────┴──────────────┘
```

**成果物**:
- [ ] PresetManagementModal.tsx
- [ ] PresetManagementModal.module.css
- [ ] PresetManagementModal.test.tsx

---

## 6. メインレイアウト統合フェーズ

### 6.1 ヘッダーの実装

#### タスク 6.1.1: AppHeader コンポーネント
**目的**: 統合ヘッダーコンポーネント

**実装内容**:
- ファイル: `src/components/AppHeader/AppHeader.tsx`
- 機能:
  - アプリタイトル「🎰 Poker Blind Timer」
  - PresetSelector 統合
  - VolumeControl 統合
  - ThemeToggle 統合
  - [⚙ プリセット管理] ボタン
- レイアウト:
  - 左側：タイトル
  - 中央：PresetSelector
  - 右側：VolumeControl, ThemeToggle, プリセット管理ボタン
- テスト: `AppHeader.test.tsx` を作成（カバレッジ80%以上）

**レスポンシブ対応**:
- 幅 < 768px: タイトルを短縮、アイコンのみ表示

**成果物**:
- [ ] AppHeader.tsx
- [ ] AppHeader.module.css
- [ ] AppHeader.test.tsx

---

### 6.2 MainLayout の更新

#### タスク 6.2.1: MainLayout の統合

**実装内容**:
- ファイル: `src/components/MainLayout.tsx` を更新
- 変更点:
  - 既存のヘッダーを AppHeader コンポーネントに置き換え
  - PresetManagementModal の状態管理追加
  - ConfirmDialog の状態管理追加（削除確認用）
- 状態管理:
  ```typescript
  const [showPresetManagement, setShowPresetManagement] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<PresetId | undefined>();
  ```
- ハンドラ:
  - `handleOpenPresetManagement()`
  - `handleClosePresetManagement()`
  - `handleDeletePreset(presetId)`
  - `handleConfirmDelete()`
- 削除の際はタイマー停止状態でのみ許可（実行中の削除防止）

**成果物**:
- [ ] MainLayout.tsx（更新）
- [ ] MainLayout.module.css（更新）
- [ ] MainLayout.test.tsx（更新、カバレッジ80%以上）

---

## 7. テストフェーズ

### 7.1 ユニットテスト

#### タスク 7.1.1: 新規コンポーネントのテスト
**対象**:
- [ ] Dropdown
- [ ] Toggle
- [ ] Slider
- [ ] NumberInput
- [ ] Modal
- [ ] ConfirmDialog
- [ ] VolumeControl
- [ ] PresetSelector
- [ ] ImportExport
- [ ] PresetList
- [ ] PresetEditor
- [ ] PresetManagementModal
- [ ] AppHeader

**テスト項目**:
- 正常系: 基本動作、Props の反映
- 異常系: バリデーション、エラーハンドリング
- ユーザー操作: クリック、入力、キーボード操作
- アクセシビリティ: ARIA属性、キーボードナビゲーション

**成功基準**:
- [ ] 全テスト合格
- [ ] カバレッジ 80%以上

---

#### タスク 7.1.2: 更新コンポーネントのテスト
**対象**:
- [ ] MainLayout

**テスト項目**:
- 新機能の動作確認
- 既存機能の回帰テスト
- Context 統合のテスト

**成功基準**:
- [ ] 全テスト合格
- [ ] カバレッジ 80%以上
- [ ] 既存テスト全て維持

---

### 7.2 統合テスト

#### タスク 7.2.1: E2Eシナリオテスト

**テストシナリオ**:

1. **プリセット選択（ドロップダウン）**
   - [ ] ドロップダウンをクリック
   - [ ] プリセットを選択
   - [ ] タイマー表示が更新される
   - [ ] 選択したプリセットがドロップダウンに表示される

2. **音量調整**
   - [ ] 🔊 アイコンをホバー/クリック
   - [ ] ポップアップが表示される
   - [ ] スライダーで音量を変更
   - [ ] 音声ON/OFFをトグル
   - [ ] 設定が保存される
   - [ ] レベル変更時に音が鳴る/鳴らない

3. **テーマ切り替え**
   - [ ] 🌓 アイコンをクリック
   - [ ] ダークモード ⇄ ライトモード 切り替え
   - [ ] テーマが保存される

4. **プリセット管理：プレビューして選択**
   - [ ] [⚙ プリセット管理] をクリック
   - [ ] モーダルが全画面で表示される
   - [ ] 左側のプリセットをクリック
   - [ ] 右側にブラインド構造が表示される
   - [ ] [このプリセットを使う] をクリック
   - [ ] モーダルが閉じる
   - [ ] タイマーに反映される

5. **プリセット管理：編集して保存**
   - [ ] モーダルを開く
   - [ ] プリセットを選択
   - [ ] ブラインドレベルを編集
   - [ ] [保存] をクリック
   - [ ] 変更が保存される
   - [ ] isDirty フラグがクリアされる

6. **プリセット管理：編集して使う**
   - [ ] プリセットを編集
   - [ ] [このプリセットを使う] をクリック
   - [ ] 未保存警告が表示される（isDirty=true）
   - [ ] 保存してから適用される
   - [ ] モーダルが閉じる

7. **プリセット作成**
   - [ ] [+ 新規作成] をクリック
   - [ ] プリセット名を入力
   - [ ] ブラインドレベルを設定
   - [ ] トーナメント設定を調整
   - [ ] [保存] をクリック
   - [ ] 左側のリストに追加される

8. **プリセット削除**
   - [ ] カスタムプリセットの [削除] をクリック
   - [ ] 確認ダイアログが表示される
   - [ ] [確認] をクリック
   - [ ] プリセットが削除される
   - [ ] リストから消える

9. **インポート/エクスポート**
   - [ ] [📤 エクスポート] をクリック
   - [ ] JSONファイルがダウンロードされる
   - [ ] [📥 インポート] をクリック
   - [ ] ファイルを選択
   - [ ] プリセットがインポートされる
   - [ ] 成功メッセージが表示される

10. **未保存警告（プリセット切り替え）**
    - [ ] プリセットを編集（未保存）
    - [ ] 別のプリセットをクリック
    - [ ] 警告ダイアログ表示
    - [ ] [変更を破棄] or [保存してから移動]

11. **未保存警告（モーダルを閉じる）**
    - [ ] プリセットを編集（未保存）
    - [ ] [× 閉じる] or Escキー
    - [ ] 警告ダイアログ表示
    - [ ] [変更を破棄] or [保存してから閉じる]

**成功基準**:
- [ ] 全シナリオが正常に完了
- [ ] ユーザー体験がスムーズ
- [ ] エラーが発生しない

---

### 7.3 ブラウザ互換性テスト

#### タスク 7.3.1: 対象ブラウザでのテスト

**対象ブラウザ**:
- [ ] Chrome（最新版）
- [ ] Firefox（最新版）
- [ ] Safari（最新版）
- [ ] Edge（最新版）

**テスト項目**:
- [ ] 全機能が正常に動作する
- [ ] レイアウトが崩れない
- [ ] ドロップダウン、ポップアップが正しく表示される
- [ ] アニメーションがスムーズ
- [ ] localStorage が正常に動作する
- [ ] キーボード操作が正常に動作する

---

## 8. ドキュメント更新フェーズ

### 8.1 ユーザー向けドキュメント

#### タスク 8.1.1: README 更新（必要に応じて）

**更新内容**:
- 新機能の説明
  - プリセット選択・管理
  - 音声設定
  - データのインポート/エクスポート

---

### 8.2 開発者向けドキュメント

#### タスク 8.2.1: コンポーネントドキュメント

**作成対象**:
- 新規作成した汎用コンポーネントの使用方法
- プリセット管理システムの構造説明

**成果物**:
- [ ] docs/specs/components.md（新規作成または更新）

---

## 9. 最終確認フェーズ

### 9.1 要求仕様達成確認

#### タスク 9.1.1: 要求仕様チェックリスト

**確認項目**（docs/urs/requirements.md 準拠）:

- [ ] 2.1.2 カスタマイズ機能
  - [ ] ブラインド金額の自由編集
  - [ ] レベルの追加・削除
- [ ] 2.2.1 タイマー設定
  - [ ] レベル時間を変更可能
- [ ] 2.2.4 休憩時間
  - [ ] 休憩カスタマイズ
- [ ] 2.4.1 音声通知
  - [ ] 音量のオン/オフ
  - [ ] レベル調整
- [ ] 2.5.2 プリセット管理
  - [ ] プリセット作成
  - [ ] プリセット編集
  - [ ] プリセット削除
- [ ] 2.6 インポート/エクスポート
  - [ ] JSON形式エクスポート
  - [ ] JSON形式インポート

**成功基準**:
- [ ] 全項目が達成されている
- [ ] UI統合率 95%以上

---

### 9.2 デザインシステム準拠確認

#### タスク 9.2.1: デザインレビュー

**確認項目**（docs/specs/03-design-system.md 準拠）:

- [ ] カラーシステム
  - [ ] CSS変数を使用している
  - [ ] ダークモード/ライトモード対応
- [ ] タイポグラフィ
  - [ ] フォントサイズスケールに準拠
  - [ ] フォントウェイトに準拠
- [ ] スペーシング
  - [ ] スペーシングスケールに準拠
- [ ] コンポーネントスタイル
  - [ ] ボタンスタイルに準拠
  - [ ] 入力フィールドスタイルに準拠
  - [ ] カード/モーダルスタイルに準拠

**成功基準**:
- [ ] 全項目がデザインシステムに準拠している
- [ ] 視覚的な一貫性がある

---

### 9.3 UX確認

#### タスク 9.3.1: ユーザビリティチェック

**確認項目**:
- [ ] プリセット選択が2クリック以内で完了する
- [ ] 音量調整が1クリックでアクセス可能
- [ ] テーマ切り替えが1クリックで完了
- [ ] プリセット編集が直感的に行える
- [ ] 未保存警告が適切に表示される
- [ ] エラーメッセージが分かりやすい
- [ ] 削除時の確認ダイアログが適切

**成功基準**:
- [ ] 全ての操作が直感的
- [ ] ユーザーが迷わない

---

### 9.4 パフォーマンス確認

#### タスク 9.4.1: パフォーマンステスト

**確認項目**:
- [ ] ドロップダウンの開閉がスムーズ（60fps）
- [ ] モーダルの表示/非表示がスムーズ
- [ ] 大量のブラインドレベル（50+）でも動作が重くならない
- [ ] localStorage への保存が1秒以内に完了
- [ ] プリセット切り替えが即座に反映される

**成功基準**:
- [ ] 全操作がスムーズに動作する
- [ ] ユーザー体験が損なわれない

---

## 10. リリース準備フェーズ

### 10.1 コードレビュー

#### タスク 10.1.1: セルフレビュー

**確認項目**:
- [ ] TypeScript エラー 0件
- [ ] ESLint エラー 0件
- [ ] ESLint 警告 0件（可能な限り）
- [ ] コードの可読性
- [ ] コメントの適切性
- [ ] ハードコードの排除
- [ ] 未使用のインポート削除

---

### 10.2 ビルド確認

#### タスク 10.2.1: プロダクションビルド

**確認項目**:
- [ ] `npm run build` が成功する
- [ ] バンドルサイズが許容範囲
- [ ] ビルド成果物が正常に動作する

---

### 10.3 最終テスト

#### タスク 10.3.1: 全テストの実行

**確認項目**:
- [ ] `npm test` が全て合格
- [ ] テストカバレッジ 80%以上
- [ ] 新規追加テストケース 50件以上

---

## 11. 工数見積もり

### 11.1 フェーズ別工数

| フェーズ | タスク数 | 見積もり工数 |
|---------|---------|-------------|
| 3. 事前準備 | 3 | 2時間 |
| 4. 基礎コンポーネント実装 | 6 | 8時間 |
| 5. プリセット管理システム実装 | 3 | 6時間 |
| 6. メインレイアウト統合 | 2 | 3時間 |
| 7. テスト | 3 | 5時間 |
| 8. ドキュメント更新 | 2 | 1時間 |
| 9. 最終確認 | 4 | 2時間 |
| 10. リリース準備 | 3 | 1時間 |
| **合計** | **26** | **28時間** |

### 11.2 リスクバッファ

- 予期しない問題対応: +4時間
- レビュー修正: +2時間

**総工数**: 34時間（約4-5営業日）

---

## 12. マイルストーン

### マイルストーン 1: 基礎コンポーネント完成
**期限**: 実装開始から1.5日目
**完了条件**:
- [ ] Dropdown, Toggle, Slider, NumberInput, Modal, ConfirmDialog 実装完了
- [ ] ユニットテスト合格

### マイルストーン 2: 機能コンポーネント完成
**期限**: 実装開始から2.5日目
**完了条件**:
- [ ] VolumeControl, PresetSelector, ImportExport 実装完了
- [ ] ユニットテスト合格

### マイルストーン 3: プリセット管理システム完成
**期限**: 実装開始から3.5日目
**完了条件**:
- [ ] PresetList, PresetEditor, PresetManagementModal 実装完了
- [ ] ユニットテスト合格

### マイルストーン 4: 統合完了
**期限**: 実装開始から4日目
**完了条件**:
- [ ] AppHeader, MainLayout 更新完了
- [ ] 統合テスト合格

### マイルストーン 5: リリース準備完了
**期限**: 実装開始から5日目
**完了条件**:
- [ ] 全テスト合格
- [ ] ドキュメント更新完了
- [ ] 要求仕様達成確認完了
- [ ] プロダクションビルド成功

---

## 13. 成功基準

### 13.1 機能面

- [ ] ユーザーがプリセットを素早く選択できる（2クリック）
- [ ] ユーザーがカスタムプリセットを作成できる
- [ ] ユーザーが既存プリセットを編集できる
- [ ] ユーザーが既存プリセットを削除できる
- [ ] ユーザーがブラインドレベルを追加・削除・編集できる
- [ ] ユーザーが休憩設定を変更できる
- [ ] ユーザーがレベル時間を変更できる
- [ ] ユーザーが音声設定を変更できる（1クリックでアクセス）
- [ ] ユーザーがテーマを切り替えられる（1クリック）
- [ ] ユーザーがプリセットをインポート/エクスポートできる

### 13.2 品質面

- [ ] TypeScript エラー 0件
- [ ] ESLint エラー 0件
- [ ] 全テスト合格（既存299件 + 新規50件以上）
- [ ] テストカバレッジ 80%以上
- [ ] プロダクションビルド成功

### 13.3 UX面

- [ ] デザインシステムに準拠している
- [ ] 直感的に操作できる
- [ ] レスポンシブに動作する（60fps）
- [ ] エラーメッセージが適切に表示される
- [ ] 未保存の変更を失わないように警告が表示される

### 13.4 要求仕様達成

- [ ] UI統合率 95%以上
- [ ] 要求仕様2.1.2（カスタマイズ機能）: 90%以上
- [ ] 要求仕様2.5.2（プリセット管理）: 95%以上
- [ ] 要求仕様2.6（インポート/エクスポート）: 100%

---

## 14. リスクと対策

### リスク 1: 複雑な状態管理
**内容**: プリセット編集時の状態管理が複雑になる可能性
**影響度**: 中
**対策**: useReducer パターンの活用、状態を明確に分離、isDirtyフラグで未保存を追跡

### リスク 2: 未保存警告の実装漏れ
**内容**: 未保存の変更を失うケースがあるかもしれない
**影響度**: 中
**対策**: 全ての離脱ポイントで警告を実装（プリセット切り替え、モーダルを閉じる）

### リスク 3: ブラウザ互換性問題
**内容**: 特定のブラウザで動作しない可能性
**影響度**: 中
**対策**: 早期にブラウザテストを実施、ポリフィルの追加

### リスク 4: パフォーマンス劣化
**内容**: 大量のブラインドレベルでパフォーマンス低下
**影響度**: 低
**対策**: React.memo、useMemo の活用、仮想スクロール（必要に応じて）

### リスク 5: デザインシステムからの逸脱
**内容**: 実装時にデザインシステムから逸脱する可能性
**影響度**: 低
**対策**: 実装前にデザインレビュー、CSS変数の徹底使用

---

## 15. UI設計の重要な決定事項（まとめ）

### ✅ 採用した設計

1. **プリセット選択 = ドロップダウン方式**
   - 理由: 最速（2クリック）、常に現在のプリセット名が見える

2. **プリセット管理 = 全画面モーダル方式**
   - 理由: 広々とした編集スペース、タイマー画面を維持

3. **音量・テーマ = ヘッダーのクイックアクセス**
   - 理由: トーナメント中に頻繁に使う、1クリックでアクセス

4. **プリセット選択時は常に編集可能**
   - 理由: 参照モード/編集モードの区別が不要、UIがシンプル

5. **保存と使うボタンを常に表示**
   - 理由: プレビュー→使う、編集→保存→使う のフローがスムーズ

### ❌ 却下した設計

1. ~~統合SettingsPanel（タブ/アコーディオン）~~
   - 問題: ブラインド編集が窮屈、トーナメント中の操作が煩雑

2. ~~参照モードと編集モードの分離~~
   - 問題: モード切り替えの複雑さ、UI要素の増加

3. ~~設定画面でプリセット選択（リストクリック）~~
   - 問題: プリセット変更が遅い（設定画面を開く必要がある）

---

## 16. 添付資料

### 16.1 参照ドキュメント

- [要求仕様書](../urs/requirements.md)
- [デザインシステム仕様](../specs/03-design-system.md)
- [実装状況レビュー報告書（修正版）](../reviews/2026-01-29-implementation-spec-review-CORRECTED.md)
- [UI統合ギャップ分析報告書](../reviews/2026-01-29-ui-integration-gap-analysis.md)

### 16.2 新規作成コンポーネント一覧

**汎用コンポーネント**:
- Dropdown
- Toggle
- Slider
- NumberInput
- Modal
- ConfirmDialog

**機能コンポーネント**:
- VolumeControl
- PresetSelector
- ImportExport
- PresetList
- PresetEditor
- PresetManagementModal
- AppHeader

**既存コンポーネント**（再利用）:
- BlindEditor
- ThemeToggle

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-29 | 初版作成 | リードエンジニア |
| 2.0 | 2026-01-29 | UI設計改善（プリセット選択ドロップダウン、常時編集可能、クイックアクセス） | リードエンジニア |

---

**計画承認**: □ 承認待ち
**実装開始予定日**: （承認後に決定）
**実装完了予定日**: （開始日 + 5営業日）
