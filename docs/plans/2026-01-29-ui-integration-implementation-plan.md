# UI統合実装計画書

**作成日**: 2026-01-29
**作成者**: リードエンジニア
**目的**: バックエンド実装済みだがUI未統合の機能を完全に統合する
**対象**: ポーカーブラインドタイマー UI統合（設定画面の完全実装）

---

## エグゼクティブサマリー

### 現状の問題

レビュー報告書（docs/reviews/2026-01-29-implementation-spec-review-CORRECTED.md、docs/reviews/2026-01-29-ui-integration-gap-analysis.md）により、以下の重大な問題が判明しました:

- **バックエンド実装**: 98% 完成
- **UI統合**: 61% のみ
- **ギャップ**: 19機能がUIから全くアクセス不可能

### 実装目標

UI統合率を **61% → 95%** に引き上げ、ユーザーが以下の機能にアクセスできるようにする:

1. ブラインド構造のカスタマイズ
2. カスタムプリセットの作成・編集・削除
3. 音声設定（ON/OFF、音量調整）
4. 休憩設定のカスタマイズ
5. レベル時間設定
6. キーボードショートカット設定
7. データのインポート/エクスポート

---

## 1. 事前準備フェーズ

### 1.1 関連仕様・実装の確認

#### タスク 1.1.1: 仕様確認
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

**成果物**: 仕様理解チェックリスト（口頭確認可）

---

#### タスク 1.1.2: 既存コンポーネントの確認
**目的**: 再利用可能なコンポーネントを把握し、重複実装を避ける

**確認対象**:
- [ ] src/components/BlindEditor/BlindEditor.tsx
  - 実装済み機能の確認
  - Props インターフェースの確認
  - テストケースの確認
- [ ] src/components/PresetManager/PresetManager.tsx
  - 現在の実装範囲
  - 未接続のコールバック（onEdit, onDelete）
- [ ] src/hooks/usePresets.ts
  - addPreset()
  - updatePreset()
  - deletePreset()
- [ ] src/contexts/SettingsContext.tsx
  - 実装済みアクション（SET_SOUND_ENABLED, SET_VOLUME, etc.）
- [ ] src/contexts/TournamentContext.tsx
  - UPDATE_BREAK_CONFIG
  - UPDATE_LEVEL_DURATION
  - UPDATE_BLIND_LEVELS

**成果物**: 既存コンポーネント機能リスト

---

#### タスク 1.1.3: デザインシステムの理解
**目的**: 一貫したUIを実装するため、デザインシステムを理解する

**確認対象**:
- [ ] CSS変数の定義（カラー、スペーシング、フォント）
- [ ] ボタンスタイル（primary, secondary, accent）
- [ ] 入力フィールドスタイル
- [ ] カードスタイル
- [ ] モーダルスタイル

**成果物**: デザインシステム適用チェックリスト

---

## 2. 基礎コンポーネント実装フェーズ

### 2.1 汎用UIコンポーネントの作成

#### タスク 2.1.1: Toggle コンポーネント
**目的**: ON/OFF切り替えUIを提供

**実装内容**:
- ファイル: `src/components/common/Toggle/Toggle.tsx`
- Props:
  - `label: string` - ラベルテキスト
  - `value: boolean` - 現在の状態
  - `onChange: (value: boolean) => void` - 変更ハンドラ
  - `disabled?: boolean` - 無効化フラグ
- スタイル: docs/specs/03-design-system.md に準拠
- テスト: `Toggle.test.tsx` を作成

**デザイン仕様**:
- アクティブ時: `--color-accent` 背景
- 非アクティブ時: `--color-border` 背景
- トランジション: `var(--transition-base)`

**成果物**:
- [ ] Toggle.tsx
- [ ] Toggle.module.css
- [ ] Toggle.test.tsx（カバレッジ80%以上）

---

#### タスク 2.1.2: Slider コンポーネント
**目的**: 音量調整などの数値スライダーUIを提供

**実装内容**:
- ファイル: `src/components/common/Slider/Slider.tsx`
- Props:
  - `label: string` - ラベルテキスト
  - `min: number` - 最小値
  - `max: number` - 最大値
  - `step: number` - ステップ
  - `value: number` - 現在値
  - `onChange: (value: number) => void` - 変更ハンドラ
  - `disabled?: boolean` - 無効化フラグ
- スタイル: docs/specs/03-design-system.md に準拠
- テスト: `Slider.test.tsx` を作成

