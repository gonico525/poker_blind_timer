# UI統合ギャップ分析報告書

**作成日**: 2026-01-29
**作成者**: システムアーキテクト兼リードエンジニア
**目的**: バックエンド実装とUI統合の乖離を詳細に分析

---

## エグゼクティブサマリー

ポーカーブラインドタイマーは**バックエンド実装98%完成**しているが、**UI統合は61%のみ**という重大な乖離が存在します。

### 主要な発見

- ✅ **バックエンド実装**: 50/51機能（98%）
- ❌ **UI統合**: 31/51機能（61%）
- 🚨 **ギャップ**: 19機能がUIから全くアクセス不可能

---

## 1. ユーザーがアクセスできない設定（完全リスト）

### 1.1 音声設定

| 設定項目 | Reducer実装 | アクション | UI実装 | 状態 |
|---------|------------|----------|--------|------|
| **音声ON/OFF** | ✅ | SET_SOUND_ENABLED | ❌ | 常にON固定 |
| **音量調整** | ✅ | SET_VOLUME | ❌ | 0.7固定 |

**実装コード**:
```typescript
// src/contexts/SettingsContext.tsx (実装済み)
case 'SET_SOUND_ENABLED': {
  return {
    ...state,
    settings: { ...state.settings, soundEnabled: action.payload.enabled },
  };
}

case 'SET_VOLUME': {
  const volume = Math.max(0, Math.min(1, action.payload.volume));
  return {
    ...state,
    settings: { ...state.settings, volume },
  };
}
```

**欠けているUI**:
```typescript
// 必要なコンポーネント（未実装）
<AudioSettings>
  <Toggle label="音声通知" value={soundEnabled} onChange={...} />
  <Slider label="音量" min={0} max={1} value={volume} onChange={...} />
</AudioSettings>
```

**影響度**: **高**
- ユーザーが音声を無効化できない
- 音量調整ができない（デフォルト70%固定）

---

### 1.2 キーボードショートカット設定

| 設定項目 | Reducer実装 | アクション | UI実装 | 状態 |
|---------|------------|----------|--------|------|
| **ショートカットON/OFF** | ✅ | SET_KEYBOARD_SHORTCUTS_ENABLED | ❌ | 常にON固定 |

**実装コード**:
```typescript
// src/contexts/SettingsContext.tsx (実装済み)
case 'SET_KEYBOARD_SHORTCUTS_ENABLED': {
  return {
    ...state,
    settings: {
      ...state.settings,
      keyboardShortcutsEnabled: action.payload.enabled,
    },
  };
}
```

**欠けているUI**:
```typescript
// 必要なコンポーネント（未実装）
<Toggle
  label="キーボードショートカット"
  value={keyboardShortcutsEnabled}
  onChange={...}
/>
```

**影響度**: **中**
- ユーザーがショートカットを無効化できない
- 入力フィールドとの競合リスク

---

### 1.3 休憩設定

| 設定項目 | Reducer実装 | アクション | UI実装 | 状態 |
|---------|------------|----------|--------|------|
| **休憩頻度（Xレベルごと）** | ✅ | UPDATE_BREAK_CONFIG | ❌ | プリセット固定 |
| **休憩時間（分）** | ✅ | UPDATE_BREAK_CONFIG | ❌ | プリセット固定 |
| **休憩有効/無効** | ✅ | UPDATE_BREAK_CONFIG | ❌ | プリセット固定 |

**実装コード**:
```typescript
// src/contexts/TournamentContext.tsx (実装済み)
case 'UPDATE_BREAK_CONFIG': {
  return {
    ...state,
    breakConfig: action.payload.breakConfig,
  };
}
```

**欠けているUI**:
```typescript
// 必要なコンポーネント（未実装）
<BreakSettings>
  <NumberInput label="休憩頻度（レベル）" value={frequency} onChange={...} />
  <NumberInput label="休憩時間（分）" value={duration} onChange={...} />
  <Toggle label="休憩を有効化" value={enabled} onChange={...} />
</BreakSettings>
```

**影響度**: **高**
- ユーザーが休憩設定をカスタマイズできない
- プリセットの設定に固定される

---

### 1.4 レベル時間設定

