## Resonite コンポーネント ビューア（ローカルJSON）

このフォルダには、Resonite のコンポーネントカテゴリをローカルJSONで管理し、Webで閲覧できる最小構成が含まれます。

- `index.html` / `styles.css` / `app.js`: ビューア
- `Assets/components/<Tag>.json`: データ（分割JSON）

参考: データの出典（カテゴリ情報）
- Resonite Wiki - カテゴリ:コンポーネント: `https://wiki.resonite.com/Category:Components`

### データ配置（分割JSON対応）

本ビューアは分割JSONのみを読み込みます。

1) 分割JSON（タグごと）
- 置き場所: `./Assets/components/`
- 命名: `<Tag>.json`
  - 例: `Assets.json`, `Audio.json`, `CommonUI.json`（スペースは除去）
- 形式は次のいずれか:
  - A. 単一カテゴリオブジェクト:
    ```json
    {
      "Summary": "説明",
      "Category": { /* 子カテゴリ */ },
      "Components": { /* コンポーネント */ }
    }
    ```
  - B. ラップ形式:
    ```json
    {
      "Category": {
        "Assets": {
          "Summary": "説明",
          "Components": {}
        }
      }
    }
    ```
  - どちらでも自動で正規化されます。

注意: ルート直下の `./components.json` は使用しません（読み込み対象外）。

### 使い方

1) ブラウザで `index.html` を開く
- 直接開いた場合（file://）はブラウザの制約により `Assets/components` 配下のJSONをフェッチできないことがあります。その際は空表示になります。ローカルHTTPサーバで提供するか、次の手順2のファイル選択で読み込んでください。

2) 自分のJSONを読み込む
- 画面上部の「ファイル選択」から JSON を選ぶと、その場で差し替え表示されます。

3) ローカルサーバで動かす（任意）
- ローカルHTTPサーバを利用すると `<Tag>.json` を自動読込できます。
  - Node.js: `npx http-server .` など
  - Python: `py -m http.server 8080`
  - VSCode/Cursor の Live Server など

### JSON 仕様

例（キー名はご指定どおり `Category` / `Components` を使用）:

```json
{
  "Category": {
    "Assets": {
      "Summary": "カテゴリの説明テキスト",
      "Category": {
        "Export": {
          "Summary": "サブカテゴリの説明",
          "Components": {
            "AudioExportable": {
              "Description": "コンポーネントの説明"
            }
          }
        }
      },
      "Components": {
        "DesktopTextureProvider": {
          "Description": "説明"
        },
        "NullTextureProvider": {
          "Description": "説明"
        }
      }
    }
  }
}
```

- ルートに `Category`（オブジェクト）を必須とします。
- 各カテゴリは任意で `Summary`（文字列）、`Category`（子カテゴリのオブジェクト）、`Components`（コンポーネントのオブジェクト）を持てます。
- 各コンポーネントは任意で `Description`（文字列）を持てます。

### 検索

- 上部の検索ボックスで、カテゴリ名・カテゴリ説明・コンポーネント名・コンポーネント説明の部分一致検索ができます。
- 一致した枝のみが残る形でツリーを再構築して表示します。

### カスタマイズのヒント

- 追加フィールド（例: `url`, `Tags`, `Deprecated` など）をJSONに増やし、`app.js` の `renderComponent` / `renderCategory` でレンダリングを拡張できます。
- 大規模化しても軽快に動くよう、クライアントサイドで再帰レンダリング＋差分更新にしています。

### 注意

- 本リポジトリの初期JSONはサンプルです。実データは必要に応じて手動で追記・編集してください。


