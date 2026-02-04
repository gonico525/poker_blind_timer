# デフォルトストラクチャー更新報告

**日付**: 2026-02-04
**ブランチ**: `claude/update-default-structure-nqMA9`

## 概要

デフォルトストラクチャーを旧3種類から新4種類へ更新した。

## 変更前

| #   | 名前             | レベル時間 | レベル数 | 休憩                     |
| --- | ---------------- | ---------- | -------- | ------------------------ |
| 1   | スタンダード     | 10分       | 12レベル | 有効（4レベルごと/10分） |
| 2   | ターボ           | 5分        | 12レベル | 有効（6レベルごと/5分）  |
| 3   | ディープスタック | 15分       | 15レベル | 有効（4レベルごと/15分） |

## 変更後

| #   | 名前                          | レベル時間 | レベル数 | 休憩                     |
| --- | ----------------------------- | ---------- | -------- | ------------------------ |
| 1   | Deepstack (30min/50k Start)   | 30分       | 24レベル | 有効（4レベルごと/10分） |
| 2   | Standard (20min/30k Start)    | 20分       | 17レベル | 有効（4レベルごと/10分） |
| 3   | Turbo (15min/25k Start)       | 15分       | 14レベル | 有効（5レベルごと/10分） |
| 4   | Hyper Turbo (10min/20k Start) | 10分       | 12レベル | 無効                     |

## 変更対象ファイル

### ソースコード

- `src/domain/models/Structure.ts`: `createDefaultStructures()` 内の4つのデフォルトストラクチャーデータを更新
  - IDは既存の `default-deepstack`, `default-standard`, `default-turbo` を維持し、新規 `default-hyperturbo` を追加
  - すべて `type: 'default'` を維持
- `src/domain/models/Structure.test.ts`: テスト内容を新4種類に合わせて更新
  - 構造体数のアサーション: 3→4
  - 各ストラクチャーの名前・レベル時間・レベル数のアサーションを更新
  - `default-hyperturbo` のテストケースを追加
  - `mergeWithDefaultStructures` のテスト内で `default-hyperturbo` の確認を追加

### ドキュメント

- `docs/specs/02-data-models.md`:
  - セクション4（デフォルトプリセット）のブラインドデータを新4種類に更新
  - セクション10（まとめ）の「3つのプリセット」→「4つのプリセット」へ更新
- `docs/specs/features/presets.md`:
  - セクション2.2（デフォルトプリセット）の一覧を新4種類に更新

## 検証結果

- ESLint: **OK**（警告0件）
- Vitest: **491テスト全件パス**（42テストファイル）
- Build: **OK**（TypeScriptチェック + Vite ビルド正常完了）
