# 機能仕様書 - ノーリミットホールデム ブラインドタイマー

## 📋 ドキュメント概要

本ディレクトリには、ポーカーブラインドタイマーの詳細な機能仕様書が格納されています。
要求仕様書（`docs/urs/requirements.md`）に基づき、実装可能な詳細レベルで設計されています。

## 🎯 対象読者

- **フロントエンド開発者**: 実装時の参照ドキュメント
- **システムアーキテクト**: 設計レビューと技術的意思決定
- **QAエンジニア**: テストケース作成の基礎資料
- **プロダクトオーナー**: 仕様確認とレビュー

## 📁 ドキュメント構成

### 共通ドキュメント（全開発者が参照）

| ファイル | 内容 | 主な読者 |
|---------|------|---------|
| [01-architecture.md](./01-architecture.md) | システムアーキテクチャ、技術スタック、ディレクトリ構成 | 全開発者 |
| [02-data-models.md](./02-data-models.md) | データモデル、TypeScript型定義、localStorage スキーマ | 全開発者 |
| [03-design-system.md](./03-design-system.md) | UI/UX詳細、デザインシステム、カラーパレット、タイポグラフィ | UI開発者 |
| [04-interface-definitions.md](./04-interface-definitions.md) | **機能間インターフェース定義、結合仕様** | 全開発者（必読） |

### 機能別ドキュメント（features/）

各機能の担当者が主に参照するドキュメントです。

| ファイル | 内容 | 依存関係 |
|---------|------|---------|
| [features/timer.md](./features/timer.md) | タイマー機能の実装仕様 | 02-data-models.md |
| [features/blinds.md](./features/blinds.md) | ブラインド管理機能の実装仕様 | 02-data-models.md |
| [features/presets.md](./features/presets.md) | プリセット管理機能の実装仕様 | 02-data-models.md, features/storage.md |
| [features/audio.md](./features/audio.md) | 音声通知機能の実装仕様 | features/timer.md |
| [features/keyboard.md](./features/keyboard.md) | キーボードショートカットの実装仕様 | features/timer.md |
| [features/storage.md](./features/storage.md) | データ永続化機能の実装仕様 | 02-data-models.md |

### プロジェクト管理ドキュメント

| ファイル | 内容 | 主な読者 |
|---------|------|---------|
| [testing.md](./testing.md) | テスト戦略、テストケース | QAエンジニア、開発者 |
| [deployment.md](./deployment.md) | ビルド設定、デプロイメント手順 | DevOps、開発リード |

## 🚀 推奨読み順

### 新規参画メンバー向け

1. **本ファイル（README.md）** - ドキュメント構成の理解
2. **01-architecture.md** - システム全体像の把握
3. **02-data-models.md** - データ構造の理解
4. **04-interface-definitions.md** - 機能間の結合仕様（**並行開発時は必読**）
5. **03-design-system.md** - UIの統一ルールの把握
6. **担当機能のドキュメント** - 実装詳細の確認

### 機能実装開始時

> ⚠️ **重要**: 並行開発を行う場合、必ず先に **04-interface-definitions.md** を確認してください。
> 機能間の結合仕様、アクション責務、イベント通知方式が定義されています。

担当する機能のドキュメントを中心に、以下を参照：

- **タイマー実装**: timer.md → 04-interface-definitions.md → 02-data-models.md
- **ブラインド管理実装**: blinds.md → 04-interface-definitions.md → 02-data-models.md
- **プリセット実装**: presets.md → 04-interface-definitions.md → storage.md
- **音声通知実装**: audio.md → 04-interface-definitions.md → timer.md
- **キーボード実装**: keyboard.md → 04-interface-definitions.md → timer.md
- **データ永続化実装**: storage.md → 04-interface-definitions.md → 02-data-models.md

## 🔗 関連ドキュメント

- **要求仕様書**: [docs/urs/requirements.md](../urs/requirements.md) - プロジェクトの要件定義
- **機能仕様書作成計画**: [docs/plans/functional_spec_plan.md](../plans/functional_spec_plan.md) - 本仕様書の作成方針
- **仕様レビュー報告書**: [docs/reviews/](../reviews/) - 仕様書のレビュー結果と改善事項
- **実装計画書**: [docs/plans/implementation-plan.md](../plans/implementation-plan.md) - TDDによる並行開発計画（チーム別計画書含む）

