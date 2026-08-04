# JSライブラリ実装規約（デザイナー向け）

このドキュメントは、Swiftia案件で **JavaScriptライブラリ（スライダー・ライトボックス・スクロールアニメ等）や独自スクリプトの初期化コードをどう書くか** のルールをまとめたものです。HTML構造のルール（お問い合わせフォームは `docs/contact-form-html-rules.md`）とは別の、**全ページ共通の規約**です。

## 0. このドキュメントの位置づけ ── これは「SDK連携のための規約」です

Swiftia案件は以下の3段階で進みます：

1. デザイナーがHTML/CSS/JSをコーディング（このドキュメントの対象）
2. 先方にデザインを見せて承認を得る
3. エンジニアがSDK書き換えを行う

**重要：従来サイトと違い、Swiftia案件には SDK が入ります。** そのため「完全に普通の静的HTMLと同じ感覚でJSを書く」と、SDK化後に動かなくなる箇所が出ます。本ドキュメントは **「SDKがあるので、JSの初期化はこう書いてください」** というルールです。

この書き方に沿っていただくと、エンジニアのSDK置き換え作業が **「あなたの初期化関数を描画後に呼び出す一行を足すだけ」** で済みます。最初はエンジニアがSDK化を担当しますが、案件を重ねれば **デザイナー自身でSDK化まで進められる**ようになることを狙いとしています。

## 1. なぜこの規約が必要か

Swiftia SDK は、ニュース一覧・記事詳細・お問い合わせフォームなどの中身を **サーバーのAPIから取得してから、ページに後から描画**します。つまり「ページが開いた瞬間」にはまだ中身（記事カード・詳細本文・ギャラリー画像・フォーム項目）が存在せず、**少し遅れてDOMに現れます**。

従来のように「ページ読み込み時に一度だけ要素を探して初期化する」書き方だと、SDKが描画する前に初期化が走ってしまい、**スライダーやライトボックスが効かない**、**フォームの装飾がかからない**といった問題が起きます。

さらにSDKは、ページ送りやカテゴリ切替で **同じ場所を何度も描画し直します**。一度きりの初期化では、2ページ目以降が初期化されません。

## 2. 規約：初期化は「名前付き・スコープ可能・冪等」な関数で書く

JSライブラリの初期化は、次の3条件を満たす関数として書いてください。

### 2-1. 名前付き関数にする
top-level に直接 `new Swiper(...)` と書いたり、`$(function(){ ... })` の中に初期化処理を直書きしたりせず、**名前のついた関数**にまとめます。

### 2-2. スコープ引数を取る（探す範囲を引数で受け取る）
要素を探すとき `document` 全体ではなく、**引数で渡された範囲だけ**を対象にします。デフォルトを `document` にしておけば、従来どおりページ全体でも動きます。

### 2-3. 冪等にする（何度呼んでも壊れない）
同じ関数が複数回呼ばれても壊れないよう、**生成前に既存インスタンスを破棄**してから作り直してください（jQueryのイベントは名前空間付きで `.off().on()`）。

### 2-4. 書き方の例

**Swiper:**

```js
// ❌ これまでの書き方（ロード時に一度だけ・document全体）
new Swiper(".news-detail-slider", { /* ... */ });

// ✅ 規約に沿った書き方
function initNewsDetailSlider(scope = document) {
  scope.querySelectorAll(".news-detail-slider").forEach((el) => {
    if (el.swiper) el.swiper.destroy(true, true); // 冪等: 作り直し前に破棄
    new Swiper(el, { /* ...options... */ });
  });
}
initNewsDetailSlider(); // 静的な確認時は従来どおりこれで動く
```

**lightcase（jQuery系）:**

```js
function initLightcase(scope = document) {
  if (!(window.jQuery && jQuery.fn.lightcase)) return;
  jQuery(scope).find("a[data-rel^=lightcase]")
    .off("click.lightcase")          // 冪等: 二重バインド防止
    .lightcase({ /* ...options... */ });
}
initLightcase();
```

**独自スクリプト（例：textareaの高さ自動可変）:**

```js
function initTextareaAutosize(scope = document) {
  scope.querySelectorAll("textarea").forEach((el) => {
    el.style.height = `${el.scrollHeight}px`;
    el.removeEventListener("input", autosize); // 冪等: 二重登録防止
    el.addEventListener("input", autosize);
  });
}
function autosize() { this.style.height = "auto"; this.style.height = `${this.scrollHeight}px`; }
initTextareaAutosize();
```

### 2-5. 再アタッチの2方式（destroy→再init 型 と scan-once→refresh 型）

ライブラリによって「冪等にする」やり方が2種類あります。どちらかに当てはめてください。

