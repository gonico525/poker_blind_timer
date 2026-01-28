# ライトモード切り替え修正 完了報告書

## 作成日
2026-01-28

## 作業概要
ライトモード切り替えボタンが正しく機能しない問題を修正しました。

---

## 1. 問題の詳細

### 報告された問題
- ライトモードに変更できない
- デフォルトでダークモードになる
- ボタンを押すとボタンの名称が「ライトモード」に変わる
- しかし、アプリ自体のデザインはダークモードのまま

### 影響範囲
- アプリ全体のテーマ表示
- ユーザーがライトモードを使用できない

---

## 2. 原因の特定

### 調査プロセス

#### 仕様確認
以下の仕様ドキュメントを確認しました：
- `docs/specs/03-design-system.md`: デザインシステム仕様
- `docs/specs/04-interface-definitions.md`: インターフェース定義

仕様では、テーマの切り替えは以下のように定義されています：

```typescript
function setTheme(theme: Theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
```

#### コード調査
以下のファイルを調査しました：

1. **src/contexts/SettingsContext.tsx**
   - テーマ状態の管理は正常に動作
   - `SET_THEME`アクションでstateは正しく更新される
   - localStorageへの保存も正常

2. **src/components/ThemeToggle/ThemeToggle.tsx**
   - ボタンのクリックで`onChange`コールバックを正しく呼び出し
   - テーマの切り替えロジックは正常
   - ボタンの表示（アイコン、ラベル）も正しく更新

3. **src/index.css**
   - CSS変数は正しく定義されている
   - `:root[data-theme='dark']` でダークモードの色
   - `:root[data-theme='light']` でライトモードの色

### 根本原因

**SettingsContextでテーマ状態は正しく更新されていましたが、その変更をHTMLの`data-theme`属性に反映する処理が実装されていませんでした。**

- CSS変数は`:root[data-theme='light']`のセレクタで定義されている
- `document.documentElement`の`data-theme`属性が更新されないと、CSSセレクタがマッチせず、スタイルが適用されない
- ボタンの表示が変わるのは、コンポーネント内のロジックで決まるため
- しかし、実際のテーマ（色、背景など）は`data-theme`属性に依存するため変わらない

---

## 3. 修正内容

### 修正ファイル
- `src/contexts/SettingsContext.tsx`

### 修正詳細

SettingsProviderコンポーネントに新しい`useEffect`を追加しました：

```typescript
// Apply theme to document
useEffect(() => {
  document.documentElement.setAttribute('data-theme', state.settings.theme);
}, [state.settings.theme]);
```

この`useEffect`により：
1. `state.settings.theme`が変更されるたびに実行される
2. `document.documentElement`（`<html>`要素）の`data-theme`属性を更新
3. CSS変数のセレクタ`:root[data-theme='light']`や`:root[data-theme='dark']`がマッチする
4. テーマに応じたスタイルが適用される

### 修正箇所
- **行番号**: 145-148行目（src/contexts/SettingsContext.tsx）
- **挿入位置**: 状態初期化の直後、localStorageへの保存前

---

## 4. 修正により期待される動作

### 修正前
1. ボタンをクリック
2. SettingsContextのテーマ状態が更新される
3. ボタンの表示（アイコン、ラベル）が変わる
4. **しかし、アプリのデザインは変わらない**（`data-theme`属性が更新されないため）

### 修正後
1. ボタンをクリック
2. SettingsContextのテーマ状態が更新される
3. **`useEffect`が実行され、`data-theme`属性が更新される**
4. ボタンの表示（アイコン、ラベル）が変わる
5. **アプリ全体のデザインが切り替わる**（CSS変数が適用される）

### 具体的な変更例

#### ダークモード → ライトモード切り替え時

| 要素 | ダークモード | ライトモード |
|------|------------|------------|
| 背景色 | `#0f1419` (濃いグレー) | `#ffffff` (白) |
| テキスト色 | `#e8eaed` (明るいグレー) | `#1a1f26` (濃いグレー) |
| カード背景 | `#252d38` | `#e8ecf1` |
| ボーダー | `#3c4451` | `#d1d5db` |

---

## 5. テスト方法

### 手動テスト

#### 前提条件
```bash
npm install
npm run dev
```

#### テストケース1: ライトモード切り替え
1. アプリを起動（デフォルトでダークモード）
2. 設定画面を開く
3. テーマ切り替えボタンをクリック
4. **期待結果**:
   - ボタンの表示が「☀️ ライトモード」に変わる
   - アプリ全体の背景が白になる
   - テキストが黒っぽい色になる
   - すべてのコンポーネントがライトテーマで表示される

