# アベレージスタック表示機能 フェーズ4完了レポート

## 実施日

2026-02-11

## 概要

アベレージスタック表示機能のフェーズ4（UI層の実装 - ストラクチャー編集）を完了した。StructureEditorに初期スタック入力フィールドを追加し、テストを更新し、すべての品質チェックをパスした。

## 関連計画書

- `docs/plans/2026-02-09-average-stack-display.md`
- `docs/reports/2026-02-10-average-stack-phase0.md`
- `docs/reports/2026-02-10-average-stack-phase1.md`
- `docs/reports/2026-02-10-average-stack-phase2.md`
- `docs/reports/2026-02-11-average-stack-design-review.md`

## 実施内容

### 1. StructureEditorの拡張 (`src/components/StructureManagement/StructureEditor.tsx`)

#### 初期スタック入力フィールドの追加

```tsx
<div>
  <NumberInput
    label="初期スタック"
    value={editedStructure.initialStack}
    min={0}
    max={10000000}
    step={1000}
    onChange={handleInitialStackChange}
    unit="チップ"
    aria-label="初期スタック（チップ）"
  />
  <p className={styles.helperText}>
    0の場合、アベレージスタックは表示されません
  </p>
</div>
```

**配置:** レベル時間入力フィールドの直後、休憩トグルの前に配置

**機能:**

- 初期スタックの入力（0〜10,000,000チップ）
- ステップ値: 1000（増減ボタンで1000刻みで変更）
- ヒントテキスト: 「0の場合、アベレージスタックは表示されません」

#### 変更ハンドラーの追加

```tsx
const handleInitialStackChange = (chips: number) => {
  setEditedStructure({ ...editedStructure, initialStack: chips });
};
```

**動作:**

- NumberInputコンポーネントの変更を受け取り、editedStructureを更新
- NumberInputが自動的に範囲チェックとクランプを行うため、追加のバリデーションは不要

### 2. StructureEditor.module.cssの更新

#### helperTextスタイルの追加

```css
.helperText {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-2);
  margin-bottom: 0;
}
```

**スタイル:**

- 小さめのフォントサイズ（sm）
- セカンダリテキストカラー
- 上部にスペーシング

### 3. StructureEditor.test.tsxの更新

#### createTestStructure関数の更新

```tsx
const createTestStructure = (overrides?: Partial<Structure>): Structure => ({
  // ... 既存フィールド
  initialStack: 0, // 初期スタック（0 = 未設定）
  // ...
});
```

#### 新規テストケースの追加（4ケース）

1. **初期スタック入力フィールドが表示される**

```tsx
it('初期スタック入力フィールドが表示される', () => {
  render(<StructureEditor {...defaultProps} />);

  expect(screen.getByText('初期スタック')).toBeInTheDocument();
  expect(
    screen.getByText('0の場合、アベレージスタックは表示されません')
  ).toBeInTheDocument();
});
```

2. **初期スタックの値が正しく表示される**

```tsx
it('初期スタックの値が正しく表示される', () => {
  const structure = createTestStructure({ initialStack: 30000 });
  render(<StructureEditor {...defaultProps} structure={structure} />);

  // NumberInputは2番目（レベル時間、初期スタックの順）
  const initialStackInput = screen.getAllByTestId('number-input')[1];
  expect(initialStackInput).toHaveValue(30000);
});
```

3. **初期スタックを変更できる**

```tsx
it('初期スタックを変更できる', async () => {
  const user = userEvent.setup();
  render(<StructureEditor {...defaultProps} />);

  // NumberInputは2番目
  const incrementButton = screen.getAllByTestId('increment-button')[1];
  await user.click(incrementButton);

  const initialStackInput = screen.getAllByTestId('number-input')[1];
  expect(initialStackInput).toHaveValue(1000); // step=1000
});
```

4. **初期スタックの変更が保存される**

```tsx
it('初期スタックの変更が保存される', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<StructureEditor {...defaultProps} onSave={onSave} isDirty={true} />);

  // NumberInputは2番目
  const incrementButton = screen.getAllByTestId('increment-button')[1];
  await user.click(incrementButton);

  const saveButton = screen.getByTestId('save-button');
  await user.click(saveButton);

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        initialStack: 1000,
      })
    );
  });
});
```

### 4. ストラクチャー保存・読み込みの確認

#### デフォルトストラクチャーの初期スタック

フェーズ1で既に実装済み:

| ストラクチャー | initialStack |
| -------------- | ------------ |
| Deepstack      | 50000        |
| Standard       | 30000        |
| Turbo          | 25000        |
| Hyper Turbo    | 20000        |

#### 後方互換性

フェーズ2で既に実装済み（`src/domain/models/Structure.ts`）:

```tsx
const normalizedUserStructures = userStructures.map((structure) => ({
  ...structure,
  initialStack: structure.initialStack ?? 0,
}));
```

- 既存のStructureデータに`initialStack`フィールドがない場合、デフォルト値（0）で補完
- ユーザーが保存した古いデータでもエラーなく読み込める

