import { parse } from 'node-html-parser';

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
                // Fetch with manual redirect handling to track hops
                // Increased timeout to 15s
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                try {
                    const res = await fetch(currentUrl, {
                        method: 'GET',
                        redirect: 'manual',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; BlankPageDetector/1.0; +https://example.com)',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5'
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
                            try {
                                currentUrl = new URL(location, currentUrl).toString();
                            } catch (e) {
                                // Fallback if URL constuction fails, use location as is if absolute
                                if (location.startsWith('http')) {
                                    currentUrl = location;
                                } else {
                                    // Just stop if redirect URL is invalid
                                    break;
                                }
                            }
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
                    finalBody = await finalRes.text();
                    result.content_length = finalBody.length; // Approximate char length

                    break; // Exit loop if not redirecting
                } catch (fetchError: any) {
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

        try {
            const root = parse(html);

            // Remove non-visible elements
            // Note: node-html-parser's querySelectorAll returns an array, we can iterate and remove
            const unwanted = root.querySelectorAll('script, style, iframe, svg, meta, link, noscript');
            unwanted.forEach(el => el.remove());

            // Extract text from body
            const body = root.querySelector('body');
            let bodyText = '';

            if (body) {
                bodyText = body.text.trim().replace(/\s+/g, ' ');
            } else {
                // Fallback if no body tag, check whole root but after removing unwanted
                bodyText = root.text.trim().replace(/\s+/g, ' ');
            }

            result.visible_text_length = bodyText.length;

            const imgCount = root.querySelectorAll('img').length;
            const iframeCount = root.querySelectorAll('iframe').length; // re-query or count before removing? 
            // Wait, we removed iframes above. We should have counted before removing or not removed them yet if we need stats.
            // Let's re-parse for counts or count before remove.
            // Actually usually we check blankness based on VISIBLE content. Iframes are "content" visually often.
            // But the original code removed them. Let's stick to original logic: iframes removed means we don't count their text.
            // But we do check their presence for "Empty Body" check.

            // Re-parsing original or just counting from separate parse? 
            // Parsing is cheap. Let's do a fresh parse for counting to be safe/clean.
            const rootForCounts = parse(html);
            const imgCountTotal = rootForCounts.querySelectorAll('img').length;
            const iframeCountTotal = rootForCounts.querySelectorAll('iframe').length;


            if (result.visible_text_length < this.MIN_TEXT_LENGTH) {
                if (imgCountTotal === 1 && result.visible_text_length < 10) {
                    result.has_images_only = true;
                    result.is_blank_page = true;
                    result.blank_reason = "Single image without text";
                    return result;
                }
                if (result.visible_text_length === 0 && imgCountTotal === 0 && iframeCountTotal === 0) {
                    result.is_blank_page = true;
                    result.blank_reason = "Empty Body / No Text";
                    return result;
                }

                result.is_blank_page = true;
                result.blank_reason = "Low visible text (<30 chars)";
                return result;
            }

        } catch (e) {
            // Fallback if parsing fails heavily
            result.error = "Parsing error";
        }

        return result;
    }
}
