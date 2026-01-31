# 用語リファクタリング実施報告書

## 概要

| 項目       | 内容                                              |
| ---------- | ------------------------------------------------- |
| 実施日     | 2026-01-31                                        |
| 対象       | ポーカー用語の修正（プリセット → ストラクチャー） |
| ステータス | 完了                                              |
| ブランチ   | `claude/review-poker-terminology-jccy5`           |

## 背景

ポーカー業界では、ブラインドレベル・レベル時間・休憩設定などの組み合わせを「**ストラクチャー（Structure）**」または「**ブラインドストラクチャー（Blind Structure）**」と呼ぶのが標準的な用語です。

本アプリでは当初「プリセット（Preset）」という用語を使用していましたが、ポーカープレイヤーにとってより自然な用語に変更しました。

## 変更内容

### 変更統計

| 項目           | 数値  |
| -------------- | ----- |
| 変更ファイル数 | 57    |
| 追加行数       | 1,645 |
| 削除行数       | 2,643 |

### 用語マッピング

| Before            | After                |
| ----------------- | -------------------- |
| `Preset`          | `Structure`          |
| `PresetId`        | `StructureId`        |
| `PresetType`      | `StructureType`      |
| `presets`         | `structures`         |
| `currentPresetId` | `currentStructureId` |
| `usePresets`      | `useStructures`      |
| `loadPreset`      | `loadStructure`      |
| `addPreset`       | `addStructure`       |
| `updatePreset`    | `updateStructure`    |
| `deletePreset`    | `deleteStructure`    |
| プリセット管理    | ストラクチャー管理   |
| プリセット選択    | ストラクチャー選択   |

### 変更ファイル一覧

#### 型定義

- `src/types/domain.ts` - 型名変更
- `src/types/context.ts` - アクション型変更
- `src/types/storage.ts` - ストレージキー変更
- `src/types/index.ts` - エクスポート更新

#### ドメインモデル

- `src/domain/models/Preset.ts` → `src/domain/models/Structure.ts`
- `src/domain/models/Preset.test.ts` → `src/domain/models/Structure.test.ts`

#### サービス層

- `src/services/StorageService.ts` - メソッド名変更
- `src/services/StorageService.test.ts` - テスト更新

#### カスタムフック

- `src/hooks/usePresets.ts` → `src/hooks/useStructures.ts`
- `src/hooks/usePresets.test.ts` → `src/hooks/useStructures.test.ts`
- `src/hooks/index.ts` - エクスポート更新

#### コンテキスト

- `src/contexts/SettingsContext.tsx` - アクション・状態変更
- `src/contexts/SettingsContext.test.tsx` - テスト更新
- `src/contexts/TournamentContext.tsx` - アクション変更
- `src/contexts/TournamentContext.test.tsx` - テスト更新

#### コンポーネント（新規作成）

- `src/components/StructureSelector/` - 全ファイル新規
- `src/components/StructureManagement/` - 全ファイル新規
- `src/components/StructureManager/` - 全ファイル新規

#### コンポーネント（削除）

- `src/components/PresetSelector/` - 全ファイル削除
- `src/components/PresetManagement/` - 全ファイル削除
- `src/components/PresetManager/` - 全ファイル削除

#### コンポーネント（更新）

- `src/components/AppHeader/AppHeader.tsx` - props・UI変更
- `src/components/AppHeader/AppHeader.test.tsx` - テスト更新
- `src/components/MainLayout.tsx` - フック・コンポーネント使用変更
- `src/components/MainLayout.test.tsx` - テスト更新
- `src/components/ImportExport/ImportExport.tsx` - props・メッセージ変更
- `src/components/ImportExport/ImportExport.test.tsx` - テスト更新
- `src/components/index.ts` - エクスポート更新

#### ユーティリティ

- `src/utils/constants.ts` - 定数名変更
- `src/utils/constants.test.ts` - テスト更新
- `src/utils/validation.ts` - 関数名・バリデーション更新
- `src/utils/validation.test.ts` - テスト更新
- `src/utils/index.ts` - エクスポート更新

#### その他

- `src/App.test.tsx` - モック更新
- `src/components/VolumeControl/VolumeControl.tsx` - 既存バグ修正（id prop削除）

### ストレージ変更

| 項目 | Before                | After                    |
| ---- | --------------------- | ------------------------ |
| キー | `poker-timer-presets` | `poker-timer-structures` |

**注意**: リリース前のため、マイグレーション処理は不要と判断し実装していません。

## テスト結果

### ビルド

```
✓ tsc && vite build - 成功
```

### 用語変更関連テスト（64件）

```
✓ src/utils/constants.test.ts (8 tests)
✓ src/utils/validation.test.ts (17 tests)
✓ src/contexts/SettingsContext.test.tsx (17 tests)
✓ src/components/AppHeader/AppHeader.test.tsx (13 tests)
✓ src/components/MainLayout.test.tsx (9 tests)
```

### 既存の問題（今回の変更とは無関係）

以下のテストは今回の変更前から失敗していた既存の問題です：

| ファイル                   | 失敗数 | 内容                       |
| -------------------------- | ------ | -------------------------- |
| TournamentContext.test.tsx | 2      | ブレイク時の動作テスト     |
| AudioService.test.ts       | 4      | オーディオ読み込みテスト   |
| ImportExport.test.tsx      | 4      | ファイルアップロードテスト |

## UIテキスト変更

### ボタン・ラベル

- 「プリセット管理」→「ストラクチャー管理」
- 「プリセット選択」→「ストラクチャー選択」
- 「プリセットをエクスポート」→「ストラクチャーをエクスポート」
- 「プリセットをインポート」→「ストラクチャーをインポート」

### メッセージ

- 「プリセットをエクスポートしました」→「ストラクチャーをエクスポートしました」
- 「プリセットをインポートしました」→「ストラクチャーをインポートしました」
- 「無効なファイル形式です。プリセット配列が必要です。」→「無効なファイル形式です。ストラクチャー配列が必要です。」
- 「有効なプリセットが見つかりませんでした」→「有効なストラクチャーが見つかりませんでした」
- 「プリセット名を入力してください」→「ストラクチャー名を入力してください」
- 「プリセット名は50文字以内で入力してください」→「ストラクチャー名は50文字以内で入力してください」

## 関連ドキュメント

- 計画書: `docs/plans/terminology-refactoring-preset-to-structure.md`

## 今後の課題

1. **既存テストの修正**: TournamentContext, AudioService, ImportExportのテスト失敗を別途修正
2. **ドキュメント更新**: `docs/specs/features/presets.md` を `structures.md` にリネーム・更新（必要に応じて）
