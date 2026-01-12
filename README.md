## Resonite コンポーネント / ProtoFlux ノード ビューア

Resonite の「Components」と「ProtoFlux ノード」をローカルの分割JSONからブラウザで閲覧する最小構成です。

- `index.html` / `Assets/css/styles.css` / `Assets/js/*.js`: ビューア本体
- `Assets/components/<Tag>.json`: Components 用データ（分割JSON）
- `Assets/FluxNodes/<Tag>.json`: ProtoFlux 用データ（分割JSON）

参考（データ出典）:
- Components: `https://wiki.resonite.com/Category:Components`
- ProtoFlux: `https://wiki.resonite.com/Category:ProtoFlux`

### 対応データと配置（分割JSON）

本ビューアは「タグごとに分割された JSON」を読み込みます（単一巨大JSONは対象外）。

- Components: `./Assets/components/`
- ProtoFlux: `./Assets/FluxNodes/`
- 命名規則: `<Tag>.json`（タグ名のスペースは除去）
  - 例: `Common UI` -> `CommonUI.json`, `Radiant UI` -> `RadiantUI.json`
- JSON 形式は次のいずれか（自動で正規化されます）:
  - A. 単一カテゴリオブジェクト
    ```json
    {
      "Summary": "説明",
      "Category": {},
      "Components": {}
    }
    ```
  - B. ラップ形式
    ```json
    {
      "Category": {
        "Assets": {
          "Summary": "説明",
          "Category": {},
          "Components": {}
        }
      }
    }
    ```

注意: ルート直下の統合ファイル（例: `./components.json`）は読み込み対象外です。

### 使い方

1) ローカルHTTPサーバで提供する（推奨）
   - Node.js:
     ```bash
     npx http-server .
     ```
   - Python:
     ```bash
     py -m http.server 8080
     ```
   - VSCode/Cursor の Live Server なども可

2) ブラウザで開く
   - 例: `http://localhost:8080/` を開き、`index.html` を表示

3) 画面の使い方
   - 左上トグル: 「Components / FluxNodes」を切り替え
   - タグバー: 上位カテゴリ単位で絞り込み（`all` は全表示）
   - 検索ボックス: カテゴリ名・Summary・コンポーネント名・Description を部分一致検索
   - クリア: 検索条件を解除
   - 階層表示スライダー: 自動で開くレベルを 0〜4 で調整

### JSON 仕様

- 必須: ルートに `Category`（オブジェクト）
- 任意: 各カテゴリに `Summary`（文字列）、`Category`（子カテゴリのオブジェクト）、`Components`（コンポーネントのオブジェクト）
- 任意: 各コンポーネントに `Description`（文字列）

最小例:
```json
{
  "Category": {
    "Assets": {
      "Summary": "カテゴリの説明",
      "Category": {},
      "Components": {
        "DesktopTextureProvider": { "Description": "説明" }
      }
    }
  }
}
```

### 検索・フィルタ挙動

- 検索は一致した枝のみを残す形でツリーを再構築します。
- タグバーは最上位カテゴリ名でのフィルタです（`all` は無制限）。
- 階層表示は `<details>` の open をレベルに応じて自動付与します。

### カスタマイズのヒント

- タグの追加/変更: `Assets/js/constants.js` の `COMPONENT_TAGS` / `FLUX_TAGS` を編集
  - 追加したタグに対応する JSON（スペース除去名）を配置してください。
- 読み込みディレクトリ: `Assets/js/constants.js` の `COMPONENTS_BASE_DIR` / `FLUX_BASE_DIR`
- レンダリング拡張: `Assets/js/render.js` の `renderCategory` / `renderComponent`
  - 例: JSON に `url` や `Tags`, `Deprecated` などを追加し、表示を拡張

### 注意

- 本リポジトリの JSON はサンプルです。実データは必要に応じて手動で追記・編集してください。
