# swiftia-site-starter

Swiftia の顧客サイト用テンプレートリポジトリ（1顧客 = 1リポジトリ）。
CMS 管理画面の「公開サイト作成」がこのテンプレートから顧客リポジトリを自動生成し、
GitHub Actions（Direct Upload）で Cloudflare Pages へデプロイする。

## 構成

| パス | 役割 |
|---|---|
| `.github/workflows/deploy.yml` | main への push / workflow_dispatch で `wrangler pages deploy` を実行 |
| `functions/_middleware.js` | SEO/OGP エッジ注入（Pages Function・swiftia-sdk のビルド成果物。直接編集しない） |
| `_routes.json` | Function 起動を HTML に限定（静的アセットは exclude ＝課金対象外） |
| `index.html` / `404.html` / `assets/` | プレースホルダ。デザイナー納品の静的HTMLで置き換える |

## 新規案件の流れ

1. CMS 管理画面でプロジェクト作成 → 「公開サイト作成」（このテンプレートから `customer-{slug}-site` が自動生成される）
2. デザイナー納品の静的HTMLをリポジトリ直下に配置（プレースホルダは削除）
3. CMS の SDK 置換プロンプト（プロジェクト詳細）を使って Swiftia SDK に置き換え
4. 各ページの `</body>` 直前に管理画面の「SDKスニペット」を貼り付け
5. main へ push → 自動で `{slug}.pages.dev`（仮環境）へ反映

## SEO/OGP エッジ注入について

- `functions/_middleware.js` が本番カスタムドメインの HTML 応答に title / description / og:* を焼き込む
- 設定は HTML 内の SDK スクリプトタグ（`data-api-key` / `data-api-base`）から読む＝追加設定不要
- `*.pages.dev`（仮環境）と `?swiftia_preview_token` 付き URL は注入しない
- 失敗時は素の HTML を返す（fail-open）ため、注入がサイトを落とすことはない
- 更新手順: swiftia-sdk で `pnpm build` → `packages/pages-middleware/dist/_middleware.js` をコピー

## 注意

- Secrets（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）と Variable（`PAGES_PROJECT_NAME`)は CMS が自動注入する。手動設定は不要
- `assets/` 以外に静的ディレクトリを追加した場合は `_routes.json` の exclude にも追加する（Function の無駄起動を防ぐ）
