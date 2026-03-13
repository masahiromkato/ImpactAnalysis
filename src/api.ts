import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from './constants/prompts';
import { ERROR_MESSAGES } from './constants/messages';

export interface ImpactDataNode {
    source: string;
    target: string;
    logic: string;
    impact_score: number;
    tier: "Tier 0" | "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
    time_horizon: "Short" | "Medium" | "Long";
    sensitivity: string;
}

/**
 * トークン切れなどで途切れたJSON文字列を、可能な限りパース可能な形に補修します。
 */
function repairTruncatedJson(text: string): string {
    let repaired = text.trim();

    // 1. 基本的なトリミングとコードブロックの除去
    if (repaired.startsWith('```')) {
        repaired = repaired.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // 2. 文字列が途切れている場合（奇数個の二重引用符）、閉じる
    const quoteCount = (repaired.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
        repaired += '"';
    }

    // 3. 各階層を閉じる
    // シンプルに、最後の有効なオブジェクトの終わりを探す
    const lastCloseBrace = repaired.lastIndexOf('}');
    if (lastCloseBrace !== -1) {
        repaired = repaired.substring(0, lastCloseBrace + 1) + ']';
    } else {
        // オブジェクトすら一つも閉じていない場合
        if (repaired.startsWith('[')) {
            // 一旦強引に要素を閉じて配列にする（パース失敗を避けるための最終手段）
            if (!repaired.endsWith('}')) repaired += ' }';
            if (!repaired.endsWith(']')) repaired += ']';
        }
    }

    // 4. 表記ゆれの補正
    repaired = repaired.replace(/:\s*\+(\d)/g, ': $1');
    repaired = repaired.replace(/,\s*([\]}])/g, '$1');

    return repaired;
}

/**
 * 指定されたミリ秒数待機します。
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateImpactGraph(
    eventText: string,
    modelName: string,
    apiKey?: string,
    retryCount = 0
): Promise<ImpactDataNode[]> {
    const finalApiKey = (apiKey && apiKey.trim()) || (import.meta.env.VITE_GEMINI_API_KEY as string);

    if (!finalApiKey || !finalApiKey.trim()) {
        throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED);
    }

    const genAI = new GoogleGenAI({ apiKey: finalApiKey.trim() });
    const prompt = SYSTEM_PROMPT(eventText);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300秒（5分）タイムアウト

    try {
        const response = await genAI.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                maxOutputTokens: 4096,
                abortSignal: controller.signal
            }
        });

        const text = response.text;
        console.log(`[Attempt ${retryCount + 1}] Raw Gemini Response Length:`, text.length);

        if (!text) {
            throw new Error(ERROR_MESSAGES.NO_TEXT_RETURNED);
        }

        const sanitizedText = repairTruncatedJson(text);

        try {
            const rawResult: any[] = JSON.parse(sanitizedText);
            return rawResult.map(item => {
                let score = parseFloat(String(item.impact_score));
                if (isNaN(score)) score = 0;
                if (Number.isInteger(score) && Math.abs(score) > 1.0) {
                    score = score / 10.0;
                }
                score = Math.max(-1.0, Math.min(1.0, score));

                return {
                    source: String(item.source || ""),
                    target: String(item.target || ""),
                    logic: String(item.logic || ""),
                    impact_score: score,
                    tier: (item.tier || "Tier 1") as any,
                    time_horizon: (item.time_horizon || "Medium") as any,
                    sensitivity: String(item.sensitivity || "")
                };
            });
        } catch (e) {
            console.error("JSON Parsing failed after repair. Sanitized Text:", sanitizedText);
            throw new Error(ERROR_MESSAGES.INVALID_JSON(e instanceof Error ? e.message : String(e)));
        }

    } catch (error: any) {
        // 503 (SERVICE_UNAVAILABLE) の場合のみリトライ
        const isUnavailable = error.message?.includes("503") ||
            error.status === "UNAVAILABLE" ||
            error.message?.includes("RESOURCE_EXHAUSTED"); // 混雑時はこれも含める場合がある

        if (isUnavailable && retryCount < 1) {
            const waitTime = 6000 * (retryCount + 1);
            console.warn(`Gemini API is busy (503). Retrying in ${waitTime}ms... (Attempt ${retryCount + 1}/2)`);
            await sleep(waitTime);
            return generateImpactGraph(eventText, modelName, apiKey, retryCount + 1);
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function generateImpactGraphWithCatch(eventText: string, modelName: string, apiKey?: string): Promise<ImpactDataNode[]> {
    try {
        return await generateImpactGraph(eventText, modelName, apiKey);
    } catch (error: any) {
        console.error("Impact Analysis Error:", error);

        // 1. タイムアウト (AbortError) のハンドリング
        if (error.name === 'AbortError' || error.message?.includes("signal is aborted")) {
            throw new Error(ERROR_MESSAGES.TIMEOUT);
        }

        // 2. 503 (UNAVAILABLE) の最終ハンドリング
        if (error.message?.includes("503") || error.status === "UNAVAILABLE") {
            throw new Error(ERROR_MESSAGES.SERVICE_UNAVAILABLE);
        }

        // 3. クォータ制限
        if (error.message?.includes("RESOURCE_EXHAUSTED") || error.code === 429) {
            throw new Error(ERROR_MESSAGES.QUOTA_EXCEEDED);
        }

        throw error;
    }
}
