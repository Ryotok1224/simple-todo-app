# GCP (Cloud Run) へのデプロイ手順

`v1.0.0` のようなタグを GitHub に push すると、GitHub Actions
（`.github/workflows/deploy.yml`）が自動で以下を行います。

1. Docker イメージをビルド（`Dockerfile`。画面と API サーバーを1つのコンテナにまとめる）
2. Artifact Registry に push
3. Cloud Run にデプロイし、公開 URL を表示

GitHub Actions から GCP への認証には **Workload Identity 連携** を使います。
サービスアカウントの鍵（JSON ファイル）を GitHub に保存しないので安全です。

---

## 1. 初回だけやる GCP の準備

### 1-1. プロジェクトを用意する

1. https://console.cloud.google.com/ でプロジェクトを作成（既存のものでもOK）
2. 課金（請求先アカウント）を有効にする
   - Cloud Run は無料枠があり、このアプリ程度ならほぼ無料で収まります

### 1-2. Cloud Shell でコマンドを実行する

GCP コンソール右上の「Cloud Shell をアクティブにする」（`>_` アイコン）を押し、
以下の最初の 3 行を自分の値に書き換えてから、まとめて貼り付けて実行します。

```bash
PROJECT_ID=your-project-id          # ← 自分のプロジェクトID
REGION=asia-northeast1              # 東京リージョン
GITHUB_REPO=Ryotok1224/simple-todo-app

gcloud config set project "$PROJECT_ID"

# 必要な API を有効化
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com

# Docker イメージの置き場所（Artifact Registry）を作成
gcloud artifacts repositories create simple-todo-app \
  --repository-format=docker \
  --location="$REGION"

# GitHub Actions 用のサービスアカウントを作成して権限を付与
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions deployer"
SA="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA}" --role="$ROLE" --condition=None
done

# Workload Identity 連携の設定（このリポジトリからのアクセスだけを許可）
gcloud iam workload-identity-pools create github \
  --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${GITHUB_REPO}'"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${GITHUB_REPO}"

# ↓ この出力を次の手順で GitHub に登録します
echo "GCP_PROJECT_ID=${PROJECT_ID}"
echo "GCP_REGION=${REGION}"
echo "GCP_SERVICE_ACCOUNT=${SA}"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/providers/github-provider"
```

## 2. 初回だけやる GitHub の準備

リポジトリの **Settings → Secrets and variables → Actions → Variables** タブで
「New repository variable」を押し、最後に表示された 4 つを登録します。

| Name | 値の例 |
| --- | --- |
| `GCP_PROJECT_ID` | `my-project-123` |
| `GCP_REGION` | `asia-northeast1` |
| `GCP_SERVICE_ACCOUNT` | `github-deployer@my-project-123.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github-provider` |

※ どれもパスワードではないので Secrets ではなく Variables で大丈夫です。

## 3. Jev（AI自動判定）を有効にする（任意・初回だけ）

この手順をしなくてもアプリはデプロイできます（Jev の自動判定が OFF になるだけです）。

1. https://console.typesafe.ai/ で TypeSafe の API キーを発行する
2. Cloud Shell で以下を実行する（最初の行は自分の値に書き換え）

```bash
PROJECT_ID=your-project-id          # ← 自分のプロジェクトID

gcloud config set project "$PROJECT_ID"
gcloud services enable secretmanager.googleapis.com

# API キーを Secret Manager に保存する
# 実行すると入力待ちになるので、API キーを貼り付けて Enter → Ctrl+D を押す
gcloud secrets create typesafe-api-key --data-file=-

# Cloud Run（アプリ本体）がこのキーを読めるようにする
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding typesafe-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
```

3. GitHub の Variables に `TYPESAFE_SECRET_NAME` = `typesafe-api-key` を追加する

※ API キーそのものは GitHub にもコードにも置きません。Cloud Run が起動するときに Secret Manager から読み込みます。
※ キーを変えたいときは `gcloud secrets versions add typesafe-api-key --data-file=-` で新しい値を保存し、もう一度タグを push します。

## 4. デプロイする（毎回）

main ブランチの最新状態でタグを作って push します。

```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

GitHub の **Actions** タブで「Deploy to Cloud Run」が動きます。
完了するとログの最後に公開 URL（`https://simple-todo-app-xxxx.a.run.app`）が表示されます。

次に更新したいときは `v1.0.1`、`v1.1.0` のように番号を上げてタグを push してください。

## うまくいかないとき

- `Permission denied` / `PERMISSION_DENIED` … 1-2 のコマンドが途中で失敗していないか確認
- `GCP_... が空` のようなエラー … 2 の Variables の名前のつづりを確認
- Actions の画面で失敗したステップを開くと詳しいエラーが見られます
