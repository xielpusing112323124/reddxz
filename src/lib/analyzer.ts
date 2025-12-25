import * as cheerio from 'cheerio';

export interface ScanResult {
    original_url: string;
    final_url: string;
    status_code: number;
    redirected: boolean;
    redirect_hops: number;
    redirect_chain: { url: string; status: number }[];
    content_length: number;
    visible_text_length: number;
    has_images_only: boolean;
    blank_reason: string | null;
    is_blank_page: boolean;
    error?: string;
}

export class PageAnalyzer {
    private static MAX_REDIRECTS = 10;
    private static MIN_TEXT_LENGTH = 30;
    private static MIN_HTML_LENGTH = 100;

    static normalizeUrl(url: string): string {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    }

    static async analyze(originalUrl: string): Promise<ScanResult> {
        let currentUrl = this.normalizeUrl(originalUrl);
        let hops = 0;
        let finalRes: Response | null = null;
        let finalBody = '';

        const result: ScanResult = {
            original_url: originalUrl,
            final_url: currentUrl,
            status_code: 0,
            redirected: false,
            redirect_hops: 0,
            redirect_chain: [],
            content_length: 0,
            visible_text_length: 0,
            has_images_only: false,
            blank_reason: null,
            is_blank_page: false,
        };

        try {
            while (hops <= this.MAX_REDIRECTS) {
                // Fetch with manual redirect handling to track hops if needed
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                try {
                    const res = await fetch(currentUrl, {
                        method: 'GET',
                        redirect: 'manual',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; BlankPageDetector/1.0; +https://example.com)',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        },
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    result.redirect_chain.push({ url: currentUrl, status: res.status });

                    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
                        hops++;
                        result.redirected = true;
                        const location = res.headers.get('location');
                        if (location) {
                            // Handle relative or absolute redirects
                            currentUrl = new URL(location, currentUrl).toString();
                        }
                        continue;
                    }

                    finalRes = res;
                    result.final_url = currentUrl;
                    result.status_code = finalRes.status;
                    result.redirect_hops = hops;

                    if (finalRes.status === 204 || finalRes.status === 205) {
                        result.is_blank_page = true;
                        result.blank_reason = `Status ${finalRes.status} No Content`;
                        return result;
                    }

                    // Read body
                    const buffer = await finalRes.arrayBuffer();
                    const decoder = new TextDecoder('utf-8');
                    finalBody = decoder.decode(buffer);
                    result.content_length = buffer.byteLength;

                    break; // Exit loop if not redirecting
                } catch (fetchError: unknown) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
            }

            if (hops > this.MAX_REDIRECTS) {
                result.error = "Too many redirects";
                result.blank_reason = "Redirect Loop / Too Many Redirects";
                result.is_blank_page = true;
                return result;
            }

            if (!finalRes) {
                throw new Error("No response received");
            }

            // Check HTTP Errors
            if (result.status_code >= 400) {
                if (result.content_length < 200) {
                    result.is_blank_page = true;
                    result.blank_reason = `HTTP Error ${result.status_code} with thin content`;
                    return result;
                }
            }

            // HTML Parsing
            return this.analyzeHtml(finalBody, result);

        } catch (e: any) {
            result.error = e.message || "Unknown error";
            result.is_blank_page = true;
            result.blank_reason = `Request Failed: ${e.message}`;
            return result;
        }
    }

    private static analyzeHtml(html: string, result: ScanResult): ScanResult {
        if (!html || html.length < this.MIN_HTML_LENGTH) {
            result.is_blank_page = true;
            result.blank_reason = "HTML too short (<100 chars)";
            return result;
        }

        const $ = cheerio.load(html);

        // Remove non-visible elements
        $('script, style, iframe, svg, meta, link, noscript').remove();

        const bodyText = $('body').text().trim().replace(/\s+/g, ' ');
        result.visible_text_length = bodyText.length;

        const $visual = cheerio.load(html);
        const imgCount = $visual('img').length;
        const iframeCount = $visual('iframe').length;

        if (result.visible_text_length < this.MIN_TEXT_LENGTH) {
            if (imgCount === 1 && result.visible_text_length < 10) {
                result.has_images_only = true;
                result.is_blank_page = true;
                result.blank_reason = "Single image without text";
                return result;
            }
            if (result.visible_text_length === 0 && imgCount === 0 && iframeCount === 0) {
                result.is_blank_page = true;
                result.blank_reason = "Empty Body / No Text";
                return result;
            }

            result.is_blank_page = true;
            result.blank_reason = "Low visible text (<30 chars)";
            return result;
        }

        return result;
    }
}