**デザイン仕様**:
- トラック色: `--color-border`
- アクティブトラック色: `--color-accent`
- つまみ色: `--color-accent`

**成果物**:
- [ ] Slider.tsx
- [ ] Slider.module.css
- [ ] Slider.test.tsx（カバレッジ80%以上）

---

#### タスク 2.1.3: NumberInput コンポーネント
**目的**: 数値入力UIを提供

**実装内容**:
- ファイル: `src/components/common/NumberInput/NumberInput.tsx`
- Props:
  - `label: string` - ラベルテキスト
  - `value: number` - 現在値
  - `min?: number` - 最小値
  - `max?: number` - 最大値
  - `step?: number` - ステップ（デフォルト: 1）
  - `onChange: (value: number) => void` - 変更ハンドラ
  - `unit?: string` - 単位（例: "分", "秒"）
  - `disabled?: boolean` - 無効化フラグ
- スタイル: docs/specs/03-design-system.md の入力フィールドスタイルに準拠
- テスト: `NumberInput.test.tsx` を作成

**デザイン仕様**:
- 入力フィールド: `.input` スタイル
- インクリメント/デクリメントボタン（オプション）

**成果物**:
- [ ] NumberInput.tsx
- [ ] NumberInput.module.css
- [ ] NumberInput.test.tsx（カバレッジ80%以上）

---

#### タスク 2.1.4: Modal コンポーネント
**目的**: プリセット作成・編集ダイアログのベースとなるモーダルUIを提供

**実装内容**:
- ファイル: `src/components/common/Modal/Modal.tsx`
- Props:
  - `isOpen: boolean` - 表示状態
  - `onClose: () => void` - 閉じるハンドラ
  - `title: string` - タイトル
  - `children: ReactNode` - コンテンツ
  - `footer?: ReactNode` - フッター（ボタンエリア）
- スタイル: docs/specs/03-design-system.md のモーダルスタイルに準拠
- 機能:
  - オーバーレイクリックで閉じる
  - Escキーで閉じる
  - フォーカストラップ
- テスト: `Modal.test.tsx` を作成

**デザイン仕様**:
- オーバーレイ: `rgba(0, 0, 0, 0.6)`
- モーダル: `.modal` スタイル
- z-index: `var(--z-index-modal)`

**成果物**:
- [ ] Modal.tsx
- [ ] Modal.module.css
- [ ] Modal.test.tsx（カバレッジ80%以上）

---

### 2.2 機能固有コンポーネントの作成

#### タスク 2.2.1: PresetFormDialog コンポーネント
**目的**: プリセット作成・編集ダイアログを提供

**実装内容**:
- ファイル: `src/components/PresetFormDialog/PresetFormDialog.tsx`
- Props:
  - `isOpen: boolean`
  - `mode: 'create' | 'edit'`
  - `preset?: Preset` - 編集時の既存プリセット
  - `onSave: (preset: Preset) => void`
  - `onCancel: () => void`
- 機能:
  - プリセット名入力
  - BlindEditor 統合（ブラインドレベル編集）
  - レベル時間設定（NumberInput）
  - 休憩設定（NumberInput + Toggle）
  - バリデーション
    - プリセット名必須（1文字以上）
    - 最低1つのブラインドレベル必須
    - レベル時間 1-60分の範囲チェック
- テスト: `PresetFormDialog.test.tsx` を作成

**デザイン仕様**:
- Modal コンポーネントを使用
- フォームレイアウト: セクションごとに分割

**成果物**:
- [ ] PresetFormDialog.tsx
- [ ] PresetFormDialog.module.css
- [ ] PresetFormDialog.test.tsx（カバレッジ80%以上）

---

#### タスク 2.2.2: ConfirmDialog コンポーネント
**目的**: プリセット削除などの確認ダイアログを提供

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
- テスト: `ConfirmDialog.test.tsx` を作成

**デザイン仕様**:
- Modal コンポーネントを使用
- variant に応じたスタイリング

**成果物**:
- [ ] ConfirmDialog.tsx
- [ ] ConfirmDialog.module.css
- [ ] ConfirmDialog.test.tsx（カバレッジ80%以上）

---

#### タスク 2.2.3: ImportExport コンポーネント
**目的**: データのインポート/エクスポート機能を提供

