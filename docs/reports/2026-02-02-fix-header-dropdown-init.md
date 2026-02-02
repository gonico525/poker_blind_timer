# ヘッダードロップダウン幅・起動時初期ブリンド表示の修正結果

**実施日**: 2026-02-02
**対応する計画書**: `docs/plans/2026-02-02-fix-header-dropdown-init.md`
**対象ブランチ**: `claude/fix-header-dropdown-init-mWpOZ`

---

## 対応状況サマリー

| 項目  | 内容                                         | 状態 |
| ----- | -------------------------------------------- | ---- |
| 修正1 | ドロップダウンメニューの幅拡張と折り返し防止 | 完了 |
| 修正2 | 起動時初期ブリンド・ネクストレベル表示の修正 | 完了 |
| 検証  | ビルド・テスト                               | 完了 |

---

## 修正1: ドロップダウンメニューの幅拡張と折り返し防止

**ファイル**: `src/components/common/Dropdown/Dropdown.module.css`

### 根本原因

`.menu` クラスが `left: 0; right: 0;` で配置されており、メニュー幅がトリガーボタン幅に拘束された。トリガーボタンの幅は `StructureSelector.module.css` の `.dropdown`（`min-width: 200px`）で決まるため、チェック列（`width: 20px` + `margin-right: 8px`）とパディングを引いた残り幅で「⚙ ストラクチャー管理...」のテキストが収まらず折り返しが発生した。

### 変更内容

**① `.menu`の幅制約緩和**

```css
/* 変更前 */
left: 0;
right: 0;

/* 変更後 */
left: 0;
min-width: 100%;
```

`right: 0` を削除し `min-width: 100%` に変更。メニューはトリガー幅以上だがコンテンツに応じて横方向に拡張可能になる。

**② `.item`の折り返し禁止**

```css
/* 追加 */
white-space: nowrap;
```

テキストが長くても1行に収まるようにする。メニュー幅の拡張と組み合わせで、いかなる長さのラベルでも改行しなくなる。

---

## 修正2: 起動時初期ブリンド・ネクストレベル表示の修正

**ファイル**: `src/components/MainLayout.tsx`

### 根本原因

アプリの初期化フローで、`SettingsContext` は `currentStructureId` を正しくセットするが、`TournamentContext` は静的な初期値（`blindLevels: []`）で起動した。`loadStructure()` は `useStructures` フックで提供されるが、ユーザーがドロップダウンで明示的に選択した際のみ呼び出されていた。

起動時には誰もこれを呼び出さないため、`TournamentContext` の `blindLevels` が空のまま残り、`useTimer` フックが返す `currentBlind` と `nextBlind` はいずれも `undefined` となった。`BlindInfo` コンポーネントは `blindLevel` が偽の場合に `null` を返すため、何も表示されなかった。

### 変更内容

`MainLayout` で初期マウント時に `loadStructure(currentStructureId)` を呼び出し、`TournamentContext` にブリンドデータを注入する。`useRef` フラグで初回実行のみに制限し、明示的なストラクチャー変更時の重複実行を防ぐ。

```typescript
const hasLoadedInitial = useRef(false);
useEffect(() => {
  if (!hasLoadedInitial.current && currentStructureId) {
    hasLoadedInitial.current = true;
    loadStructure(currentStructureId);
  }
}, [currentStructureId, loadStructure]);
```

これにより起動直後から `blindLevels` に実データが入り、ブリンド情報とネクストレベルが即座に表示される。

---

## 検証結果

- **TypeScriptコンパイル**: 型エラー0件
- **テスト**: 42テストファイル・490件全件合格
- **Lint**: ESLint・Prettier ともエラー0件（pre-commitフック経由で自動修正済み）
