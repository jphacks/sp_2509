# Vercel & Render 自動デプロイ設定メモ

Next.js（フロントエンド）とFastAPI（バックエンド）のモノリポ構成アプリを、VercelとRenderに自動デプロイするための手順。

## 1. プロジェクト初期設定

1.  **ディレクトリ作成:**
    `frontend`と`backend`ディレクトリをルートに作成。

2.  **バックエンド (FastAPI) セットアップ:**
    *   `backend/main.py`: CRUD APIとSQLite設定を記述。
    *   `backend/requirements.txt`: `fastapi`, `uvicorn`, `databases[sqlite]`, `sqlalchemy` 等必要なライブラリを記述。

3.  **フロントエンド (Next.js) セットアップ:**
    *   `frontend`内で`npx create-next-app`を実行。
    *   `frontend/src/app/page.tsx`: バックエンドからHello, World!を取得して表示するだけのボタンを記述。

4.  **.gitignore作成:**
    ルートに`.gitignore`を作成。`node_modules`, `.next`, `.venv`等をバージョン管理から除外。

## 2. バックエンド (Render) デプロイ設定

1.  **`render.yaml`作成:**
    プロジェクトルートに作成。`plan: free`で無料プランを指定。

    ```yaml
    services:
      - type: web
        name: sp2509-backend-fastapi # サービス名
        runtime: python
        plan: free # 無料プラン
        repo: https://github.com/jphacks/sp_2509 # 実際のGitHubリポジトリ
        branch: main
        buildCommand: "pip install -r backend/requirements.txt"
        startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
        envVars:
          - key: DATABASE_URL
            fromDatabase:
              name: postgres
              property: connectionString

    databases:
      - name: sp2509-backend-postgres
        plan: free
    ```

    ローカル開発ではSQLiteを使用し、Render環境ではPostgreSQLを使用する構成にする

2.  **Renderダッシュボード設定:**
    *   「New Blueprint Instance」からGitHubリポジトリを連携。
    *   `render.yaml`が自動検出されデプロイ開始。
    *   デプロイ完了後、発行されたURLをコピー。

## 3. フロントエンド (Vercel) デプロイ設定

1.  **Vercelダッシュボード設定:**
    *   「Add New... -> Project」からGitHubリポジトリをインポート。
    *   **Configure Project:**
        *   **Framework Preset:** `Next.js`
        *   **Root Directory:** `frontend`
    *   `Deploy`をクリック。

## 4. VercelとRenderの連携

1.  **Vercel環境変数設定:**
    *   プロジェクトの `Settings` > `Environment Variables` に移動。
    *   以下の環境変数を追加。
        *   **Name:** `NEXT_PUBLIC_API_URL`
        *   **Value:** 手順2でコピーしたRenderのURL
    *   保存すると自動で再デプロイ。

## 5. 自動デプロイ(CD)の仕組み

`main`ブランチへのpushで、VercelとRenderがそれぞれ自動でビルド＆デプロイを実行。

## 6. トラブルシューティング

-   **エラー:** `Failed to fetch`
-   **原因:** Vercelの環境変数 `NEXT_PUBLIC_API_URL` が未設定、またはURLが誤っている可能性。
-   **解決策:** 手順4に戻り、RenderのURLがVercelの環境変数に正しく設定されているか確認。

## 7. 開発環境のセットアップとローカル実行

新しい開発者がプロジェクトに参加した場合、以下の手順で環境をセットアップします。

**推奨VS Code拡張機能**

*   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint): コードの静的解析とフォーマットのために必須です。

**VS Codeのチーム共通設定**

このリポジトリには、チーム全体の開発体験を統一するため、VS Codeの共通設定ファイル (`.vscode/settings.json`) が含まれています。

リポジトリをクローンすると、この設定がVS Codeに自動的に読み込まれ、以下の機能が有効になります。

*   **保存時の自動フォーマット**:
    *   TypeScript/JavaScript (`.ts`, `.tsx`) ファイルを保存すると、ESLintのルールに従って自動でコードが整形されます。

**開発者が行うこと:**