| 設定項目 | Reducer実装 | アクション | UI実装 | 状態 |
|---------|------------|----------|--------|------|
| **レベル時間（分）** | ✅ | UPDATE_LEVEL_DURATION | ❌ | プリセット固定 |

**実装コード**:
```typescript
// src/contexts/TournamentContext.tsx (実装済み)
case 'UPDATE_LEVEL_DURATION': {
  return {
    ...state,
    levelDuration: action.payload.levelDuration,
  };
}
```

**欠けているUI**:
```typescript
// 必要なコンポーネント（未実装）
<NumberInput
  label="レベル時間（分）"
  min={1}
  max={60}
  value={levelDuration / 60}
  onChange={(minutes) => dispatch({
    type: 'UPDATE_LEVEL_DURATION',
    payload: { levelDuration: minutes * 60 }
  })}
/>
```

**影響度**: **高**
- ユーザーがレベル時間をカスタマイズできない
- プリセットの設定に固定される

---

### 1.5 ブラインド構造編集

| 設定項目 | コンポーネント実装 | UI統合 | 状態 |
|---------|------------------|--------|------|
| **SB/BB/Ante編集** | ✅ BlindEditor.tsx | ❌ | 未統合 |
| **レベル追加** | ✅ BlindEditor.tsx | ❌ | 未統合 |
| **レベル削除** | ✅ BlindEditor.tsx | ❌ | 未統合 |
| **レベル順序変更** | ❌ 未実装 | ❌ | 未実装 |

**実装コード**:
```typescript
// src/components/BlindEditor/BlindEditor.tsx (実装済み)
export function BlindEditor({ blindLevels, onChange }: BlindEditorProps) {
  // ✅ 完全に実装されている
  // ✅ ユニットテスト合格
  // ❌ しかしMainLayoutに統合されていない
}
```

**欠けているUI統合**:
```typescript
// MainLayout.tsx で必要な統合（未実装）
{showSettings && (
  <SettingsPanel>
    <BlindEditor
      blindLevels={currentPreset.blindLevels}
      onChange={(levels) => {
        // プリセットを更新
      }}
    />
  </SettingsPanel>
)}
```

**影響度**: **最高**
- ユーザーがブラインド構造を全くカスタマイズできない
- 要求仕様2.1.2の中核機能

---

### 1.6 プリセット管理

| 設定項目 | バックエンド実装 | UI実装 | 状態 |
|---------|-----------------|--------|------|
| **プリセット新規作成** | ✅ usePresets.addPreset() | ❌ | ボタンなし |
| **プリセット編集** | ✅ usePresets.updatePreset() | ⚠️ | ボタンあり、機能未接続 |
| **プリセット削除** | ✅ usePresets.deletePreset() | ⚠️ | ボタンあり、機能未接続 |

**実装コード**:
```typescript
// src/hooks/usePresets.ts (実装済み)
export function usePresets() {
  const addPreset = useCallback((preset) => { ... }); // ✅ 実装済み
  const updatePreset = useCallback((id, updates) => { ... }); // ✅ 実装済み
  const deletePreset = useCallback((id) => { ... }); // ✅ 実装済み
}

// src/components/PresetManager/PresetManager.tsx (部分実装)
<button onClick={(e) => handleEdit(e, preset.id)}>編集</button>
<button onClick={(e) => handleDelete(e, preset.id)}>削除</button>
// ✅ ボタンは存在
// ❌ しかし onEdit, onDelete props が未定義
```

**欠けているUI統合**:
```typescript
// MainLayout.tsx で必要な統合（未実装）
<PresetManager
  presets={presets}
  currentPresetId={currentPresetId}
  onLoad={loadPreset}  // ✅ 実装済み
  onEdit={handleEditPreset}  // ❌ 未実装
  onDelete={handleDeletePreset}  // ❌ 未実装
/>

// 必要な新規作成ボタン（未実装）
<button onClick={handleCreateNewPreset}>新規プリセット作成</button>
```

**影響度**: **最高**
- ユーザーがカスタムプリセットを全く作成できない
- デフォルトプリセットしか使用できない
- 要求仕様2.5.2の中核機能

---

## 2. UI統合ギャップの定量分析

