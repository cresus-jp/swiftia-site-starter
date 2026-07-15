// Swiftia SEO/OGP エッジ注入 Pages Function（本体 #116）
// 生成元: swiftia-sdk main 7741342（/simplify 適用済）+ ビルド修正 PR #59 — 直接編集しないこと。
// 更新手順: swiftia-sdk で pnpm build → packages/pages-middleware/dist/_middleware.js をここへコピー
// ../core/src/utils/file-extension.ts
var NORMALIZATION_MAP = {
  pdf: "pdf",
  doc: "word",
  docx: "word",
  xls: "excel",
  xlsx: "excel",
  ppt: "powerpoint",
  pptx: "powerpoint"
};
var FALLBACK_CLASS = "file";
function extractFileExtension(originalName) {
  const trimmed = originalName.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot < 0 || dot === trimmed.length - 1) {
    return null;
  }
  return trimmed.slice(dot + 1).toLowerCase();
}
function normalizeFileExtension(ext) {
  if (ext === null) {
    return FALLBACK_CLASS;
  }
  return NORMALIZATION_MAP[ext] ?? FALLBACK_CLASS;
}

// ../core/src/client/cache.ts
var MemoryCacheStore = class {
  map = /* @__PURE__ */ new Map();
  get(key) {
    return this.map.get(key) ?? null;
  }
  set(key, value) {
    this.map.set(key, value);
  }
};
var ETagCache = class {
  prefix = "swiftia:etag:";
  backing;
  constructor(backing = new MemoryCacheStore()) {
    this.backing = backing;
  }
  /** 保存済みのキャッシュエントリを取得する */
  getEntry(url) {
    const raw = this.backing.get(this.prefix + url);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  /** ETag とレスポンスデータを保存する */
  store(url, etag, data) {
    this.backing.set(this.prefix + url, JSON.stringify({ etag, data }));
  }
};
var RequestDeduplicator = class {
  pending = /* @__PURE__ */ new Map();
  /** 同一URLが進行中なら既存 Promise を返す。なければ executor を実行する */
  dedupe(url, executor) {
    const existing = this.pending.get(url);
    if (existing) {
      return existing;
    }
    const promise = executor().finally(() => {
      this.pending.delete(url);
    });
    this.pending.set(url, promise);
    return promise;
  }
};

// ../core/src/client/config.ts
var DEFAULT_BASE_URL = "https://api.swiftia.app";

// ../core/src/client/errors.ts
var SwiftiaError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SwiftiaError";
  }
};
var SwiftiaApiError = class extends SwiftiaError {
  status;
  code;
  constructor(message, status, code) {
    super(message);
    this.name = "SwiftiaApiError";
    this.status = status;
    this.code = code;
  }
};
var SwiftiaNetworkError = class extends SwiftiaError {
  constructor(message) {
    super(message);
    this.name = "SwiftiaNetworkError";
  }
};
var SwiftiaValidationError = class extends SwiftiaApiError {
  errors;
  constructor(message, errors) {
    super(message, 422, "VALIDATION_ERROR");
    this.name = "SwiftiaValidationError";
    this.errors = errors;
  }
};
function isFieldErrors(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  for (const messages of Object.values(value)) {
    if (!Array.isArray(messages) || !messages.every((m) => typeof m === "string")) {
      return false;
    }
  }
  return true;
}
async function parseApiError(response) {
  try {
    const body = await response.json();
    if (response.status === 422 && body.error.code === "VALIDATION_ERROR" && "errors" in body.error && isFieldErrors(body.error.errors)) {
      return new SwiftiaValidationError(body.error.message, body.error.errors);
    }
    return new SwiftiaApiError(body.error.message, response.status, body.error.code);
  } catch {
    return new SwiftiaApiError(`API\u30A8\u30E9\u30FC (HTTP ${response.status})`, response.status, "UNKNOWN");
  }
}

