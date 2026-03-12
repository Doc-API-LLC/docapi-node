import type {
  PdfOptions,
  ScreenshotOptions,
  RegisterOptions,
  RegisterResponse,
  CreditsResponse,
  InvoiceOptions,
} from "./types.js";

const PDF_URL = "https://api.docapi.co/v1/pdf";
const SCREENSHOT_URL = "https://api.docapi.co/v1/screenshot";
const INVOICE_URL = "https://api.docapi.co/v1/invoice";
const REGISTER_URL = "https://www.docapi.co/api/register";
const TOPUP_URL = "https://www.docapi.co/api/topup";

export class DocAPIError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "DocAPIError";
    this.status = status;
    this.code = code;
  }
}

export class DocAPI {
  readonly #apiKey: string;

  /** Remaining credits after the last API call (agent accounts only). */
  creditsRemaining: number | null = null;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("DocAPI: apiKey is required");
    this.#apiKey = apiKey;
  }

  /**
   * Convert HTML to a PDF.
   * @returns Buffer containing the PDF bytes.
   */
  async pdf(html: string, options?: PdfOptions): Promise<Buffer> {
    const res = await fetch(PDF_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.#apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, options }),
    });

    this.#updateCredits(res);
    if (!res.ok) await this.#throwError(res);
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Screenshot a URL or render HTML and capture it as an image.
   * Provide either `url` or `html`, not both.
   * @returns Buffer containing the PNG or JPEG bytes.
   */
  async screenshot(input: ScreenshotOptions): Promise<Buffer> {
    if (!input.url && !input.html) {
      throw new Error("DocAPI: screenshot requires either url or html");
    }
    if (input.url && input.html) {
      throw new Error(
        "DocAPI: screenshot requires either url or html, not both"
      );
    }

    const { url, html, ...opts } = input;
    const body: Record<string, unknown> = { options: opts };
    if (url) body.url = url;
    if (html) body.html = html;

    const res = await fetch(SCREENSHOT_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.#apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    this.#updateCredits(res);
    if (!res.ok) await this.#throwError(res);
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Generate a PDF invoice.
   * @returns Buffer containing the PDF bytes.
   */
  async invoice(data: InvoiceOptions): Promise<Buffer> {
    const res = await fetch(INVOICE_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.#apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    this.#updateCredits(res);
    if (!res.ok) await this.#throwError(res);
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Check remaining credits and USDC top-up address.
   * Only applicable to agent accounts (registered via DocAPI.register).
   */
  async credits(): Promise<CreditsResponse> {
    const res = await fetch(TOPUP_URL, {
      headers: { "x-api-key": this.#apiKey },
    });
    if (!res.ok) await this.#throwError(res);
    return res.json() as Promise<CreditsResponse>;
  }

  /**
   * Register a new agent account programmatically.
   * No API key required — call as a static method.
   * Returns an API key and USDC address with 10 free calls included.
   */
  static async register(options?: RegisterOptions): Promise<RegisterResponse> {
    const res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options ?? {}),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      throw new DocAPIError(
        res.status,
        String(body.error ?? "register_failed"),
        String(body.message ?? res.statusText)
      );
    }

    return res.json() as Promise<RegisterResponse>;
  }

  #updateCredits(res: Response): void {
    const header = res.headers.get("x-credits-remaining");
    if (header !== null) this.creditsRemaining = parseInt(header, 10);
  }

  async #throwError(res: Response): Promise<never> {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const error = body.error as Record<string, string> | string | undefined;
    const code =
      typeof error === "object" ? error.code : String(error ?? "unknown");
    const message =
      typeof error === "object"
        ? error.message
        : String(body.message ?? res.statusText);
    throw new DocAPIError(res.status, code, message);
  }
}
