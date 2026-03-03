# docapi

Official Node.js SDK for [DocAPI](https://www.docapi.co) — generate PDFs and screenshots from HTML.

```bash
npm install @docapi/sdk
```

Zero dependencies. Uses native `fetch` (Node.js 18+).

## Quick start

```typescript
import { DocAPI } from "@docapi/sdk";

const client = new DocAPI("pk_live_...");

// Generate a PDF
const pdf = await client.pdf("<h1>Hello World</h1>");
fs.writeFileSync("output.pdf", pdf);

// Screenshot a URL
const img = await client.screenshot({ url: "https://example.com" });
fs.writeFileSync("screenshot.png", img);
```

Get a free API key at [docapi.co/signup](https://www.docapi.co/signup) — 100 calls/month, no credit card.

---

## API

### `new DocAPI(apiKey)`

```typescript
const client = new DocAPI("pk_live_...");
```

### `client.pdf(html, options?)`

Convert HTML to a PDF. Returns a `Buffer`.

```typescript
const pdf = await client.pdf(`
  <html>
    <head>
      <style>
        body { font-family: sans-serif; padding: 40px; }
        h1 { color: #0f172a; }
      </style>
    </head>
    <body>
      <h1>Invoice #123</h1>
      <p>Amount due: $4,500.00</p>
    </body>
  </html>
`, {
  format: "A4",           // "A4" | "Letter" | "Legal" | "Tabloid"
  landscape: false,
  printBackground: true,
  margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
});

fs.writeFileSync("invoice.pdf", pdf);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | string | `"A4"` | Paper format |
| `landscape` | boolean | `false` | Landscape orientation |
| `printBackground` | boolean | `true` | Include background colors/images |
| `margin` | object | — | `{ top, right, bottom, left }` in CSS units |
| `scale` | number | `1` | Scale factor 0.1–2 |
| `pageRanges` | string | — | Pages to print e.g. `"1-5, 8"` |

### `client.screenshot(options)`

Screenshot a URL or render HTML. Returns a `Buffer`. Provide `url` OR `html`, not both.

```typescript
// From a URL
const img = await client.screenshot({
  url: "https://mysite.com/blog/post",
  width: 1200,
  height: 630,
  format: "png",
});

// From HTML (e.g. OG image)
const img = await client.screenshot({
  html: `<div style="width:1200px;height:630px;background:#0f172a;
                      display:flex;align-items:center;padding:80px">
           <h1 style="color:white;font-size:64px">My Blog Post</h1>
         </div>`,
  width: 1200,
  height: 630,
});

fs.writeFileSync("og-image.png", img);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | string | — | URL to screenshot |
| `html` | string | — | HTML to render |
| `width` | number | `1200` | Viewport width |
| `height` | number | `630` | Viewport height |
| `format` | string | `"png"` | `"png"` or `"jpeg"` |

### `client.credits()`

Check remaining credits and USDC top-up address. Agent accounts only.

```typescript
const { credits, usdc_address } = await client.credits();
console.log(`${credits} credits remaining`);
```

### `client.creditsRemaining`

After any `pdf()` or `screenshot()` call, `client.creditsRemaining` holds the value from the `X-Credits-Remaining` response header. Use this to trigger proactive USDC top-ups.

```typescript
const pdf = await client.pdf(html);
if ((client.creditsRemaining ?? 999) < 50) {
  // top up via USDC
}
```

### `DocAPI.register(options?)`

Register a new agent account programmatically. No API key required.

```typescript
const account = await DocAPI.register({
  notify_email: "ops@yourcompany.com", // optional low-balance alerts
});

console.log(account.api_key);       // "pk_..."
console.log(account.usdc_address);  // "0x..."
console.log(account.free_calls);    // 10
```

---

## Error handling

All errors throw `DocAPIError` with `status` and `code` properties.

```typescript
import { DocAPI, DocAPIError } from "@docapi/sdk";

try {
  const pdf = await client.pdf("<h1>Hello</h1>");
} catch (err) {
  if (err instanceof DocAPIError) {
    console.error(err.status); // 401, 402, 429, 500
    console.error(err.code);   // "invalid_api_key", "credits_exhausted", etc.
    console.error(err.message);
  }
}
```

| Status | Code | Meaning |
|--------|------|---------|
| 401 | `invalid_api_key` | Invalid or missing API key |
| 402 | `credits_exhausted` | Agent account out of credits — send USDC |
| 429 | `usage_limit_exceeded` | Monthly plan limit reached |
| 500 | `generation_failed` | Rendering error |

---

## Next.js example

```typescript
// app/api/og/route.ts
import { DocAPI } from "@docapi/sdk";
import { NextRequest } from "next/server";

const client = new DocAPI(process.env.DOCAPI_KEY!);

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "My Page";

  const img = await client.screenshot({
    html: `<div style="width:1200px;height:630px;background:#0f172a;
                        display:flex;align-items:center;padding:80px;
                        font-family:system-ui,sans-serif">
             <h1 style="color:white;font-size:64px">${title}</h1>
           </div>`,
    width: 1200,
    height: 630,
  });

  return new Response(img, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
```

## Django example

```python
# Use the REST API directly — Python SDK coming soon
import requests

response = requests.post(
    "https://api.docapi.co/v1/pdf",
    headers={"x-api-key": os.environ["DOCAPI_KEY"]},
    json={"html": html_string, "options": {"format": "A4"}},
)
pdf_bytes = response.content
```

---

## Links

- [Documentation](https://www.docapi.co/docs)
- [Pricing](https://www.docapi.co/pricing)
- [MCP Server](https://www.docapi.co/docs#mcp-server) — use DocAPI directly from Claude Desktop
- [GitHub](https://github.com/Doc-API-LLC/docapi-node)