#### インポート/エクスポート

- ImportExportコンポーネントはStructure型をそのまま扱うため、`initialStack`は自動的にエクスポート/インポートされる
- テストにも`initialStack`が含まれていることを確認済み（`ImportExport.test.tsx`）

## 変更ファイル一覧

### 変更

| ファイル                                                        | 変更内容                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/components/StructureManagement/StructureEditor.tsx`        | 初期スタック入力フィールド追加、handleInitialStackChange追加 |
| `src/components/StructureManagement/StructureEditor.module.css` | helperTextスタイル追加                                       |
| `src/components/StructureManagement/StructureEditor.test.tsx`   | createTestStructure更新、新規テスト4ケース追加               |

## テスト結果

### Lint

```bash
npm run lint
```

**結果:** ✅ 成功（警告なし）

### Unit Tests

```bash
npm test -- --run
```

**結果:** ✅ 全533テストが成功

- StructureEditor: 23テスト（+4）
- 既存テスト: すべて成功（後方互換性維持）

**新規テストケース:**

1. 初期スタック入力フィールドが表示される
2. 初期スタックの値が正しく表示される
3. 初期スタックを変更できる
4. 初期スタックの変更が保存される

## 品質メトリクス

- **変更ファイル**: 3ファイル
- **新規テスト**: 4ケース
- **総テスト数**: 533テスト（全パス）
- **lintエラー**: 0件
- **lintワーニング**: 0件

## 完了確認

### フェーズ4の完了条件

- [x] StructureEditorに初期スタック入力フィールドを追加
- [x] 初期スタック変更ハンドラーの実装
- [x] ヒントテキストの表示
- [x] テストの作成（4ケース）
- [x] ストラクチャー保存・読み込みの確認
  - [x] デフォルトストラクチャーの初期スタック値
  - [x] 後方互換性（mergeWithDefaultStructures）
  - [x] インポート/エクスポート対応
- [x] `npm test` がパス（533テスト）
- [x] `npm run lint` がパス（警告なし）

## UI仕様

### 初期スタック入力フィールド

**配置:**

- セクション: トーナメント設定
- 位置: レベル時間入力の直後、休憩トグルの前

**入力仕様:**

- ラベル: 「初期スタック」
- 入力範囲: 0〜10,000,000
- ステップ: 1000
- 単位: 「チップ」
- ヒントテキスト: 「0の場合、アベレージスタックは表示されません」

**動作:**

- 0の場合、アベレージスタック表示機能は無効化される
- 正の値の場合、タイマー画面でアベレージスタックが表示される
- NumberInputコンポーネントの増減ボタンで1000刻みで変更可能
- 手動入力も可能（範囲外の値は自動的にクランプされる）

## 課題・注意事項

### NumberInputコンポーネントの拡張

- 現在、NumberInputコンポーネントは`helperText`プロパティをサポートしていない
- 今回は、StructureEditor内でカスタムのhelperText表示を実装
- 将来、他のコンポーネントでもhelperTextが必要になった場合は、NumberInputコンポーネント自体を拡張することを検討

### デフォルトストラクチャーの編集

- デフォルトストラクチャーは編集不可のため、初期スタックも表示のみ
- ユーザーがデフォルトストラクチャーをカスタマイズする場合は、新規ストラクチャーとして保存する必要がある

## 次のステップ

フェーズ5（統合テスト・最終確認）に進む。具体的には:

1. **E2Eシナリオの確認**
   - ストラクチャーで初期スタックを設定 → タイマー画面でプレイヤー数を設定 → アベレージスタックが正しく表示される
   - レベルが進行するとBB換算値が変化する
   - プレイヤーが脱落（残り人数を減らす）するとアベレージスタックが増加する
   - ブレイク中もアベレージスタックが表示される
   - タイマーリセット時に残り人数が参加人数にリセットされる

2. **後方互換性の確認**
   - `initialStack`フィールドなしの既存ストラクチャーデータが正しく読み込まれる
   - `totalPlayers`/`remainingPlayers`なしの既存トーナメント状態が正しく復元される

3. **レスポンシブ確認**
   - モバイル、タブレット、デスクトップでの表示確認

4. **ビルド確認**
   - `npm run build` が成功すること
   - `npm run lint` がゼロ警告であること
   - `npm test` が全テストパスすること

## まとめ

フェーズ4のストラクチャー編集UI実装を完了し、StructureEditorに初期スタック入力フィールドを追加した。すべてのテストがパスし、既存機能への影響もなく、後方互換性も確保されている。次のフェーズで統合テストと最終確認に進む準備が整った。

## フェーズ4で追加された機能

- ストラクチャー編集画面で初期スタックを設定可能
- 0〜10,000,000チップの範囲で入力可能（ステップ: 1000）
- 0の場合、アベレージスタック表示機能が無効化されることをユーザーに通知
- 既存のデフォルトストラクチャーには適切な初期スタック値が設定済み
- インポート/エクスポートで初期スタック値が保持される
