# 用語リファクタリング計画書：「プリセット」→「ストラクチャー」

## 概要

本ドキュメントは、アプリケーション内の「プリセット（Preset）」という用語を、ポーカー業界標準の「ストラクチャー（Structure）」に変更するためのリファクタリング計画を定義します。

---

## 目次

1. [背景と目的](#1-背景と目的)
2. [変更範囲](#2-変更範囲)
3. [用語対応表](#3-用語対応表)
4. [フェーズ別実装計画](#4-フェーズ別実装計画)
5. [ファイル別変更一覧](#5-ファイル別変更一覧)
6. [リスクと対策](#6-リスクと対策)
7. [テスト計画](#7-テスト計画)
8. [マイグレーション戦略](#8-マイグレーション戦略)

---

## 1. 背景と目的

### 1.1 背景

現在、アプリケーションでは「プリセット」という用語を使用しているが、これはポーカー業界の標準用語ではない。

**現状の問題:**
- 「プリセット」は汎用的なソフトウェア用語であり、ポーカー固有の概念を表現していない
- ポーカープレイヤーは「ストラクチャー」または「ブラインドストラクチャー」という用語を使用する
- WSOP、PokerStars等の主要トーナメント/プラットフォームでは「Structure」が標準

### 1.2 目的

- ポーカー業界標準の用語に統一し、ユーザー体験を向上させる
- ポーカープレイヤーにとって直感的なUIを提供する
- コードベースの用語一貫性を保つ

### 1.3 対象機能

現在「プリセット」と呼んでいる機能は、以下を管理している：

| 管理項目 | 説明 |
|---------|------|
| blindLevels | 各レベルのSB/BB/Ante |
| levelDuration | 各レベルの時間（秒） |
| breakConfig | 休憩設定（頻度、時間） |

これらはまさに「トーナメントストラクチャー」の定義そのものである。

---

## 2. 変更範囲

### 2.1 変更対象

```
変更範囲マップ
├── 型定義（Types）
├── ドメインモデル（Domain Models）
├── カスタムフック（Hooks）
├── コンテキスト（Contexts）
├── コンポーネント（Components）
├── サービス（Services）
├── テスト（Tests）
└── ドキュメント（Documentation）
```

### 2.2 影響範囲の概要

| カテゴリ | ファイル数 | 変更規模 |
|---------|-----------|---------|
| 型定義 | 3 | 中 |
| ドメインモデル | 1 | 大（ファイル名変更含む） |
| フック | 1 | 大（ファイル名変更含む） |
| コンテキスト | 2 | 中 |
| コンポーネント | 8 | 大（ファイル名・ディレクトリ名変更含む） |
| サービス | 1 | 小 |
| テスト | 複数 | 中 |
| ドキュメント | 2 | 中 |

---

## 3. 用語対応表

### 3.1 日本語UI表示

| 変更前（現在） | 変更後 |
|--------------|--------|
| プリセット管理 | ストラクチャー管理 |
| プリセットを選択 | ストラクチャーを選択 |
| プリセット一覧 | ストラクチャー一覧 |
| プリセット名 | ストラクチャー名 |
| このプリセットを使う | このストラクチャーを使う |
| プリセットを選択するか、新規作成してください | ストラクチャーを選択するか、新規作成してください |
| プリセット名を入力してください | ストラクチャー名を入力してください |
| プリセット名は50文字以内で入力してください | ストラクチャー名は50文字以内で入力してください |
| プリセットを削除 | ストラクチャーを削除 |

### 3.2 型・インターフェース名

| 変更前 | 変更後 |
|-------|--------|
| `Preset` | `Structure` |
| `PresetId` | `StructureId` |
| `PresetType` | `StructureType` |
| `PresetAction` | `StructureAction` |

### 3.3 変数・関数名

| 変更前 | 変更後 |
|-------|--------|
| `preset` | `structure` |
| `presets` | `structures` |
| `currentPresetId` | `currentStructureId` |
| `addPreset` | `addStructure` |
| `updatePreset` | `updateStructure` |
| `deletePreset` | `deleteStructure` |
| `loadPreset` | `loadStructure` |
| `getPresets` | `getStructures` |
| `getPreset` | `getStructure` |
| `savePresets` | `saveStructures` |
| `loadPresets` | `loadStructures` |
| `generatePresetId` | `generateStructureId` |
| `isDefaultPreset` | `isDefaultStructure` |
| `createDefaultPresets` | `createDefaultStructures` |
| `mergeWithDefaultPresets` | `mergeWithDefaultStructures` |

### 3.4 コンポーネント名

| 変更前 | 変更後 |
|-------|--------|
| `PresetSelector` | `StructureSelector` |
| `PresetManager` | `StructureManager` |
| `PresetManagementModal` | `StructureManagementModal` |
| `PresetList` | `StructureList` |
| `PresetEditor` | `StructureEditor` |

### 3.5 ディレクトリ名

| 変更前 | 変更後 |
|-------|--------|
| `src/components/PresetSelector/` | `src/components/StructureSelector/` |
| `src/components/PresetManager/` | `src/components/StructureManager/` |
| `src/components/PresetManagement/` | `src/components/StructureManagement/` |

### 3.6 ファイル名

| 変更前 | 変更後 |
|-------|--------|
| `Preset.ts` | `Structure.ts` |
| `usePresets.ts` | `useStructures.ts` |
| `PresetSelector.tsx` | `StructureSelector.tsx` |
| `PresetManager.tsx` | `StructureManager.tsx` |
| `PresetManagementModal.tsx` | `StructureManagementModal.tsx` |
| `PresetList.tsx` | `StructureList.tsx` |
| `PresetEditor.tsx` | `StructureEditor.tsx` |
| `presets.md` | `structures.md` |

### 3.7 ストレージキー

| 変更前 | 変更後 |
|-------|--------|
| `poker-timer-presets` | `poker-timer-structures` |

### 3.8 Contextアクション名

| 変更前 | 変更後 |
|-------|--------|
| `ADD_PRESET` | `ADD_STRUCTURE` |
| `UPDATE_PRESET` | `UPDATE_STRUCTURE` |
| `DELETE_PRESET` | `DELETE_STRUCTURE` |
| `SET_PRESETS` | `SET_STRUCTURES` |
| `SET_CURRENT_PRESET` | `SET_CURRENT_STRUCTURE` |
| `IMPORT_PRESETS` | `IMPORT_STRUCTURES` |
| `LOAD_PRESET` | `LOAD_STRUCTURE` |

---

## 4. フェーズ別実装計画

### フェーズ1: 型定義の変更（基盤層）

**目的:** 型定義を変更し、TypeScriptコンパイラによるエラー検出を活用

**作業内容:**
1. `src/types/domain.ts` の型名変更
2. `src/types/context.ts` のアクション型変更
3. `src/types/storage.ts` のストレージキー変更
4. `src/types/index.ts` のエクスポート更新

**依存関係:** なし（最初に実施）

**完了条件:** 型定義の変更完了（この時点でコンパイルエラーが発生する）

---

### フェーズ2: ドメインモデルの変更

**目的:** ビジネスロジック層の用語統一

**作業内容:**
1. `src/domain/models/Preset.ts` → `Structure.ts` にリネーム
2. 関数名・変数名の変更
3. デフォルトストラクチャーIDの変更（`default-standard` 等は維持可）
4. `src/domain/models/index.ts` のエクスポート更新

**依存関係:** フェーズ1完了後

**完了条件:** ドメインモデルのコンパイルエラー解消

---

### フェーズ3: サービス層の変更

**目的:** データ永続化層の用語統一

**作業内容:**
1. `src/services/StorageService.ts` の関数名変更
2. ストレージキーの変更
3. マイグレーションロジックの追加（後方互換性）

**依存関係:** フェーズ1, 2完了後

**完了条件:** サービス層のコンパイルエラー解消

---

### フェーズ4: カスタムフックの変更

**目的:** フック層の用語統一

**作業内容:**
1. `src/hooks/usePresets.ts` → `useStructures.ts` にリネーム
2. フック内の関数名・変数名変更
3. `src/hooks/index.ts` のエクスポート更新

**依存関係:** フェーズ1, 2, 3完了後

**完了条件:** フック層のコンパイルエラー解消

---

### フェーズ5: コンテキストの変更

**目的:** 状態管理層の用語統一

**作業内容:**
1. `src/contexts/SettingsContext.tsx` のアクション名・変数名変更
2. `src/contexts/TournamentContext.tsx` のアクション名変更

**依存関係:** フェーズ1〜4完了後

**完了条件:** コンテキスト層のコンパイルエラー解消

---

### フェーズ6: コンポーネントの変更（ファイル・ディレクトリ構造）

**目的:** コンポーネントのファイル名・ディレクトリ名変更

**作業内容:**
1. `PresetSelector/` → `StructureSelector/` ディレクトリリネーム
2. `PresetManager/` → `StructureManager/` ディレクトリリネーム
3. `PresetManagement/` → `StructureManagement/` ディレクトリリネーム
4. 各ディレクトリ内のファイル名変更
5. index.ts のエクスポート更新
6. `src/components/index.ts` のエクスポート更新

**依存関係:** フェーズ5完了後

**完了条件:** ファイル構造の変更完了

---

### フェーズ7: コンポーネント内部の変更

**目的:** コンポーネント内のコード変更

**作業内容:**
1. 各コンポーネント内の変数名・関数名変更
2. 日本語UI表示テキストの変更
3. import文の更新
4. props型の更新

**対象コンポーネント:**
- `StructureSelector.tsx`
- `StructureManager.tsx`
- `StructureManagementModal.tsx`
- `StructureList.tsx`
- `StructureEditor.tsx`
- `AppHeader.tsx`（import・使用箇所）
- `MainLayout.tsx`（import・使用箇所）

**依存関係:** フェーズ6完了後

**完了条件:** 全コンポーネントのコンパイルエラー解消

---

### フェーズ8: テストの更新

**目的:** テストコードの用語統一

**作業内容:**
1. テストファイルのリネーム（必要に応じて）
2. テスト内の変数名・関数名変更
3. テストの実行と確認

**依存関係:** フェーズ7完了後

**完了条件:** 全テストがパス

---

### フェーズ9: ドキュメントの更新

**目的:** ドキュメントの用語統一

**作業内容:**
1. `docs/specs/features/presets.md` → `structures.md` にリネーム
2. ドキュメント内容の用語変更
3. 他ドキュメントからの参照更新

**依存関係:** フェーズ8完了後

**完了条件:** ドキュメント更新完了

---

### フェーズ10: 最終確認とクリーンアップ

**目的:** 全体の動作確認とコード品質確保

**作業内容:**
1. アプリケーション全体の動作確認
2. リンター・フォーマッターの実行
3. ビルド確認
4. 未使用コード・import の削除

**依存関係:** フェーズ9完了後

**完了条件:** ビルド成功、全テストパス、アプリ正常動作

---

## 5. ファイル別変更一覧

### 5.1 型定義

| ファイル | 変更内容 |
|---------|---------|
| `src/types/domain.ts` | `Preset` → `Structure`, `PresetId` → `StructureId`, `PresetType` → `StructureType` |
| `src/types/context.ts` | アクション型名の変更 |
| `src/types/storage.ts` | ストレージキーの変更 |
| `src/types/index.ts` | エクスポート名の更新 |

### 5.2 ドメインモデル

| ファイル | 変更内容 |
|---------|---------|
| `src/domain/models/Preset.ts` → `Structure.ts` | ファイル名変更、関数名変更 |
| `src/domain/models/index.ts` | エクスポート更新 |

### 5.3 サービス

| ファイル | 変更内容 |
|---------|---------|
| `src/services/StorageService.ts` | `savePresets` → `saveStructures`, `loadPresets` → `loadStructures`, キー変更 |

### 5.4 フック

| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/usePresets.ts` → `useStructures.ts` | ファイル名変更、フック名・関数名変更 |
| `src/hooks/index.ts` | エクスポート更新 |

### 5.5 コンテキスト

| ファイル | 変更内容 |
|---------|---------|
| `src/contexts/SettingsContext.tsx` | アクション名、変数名変更 |
| `src/contexts/TournamentContext.tsx` | アクション名変更 |

### 5.6 コンポーネント

| 変更前 | 変更後 |
|-------|--------|
| `src/components/PresetSelector/PresetSelector.tsx` | `src/components/StructureSelector/StructureSelector.tsx` |
| `src/components/PresetSelector/PresetSelector.css` | `src/components/StructureSelector/StructureSelector.css` |
| `src/components/PresetSelector/index.ts` | `src/components/StructureSelector/index.ts` |
| `src/components/PresetManager/PresetManager.tsx` | `src/components/StructureManager/StructureManager.tsx` |
| `src/components/PresetManager/PresetManager.css` | `src/components/StructureManager/StructureManager.css` |
| `src/components/PresetManager/index.ts` | `src/components/StructureManager/index.ts` |
| `src/components/PresetManagement/PresetManagementModal.tsx` | `src/components/StructureManagement/StructureManagementModal.tsx` |
| `src/components/PresetManagement/PresetList.tsx` | `src/components/StructureManagement/StructureList.tsx` |
| `src/components/PresetManagement/PresetEditor.tsx` | `src/components/StructureManagement/StructureEditor.tsx` |
| `src/components/PresetManagement/*.css` | `src/components/StructureManagement/*.css` |
| `src/components/PresetManagement/index.ts` | `src/components/StructureManagement/index.ts` |

### 5.7 その他コンポーネント（import更新のみ）

| ファイル | 変更内容 |
|---------|---------|
| `src/components/AppHeader/AppHeader.tsx` | import文、コンポーネント使用箇所の更新 |
| `src/components/MainLayout.tsx` | import文、コンポーネント使用箇所の更新 |
| `src/components/index.ts` | エクスポート更新 |

### 5.8 ドキュメント

| 変更前 | 変更後 |
|-------|--------|
| `docs/specs/features/presets.md` | `docs/specs/features/structures.md` |

---

## 6. リスクと対策

### 6.1 リスク一覧

| リスク | 影響度 | 発生確率 | 対策 |
|-------|-------|---------|------|
| 既存ユーザーのlocalStorageデータ消失 | 高 | 高 | マイグレーション処理の実装 |
| 変更漏れによるランタイムエラー | 中 | 中 | TypeScriptコンパイラの活用、テスト実行 |
| import文の更新漏れ | 低 | 中 | ビルド確認で検出可能 |
| CSSクラス名の変更漏れ | 低 | 低 | 目視確認、E2Eテスト |

### 6.2 マイグレーション対策（詳細）

既存ユーザーが保存しているlocalStorageデータを保護するため、以下のマイグレーション処理を実装する：

```typescript
// StorageService.ts に追加するマイグレーションロジック
const OLD_STORAGE_KEY = 'poker-timer-presets';
const NEW_STORAGE_KEY = 'poker-timer-structures';

function migrateStorageKey(): void {
  const oldData = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldData && !localStorage.getItem(NEW_STORAGE_KEY)) {
    localStorage.setItem(NEW_STORAGE_KEY, oldData);
    localStorage.removeItem(OLD_STORAGE_KEY);
  }
}
```

---

## 7. テスト計画

### 7.1 単体テスト

| 対象 | テスト内容 |
|-----|----------|
| Structure型 | 型定義が正しいこと |
| useStructures | 各メソッドが正常に動作すること |
| StorageService | マイグレーション処理が正常に動作すること |
| SettingsContext | アクションが正常にディスパッチされること |

### 7.2 統合テスト

| シナリオ | 確認内容 |
|---------|---------|
| ストラクチャー選択 | ドロップダウンから選択できること |
| ストラクチャー作成 | 新規作成フローが動作すること |
| ストラクチャー編集 | 編集が保存されること |
| ストラクチャー削除 | 削除確認後に削除されること |
| データマイグレーション | 旧キーのデータが新キーに移行されること |

### 7.3 手動テスト

| 項目 | 確認内容 |
|-----|---------|
| UI表示 | 全ての「プリセット」が「ストラクチャー」に変更されていること |
| レスポンシブ | モバイル表示で問題がないこと |
| アクセシビリティ | aria-label等が更新されていること |

---

## 8. マイグレーション戦略

### 8.1 後方互換性

アプリケーション起動時に自動マイグレーションを実行し、既存ユーザーのデータを保護する。

### 8.2 マイグレーションフロー

```
アプリ起動
    │
    ▼
旧ストレージキー存在確認
    │
    ├─ YES → 新キーにコピー → 旧キー削除 → 通常起動
    │
    └─ NO → 通常起動
```

### 8.3 ロールバック計画

万が一問題が発生した場合：
1. 旧コードへのリバート（git revert）
2. localStorageは旧キーを残す設計のため、データ復旧可能

---

## 実装チェックリスト

- [ ] フェーズ1: 型定義の変更
- [ ] フェーズ2: ドメインモデルの変更
- [ ] フェーズ3: サービス層の変更
- [ ] フェーズ4: カスタムフックの変更
- [ ] フェーズ5: コンテキストの変更
- [ ] フェーズ6: コンポーネントのファイル・ディレクトリ構造変更
- [ ] フェーズ7: コンポーネント内部の変更
- [ ] フェーズ8: テストの更新
- [ ] フェーズ9: ドキュメントの更新
- [ ] フェーズ10: 最終確認とクリーンアップ

---

## 備考

- 本リファクタリングは機能変更を伴わない純粋な用語変更である
- TypeScriptのコンパイルエラーを活用し、変更漏れを防ぐ
- 各フェーズ完了後にコミットを作成し、変更を追跡可能にする