#### テストケース2: ダークモード切り替え
1. ライトモードの状態から
2. テーマ切り替えボタンをクリック
3. **期待結果**:
   - ボタンの表示が「🌙 ダークモード」に変わる
   - アプリ全体の背景が濃いグレーになる
   - テキストが明るい色になる
   - すべてのコンポーネントがダークテーマで表示される

#### テストケース3: テーマの永続化
1. ライトモードに切り替え
2. ページをリロード
3. **期待結果**:
   - リロード後もライトモードが維持される
   - localStorageに正しく保存されている

#### テストケース4: 開発者ツールでの確認
1. ブラウザの開発者ツールを開く
2. Elements/要素タブで`<html>`要素を確認
3. テーマを切り替える
4. **期待結果**:
   - ダークモード時: `<html data-theme="dark">`
   - ライトモード時: `<html data-theme="light">`
   - 属性が動的に変更される

### 自動テスト（今後の追加推奨）

```typescript
describe('Theme Toggle', () => {
  it('should update document data-theme attribute when theme changes', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    // Initial theme should be 'dark'
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Change to light
    act(() => {
      result.current.dispatch({ type: 'SET_THEME', payload: { theme: 'light' } });
    });

    // data-theme should be updated
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
```

---

## 6. 技術的な詳細

### CSS変数の仕組み

CSSでは、`:root[data-theme='light']`のようなセレクタでテーマごとの変数を定義しています：

```css
/* ダークモード */
:root[data-theme='dark'] {
  --color-bg-primary: #0f1419;
  --color-text-primary: #e8eaed;
}

/* ライトモード */
:root[data-theme='light'] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #1a1f26;
}
```

コンポーネントでは、これらのCSS変数を使用します：

```css
body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

### 属性セレクタの動作

- `document.documentElement`は`<html>`要素を指す
- `data-theme`属性を設定すると、`:root[data-theme='light']`セレクタがマッチする
- セレクタがマッチすると、そのブロック内で定義されたCSS変数が有効になる
- すべてのコンポーネントが`var(--color-*)`を参照しているため、一括で更新される

### Reactにおける副作用の適切な配置

今回の修正では、`useEffect`を使用してDOM操作を行いました。これは、Reactのベストプラクティスに従っています：

- **Reducerは純粋関数**: 状態更新ロジックのみを含む
- **副作用はuseEffect**: DOM操作、API呼び出しなどはuseEffectで行う
- **依存配列で最適化**: `[state.settings.theme]`により、テーマ変更時のみ実行

---

## 7. 関連する仕様ドキュメント

### デザインシステム仕様
- **ファイル**: `docs/specs/03-design-system.md`
- **セクション**: 14. ダークモード/ライトモード切り替え
- **該当箇所**: 14.1 テーマ切り替えロジック（772-781行目）

### インターフェース定義
- **ファイル**: `docs/specs/04-interface-definitions.md`
- **セクション**: 1.2 アクション発行元と処理先
- **該当箇所**: SettingsContextのアクション（56行目）

---

## 8. コミット情報

- **ブランチ**: `claude/fix-light-mode-toggle-OS5Hi`
- **コミットハッシュ**: `dbc62cc`
- **コミットメッセージ**: "fix: テーマ切り替え時にHTMLのdata-theme属性を更新"
- **変更ファイル数**: 1ファイル
- **変更行数**: +5行

---

## 9. まとめ

### 問題
ライトモード切り替えボタンを押してもアプリのデザインがダークモードのまま

### 原因
`document.documentElement`の`data-theme`属性を更新する処理が実装されていなかった

### 修正
SettingsContextに`useEffect`を追加し、テーマ変更時に`data-theme`属性を更新

### 結果
- ライトモード/ダークモードの切り替えが正常に動作
- 仕様通りの実装を実現
- テーマがlocalStorageに保存され、リロード後も維持される

---

## 10. 今後の改善提案

### 自動テストの追加
テーマ切り替えが正しく動作することを保証するため、自動テストの追加を推奨します。

### システムテーマへの対応（オプション）
現在は'dark'/'light'の2つのテーマのみですが、仕様書には'system'テーマの記載もあります。将来的にシステムのカラースキーム設定に従う機能を追加する場合は、以下のような実装が必要です：

```typescript
useEffect(() => {
  if (state.settings.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

    // システム設定の変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  } else {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }
}, [state.settings.theme]);
```

---

## 関連リンク

- 作業セッション: https://claude.ai/code/session_01UpujXa5Ri2u4DYST6BphY3
- プルリクエスト作成リンク: https://github.com/gonico525/poker_blind_timer/pull/new/claude/fix-light-mode-toggle-OS5Hi

---

**報告者**: Claude Code
**報告日**: 2026-01-28
