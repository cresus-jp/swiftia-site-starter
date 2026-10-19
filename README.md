# swiftia-site-starter

> **デザイナーの方へ**：このページは前半の「デザイナーの方へ」だけ読めば大丈夫です。
> 後半の「エンジニア向け」は読まなくて構いません。

## デザイナーの方へ

### これは何？

このフォルダは、**{{案件名}} の Web サイトそのもの**です。

ここに HTML・CSS・画像を入れて GitHub にアップロードすると、数分後に**自動でテスト用サイトに表示**されます。
FTP でサーバーにアップする作業はありません。フォルダの中身が、そのまま Web サイトとして公開されます。

案件ごとに 1 つずつ用意されていて、最初は「準備中」の仮ページだけが入っています。
これを、あなたがデザインしたページに置き換えていくのが制作のお仕事です。

> 上のタイトルの「swiftia-site-starter」は、この案件フォルダの元になった**ひな形の名前**です。気にしなくて大丈夫です。

### お仕事の流れ

1. **招待を受け取る** — 担当者から GitHub の招待メールが届きます。承諾して、このフォルダを自分のパソコンにコピーします
2. **ページを作る** — いつもどおり HTML・CSS・画像を作ります
3. **アップロードする** — アップロードすると、自動でテスト用サイト {{テストサイトURL}} に反映されます
4. **お客様の確認** — お客様がテスト用サイトでデザインを確認・承認します
5. **仕上げと公開** — エンジニアが「お知らせ」や「お問い合わせフォーム」などを管理画面から更新できる形に仕上げて、本番公開します

**本番公開したあとの修正について**：公開後にアップロードした内容は、いきなり本番サイトには出ません。
まず別のテスト用サイト {{公開後テストサイトURL}} に反映され、確認が済んでから担当者が本番に反映します。
安心して修正をアップロードしてください。

### 最初に読むもの（この順番で）

手順書はすべて `docs` フォルダに入っています。

| 順番 | 手順書 | 内容 |
|---|---|---|
| 1 | [GitHub はじめてガイド](docs/github-first-steps.md) | アカウント作成〜このフォルダを自分のパソコンにコピーするまで |
| 2 | [Git かんたんマニュアル（Mac 編）](docs/git-guide-mac.md) / [（Windows 編）](docs/git-guide-windows.md) | ふだんのアップロード手順 |
| 3 | [コーディングガイドライン](docs/designer-coding-guidelines.md) | HTML・CSS・JS の書き方のルール（**必読**） |
| 必要なとき | [お問い合わせフォームの書き方](docs/contact-form-html-rules.md) | フォームのページを作るとき |
| 必要なとき | [JS ライブラリの書き方](docs/js-library-rules.md) | スライダーなどの JS を 1 行でも書くとき |

### フォルダの中身

| 名前 | 中身 | あなたがすること |
|---|---|---|
| `index.html` | トップページ（今は仮の「準備中」ページ） | 自分のデザインに置き換える |
| `404.html` | 「ページが見つかりません」のページ | デザインに合わせて作り直す（**ファイルは消さない**） |
| `assets/` | CSS・JS・画像の置き場所 | ここに入れる |
| `_private/` | 仕様書・お客様からの素材・メモの置き場所 | 公開したくないものはここへ |
| `docs/` | 手順書 | 読む |
| `_headers` `_routes.json` `.github/` | サイトを公開するための仕組み | **触らない・消さない**（静的ファイルのフォルダを足すときは [コーディングガイドライン](docs/designer-coding-guidelines.md) の 2-1） |
| `README.md` | この説明書 | — |

### 必ず守ってほしいこと

1. **公開したくないファイルは `_private` フォルダへ**
   それ以外の場所に置いたファイルは、**インターネット上で誰でもダウンロードできる状態**になります。
   仕様書やお客様の素材を、うっかりトップに置かないよう注意してください。
   ※ パスワードは `_private` にも置かないでください（案件メンバー全員が見られます）
2. **「触らない」ファイルは編集も削除もしない**
   サイトの公開が止まったり、検索エンジン向けの設定が壊れたりします
3. **`404.html` は消さない／`sitemap.xml` と `robots.txt` は作らない**
   どちらも検索エンジン向けの設定に関わります。`sitemap.xml` と `robots.txt` は自動で用意されるので、作る必要はありません