### 2.1 機能別ギャップ

| 機能カテゴリ | バックエンド実装 | UI統合 | ギャップ | ギャップ率 |
|------------|-----------------|--------|---------|-----------|
| 音声設定 | 4/4 (100%) | 0/4 (0%) | 4 | **100%** |
| キーボード設定 | 1/1 (100%) | 0/1 (0%) | 1 | **100%** |
| 休憩設定 | 3/3 (100%) | 0/3 (0%) | 3 | **100%** |
| レベル時間設定 | 1/1 (100%) | 0/1 (0%) | 1 | **100%** |
| ブラインド編集 | 3/4 (75%) | 0/4 (0%) | 4 | **100%** |
| プリセット管理 | 4/4 (100%) | 1/4 (25%) | 3 | **75%** |
| **合計** | **16/17 (94%)** | **1/17 (6%)** | **16** | **94%** |

### 2.2 影響度分析

| 影響度 | 機能数 | 具体例 |
|-------|--------|--------|
| **最高** | 7 | ブラインド編集、プリセット作成・編集・削除、休憩設定、レベル時間 |
| **高** | 3 | 音声ON/OFF、音量調整、キーボードショートカット設定 |
| **中** | 2 | インポート/エクスポート |
| **低** | 1 | レベル順序変更 |

---

## 3. ユーザーが実際にできること・できないこと

### ✅ できること（2項目のみ）

1. **テーマ変更** - ダーク/ライトモード切り替え
2. **プリセット選択** - デフォルトプリセット3種類から選択

### ❌ できないこと（16項目）

1. **音声をOFFにする**
2. **音量を調整する**
3. **カスタムプリセットを作成する**
4. **既存プリセットを編集する**
5. **既存プリセットを削除する**
6. **ブラインド金額を編集する**
7. **ブラインドレベルを追加する**
8. **ブラインドレベルを削除する**
9. **レベルの順序を変更する**
10. **休憩頻度を変更する**
11. **休憩時間を変更する**
12. **休憩を無効化する**
13. **レベル時間を変更する**
14. **キーボードショートカットを無効化する**
15. **プリセットをエクスポートする**
16. **プリセットをインポートする**

---

## 4. 要求仕様との詳細比較

### 4.1 要求仕様2.1.2「カスタマイズ機能」

| 要求項目 | バックエンド | UI | ユーザー |
|---------|------------|----|---------|
| ブラインド金額の自由編集 | ✅ | ❌ | ❌ |
| レベルの追加・削除 | ✅ | ❌ | ❌ |
| レベル順序の変更 | ❌ | ❌ | ❌ |

**達成度**: ❌ **0%**（ユーザー観点）

---

### 4.2 要求仕様2.2.1「タイマー設定」

| 要求項目 | バックエンド | UI | ユーザー |
|---------|------------|----|---------|
| レベル時間を変更可能 | ✅ | ❌ | ❌ |

**達成度**: ❌ **0%**（ユーザー観点）

---

### 4.3 要求仕様2.2.4「休憩時間」

| 要求項目 | バックエンド | UI | ユーザー |
|---------|------------|----|---------|
| 休憩カスタマイズ | ✅ | ❌ | ❌ |

**達成度**: ❌ **0%**（ユーザー観点）

---

### 4.4 要求仕様2.4.1「音声通知」

| 要求項目 | バックエンド | UI | ユーザー |
|---------|------------|----|---------|
| 音量のオン/オフ | ✅ | ❌ | ❌ |
| レベル調整 | ✅ | ❌ | ❌ |

**達成度**: ❌ **0%**（ユーザー観点）

---

### 4.5 要求仕様2.5.2「プリセット管理」

| 要求項目 | バックエンド | UI | ユーザー |
|---------|------------|----|---------|
| プリセット作成 | ✅ | ❌ | ❌ |
| プリセット編集 | ✅ | ⚠️ | ❌ |
| プリセット削除 | ✅ | ⚠️ | ❌ |
| プリセット選択 | ✅ | ✅ | ✅ |

**達成度**: ⚠️ **25%**（ユーザー観点）

---

## 5. 推奨される対策

### 5.1 緊急対応（工数: 4-6時間）