**実装内容**:
- ファイル: `src/components/ImportExport/ImportExport.tsx`
- 機能:
  - **エクスポート**:
    - 現在のプリセット全てをJSON形式でダウンロード
    - ファイル名: `poker-presets-{YYYY-MM-DD}.json`
  - **インポート**:
    - ファイルアップロード（JSON）
    - バリデーション（src/utils/validation.ts を使用）
    - エラーメッセージ表示
    - 成功時のフィードバック
- Props:
  - `presets: Preset[]`
  - `onImport: (presets: Preset[]) => void`
- テスト: `ImportExport.test.tsx` を作成

**デザイン仕様**:
- エクスポートボタン: `.button-primary`
- インポートボタン: `.button-secondary`

**成果物**:
- [ ] ImportExport.tsx
- [ ] ImportExport.module.css
- [ ] ImportExport.test.tsx（カバレッジ80%以上）

---

## 3. 設定パネル実装フェーズ

### 3.1 SettingsPanel の完全実装

#### タスク 3.1.1: SettingsPanel の構造設計

**目的**: 全ての設定項目を含む統合設定パネルを実装

**実装方針確認**:

[Question 1] SettingsPanel のレイアウト方式
設定パネルのレイアウトをどの方式にしますか？

A) タブ方式 - 各設定カテゴリをタブで切り替え
   - メリット: 情報の整理がしやすい、視覚的に分かりやすい
   - デメリット: タブ切り替えの手間

B) アコーディオン方式 - セクションを折りたたみ可能にする
   - メリット: 全体を俯瞰しやすい、スクロールで全設定にアクセス可能
   - デメリット: 画面が縦に長くなる可能性

C) シンプルなセクション分割 - 全てを一画面に配置
   - メリット: 実装がシンプル、全設定が一目で見える
   - デメリット: 設定項目が多いと見づらい

推奨: **B) アコーディオン方式** - 段階的な情報開示で使いやすい

[Answer 1]


---

[Question 2] プリセット作成・編集フロー
プリセット作成・編集時のフローをどうしますか？

A) モーダルダイアログ方式
   - 「新規作成」ボタン → モーダル表示 → 入力 → 保存
   - メリット: 集中して編集できる、現在の画面を維持
   - デメリット: 画面が小さいとモーダルが窮屈

B) インライン編集方式
   - 設定パネル内で直接編集
   - メリット: 画面遷移なし、直感的
   - デメリット: UIが複雑になる

推奨: **A) モーダルダイアログ方式** - 編集中の明確な区別ができる

[Answer 2]


---

[Question 3] 設定の保存タイミング
設定変更の保存タイミングをどうしますか？

A) 即座に保存（オートセーブ）
   - 変更と同時に localStorage に保存
   - メリット: 保存忘れがない、シンプル
   - デメリット: 意図しない変更の取り消しが困難

B) 明示的な保存ボタン
   - 「保存」ボタンクリックで保存
   - メリット: 変更のレビューが可能、キャンセル可能
   - デメリット: 保存忘れのリスク

推奨: **A) 即座に保存（設定項目）+ B) 明示的保存（プリセット編集）**
- 音声設定、テーマ等: 即座に保存
- プリセット作成・編集: 明示的な保存ボタン

[Answer 3]


---

#### タスク 3.1.2: SettingsPanel の実装

**実装内容**:
- ファイル: `src/components/SettingsPanel/SettingsPanel.tsx` を更新
- セクション構成:
  1. **プリセット管理セクション**
     - PresetManager コンポーネント統合
     - 「新規プリセット作成」ボタン
     - 編集・削除機能の接続
  2. **ブラインド構造編集セクション**（現在のプリセット用）
     - BlindEditor コンポーネント統合
     - 変更の即座反映
  3. **タイマー設定セクション**
     - レベル時間設定（NumberInput）
     - 単位: 分
     - 範囲: 1-60分
  4. **休憩設定セクション**
     - 休憩有効/無効（Toggle）
     - 休憩頻度（NumberInput、単位: レベル）
     - 休憩時間（NumberInput、単位: 分）
  5. **音声設定セクション**
     - 音声通知 ON/OFF（Toggle）
     - 音量調整（Slider、0-100%）
  6. **その他設定セクション**
     - キーボードショートカット ON/OFF（Toggle）
     - テーマ切り替え（ThemeToggle 統合）
  7. **インポート/エクスポートセクション**
     - ImportExport コンポーネント統合

