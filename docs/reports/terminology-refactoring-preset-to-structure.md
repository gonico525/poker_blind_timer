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
| 変更ファイル数 | 62    |
| 追加行数       | 2,821 |
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

#### コンポーネント（リネーム）

- `src/components/PresetSelector/` → `src/components/StructureSelector/`
- `src/components/PresetManagement/` → `src/components/StructureManagement/`
- `src/components/PresetManager/` → `src/components/StructureManager/`

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

### 全テスト結果

| 項目         | 数値 |
| ------------ | ---- |
| パス         | 481  |
| 失敗（既存） | 11   |
| 合計         | 492  |

### Structure系コンポーネントテスト（復元・リネーム）

元のPreset系テストファイルを復元し、用語を置換して再利用しました。

| ファイル                          | テスト数 | 方法                      |
| --------------------------------- | -------- | ------------------------- |
| StructureEditor.test.tsx          | 19       | 復元 + sed置換            |
| StructureList.test.tsx            | 15       | 復元 + sed置換            |
| StructureManagementModal.test.tsx | 14       | 復元 + sed置換            |
| StructureManager.test.tsx         | 7        | 復元 + sed置換            |
| StructureSelector.test.tsx        | 13       | 復元 + sed置換 + 手動修正 |
| **合計**                          | **68**   |                           |

### 既存の問題（今回の変更とは無関係）

以下のテストは今回の変更前から失敗していた既存の問題です：

| ファイル                   | 失敗数 | 内容                       |
| -------------------------- | ------ | -------------------------- |
| TournamentContext.test.tsx | 2      | ブレイク時の動作テスト     |
| AudioService.test.ts       | 4      | オーディオ読み込みテスト   |
| ImportExport.test.tsx      | 5      | ファイルアップロードテスト |

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

## 実施手順

### テストファイルの復元方法

```bash
# 1. 元のテストファイルを復元
git checkout 570c92b -- src/components/PresetManagement/*.test.tsx
git checkout 570c92b -- src/components/PresetManager/*.test.tsx
git checkout 570c92b -- src/components/PresetSelector/*.test.tsx

# 2. ファイルをリネーム
mv src/components/PresetManagement/PresetEditor.test.tsx \
   src/components/StructureManagement/StructureEditor.test.tsx
# ... 他のファイルも同様

# 3. 用語を一括置換
sed -i 's/Preset/Structure/g' src/components/Structure*/*.test.tsx
sed -i 's/preset/structure/g' src/components/Structure*/*.test.tsx
sed -i 's/プリセット/ストラクチャー/g' src/components/Structure*/*.test.tsx
# ... 他の置換も同様
```

## 関連ドキュメント

- 計画書: `docs/plans/terminology-refactoring-preset-to-structure.md`

## 今後の課題

1. **既存テストの修正**: TournamentContext, AudioService, ImportExportのテスト失敗を別途修正
2. **ドキュメント更新**: `docs/specs/features/presets.md` を `structures.md` にリネーム・更新（必要に応じて）