// ../core/src/client/api-client.ts
var DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1e3,
  maxDelay: 1e4
};
function containsFile(data) {
  for (const value of Object.values(data)) {
    if (value instanceof File) {
      return true;
    }
    if (Array.isArray(value) && value.some((item) => item instanceof File)) {
      return true;
    }
  }
  return false;
}
function toFormData(data) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === void 0) {
      continue;
    }
    if (value instanceof File) {
      formData.append(key, value, value.name);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(`${key}[]`, item);
      }
      continue;
    }
    formData.append(key, value);
  }
  return formData;
}
function shouldConvertKey(key) {
  return /^[a-z_]+$/.test(key);
}
function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function transformKeys(data) {
  if (data === null || data === void 0) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(transformKeys);
  }
  if (typeof data === "object") {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const newKey = shouldConvertKey(key) ? snakeToCamel(key) : key;
      const transformed = transformKeys(value);
      result[newKey] = newKey === "files" ? enrichFiles(transformed) : transformed;
    }
    return result;
  }
  return data;
}
function enrichFiles(value) {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }
    const record = item;
    const rawExtension = typeof record.originalName === "string" ? extractFileExtension(record.originalName) : null;
    return {
      ...record,
      extension: normalizeFileExtension(rawExtension)
    };
  });
}
var SwiftiaApiClient = class {
  baseUrl;
  apiKey;
  retryConfig;
  etagCache;
  deduplicator;
  constructor(config, retryConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.etagCache = new ETagCache(config.cacheStore);
    this.deduplicator = new RequestDeduplicator();
  }
  /** カタログ一覧を取得する */
  async getCatalog(catalogType, params) {
    const queryParams = {};
    if (params?.category !== void 0) queryParams.category = params.category;
    if (params?.page !== void 0) queryParams.page = params.page;
    if (params?.perPage !== void 0) queryParams.per_page = params.perPage;
    if (params?.sort !== void 0) queryParams.sort = params.sort;
    if (params?.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (typeof value === "string" && value !== "") {
          queryParams[`filter[${key}]`] = value;
        }
      }
    }
    const url = this.buildUrl(catalogType, queryParams);
    return this.request(url);
  }
  /** アイテム詳細を取得する */
  async getItem(catalogType, itemId) {
    const url = this.buildUrl(`${catalogType}/items/${itemId}`);
    return this.request(url);
  }
  /** カテゴリー詳細を取得する */
  async getCategory(catalogType, categoryId) {
    const url = this.buildUrl(`${catalogType}/categories/${categoryId}`);
    return this.request(url);
  }
  /** 外部プレビュー: 管理画面発行の短命トークンでドラフト含むエントリー詳細を取得する（キャッシュ非対象） */
  async getPreview(catalogType, entryId, token) {
    const url = this.buildUrl(`${catalogType}/preview/${entryId}`, { token });
    return this.request(url, false);
  }
  /** お問い合わせフォーム定義を取得する */
  async getContactForm(slug) {
    const url = this.buildUrl(`contact/${encodeURIComponent(slug)}`);
    return this.request(url);
  }
  /** お問い合わせを送信する（自動リトライは重複送信を招くため request() を経由しない） */
  async submitInquiry(slug, data) {
    const url = this.buildUrl(`contact/${encodeURIComponent(slug)}`);
    const init = this.buildSubmitRequest(data);
    const response = await fetch(url, init).catch((error) => {
      throw new SwiftiaNetworkError(
        error instanceof Error ? error.message : "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"
      );
    });
    if (!response.ok) {
      throw await parseApiError(response);
    }
    return await response.json();
  }
  /**
   * 送信内容に File が含まれるかで multipart/form-data と JSON を切り替える。
   *
   * WHY: ファイル無しの既存フォームは JSON のままにし、追加機能のためにネットワーク表現を
   * 一律変更しない。multipart 時は Content-Type を指定せずブラウザに boundary を任せる。
   */
  buildSubmitRequest(data) {
    if (containsFile(data)) {
      return { method: "POST", body: toFormData(data) };
    }
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  }
  /** URL を構築する: /api/v1/{apiKey}/{path}?{queryParams} */
  buildUrl(path, params) {
    const url = new URL(`/api/v1/${this.apiKey}/${path}`, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
  /**
   * デデュプリケーション経由でリクエストを実行する
   *
   * `cacheable: false`（既定 true）は外部プレビュー等、ETag キャッシュを一切使わせたくない
   * リクエスト向けの引数（#51）。URL に token が含まれ通常詳細とは自然にキーが
   * 分離されるが、念のため ETag の読み書き自体を行わない。
   */
  request(url, cacheable = true) {
    return this.deduplicator.dedupe(url, () => this.fetchWithRetry(url, 0, cacheable));
  }
  /** ETag / リトライ付き fetch */
  async fetchWithRetry(url, attempt, cacheable = true) {
    const headers = {};
    const cached = cacheable ? this.etagCache.getEntry(url) : null;
    if (cached) {
      headers["If-None-Match"] = cached.etag;
    }
    const response = await fetch(url, {
      headers,
      cache: cacheable ? "no-cache" : "no-store"
    }).catch((error) => {
      throw new SwiftiaNetworkError(
        error instanceof Error ? error.message : "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"
      );
    });
    if (response.status === 304) {
      if (cached) {
        return cached.data;
      }
      return this.fetchWithRetry(url, 0, cacheable);
    }
    if (response.status === 429 && attempt < this.retryConfig.maxRetries) {
      const delay = this.calculateDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, attempt + 1, cacheable);
    }
    if (!response.ok) {
      throw await parseApiError(response);
    }
    const data = await response.json();
    const transformed = transformKeys(data);
    if (cacheable) {
      const responseEtag = response.headers.get("ETag");
      if (responseEtag) {
        this.etagCache.store(url, responseEtag, transformed);
      }
    }
    return transformed;
  }
  /** 指数バックオフの遅延時間を計算する */
  calculateDelay(attempt) {
    const jitter = Math.random() * 100;
    return Math.min(this.retryConfig.baseDelay * 2 ** attempt + jitter, this.retryConfig.maxDelay);
  }
};
function createClient(config, retryConfig) {
  return new SwiftiaApiClient(config, retryConfig);
}