**Context/Hook 統合**:
- useSettings() - 音声設定、キーボードショートカット設定
- useTournament() - ブラインド構造、休憩設定、レベル時間
- usePresets() - プリセット管理

**成果物**:
- [ ] SettingsPanel.tsx（更新）
- [ ] SettingsPanel.module.css（更新）
- [ ] SettingsPanel.test.tsx（更新、カバレッジ80%以上）

---

## 4. メインレイアウト統合フェーズ

### 4.1 MainLayout の更新

#### タスク 4.1.1: SettingsPanel の統合

**実装内容**:
- ファイル: `src/components/MainLayout.tsx` を更新
- 変更点:
  - 設定表示時に SettingsPanel を使用（現在の PresetManager 単体表示を置き換え）
  - PresetFormDialog の状態管理追加
  - ConfirmDialog の状態管理追加

**実装詳細**:
```typescript
// 状態管理
const [showSettings, setShowSettings] = useState(false);
const [showPresetDialog, setShowPresetDialog] = useState(false);
const [presetDialogMode, setPresetDialogMode] = useState<'create' | 'edit'>('create');
const [editingPreset, setEditingPreset] = useState<Preset | undefined>();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deletingPresetId, setDeletingPresetId] = useState<string | undefined>();

// ハンドラ
const handleCreatePreset = () => { ... };
const handleEditPreset = (presetId: string) => { ... };
const handleDeletePreset = (presetId: string) => { ... };
const handleSavePreset = (preset: Preset) => { ... };
const handleConfirmDelete = () => { ... };
```

**成果物**:
- [ ] MainLayout.tsx（更新）
- [ ] MainLayout.test.tsx（更新、カバレッジ80%以上）

---

#### タスク 4.1.2: PresetManager の更新

**実装内容**:
- ファイル: `src/components/PresetManager/PresetManager.tsx` を更新
- Props に追加:
  - `onEdit?: (presetId: string) => void`
  - `onDelete?: (presetId: string) => void`
  - `onAdd?: () => void`
- 変更点:
  - 編集ボタン、削除ボタンに onEdit, onDelete を接続
  - 「新規作成」ボタンの追加（onAdd）

**成果物**:
- [ ] PresetManager.tsx（更新）
- [ ] PresetManager.test.tsx（更新、カバレッジ80%以上）

---

## 5. テストフェーズ

### 5.1 ユニットテスト

#### タスク 5.1.1: 新規コンポーネントのテスト
**対象**:
- [ ] Toggle コンポーネント
- [ ] Slider コンポーネント
- [ ] NumberInput コンポーネント
- [ ] Modal コンポーネント
- [ ] ConfirmDialog コンポーネント
- [ ] PresetFormDialog コンポーネント
- [ ] ImportExport コンポーネント

**テスト項目**:
- 正常系: 基本動作、Props の反映
- 異常系: バリデーション、エラーハンドリング
- ユーザー操作: クリック、入力、キーボード操作
- アクセシビリティ: ARIA属性、キーボードナビゲーション

**成功基準**:
- [ ] 全テスト合格
- [ ] カバレッジ 80%以上

---

#### タスク 5.1.2: 更新コンポーネントのテスト
**対象**:
- [ ] SettingsPanel
- [ ] MainLayout
- [ ] PresetManager

**テスト項目**:
- 新機能の動作確認
- 既存機能の回帰テスト
- Context 統合のテスト

**成功基準**:
- [ ] 全テスト合格
- [ ] カバレッジ 80%以上
- [ ] 既存テスト全て維持

---

### 5.2 統合テスト

#### タスク 5.2.1: E2Eシナリオテスト

**テストシナリオ**:

1. **プリセット作成フロー**
   - [ ] 「新規プリセット作成」ボタンをクリック
   - [ ] プリセット名を入力
   - [ ] ブラインドレベルを編集
   - [ ] 休憩設定を変更
   - [ ] 保存
   - [ ] プリセット一覧に表示されることを確認

2. **プリセット編集フロー**
   - [ ] プリセットの「編集」ボタンをクリック
   - [ ] ブラインドレベルを変更
   - [ ] 保存
   - [ ] 変更が反映されることを確認

3. **プリセット削除フロー**
   - [ ] プリセットの「削除」ボタンをクリック
   - [ ] 確認ダイアログが表示される
   - [ ] 「確認」をクリック
   - [ ] プリセットが削除されることを確認

