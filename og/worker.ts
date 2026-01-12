import { createSandbox, executeUserCode } from './services/sandbox';
import { loadGraphemeImages, loadDynamicFonts, getCoreFonts } from './services/assets';
// @ts-ignore
import satori from 'satori';
// @ts-ignore
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';

declare var self: any;

// Log Interception
function interceptLogs(callback: (logs: any[]) => Promise<any>) {
    const logs: any[] = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
        logs.push({ level: 'info', message: args.map(String).join(' '), timestamp: new Date().toISOString() });
        originalConsoleLog(...args);
    };
    console.error = (...args) => {
        logs.push({ level: 'error', message: args.map(String).join(' '), timestamp: new Date().toISOString() });
        originalConsoleError(...args);
    };
    console.warn = (...args) => {
        logs.push({ level: 'warn', message: args.map(String).join(' '), timestamp: new Date().toISOString() });
        originalConsoleWarn(...args);
    };

    return callback(logs).finally(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
    });
}

self.onmessage = async (event: any) => {
    const { id, data } = event.data;
    try {
        await interceptLogs(async (logs) => {
            const image = await render(data);
            self.postMessage({ id, result: { image, logs } });
        });
    } catch (e: any) {
        self.postMessage({ id, error: e.message || String(e) });
    }
};

async function render(input: any) {
    const { uiCode, props, width = 1200, height = 800, baseUrl = 'http://localhost:3000' } = input;
    if (!uiCode) throw new Error('Missing uiCode');

    // 1. Sandbox Execution
    const sandbox = createSandbox(baseUrl);
    const WidgetComponent = executeUserCode(uiCode, sandbox);

    // 2. Pre-flight (Emoji)
    const element = React.createElement(WidgetComponent, props);
    let graphemeImages = {};
    try {
        const htmlString = renderToStaticMarkup(element);
        graphemeImages = await loadGraphemeImages(htmlString);
    } catch (e) {
        console.error("Emoji check failed", e);
    }

    // 3. Fonts
    // Ensure we await any async config if needed, though executeUserCode is sync currently.
    // User config is on scope.exports.config
    const dynamicFonts = await loadDynamicFonts(sandbox.scope.exports.config || {});
    const coreFonts = getCoreFonts();
    const allFonts = [...coreFonts, ...dynamicFonts];

    // 4. Satori
    let svg;
    try {
        svg = await satori(element, {
            width,
            height,
            fonts: (allFonts.length > 0 ? allFonts : []) as any,
            graphemeImages
        });
    } catch (e: any) {
        const msg = e.message || String(e);
        console.error("Satori Failed, Using Fallback:", msg.length > 500 ? msg.substring(0, 500) + '... (truncated)' : msg);
        // Fallback Error Render
        const fallbackFonts = coreFonts.filter((f: any) => f.name === 'Inter');

        svg = await satori(
            React.createElement('div', {
                style: { display: 'flex', width: '100%', height: '100%', background: '#ff0000', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexDirection: 'column' }
            }, [
                React.createElement('div', {}, 'Render Failed'),
                React.createElement('div', { style: { fontSize: 20, marginTop: 20 } }, e.message)
            ]),
            { width, height, fonts: (fallbackFonts.length > 0 ? fallbackFonts : []) as any }
        );
    }

    // 5. Resvg
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
    return resvg.render().asPng();
}