// ../core/src/utils/meta-resolver.ts
var TITLE_PLACEHOLDER = "{title}";
function resolveMeta(input) {
  return {
    title: resolveValue(input.meta?.pageTitle, input.titleTemplate, input.entityTitle),
    description: resolveValue(
      input.meta?.description,
      input.descriptionTemplate,
      input.entityTitle
    )
  };
}
function resolveValue(metaValue, template, entityTitle) {
  if (metaValue?.trim()) {
    return metaValue;
  }
  if (template && entityTitle) {
    return template.split(TITLE_PLACEHOLDER).join(entityTitle);
  }
  return null;
}

// ../edge-core/src/head-rewriter.ts
function injectHead(html, meta, init) {
  let titleSeen = false;
  let descriptionSeen = false;
  const rewriter = new HTMLRewriter().on("head > title", {
    element(element) {
      titleSeen = true;
      if (meta.title !== null) {
        element.setInnerContent(meta.title);
      }
    }
  }).on('head > meta[name="description"]', {
    element(element) {
      descriptionSeen = true;
      if (meta.description !== null) {
        element.setAttribute("content", meta.description);
      }
    }
  }).on('head > meta[property="og:title"]', {
    element(element) {
      if (meta.title !== null) {
        element.setAttribute("content", meta.title);
      }
    }
  }).on('head > meta[property="og:description"]', {
    element(element) {
      if (meta.description !== null) {
        element.setAttribute("content", meta.description);
      }
    }
  }).on("head", {
    element(element) {
      element.onEndTag((end) => {
        if (!titleSeen && meta.title !== null) {
          end.before(`<title>${escapeHtml(meta.title)}</title>`, { html: true });
        }
        if (!descriptionSeen && meta.description !== null) {
          end.before(`<meta name="description" content="${escapeHtml(meta.description)}">`, {
            html: true
          });
        }
      });
    }
  });
  return rewriter.transform(new Response(html, init));
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ../edge-core/src/html-attributes.ts
var attributePatterns = /* @__PURE__ */ new Map();
function readAttribute(attrs, name) {
  let pattern = attributePatterns.get(name);
  if (!pattern) {
    pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
    attributePatterns.set(name, pattern);
  }
  const match = pattern.exec(attrs);
  if (!match) {
    return null;
  }
  return match[1] ?? match[2] ?? null;
}

// ../edge-core/src/resolve-injection.ts
async function resolveInjection(client, element, url) {
  const entity = await resolveEntity(client, element, url);
  if (!entity) {
    return null;
  }
  const resolved = resolveMeta({
    meta: entity.meta ?? null,
    entityTitle: entity.title,
    titleTemplate: element.titleTemplate,
    descriptionTemplate: element.descriptionTemplate
  });
  if (resolved.title === null && resolved.description === null) {
    return null;
  }
  return resolved;
}
async function resolveEntity(client, element, url) {
  if (element.kind === "detail") {
    const id = positiveIntParam(url, "id");
    if (id === void 0) {
      return null;
    }
    const response2 = await client.getItem(element.type, id);
    return { meta: response2.item.meta, title: response2.item.title };
  }
  const category = positiveIntParam(url, "category");
  if (category !== void 0) {
    const response2 = await client.getCatalog(element.type, { category });
    if (!response2.currentCategory) {
      return null;
    }
    return { meta: response2.currentCategory.meta, title: response2.currentCategory.title };
  }
  const response = await client.getCatalog(element.type);
  const landing = response.features.categoryLanding;
  const isFirst = landing?.enabled === true && landing.config?.mode === "first";
  if (!isFirst || response.categories.length === 0) {
    return null;
  }
  const first = response.categories[0];
  return { meta: first.meta, title: first.title };
}
function positiveIntParam(url, name) {
  const raw = url.searchParams.get(name);
  if (raw === null || !/^\d+$/.test(raw)) {
    return void 0;
  }
  const value = Number(raw);
  return value >= 1 ? value : void 0;
}

// ../edge-core/src/swiftia-element.ts
var ELEMENT_PATTERN = /<swiftia-(catalog|detail)\b([^>]*)>/i;
function extractSwiftiaElement(html) {
  const match = ELEMENT_PATTERN.exec(html);
  if (!match) {
    return null;
  }
  const kind = match[1].toLowerCase();
  const attrs = match[2];
  const type = readAttribute(attrs, "type");
  if (!type) {
    return null;
  }
  return {
    kind,
    type,
    titleTemplate: readAttribute(attrs, "title-template"),
    descriptionTemplate: readAttribute(attrs, "description-template")
  };
}

// ../edge-core/src/inject.ts
var PREVIEW_PARAM = "swiftia_preview_token";
function shouldInjectHtml(method, url, contentType) {
  return method === "GET" && (contentType?.includes("text/html") ?? false) && !url.searchParams.has(PREVIEW_PARAM);
}
function htmlResponseInit(response) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return { status: response.status, statusText: response.statusText, headers };
}
async function injectMetaFailOpen(html, init, url, makeClient, logTag) {
  try {
    const element = extractSwiftiaElement(html);
    if (!element) {
      return new Response(html, init);
    }
    const client = makeClient();
    if (!client) {
      return new Response(html, init);
    }
    const meta = await resolveInjection(client, element, url);
    if (!meta) {
      return new Response(html, init);
    }
    return injectHead(html, meta, init);
  } catch (error) {
    console.error(`[${logTag}] \u30E1\u30BF\u6CE8\u5165\u306B\u5931\u6557\uFF08\u7D20\u306E HTML \u3092\u8FD4\u3059\uFF09:`, error);
    return new Response(html, init);
  }
}