4. **音声設定フロー**
   - [ ] 設定パネルを開く
   - [ ] 音声通知をOFFにする
   - [ ] タイマーを開始し、レベル変更時に音が鳴らないことを確認
   - [ ] 音声通知をONにする
   - [ ] 音量を調整する
   - [ ] レベル変更時に適切な音量で音が鳴ることを確認

5. **休憩設定フロー**
   - [ ] 設定パネルで休憩頻度を4レベルに設定
   - [ ] 休憩時間を10分に設定
   - [ ] タイマーを開始し、4レベル後に休憩が入ることを確認

6. **インポート/エクスポートフロー**
   - [ ] プリセットをエクスポート
   - [ ] JSONファイルがダウンロードされることを確認
   - [ ] 別のプリセットに切り替え
   - [ ] エクスポートしたファイルをインポート
   - [ ] プリセットが復元されることを確認

**成功基準**:
- [ ] 全シナリオが正常に完了
- [ ] ユーザー体験がスムーズ
- [ ] エラーが発生しない

---

### 5.3 ブラウザ互換性テスト

#### タスク 5.3.1: 対象ブラウザでのテスト

**対象ブラウザ**:
- [ ] Chrome（最新版）
- [ ] Firefox（最新版）
- [ ] Safari（最新版）
- [ ] Edge（最新版）

**テスト項目**:
- [ ] 全機能が正常に動作する
- [ ] レイアウトが崩れない
- [ ] アニメーションがスムーズ
- [ ] localStorage が正常に動作する

---

## 6. ドキュメント更新フェーズ

### 6.1 ユーザー向けドキュメント

#### タスク 6.1.1: README 更新（必要に応じて）

**更新内容**:
- 新機能の説明
  - プリセット作成・編集・削除
  - 音声設定
  - 休憩設定
  - インポート/エクスポート

---

### 6.2 開発者向けドキュメント

#### タスク 6.2.1: コンポーネントドキュメント

**作成対象**:
- 新規作成した汎用コンポーネントの使用方法
- SettingsPanel の構造説明

**成果物**:
- [ ] docs/specs/components.md（新規作成または更新）

---

## 7. 最終確認フェーズ

### 7.1 要求仕様達成確認

#### タスク 7.1.1: 要求仕様チェックリスト

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

### 7.2 デザインシステム準拠確認

#### タスク 7.2.1: デザインレビュー

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

### 7.3 パフォーマンス確認

#### タスク 7.3.1: パフォーマンステスト

**確認項目**:
- [ ] 設定パネルの開閉がスムーズ（60fps）
- [ ] モーダルの表示/非表示がスムーズ
- [ ] 大量のブラインドレベル（50+）でも動作が重くならない
- [ ] localStorage への保存が1秒以内に完了

**成功基準**:
- [ ] 全操作がスムーズに動作する
- [ ] ユーザー体験が損なわれない

---

## 8. リリース準備フェーズ

### 8.1 コードレビュー

#### タスク 8.1.1: セルフレビュー

**確認項目**:
- [ ] TypeScript エラー 0件
- [ ] ESLint エラー 0件
- [ ] ESLint 警告 0件（可能な限り）
- [ ] コードの可読性
- [ ] コメントの適切性
- [ ] ハードコードの排除

---

### 8.2 ビルド確認

#### タスク 8.2.1: プロダクションビルド

**確認項目**:
- [ ] `npm run build` が成功する
- [ ] バンドルサイズが許容範囲（100kB以下、Gzip圧縮後）
- [ ] ビルド成果物が正常に動作する

---

### 8.3 最終テスト

#### タスク 8.3.1: 全テストの実行

**確認項目**:
- [ ] `npm test` が全て合格
- [ ] テストカバレッジ 80%以上
- [ ] 新規追加テストケース 50件以上

---

## 9. 工数見積もり

### 9.1 フェーズ別工数

| フェーズ | タスク数 | 見積もり工数 |
|---------|---------|-------------|
| 1. 事前準備 | 3 | 2時間 |
| 2. 基礎コンポーネント実装 | 7 | 8時間 |
| 3. 設定パネル実装 | 2 | 4時間 |
| 4. メインレイアウト統合 | 2 | 2時間 |
| 5. テスト | 3 | 4時間 |
| 6. ドキュメント更新 | 2 | 1時間 |
| 7. 最終確認 | 3 | 2時間 |
| 8. リリース準備 | 3 | 1時間 |
| **合計** | **25** | **24時間** |