*   推奨拡張機能である **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)** をインストールしてください。

これだけで、特別な設定をせずともチーム共通のフォーマットルールが自動で適用されます。

1.  **セットアップスクリプトの実行:**
    プロジェクトのルートで以下のコマンドを実行します。これにより、必要な依存関係のインストールとGitフックの有効化が自動で行われます。

    ```bash
    bash setup.sh
    ```
    *初回実行時や、`setup.sh`自体に変更があった場合は、`chmod +x setup.sh`で実行権限を付与する必要があるかもしれません。*

2.  **バックエンドの実行:**
    *   仮想環境を有効化します。
        ```bash
        source backend/.venv/bin/activate
        ```
    *   FastAPIサーバーを起動します。
        ```bash
        uvicorn backend.main:app --reload
        ```
    *   ブラウザで `http://127.0.0.1:8000/docs` にアクセスすると、APIドキュメントが確認できます。

3.  **フロントエンドの実行:**
    *   `frontend`ディレクトリで開発サーバーを起動します。
        ```bash
        cd frontend
        npm run dev
        ```
    *   ブラウザで `http://localhost:3000` にアクセスすると、アプリケーションが表示されます。

## 8. CI/CD とコード品質

### a. CI (継続的インテグレーション) on GitHub Actions

`main`ブランチへのプルリクエスト時に、フロントエンドとバックエンドのビルドが通るかを自動でチェックします。

**ブランチ保護ルールの設定（推奨）**

CIチェックが完了するまでマージを禁止するには、GitHub上でブランチ保護ルールを設定します。これにより、品質が担保されたコードのみが`main`ブランチにマージされるようになります。

1.  対象リポジトリの **Settings** > **Branches** に移動します。
2.  **Branch protection rules**セクションで、**Add rule** をクリックします。
3.  **Branch name pattern** に `main` と入力します。
4.  **Require status checks to pass before merging** を有効にします。
    *   **Require branches to be up to date before merging** も有効にすると、より厳格な運用ができます。
5.  必須とするステータスチェックを検索し、以下を選択します。
    *   `build`
6.  **Create** をクリックしてルールを保存します。

この設定後、CIが成功しないプルリクエストはマージできなくなります。

**ワークフローファイル**

CIの実体は、`.github/workflows`ディレクトリ内の以下のYAMLファイルです。

*   **`frontend-ci.yml` (フロントエンドCI):**
    `frontend`ディレクトリの変更を検知し、`npm install`, `npm run lint`, `npm run build` を実行します。
    ```yaml
    name: Frontend CI

    on:
      pull_request:
        branches:
          - main
        paths:
          - 'frontend/**'

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'

          - name: Install dependencies
            run: npm install
            working-directory: ./frontend

          - name: Run linter
            run: npm run lint
            working-directory: ./frontend

          - name: Build project
            run: npm run build
            working-directory: ./frontend
    ```

*   **`backend-ci.yml` (バックエンドCI):**
    `backend`ディレクトリの変更を検知し、依存関係のインストール（ビルドチェック）を実行します。
    ```yaml
    name: Backend CI

    on:
      pull_request:
        branches:
          - main
        paths:
          - 'backend/**'

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Python
            uses: actions/setup-python@v5
            with:
              python-version: '3.11'

          - name: Install PostgreSQL client
            run: sudo apt-get install -y libpq-dev

          - name: Install dependencies
            run: pip install -r backend/requirements.txt
    ```


### b. コード品質チェック (Husky & lint-staged)

`setup.sh`を実行することで、フロントエンドのGitコミット時に自動でコード品質チェックが走る仕組み（Gitフック）が有効になります。

*   **Frontend (`.ts`, `.tsx`ファイル):**
    *   `husky`と`lint-staged`を利用します。
    *   `eslint --fix`が実行され、コードのチェックと自動修正が行われます。
    *   設定は`frontend/package.json`に記述されています。

*注意: もし過去に`pre-commit`を有効化していてコミットエラーが出る場合は、`pre-commit uninstall`コマンドを実行してフックを解除してください。*