// src/sdk-script.ts
var SCRIPT_PATTERN = /<script\b[^>]*\bdata-api-key\b[^>]*>/i;
function extractSdkScript(html) {
  const match = SCRIPT_PATTERN.exec(html);
  if (!match) {
    return null;
  }
  const attrs = match[0];
  const apiKey = readAttribute(attrs, "data-api-key");
  if (!apiKey) {
    return null;
  }
  const apiBase = readAttribute(attrs, "data-api-base") || DEFAULT_BASE_URL;
  return { apiKey, apiBase };
}

// src/index.ts
var PAGES_DEV_SUFFIX = ".pages.dev";
function shouldInject(method, url, contentType) {
  return shouldInjectHtml(method, url, contentType) && !url.hostname.endsWith(PAGES_DEV_SUFFIX);
}
var clients = /* @__PURE__ */ new Map();
function clientFor(script) {
  const key = `${script.apiBase}
${script.apiKey}`;
  let client = clients.get(key);
  if (!client) {
    client = createClient({ apiKey: script.apiKey, baseUrl: script.apiBase }, { maxRetries: 0 });
    clients.set(key, client);
  }
  return client;
}
var onRequest = async (context) => {
  const response = await context.next();
  const url = new URL(context.request.url);
  if (!shouldInject(context.request.method, url, response.headers.get("content-type"))) {
    return response;
  }
  const html = await response.text();
  const init = htmlResponseInit(response);
  return injectMetaFailOpen(
    html,
    init,
    url,
    () => {
      const script = extractSdkScript(html);
      return script && clientFor(script);
    },
    "pages-middleware"
  );
};
export {
  onRequest,
  shouldInject
};
