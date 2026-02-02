# ヘッダードロップダウン幅・初期ブリンド表示の修正計画

**日付**: 2026-02-02
**対象ブランチ**: `claude/fix-header-dropdown-init-mWpOZ`
**優先度**: 高（アプリ起動時にブリンド情報が非表示になっている）

---

## 1. バグ1: ドロップダウンメニューの「⚙ ストラクチャー管理...」が改行される

### 1.1 症状

ヘッダーのストラクチャー選択プルダウンを開くと、末尾の「⚙ ストラクチャー管理...」テキストが2行に折り返される。

### 1.2 根本原因

`src/components/common/Dropdown/Dropdown.module.css` の `.menu` クラスが `left: 0; right: 0;` で配置されており、メニューの幅がトリガーボタン幅に拘束される。

トリガーボタンの幅は `src/components/StructureSelector/StructureSelector.module.css` の `.dropdown` で `min-width: 200px` に制限される。

各メニュー項目には `.check`（`width: 20px` + `margin-right: 8px`）+ `.label` の構成があり、「⚙ ストラクチャー管理...」のテキスト幅は200pxを超えるため折り返しが発生する。

```
メニュー幅: 200px（min-width で制限）
  └─ .check: 20px + margin 8px = 28px
  └─ .label: 200 - 28 - padding(32px) = 140px → テキスト不収まり → 改行
```

### 1.3 修正方針

2つの変更で対応する。

**① `.menu` の幅制約を緩和**（`Dropdown.module.css`）

`right: 0` を削除し、`min-width: 100%` に変更。メニューはトリガーボタン幅以上だが、コンテンツに応じて横方向に拡張可能になる。

```css
.menu {
  /* right: 0; ← 削除 */
  min-width: 100%;
}
```

**② メニュー項目のテキスト折り返しを禁止**（`Dropdown.module.css`）

`.item` に `white-space: nowrap` を追加。テキストが長くても1行に収まる。

```css
.item {
  white-space: nowrap;
}
```

---

## 2. バグ2: アプリ起動時にブリンド・ネクストレベル情報が未表示

### 2.1 症状

アプリを開いた直後、ブリンド情報（SB/BB/Ante）とネクストレベル情報が表示されない。ドロップダウンからストラクチャーを再選択すると正常に表示される。

### 2.2 根本原因

アプリの初期化フローで、ストラクチャーの読み込みが実行されていない。

| コンテキスト        | 初期化時の状態                                      | 問題                    |
| ------------------- | --------------------------------------------------- | ----------------------- |
| `SettingsContext`   | `currentStructureId` = デフォルトストラクチャーのID | 正常                    |
| `TournamentContext` | `blindLevels: []`（空配列）                         | **ブリンド データなし** |

`SettingsProvider` は `currentStructureId` を正しくセットするが、`TournamentProvider` は静的な初期値（`blindLevels: []`）で起動する。`loadStructure()` は `useStructures` フックで提供されるが、ユーザーがドロップダウンで選択した際のみ呼び出される。

起動時には誰もこれを呼び出さないため、`TournamentContext` に `blindLevels` が永遠に空のままとなる。

`useTimer` フックは `state.blindLevels[state.currentLevel]` で現在のブリンドを算出するが、配列が空なので `undefined` を返す。`BlindInfo` コンポーネントは `blindLevel` が偽の場合に `null` を返すため、何も表示されない。

### 2.3 修正方針

`MainLayout` で初期マウント時に `loadStructure(currentStructureId)` を呼び出し、`TournamentContext` にブリンドデータを注入する。

`useRef` フラグで初回実行のみに制限し、明示的なストラクチャー変更時の再実行を防ぐ。

```typescript
const hasLoadedInitial = useRef(false);

useEffect(() => {
  if (!hasLoadedInitial.current && currentStructureId) {
    hasLoadedInitial.current = true;
    loadStructure(currentStructureId);
  }
}, [currentStructureId, loadStructure]);
```

---

## 3. 影響範囲と変更対象ファイル

| ファイル                                             | 変更箇所           | 変更内容                                        |
| ---------------------------------------------------- | ------------------ | ----------------------------------------------- |
| `src/components/common/Dropdown/Dropdown.module.css` | `.menu`            | `right: 0` を削除し `min-width: 100%` を追加    |
| `src/components/common/Dropdown/Dropdown.module.css` | `.item`            | `white-space: nowrap` を追加                    |
| `src/components/MainLayout.tsx`                      | コンポーネント本体 | 初期ストラクチャー読み込みの `useEffect` を追加 |

---

## 4. テスト更新の必要性

| テストファイル                                                     | 確認・更新内容                             |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `src/components/MainLayout.test.tsx`（存在する場合）               | 起動時にブリンド情報が表示されることを検証 |
| `src/components/common/Dropdown/Dropdown.test.tsx`（存在する場合） | 長いラベルテキストが改行しないことを検証   |

---

## 5. 検証方法

1. `npm run build` で型エラー0件を確認
2. `npm test` で全件パスを確認
3. 手動検証:
   - アプリ起動時にブリンド情報が即座に表示される
   - ドロップダウンを開くと「⚙ ストラクチャー管理...」が1行で収まる
   - ストラクチャーを変更してもブリンド情報が正しく更新される