#### 対策1: SettingsPanel.tsx の完全実装

**目的**: UI統合ギャップの解消
**優先度**: 最高
**工数**: 4-6時間

**実装内容**:
```typescript
export function SettingsPanel() {
  const { state, dispatch } = useSettings();
  const tournament = useTournament();
  const presets = usePresets();

  return (
    <div className={styles.panel}>
      {/* 1. 音声設定セクション */}
      <section>
        <h3>音声設定</h3>
        <Toggle
          label="音声通知"
          value={state.settings.soundEnabled}
          onChange={(enabled) =>
            dispatch({ type: 'SET_SOUND_ENABLED', payload: { enabled } })
          }
        />
        <Slider
          label="音量"
          min={0}
          max={1}
          step={0.1}
          value={state.settings.volume}
          onChange={(volume) =>
            dispatch({ type: 'SET_VOLUME', payload: { volume } })
          }
        />
      </section>

      {/* 2. プリセット管理セクション */}
      <section>
        <h3>プリセット管理</h3>
        <button onClick={handleCreatePreset}>新規プリセット作成</button>
        <PresetManager
          presets={presets.presets}
          currentPresetId={presets.currentPresetId}
          onLoad={presets.loadPreset}
          onEdit={handleEditPreset}
          onDelete={presets.deletePreset}
        />
      </section>

      {/* 3. ブラインド構造編集セクション */}
      <section>
        <h3>ブラインド構造</h3>
        <BlindEditor
          blindLevels={tournament.state.blindLevels}
          onChange={(levels) =>
            tournament.dispatch({
              type: 'UPDATE_BLIND_LEVELS',
              payload: { blindLevels: levels }
            })
          }
        />
      </section>

      {/* 4. タイマー設定セクション */}
      <section>
        <h3>タイマー設定</h3>
        <NumberInput
          label="レベル時間（分）"
          value={tournament.state.levelDuration / 60}
          onChange={(minutes) =>
            tournament.dispatch({
              type: 'UPDATE_LEVEL_DURATION',
              payload: { levelDuration: minutes * 60 }
            })
          }
        />
      </section>

      {/* 5. 休憩設定セクション */}
      <section>
        <h3>休憩設定</h3>
        <NumberInput
          label="休憩頻度（レベル）"
          value={tournament.state.breakConfig.frequency}
          onChange={...}
        />
        <NumberInput
          label="休憩時間（分）"
          value={tournament.state.breakConfig.duration / 60}
          onChange={...}
        />
        <Toggle
          label="休憩を有効化"
          value={tournament.state.breakConfig.enabled}
          onChange={...}
        />
      </section>

      {/* 6. その他設定セクション */}
      <section>
        <h3>その他</h3>
        <Toggle
          label="キーボードショートカット"
          value={state.settings.keyboardShortcutsEnabled}
          onChange={(enabled) =>
            dispatch({
              type: 'SET_KEYBOARD_SHORTCUTS_ENABLED',
              payload: { enabled }
            })
          }
        />
      </section>
    </div>
  );
}
```

**期待される効果**:
- UI統合ギャップ: 94% → **10%**
- ユーザーアクセス可能機能: 6% → **90%**

---

### 5.2 追加対応（工数: 2-3時間）

#### 対策2: プリセット作成・編集ダイアログの実装

**必要なコンポーネント**:
- PresetFormDialog.tsx
- ConfirmDialog.tsx（削除確認用）

---

## 6. 結論

### 6.1 現状の評価

**バックエンド**: ✅ 98% 完成（極めて優秀）
**UI統合**: ❌ **6%のみ**（ほぼ未統合）
**ユーザー体験**: ❌ **極めて限定的**

### 6.2 最終判定

プロダクションレディ判定: **❌ 不合格**

**理由**:
- 要求仕様の中核機能（カスタマイズ）がUIから全くアクセスできない
- ユーザーはデフォルトプリセットしか使用できない
- 音声・休憩・レベル時間などの設定変更が不可能

**リリース可能条件**:
- SettingsPanel.tsx の完全実装（対策1）
- プリセット作成・編集ダイアログの実装（対策2）

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-29 | 初版作成 | システムアーキテクト兼リードエンジニア |