4. **テスト用サイトの URL をむやみに広めない**
   検索には出てきませんが、URL を知っていれば誰でも見られます

### 困ったときは

わからないことがあれば、遠慮なく担当者（コーディネーター／エンジニア）に連絡してください。
「こういうことをしたい」「この場所に新しいフォルダを作りたい」など、迷ったら作業前に相談してもらえると助かります。

---

## エンジニア向け

ここから下は、案件の立ち上げ・保守をするエンジニア向けの情報です。

Swiftia の顧客サイト用テンプレートリポジトリ（1顧客 = 1リポジトリ）。
CMS 管理画面の「公開サイト作成」がこのテンプレートから顧客リポジトリを自動生成し、
GitHub Actions（Direct Upload）で Cloudflare Pages へデプロイする。

### 構成

| パス | 役割 |
|---|---|
| `.github/workflows/deploy.yml` | main への push / workflow_dispatch で `wrangler pages deploy` を実行（`docs/` `_private/` と README は配信対象から除外） |
| `_headers` | `*.pages.dev`（仮環境・テストサイトのブランチ別名）への noindex 付与（Worker を通らないホストのため） |
| `_routes.json` | `exclude` のパス（静的アセット）は Swiftia の一元運用の Worker を通さない（CMS がこの `exclude` を読んで Worker のルートから外す＝課金対象外） |
| `index.html` / `404.html` / `assets/` | プレースホルダ。デザイナー納品の静的HTMLで置き換える |
| `docs/` | デザイナー向けドキュメント（コーディングガイドライン・Git マニュアル等）。公開サイトには配信されない。原本は swiftia-sdk の `docs/` |
| `_private/` | 仕様書・顧客支給素材・案件メモの置き場。コミットするが公開サイトには配信されない（詳細は `_private/README.md`） |

### 新規案件の流れ

1. CMS 管理画面でプロジェクト作成 → 「公開サイト作成」（このテンプレートから `customer-{slug}-site` が自動生成される）
2. デザイナー納品の静的HTMLをリポジトリ直下に配置（プレースホルダは削除）。デザイナーへの案内は `docs/github-first-steps.md`（アカウント作成〜clone）→ `docs/git-guide-mac.md` / `docs/git-guide-windows.md`（日常作業）→ `docs/designer-coding-guidelines.md`（コーディング規約）の順
3. CMS の SDK 置換プロンプト（プロジェクト詳細）を使って Swiftia SDK に置き換え
4. 各ページの `</body>` 直前に管理画面の「SDKスニペット」を貼り付け
5. main へ push → 自動で `{slug}.pages.dev`（仮環境。README 前半のテスト用サイト）へ反映。Worker を通るテストサイト `{CMS のサブドメイン}-test.swiftia.app`（CMS の公開サイトタブに出る）にも出て、メタ注入まで確かめられる
6. 本番公開（CMS で本番昇格）後は push の反映先がテストサイトへ切り替わる（下記）

### デプロイ先の切り替え（本番公開後）

本番公開後に push がそのまま本番へ出ると、顧客サイトが変わる前に確認できる場所が無くなる。
そのため deploy.yml はイベントごとにデプロイ先を分ける。

| きっかけ | デプロイ先 | 配信URL |
|---|---|---|
| `main` への push（本番公開**前**） | production | `{slug}.pages.dev` ＋ 接続済みカスタムドメイン |
| `main` への push（本番公開**後**） | preview（`PAGES_PUSH_BRANCH`） | `preview.{slug}.pages.dev`（テストサイト） |
| workflow_dispatch（CMS の「本番へ反映する」/ Actions の Run workflow） | production | `{slug}.pages.dev` ＋ 接続済みカスタムドメイン |

- 切り替えは CMS が Actions Variable `PAGES_PUSH_BRANCH` を書き換えることで行う（本番昇格で `preview`、昇格の取り消しで `main`）
- Variable が無いリポジトリでは `main` にフォールバックするため、**従来どおり push = 即本番**のまま動く
- テストサイト（`preview.{slug}.pages.dev`）は最初の preview デプロイが走るまで存在しない
- テストサイトの Origin は CMS 側で CORS 自動許可されるので、SDK は実データを引ける

