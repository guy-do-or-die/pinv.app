const fs = require('fs');
const path = require('path');
const { transform } = require('sucrase');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Lucide = require('lucide-react');
const emojiRegex = require('emoji-regex');

// Global Font Cache (Loaded Once per Thread)
const possiblePaths = [
    path.join(__dirname, 'public/fonts'),
    path.join(process.cwd(), 'og/public/fonts'),
    path.join(process.cwd(), 'public/fonts'),
];
const fontPath = possiblePaths.find(p => fs.existsSync(p));

if (!fontPath) {
    console.error(`[Worker] Fonts NOT FOUND. Checked:`, possiblePaths);
} else {
    // console.log(`[Worker] Loaded fonts from: ${fontPath}`);
}

let interRegular, interBold, emojiFont;

try {
    if (fontPath) {
        interRegular = fs.readFileSync(path.join(fontPath, 'Inter_18pt-Medium.ttf'));
        interBold = fs.readFileSync(path.join(fontPath, 'Inter_18pt-SemiBold.ttf'));
        try {
            emojiFont = fs.readFileSync(path.join(fontPath, 'NotoEmoji-Regular.ttf'));
        } catch (e) {
            console.error("Emoji font missing");
        }
    }
} catch (e) {
    console.error("[Worker] Font Load Failed at Startup:", e);
}

// Redirect Console in Worker?
// Piscina pipes worker stdout/stderr to parent. We can keep console.log or use console.error.
// But we return buffer directly now.

// Worker Protocol (Bun Native)
self.onmessage = async (event) => {
    const { id, data } = event.data;
    try {
        const result = await render(data);
        self.postMessage({ id, result });
    } catch (e) {
        self.postMessage({ id, error: e.message || String(e) });
    }
};

