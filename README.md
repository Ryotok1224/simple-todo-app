# simple-todo-app

ブラウザだけで動くシンプルなTODOリストアプリです。
ログインやサーバーは不要で、データはブラウザの localStorage に保存されます。

## 機能

- TODOの追加・削除
- 完了/未完了の切り替え
- 「すべて / 未完了 / 完了」での絞り込み
- 完了済みTODOの一括削除
- ページを再読み込みしてもデータが残る（localStorage）

## 使用技術

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)

## 動かし方

Node.js（v20以上推奨）をインストールしてから、以下を実行します。

```bash
npm install
npm run dev
```

表示された URL（通常は http://localhost:5173 ）をブラウザで開いてください。

## その他のコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run build` | 本番用にビルド（`dist/` に出力） |
| `npm run preview` | ビルド結果をローカルで確認 |
| `npm run lint` | コードのチェック |

## デプロイ（GCP Cloud Run）

`v1.0.0` のようなタグを push すると、GitHub Actions が自動で Cloud Run にデプロイします。

```bash
git tag v1.0.0
git push origin v1.0.0
```

初回の GCP / GitHub の設定手順は [docs/deploy-gcp.md](docs/deploy-gcp.md) を見てください。

## ファイル構成

- `src/App.tsx` … アプリ本体（画面とロジック）
- `src/App.css` … アプリのスタイル
- `src/index.css` … 全体のスタイル
- `Dockerfile` / `nginx.conf` … Cloud Run で動かすためのコンテナ設定
- `.github/workflows/ci.yml` … PR / main への push 時にビルドとチェック
- `.github/workflows/deploy.yml` … タグ push 時に Cloud Run へデプロイ
