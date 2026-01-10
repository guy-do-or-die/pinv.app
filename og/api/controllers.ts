import { FastifyRequest, FastifyReply } from 'fastify';
import { executeLitAction } from '../infra/executor';
import { renderImageInWorker } from '../infra/renderer';
import { generateOgImage } from '../services/generator';
import { resolveContext } from '../services/auth';
import { generateCacheKey } from '../utils/keygen';
import { serveWithSWR } from '../services/swr';
import { OG_WIDTH, OG_HEIGHT } from '../utils/constants';

export async function previewHandler(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { dataCode, uiCode, params } = req.body as { dataCode?: string, uiCode?: string, params?: any };

        let result = {};
        let logs: string[] = [];

        if (dataCode) {
            const execRes = await executeLitAction(dataCode, params || {});
            result = execRes.result || {};
            logs = execRes.logs || [];
        } else {
            result = params || {};
        }

        let imageBase64 = null;
        if (uiCode) {
            const props = { ...params, ...result };
            try {
                const buffer = await renderImageInWorker(uiCode, props, OG_WIDTH, OG_HEIGHT);
                imageBase64 = buffer.toString('base64');
            } catch (e) {
                logs.push("[Preview] Image Generation Failed: " + (e as any).message);
            }
        }

        return reply.send({ result, logs, image: imageBase64 });
    } catch (e: any) {
        req.log.error(e);
        return reply.status(500).send({ error: "Preview failed", logs: [e.message] });
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
    return serveWithSWR({
        pinId,
        cacheKey,
        lockKey,
        generatorFn,
        reply,
        forceRefresh: !!request.query.t,
        isBundle: !!ctx.authorizedBundle
    });
}
