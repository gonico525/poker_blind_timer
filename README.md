# Poker Blind Timer

ノーリミットホールデムトーナメント用のブラインドタイマー

## 概要

ブラウザベースで動作する、ローカル環境で完結するポーカートーナメント用のブラインドタイマーアプリケーションです。

## 技術スタック

- **フレームワーク**: React 19.2
- **言語**: TypeScript 5.9
- **ビルドツール**: Vite 7.3
- **テスト**: Vitest 4.0 + React Testing Library 16.3
- **Linting**: ESLint 9.39 (Flat Config)
- **Formatting**: Prettier 3.8
- **Git Hooks**: Husky 9.0 + lint-staged 16.2

## セットアップ

### 前提条件

- Node.js 18.x 以上
- npm 9.x 以上

### インストール

```bash
# 依存関係のインストール
npm install
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プレビュー

```bash
npm run preview
```

## テスト

### テストの実行

```bash
# 通常のテスト実行
npm test

# UIモード
npm run test:ui

# カバレッジレポート
npm run test:coverage
```

## コード品質

### リント

```bash
npm run lint
```

### フォーマット

```bash
# フォーマットのチェック
npm run format:check

# フォーマットの適用
npm run format
```

## Git Hooks

コミット前に自動的に以下が実行されます：

- ESLint による静的解析
- Prettier によるコードフォーマット

## CI/CD

GitHub Actions により以下が自動実行されます：

- ESLint チェック
- Prettier チェック
- テスト実行
- ビルド検証
- カバレッジレポート

## プロジェクト構造

```
poker-blind-timer/
├── src/
│   ├── test/         # テストセットアップ
│   ├── App.tsx       # メインコンポーネント
│   ├── main.tsx      # エントリーポイント
│   └── ...
├── docs/             # ドキュメント
├── public/           # 静的ファイル
└── ...
```

## ライセンス

MIT

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリを参照してください。

- [要求仕様書](docs/urs/requirements.md)
- [アーキテクチャ](docs/specs/01-architecture.md)
- [実装計画](docs/plans/implementation-plan.md)