## 📝 技術スタック概要

本プロジェクトは以下の技術スタックで実装されます：

- **フレームワーク**: React 18.x
- **言語**: TypeScript 5.x
- **ビルドツール**: Vite 5.x
- **状態管理**: React Context + useReducer
- **スタイリング**: CSS Modules
- **データ永続化**: localStorage API
- **音声**: Web Audio API / HTML5 Audio
- **フルスクリーン**: Fullscreen API

詳細は [01-architecture.md](./01-architecture.md) を参照してください。

## 🎨 主要機能一覧

### コア機能

1. **タイマー機能**
   - カウントダウンタイマー
   - 開始/一時停止/リセット
   - 自動レベル進行

2. **ブラインド管理**
   - ブラインドレベルの設定
   - 休憩時間の管理
   - レベル間の手動移動

3. **プリセット管理**
   - デフォルトプリセット（スタンダード、ターボ、ディープスタック）
   - カスタムプリセットの作成・編集・削除
   - インポート/エクスポート（JSON形式）

4. **音声通知**
   - レベル変更時の通知音
   - 残り1分の警告音
   - 音量のオン/オフ

5. **キーボードショートカット**
   - スペース: 開始/一時停止
   - ←→: レベル移動
   - R: リセット
   - F: フルスクリーン
   - Esc: 設定閉じる/フルスクリーン解除
   - ?: ヘルプ表示

6. **データ永続化**
   - localStorage によるデータ保存
   - 設定の自動保存
   - プリセットの永続化

### UI/UX機能

- ダークモード/ライトモード切り替え
- フルスクリーン表示
- レスポンシブデザイン（PC最適化）
- アニメーション効果

## 🎯 設計原則

1. **YAGNI (You Aren't Gonna Need It)**: 必要な機能のみを実装
2. **KISS (Keep It Simple, Stupid)**: シンプルな設計を優先
3. **実装可能性**: 開発者がすぐ実装できる具体性
4. **一貫性**: 要求仕様書との整合性を保つ
5. **拡張性**: 将来の機能追加を考慮した柔軟な設計

## ⚙️ 開発環境セットアップ

詳細は [deployment.md](./deployment.md) を参照してください。

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test
```

## 🧪 テスト方針

テスト戦略の詳細は [testing.md](./testing.md) を参照してください。

- **単体テスト**: ドメインロジック、ユーティリティ関数
- **統合テスト**: Reactコンポーネント、カスタムフック
- **E2Eテスト**: クリティカルパスのシナリオ

## 📊 進捗管理

機能実装の進捗は以下のチェックリストで管理します：

- [ ] アーキテクチャ設計完了
- [ ] データモデル実装完了
- [ ] タイマー機能実装完了
- [ ] ブラインド管理機能実装完了
- [ ] プリセット管理機能実装完了
- [ ] 音声通知機能実装完了
- [ ] キーボードショートカット実装完了
- [ ] データ永続化機能実装完了
- [ ] UI/UXデザイン実装完了
- [ ] テスト完了
- [ ] デプロイメント準備完了

## 🔄 ドキュメント更新ルール

本仕様書は開発中に以下の場合に更新します：

1. **要求変更**: 要求仕様書の変更に伴う仕様の更新
2. **設計変更**: 実装中に判明した技術的制約による設計変更
3. **バグ修正**: 仕様の曖昧さや誤りの修正

更新時は各ドキュメントの「改訂履歴」セクションに記録してください。

## 📞 質問・フィードバック

仕様に関する質問や不明点がある場合：

1. まず該当する機能のドキュメントを確認
2. 共通ドキュメント（architecture, data-models, design-system）を参照
3. それでも不明な場合はプロジェクトリードに確認

## 📄 ライセンス

本プロジェクトはローカル使用を前提としたツールです。
詳細なライセンス情報はプロジェクトのREADMEを参照してください。

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
| 1.1 | 2026-01-26 | インターフェース定義書（04-interface-definitions.md）への参照を追加、推奨読み順を更新 | システムアーキテクト |
| 1.2 | 2026-01-26 | 実装計画書への参照を追加 | システムアーキテクト |

---

**次のステップ**: [01-architecture.md](./01-architecture.md) でシステムアーキテクチャを確認してください。
