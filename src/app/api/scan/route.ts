import { NextRequest, NextResponse } from 'next/server';
import { PageAnalyzer, ScanResult } from '@/lib/analyzer';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { urls } = body;

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json(
                { error: 'Invalid input. "urls" must be an array of strings.' },
                { status: 400 }
            );
        }

        if (urls.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // Limit batch size to prevent timeout/abuse
        if (urls.length > 1000) {
            return NextResponse.json(
                { error: 'Batch size limit exceeded. Max 1000 URLs per request.' },
                { status: 400 }
            );
        }

        // Process in parallel with concurrency limit (optional, but good for performance)
        // For simplicity, we use Promise.all for small batches, but for 1000 it might be heavy.
        // Let's do chunks of 10.

        const results: ScanResult[] = [];
        const chunkSize = 10;

        for (let i = 0; i < urls.length; i += chunkSize) {
            const chunk = urls.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
                chunk.map(async (url: string) => {
                    // Basic validation
                    if (typeof url !== 'string' || !url.trim()) return null;
                    // Run analysis
                    return await PageAnalyzer.analyze(url.trim());
                })
            );

            // Filter out nulls
            results.push(...(chunkResults.filter(r => r !== null) as ScanResult[]));
        }

        return NextResponse.json(results); // Return standard JSON array directly as requested by format spec? 
        // Spec says: Response JSON harus seperti: [ { ... } ]
        // So I should return the array directly.

    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