### エッジ配信（Swiftia の一元運用の Worker）について

- 新しいサイトは、CMS の「公開サイト作成」で最初から Swiftia の一元運用の Worker を通る（Pages の前段で動く。
  CMS の `公開サイト > エッジ配信`。リポジトリに Functions は置かない）
- Worker が本番ドメインとテストサイトの HTML 応答に title / description / og:* を入れ、`/sitemap.xml`・`/robots.txt` を配信し、
  ページビューを計測する。設定は HTML 内の SDK スクリプトタグ（`data-api-key` / `data-api-base`）から読む＝追加設定不要
- SDK v2（`sdk@2.js`）のページは、CMS で「本文も焼く」にすると、Worker が一覧・詳細を初期 HTML に焼き、ブラウザは API を呼ばずに引き継ぐ
- テストサイトの全応答には `X-Robots-Tag: noindex` を付ける。`*.pages.dev` は Worker を通らないので、`_headers` で noindex を付ける
- `?swiftia_preview_token` 付き URL は注入・焼き込みをしない。失敗時は素の HTML を返す（fail-open）
- 参照（CSS・JS・画像・内部リンク）は**ルート絶対パス**で書く（詳細ページをパス形式の URL `/works/42` で配信しても壊れないように。`docs/designer-coding-guidelines.md` §3-2）
- **`functions/_middleware.js` を置かない。** 置くと Worker と二重に動き、ページビューを二重に数える（CMS は、本番に `_middleware.js` があると Worker への切り替えを拒む）

### sitemap.xml / robots.txt について

- Worker が `/sitemap.xml` と `/robots.txt` を配信する
- `sitemap.xml` の中身は CMS が生成する。コンテンツの公開・更新が即 sitemap に反映されるため、案件ごとに静的ファイルを書き換える運用は不要
- 有効化は CMS 管理画面のプロジェクト詳細 →「サイトマップ配信」カード（本番URLパターンと静的ページを設定する）
- `robots.txt` は `Sitemap: https://{host}/sitemap.xml` 行を含む最小構成を Worker が生成する
- **リポジトリに実ファイル（`sitemap.xml` / `robots.txt`）を置いた場合はそちらを優先する**ので、手作りのものを使いたい案件はファイルを置けばよい
- テストサイトと `*.pages.dev` では配信しない（インデックスされるのを防ぐ）
- CMS 側が無効・取得失敗のときは元の応答（404）をそのまま返す（fail-open）

### 注意

- README 前半の二重波括弧で囲んだプレースホルダ（案件名・テストサイトURL・公開後テストサイトURL）は、CMS が「公開サイト作成」時に案件の値へ置き換えてコミットする（swiftia `CreateProjectSiteAction`）。文言を変えるときはプレースホルダの綴りを変えないこと。また置き換えは README 全体に効くので、説明のためにプレースホルダそのものを書かないこと
- Secrets（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）と Variable（`PAGES_PROJECT_NAME` / `PAGES_PUSH_BRANCH`）は CMS が自動注入する。手動設定は不要
- **除外リストに無いファイルはすべて公開される。** リポジトリ直下にコミットしたファイルは `https://{host}/{ファイル名}` でダウンロードできる状態になる。仕様書・顧客支給素材・パスワードを含むメモ等は `_private/` に置く（`.gitignore` するのではなく、コミットしたうえで配信除外する運用）
- `assets/` 以外に静的ディレクトリを追加した場合は `_routes.json` の exclude にも追加し、CMS の `エッジ配信` で「ルートを同期し直す」を押す（Worker の無駄起動を防ぐ）
- `docs/` の原本は swiftia-sdk の `docs/` にある。更新は swiftia-sdk 側で行い、`node scripts/sync-designer-docs.mjs <このリポジトリのパス>` で同期する
- **このテンプレートの更新は新規生成リポジトリにしか効かない。** 既存の納品リポジトリを一元運用の Worker へ移すには、`functions/_middleware.js` を外して `_headers` を足し、CMS で切り替える（Swiftia 本体の `site-delivery.md` §7「エッジ配信の切り替え」）。docs 除外デプロイや公開後のデプロイ分離は `.github/workflows/deploy.yml` を個別に反映する
