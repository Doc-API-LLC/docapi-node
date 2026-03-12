export interface PdfOptions {
  /** Paper format. Default: "A4" */
  format?: "A4" | "Letter" | "Legal" | "Tabloid";
  /** Landscape orientation. Default: false */
  landscape?: boolean;
  /** Include background colors and images. Default: true */
  printBackground?: boolean;
  /** Page margins */
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Scale factor 0.1–2. Default: 1 */
  scale?: number;
  /** Page ranges to print, e.g. "1-5, 8" */
  pageRanges?: string;
}

export interface ScreenshotOptions {
  /** URL to screenshot. Provide url OR html, not both. */
  url?: string;
  /** HTML to render and screenshot. Provide url OR html, not both. */
  html?: string;
  /** Viewport width in pixels. Default: 1200 */
  width?: number;
  /** Viewport height in pixels. Default: 630 */
  height?: number;
  /** Image format. Default: "png" */
  format?: "png" | "jpeg";
}

export interface RegisterOptions {
  /** Auto-generated if omitted */
  email?: string;
  /** Email for low-balance alerts (one per 24h when credits < 50) */
  notify_email?: string;
}

export interface RegisterResponse {
  api_key: string;
  usdc_address: string;
  free_calls: number;
  credits_per_usdc: number;
  network: string;
  rate: string;
  auto_topup: {
    header: string;
    recommended_threshold: number;
    recommended_topup_usdc: number;
  };
  on_exhausted: {
    http_status: number;
    body: { error: string };
  };
  integration: {
    python: string;
    javascript: string;
  };
  docs: string;
}

export interface CreditsResponse {
  credits: number;
  usdc_address: string;
  rate: string;
  suggested_topup_usdc: number;
}

export interface InvoiceOptions {
  from: {
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  to: {
    name: string;
    email?: string;
    address?: string;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  invoice_number?: string;
  date?: string;
  due_date?: string;
  /** Default: "$" */
  currency_symbol?: string;
  /** 0–100 */
  tax_percent?: number;
  notes?: string;
  logo_url?: string;
}