### 9.2 リスクバッファ

- 予期しない問題対応: +4時間
- レビュー修正: +2時間

**総工数**: 30時間（約4営業日）

---

## 10. マイルストーン

### マイルストーン 1: 基礎コンポーネント完成
**期限**: 実装開始から1日目
**完了条件**:
- [ ] Toggle, Slider, NumberInput, Modal, ConfirmDialog 実装完了
- [ ] ユニットテスト合格

### マイルストーン 2: 機能コンポーネント完成
**期限**: 実装開始から2日目
**完了条件**:
- [ ] PresetFormDialog, ImportExport 実装完了
- [ ] SettingsPanel 実装完了
- [ ] ユニットテスト合格

### マイルストーン 3: 統合完了
**期限**: 実装開始から3日目
**完了条件**:
- [ ] MainLayout 更新完了
- [ ] PresetManager 更新完了
- [ ] 統合テスト合格

### マイルストーン 4: リリース準備完了
**期限**: 実装開始から4日目
**完了条件**:
- [ ] 全テスト合格
- [ ] ドキュメント更新完了
- [ ] 要求仕様達成確認完了
- [ ] プロダクションビルド成功

---

## 11. 成功基準

### 11.1 機能面

- [ ] ユーザーがカスタムプリセットを作成できる
- [ ] ユーザーが既存プリセットを編集できる
- [ ] ユーザーが既存プリセットを削除できる
- [ ] ユーザーがブラインドレベルを追加・削除・編集できる
- [ ] ユーザーが休憩設定を変更できる
- [ ] ユーザーがレベル時間を変更できる
- [ ] ユーザーが音声設定を変更できる
- [ ] ユーザーがキーボードショートカット設定を変更できる
- [ ] ユーザーがプリセットをインポート/エクスポートできる

### 11.2 品質面

- [ ] TypeScript エラー 0件
- [ ] ESLint エラー 0件
- [ ] 全テスト合格（299件 + 新規50件以上）
- [ ] テストカバレッジ 80%以上
- [ ] プロダクションビルド成功

### 11.3 UX面

- [ ] デザインシステムに準拠している
- [ ] 直感的に操作できる
- [ ] レスポンシブに動作する（60fps）
- [ ] エラーメッセージが適切に表示される

### 11.4 要求仕様達成

- [ ] UI統合率 95%以上
- [ ] 要求仕様2.1.2（カスタマイズ機能）: 90%以上
- [ ] 要求仕様2.5.2（プリセット管理）: 95%以上
- [ ] 要求仕様2.6（インポート/エクスポート）: 100%

---

## 12. リスクと対策

### リスク 1: 複雑な状態管理
**内容**: プリセット編集時の状態管理が複雑になる可能性
**影響度**: 中
**対策**: useReducer パターンの活用、状態を明確に分離

### リスク 2: ブラウザ互換性問題
**内容**: 特定のブラウザで動作しない可能性
**影響度**: 中
**対策**: 早期にブラウザテストを実施、ポリフィルの追加

### リスク 3: パフォーマンス劣化
**内容**: 大量のブラインドレベルでパフォーマンス低下
**影響度**: 低
**対策**: React.memo、useMemo の活用

### リスク 4: デザインシステムからの逸脱
**内容**: 実装時にデザインシステムから逸脱する可能性
**影響度**: 低
**対策**: 実装前にデザインレビュー、CSS変数の徹底使用

---

## 13. 添付資料

### 13.1 参照ドキュメント

- [要求仕様書](../urs/requirements.md)
- [デザインシステム仕様](../specs/03-design-system.md)
- [実装状況レビュー報告書（修正版）](../reviews/2026-01-29-implementation-spec-review-CORRECTED.md)
- [UI統合ギャップ分析報告書](../reviews/2026-01-29-ui-integration-gap-analysis.md)

### 13.2 関連コンポーネント

**既存コンポーネント**（再利用）:
- BlindEditor
- PresetManager
- ThemeToggle

**新規コンポーネント**（作成予定）:
- Toggle
- Slider
- NumberInput
- Modal
- ConfirmDialog
- PresetFormDialog
- ImportExport

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-29 | 初版作成 | リードエンジニア |

---

**計画承認**: □ 承認待ち
**実装開始予定日**: （承認後に決定）
**実装完了予定日**: （開始日 + 4営業日）