| 方式 | 代表ライブラリ | 冪等化のやり方 |
|---|---|---|
| **destroy→再init 型** | Swiper / lightcase / slick | 生成前に既存インスタンスを破棄してから作り直す（上の例）。`scope` で範囲を絞る |
| **scan-once→refresh 型** | **AOS / matchHeight** | 破棄・再生成ではなく、用意された再スキャンAPIを呼ぶ。多くはグローバルで足りる |

scan-once 型の例（AOS / matchHeight）:

```js
// AOS は data-aos を1回スキャンするだけなので、要素が増えたら refresh する
function refreshScrollAnimations() {
  if (window.AOS) AOS.refresh();          // 再 init ではなく refresh
}
// matchHeight も同様に再計算APIを呼ぶ
function refreshMatchHeight() {
  if (window.jQuery) jQuery.fn.matchHeight._update();
}
```

> **注意**：AOS / matchHeight を「`AOS.init()` を2回呼ぶ」「`matchHeight()` を再度バインドする」形で再アタッチすると、イベントの二重登録などの副作用が出ます。**必ず refresh 系API**を使ってください。

## 3. SDK化されると何が変わるか（参考）

エンジニアがSDK化したあとは、SDKが描画を終えた合図（統一イベント `swiftia:rendered`）を受けて、**あなたが書いた初期化関数を呼ぶだけ**になります。

```js
// エンジニアが足すのはこの1行だけ。関数の中身は書き直さない
document.querySelector("swiftia-detail")
  .addEventListener("swiftia:rendered", (e) => initNewsDetailSlider(e.target));
```

→ あなたの初期化関数がそのまま再利用されます。ページ送り・カテゴリ切替で再描画されても、冪等に書いてあるので何度でも安全に呼び直せます（失敗時は `swiftia:error` が発火します）。

## 4. この規約の対象範囲

- **対象**：SDKが動的に描画する場所（記事一覧カード・記事詳細の本文/ギャラリー・お問い合わせフォームの入力項目）を触る初期化。代表例 — Swiper / slick / lightcase / AOS / matchHeight / フォーム関連の独自スクリプト。
- **対象外でもOK**：ヘッダー・ハンバーガーメニュー・ローダー・ページ全体のスクロール演出など、**SDKが描画しない静的な部分だけ**を触るものは従来どおりで構いません（全部この書き方に統一しても無害なので、迷ったら統一推奨）。

判断に迷ったら **「この初期化は、後から増える／差し替わる内容を触るか？」** で考えてください。Yes なら本規約に沿って関数化してください。

### 4-1. 公式対応スタック

過去案件で実際に使われてきたライブラリは、下記に概ね収束しています。**新規案件はこのスタックを基準**にしてください（揃っているほどSDK側の対応がしやすく、品質が上がります）。

| 役割 | 推奨（公式対応） | 再アタッチ方式 |
|---|---|---|
| スライダー | **Swiper** | destroy→再init |
| ライトボックス | **lightcase** | destroy→再init |
| スクロール演出 | **AOS** / GSAP(ScrollTrigger) | AOS=refresh ／ GSAP=各 ScrollTrigger を再生成 |
| 高さ揃え | **matchHeight** | refresh |
| 基盤 | **jQuery** | — |

これ以外のライブラリ（fancybox / colorbox / slick / sliderPro 等）を使う場合も、本規約（名前付き・スコープ可能・冪等）に沿っていれば動かせますが、**公式スタックから外れるものは事前にエンジニアへ共有**してください（§6 のチェックリスト最終項目）。

## 5. ライブラリの3タイプと扱い

| タイプ | 例 | 扱い |
|---|---|---|
| **CSSクラスでフック**（DOM変化を自動追従） | yubinbango（`h-adr` / `p-postal-code` 等） | 必要クラスをHTMLに付与するだけ。クラスはSDK化後も保持され、明示的な再初期化は基本不要 |
| **命令的 init・destroy→再init** | Swiper / lightcase / slick | §2 の規約（冪等関数）で書く。描画後に呼び直す |
| **scan-once・refresh** | AOS / matchHeight | §2-5 のとおり refresh 系APIで再アタッチする |

## 6. 納品時のチェックリスト

- [ ] スライダー・ライトボックス等の初期化が、名前付き関数になっている
- [ ] その関数が探す範囲（`scope`）を引数で受け取り、その中だけを対象にしている
- [ ] その関数を2回呼んでも壊れない（再生成前に destroy ／ jQuery は名前空間付き off→on）
- [ ] 静的な確認時は、その関数を呼べば従来どおり動作する
- [ ] 使用しているJSライブラリ（自作スクリプトを含む）の一覧をエンジニアに共有できる