// Internal Render Function
async function render(input) {
    try {
        const { uiCode, props, width = 1200, height = 800, baseUrl = 'http://localhost:3000' } = input;

        if (!uiCode) {
            throw new Error('Missing uiCode');
        }

        const tStart = performance.now();

        // 1. Transpile User Code (Sucrase is fast)
        const transpiled = transform(uiCode, {
            transforms: ['jsx', 'imports'],
            production: true,
        }).code;

        // 2. Sandbox Setup
        const proxiedReact = { ...React };

        // Intercept createElement to enforce styles if needed
        proxiedReact.createElement = (type, props, ...children) => {
            props = props || {};

            if (type === 'div') {
                const newStyle = { ...(props.style || {}) };
                if (!newStyle.display) {
                    newStyle.display = 'flex';
                }
                props = { ...props, style: newStyle };
            }

            // CSS Transformations (Background Images, Unsplash fixes)
            if (props.style) {
                // Background Image
                if (props.style.backgroundImage) {
                    const bg = props.style.backgroundImage;
                    if (typeof bg === 'string') {
                        if (bg.includes('source.unsplash.com')) {
                            const newStyle = {
                                ...props.style,
                                backgroundImage: `url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`
                            };
                            props = { ...props, style: newStyle };
                        } else {
                            const urlMatch = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
                            if (urlMatch) {
                                const rawUrl = urlMatch[1];
                                if (rawUrl.startsWith('/')) {
                                    const newUrl = `${baseUrl}${rawUrl}`;
                                    props = { ...props, style: { ...props.style, backgroundImage: `url('${newUrl}')` } };
                                }
                            }
                        }
                    }
                }
                // Background Shorthand
                if (props.style.background && typeof props.style.background === 'string') {
                    if (props.style.background.includes('source.unsplash.com')) {
                        const newStyle = {
                            ...props.style,
                            background: `url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`
                        };
                        props = { ...props, style: newStyle };
                    }
                }
            }

            // Img Src Resolution
            if (type === 'img' && props) {
                if (!props.src || typeof props.src !== 'string') {
                    props = { ...props, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
                } else if (props.src.includes('source.unsplash.com')) {
                    props = { ...props, src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' };
                } else if (props.src.startsWith('/')) {
                    props = { ...props, src: `${baseUrl}${props.src}` };
                }
            }

            return React.createElement(type, props, ...children);
        };

        const scope = {
            React: proxiedReact,
            ...Lucide,
            require: (mod) => {
                if (mod === 'react') return proxiedReact;
                if (mod === 'lucide-react') return Lucide;
                return null;
            },
            exports: { default: null }
        };

        // 3. Execute Code (Sandbox)
        const func = new Function('React', 'exports', 'require', ...Object.keys(Lucide), transpiled);
        func(proxiedReact, scope.exports, scope.require, ...Object.values(Lucide));

        const WidgetComponent = scope.exports.default;
        if (!WidgetComponent) {
            throw new Error('No default export found in widget code');
        }

        // 4. Emoji & Font Pre-flight (Render to Static Markup)
        const element = React.createElement(WidgetComponent, props);
        let graphemeImages = {};
        const dynamicFonts = [];

        try {
            // Check for Emojis
            const htmlString = ReactDOMServer.renderToStaticMarkup(element);
            const regex = emojiRegex();
            const foundEmojis = new Set();
            let match;
            while ((match = regex.exec(htmlString))) {
                foundEmojis.add(match[0]);
            }

            // Load Twemojis
            if (foundEmojis.size > 0) {
                const loadTwemoji = async (emojiChar) => {
                    try {
                        const codePoints = [...emojiChar].map(c => c.codePointAt(0));
                        const hex = codePoints.map(c => c.toString(16)).join('-');
                        let url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;
                        let res = await fetch(url);
                        if (!res.ok && hex.endsWith('-fe0f')) {
                            // Retry without variant selector
                            url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex.replace(/-fe0f$/, '')}.svg`;
                            res = await fetch(url);
                        }
                        if (res.ok) {
                            const svgText = await res.text();
                            const base64 = Buffer.from(svgText).toString('base64');
                            return `data:image/svg+xml;base64,${base64}`;
                        }
                    } catch (e) { }
                    return null;
                };

                const emojiConfig = await Promise.all(Array.from(foundEmojis).map(async (char) => ({ char, dataUrl: await loadTwemoji(char) })));
                emojiConfig.forEach(({ char, dataUrl }) => {
                    if (dataUrl) graphemeImages[char] = dataUrl;
                });
            }
        } catch (e) {
            console.error("[Worker] Pre-flight/Emoji check failed:", e);
        }

        // Load Dynamic Fonts
        const userConfig = scope.exports.config || {};
        if (userConfig.fonts && Array.isArray(userConfig.fonts)) {
            const fontRequests = userConfig.fonts.map(async (fontDef) => {
                try {
                    const res = await fetch(fontDef.url);
                    if (!res.ok) throw new Error(`404 ${fontDef.url}`);
                    return {
                        name: fontDef.name,
                        data: Buffer.from(await res.arrayBuffer()),
                        weight: fontDef.weight || 400,
                        style: fontDef.style || 'normal'
                    };
                } catch (e) {
                    console.error("[Worker] Font fetch failed:", e.message);
                    return null;
                }
            });
            const results = await Promise.all(fontRequests);
            dynamicFonts.push(...results.filter(Boolean));
        }

        // 5. Satori Render
        let svg;
        try {
            svg = await satori(element, {
                width,
                height,
                fonts: [
                    { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
                    { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
                    ...(emojiFont ? [{ name: 'Noto Emoji', data: emojiFont, weight: 400, style: 'normal' }] : []),
                    ...dynamicFonts
                ],
                graphemeImages
            });
        } catch (satoriErr) {
            // Fallback Error Render
            console.error("[Worker] Satori Failed, Using Fallback:", satoriErr);
            svg = await satori(
                React.createElement('div', {
                    style: { display: 'flex', width: '100%', height: '100%', background: '#ff0000', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexDirection: 'column' }
                }, [
                    React.createElement('div', {}, 'Render Failed'),
                    React.createElement('div', { style: { fontSize: 20, marginTop: 20 } }, satoriErr.message)
                ]),
                { width, height, fonts: [{ name: 'Inter', data: interRegular, weight: 400, style: 'normal' }] }
            );
        }

        // 6. Resvg Render (SVG -> PNG)
        const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        // console.log(`[Worker] Rendered in ${(performance.now() - tStart).toFixed(2)}ms`); 
        return pngBuffer;

    } catch (err) {
        console.error("[Worker] Critical Error:", err);
        throw err;
    }
};
