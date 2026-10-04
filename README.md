# simple-todo-app

ブラウザだけで動くシンプルなTODOリストアプリです。
データはブラウザの localStorage に保存されます（ログイン不要）。
TypeSafe AI の [Jev](https://docs.typesafe.ai/introduction) を使って、TODO のカテゴリ・優先度・急ぎかどうかを自動で判定します（API キーがないときは判定なしで動きます）。

## 機能

- TODOの追加・削除
- 完了/未完了の切り替え
- 「すべて / 未完了 / 完了」での絞り込み
- 完了済みTODOの一括削除
- ページを再読み込みしてもデータが残る（localStorage）
- Jev による自動判定（TODO 追加時に1回のリクエストでまとめて判定）
  - カテゴリ: 仕事 / プライベート / 買い物 / その他（Choice）
  - 優先度: 低 / 中 / 高（Score）
  - 急ぎマーク: 期限が今日〜1, 2日以内か（Noul）

## 使用技術

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Express](https://expressjs.com/)（API サーバー）+ [TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)

## 動かし方

Node.js（v20以上推奨）をインストールしてから、以下を実行します。

```bash
npm install
npm run dev
```

表示された URL（通常は http://localhost:5173 ）をブラウザで開いてください。

### Jev の自動判定も試すとき

1. `.env.example` をコピーして `.env` を作り、`TYPESAFE_API_KEY=` の後ろに API キーを書く（`.env` は Git に上がりません）
2. ターミナルを2つ開いて、それぞれで実行する

```bash
npm run dev:server   # API サーバー（http://localhost:8787）
npm run dev          # 画面（http://localhost:5173）
```

## その他のコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run build` | 本番用にビルド（`dist/` に出力） |
| `npm start` | ビルド結果と API を本番と同じサーバーで起動 |
| `npm run preview` | ビルド結果をローカルで確認 |
| `npm run lint` | コードのチェック |

## デプロイ（GCP Cloud Run）

`v1.0.0` のようなタグを push すると、GitHub Actions が自動で Cloud Run にデプロイします。

```bash
git tag v1.0.0
git push origin v1.0.0
```

初回の GCP / GitHub / Jev の設定手順は [docs/deploy-gcp.md](docs/deploy-gcp.md) を見てください。

## ファイル構成

- `src/App.tsx` … アプリ本体（画面とロジック）
- `src/App.css` … アプリのスタイル
- `src/index.css` … 全体のスタイル
- `server/index.ts` … API サーバー（画面の配信と `/api/classify`）
- `server/classify.ts` … Jev に聞く質問（カテゴリ・優先度・急ぎ）
- `Dockerfile` … Cloud Run で動かすためのコンテナ設定
- `.github/workflows/ci.yml` … PR / main への push 時にビルドとチェック
- `.github/workflows/deploy.yml` … タグ push 時に Cloud Run へデプロイ
