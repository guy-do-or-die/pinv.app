import { FastifyRequest, FastifyReply } from 'fastify';
import { executeBoxAction } from '../infra/box';
import { renderImageInWorker } from '../infra/renderer';
import { generateOgImage } from '../services/generator';
import { resolveContext } from '../services/auth';
import { generateCacheKey } from '../utils/keygen';
import { serveWithSWR } from '../services/swr';
import { logToFile } from '../utils/logger';

import { OG_WIDTH, OG_HEIGHT } from '../utils/constants';

console.log('[DEBUG] Preview Request Recv');
export async function previewHandler(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { dataCode, uiCode, params, encryptedCode, encryptedParams, publicParams } = req.body as {
            dataCode?: string,
            uiCode?: string,
            params?: any,
            encryptedCode?: string,
            encryptedParams?: string,
            publicParams?: any
        };

        let result = {};
        let logs: string[] = [];

        // Box Execution Logic
        // We support both:
        // 1. Direct Script (dataCode -> script) for Dev/Simple
        // 2. Encrypted Code (encryptedCode -> encryptedCode) for Secure
        if (dataCode || encryptedCode) {
            const execRes = await executeBoxAction({
                code: dataCode,
                encryptedCode,
                encryptedParams,
                publicParams: publicParams || params || {}
            });
            result = execRes.result || {};
            logs = execRes.logs || [];
        } else {
            result = params || {};
        }

        let imageBase64 = null;
        if (uiCode) {
            const props = { ...params, ...result };
            try {
                const { image: buffer, logs: renderLogs } = await renderImageInWorker(uiCode, props, OG_WIDTH, OG_HEIGHT);
                imageBase64 = buffer.toString('base64');
                if (renderLogs && renderLogs.length > 0) {
                    logs.push(...renderLogs);
                }
            } catch (e) {
                logs.push("[Preview] Image Generation Failed: " + (e as any).message);
            }
        }

        return reply.send({ result, logs, image: imageBase64 });
    } catch (e: any) {
        req.log.error(e);
        logToFile(`[Preview] Error: ${e.message}`);
        return reply.status(500).send({ error: e.message || "Unknown Error", logs: [e.message] });
    }
}

export async function getPinHandler(request: FastifyRequest<{
    Params: { pinId: string },
    Querystring: {
        t: any; b?: string, sig?: string, params?: string, ver?: string, ts?: string, tokenId?: string
    }
}>, reply: FastifyReply) {
    const pinId = parseInt(request.params.pinId);
    if (isNaN(pinId)) return reply.code(400).send('Invalid Pin ID');

    // 1. Resolve Auth & Context (Bundle vs Pin)
    const ctx = await resolveContext(pinId, request.query);

    // 2. Generate Cache Keys
    const { cacheKey, lockKey } = generateCacheKey(pinId, ctx, request.query);

    // 3. Define Generator (Closure captures context)
    const generatorFn = async () => {
        return generateOgImage(pinId, request.query as any, ctx.authorizedBundle, cacheKey, ctx.preFetchedPin);
    };

    // 4. Serve
    return await serveWithSWR({
        pinId,
        cacheKey,
        lockKey,
        generatorFn,
        reply,
        forceRefresh: !!request.query.t,
        isBundle: !!ctx.authorizedBundle
    });
}
