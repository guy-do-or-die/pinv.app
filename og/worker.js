const fs = require('fs');
const path = require('path');
const { transform } = require('sucrase');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const React = require('react');
const Lucide = require('lucide-react');

// Disable console.log in worker to avoid polluting stdout (which is used for PNG output)
const originalConsoleLog = console.log;
console.log = console.error; // Redirect log to stderr

async function run() {
    try {
        const tStart = performance.now();

        // 1. Read Input from Stdin
        const chunks = [];
        for await (const chunk of process.stdin) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const inputStr = buffer.toString('utf8');

        if (!inputStr) {
            throw new Error('No input provided to worker');
        }

        const input = JSON.parse(inputStr);
        const { uiCode, props, width = 1200, height = 800 } = input;

        if (!uiCode) {
            throw new Error('Missing uiCode');
        }

        const tInput = performance.now();
        // console.error(`[Worker Perf] Input Read: ${(tInput - tStart).toFixed(2)}ms`); 

        // 2. Load Fonts
        // We assume fonts are in ./public/fonts relative to CWD or current file
        const fontPath = path.join(__dirname, 'public/fonts');
        const interRegular = fs.readFileSync(path.join(fontPath, 'Inter_18pt-Medium.ttf'));
        const interBold = fs.readFileSync(path.join(fontPath, 'Inter_18pt-SemiBold.ttf'));

        // 3. Transpile User Code
        const transpiled = transform(uiCode, {
            transforms: ['jsx', 'imports'],
            production: true,
        }).code;

        // 4. Sandbox Setup
        const proxiedReact = { ...React };
        const baseUrl = input.baseUrl || 'http://localhost:3000';

        // Intercept createElement to enforce styles if needed (similar to existing logic)
        proxiedReact.createElement = (type, props, ...children) => {
            // Ensure props is an object
            props = props || {};

            if (type === 'div') {
                const newStyle = { ...(props.style || {}) };
                if (!newStyle.display) {
                    newStyle.display = 'flex';
                }
                props = { ...props, style: newStyle };
            }

            // AUTO-FIX: Resolve relative image URLs in backgroundImage
            if (props.style && props.style.backgroundImage) {
                const bg = props.style.backgroundImage;
                if (typeof bg === 'string') {
                    // Handle url(...) wrapper
                    // Basic match for url('...') or url("...") or url(...)
                    const urlMatch = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
                    if (urlMatch) {
                        const rawUrl = urlMatch[1];
                        // Check for common bad values
                        try {
                            if (rawUrl === 'undefined' || rawUrl === 'null' || !rawUrl) {
                                // If undefined/null, DELETE the background image style to avoid crash
                                const newStyle = { ...props.style };
                                delete newStyle.backgroundImage;
                                props = { ...props, style: newStyle };
                            } else if (rawUrl.startsWith('/')) {
                                const newUrl = `${baseUrl}${rawUrl}`;
                                props = {
                                    ...props,
                                    style: {
                                        ...props.style,
                                        backgroundImage: `url('${newUrl}')`
                                    }
                                };
                            }
                        } catch (e) { }
                    }
                }
            }
            // AUTO-FIX: Resolve relative src in img tags
            if (type === 'img' && props) {
                if (!props.src || typeof props.src !== 'string') {
                    // Start of Stub: Satori crashes on missing src. Provide transparent pixel.
                    props = { ...props, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
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

        // 5. Execute Code
        const func = new Function('React', 'exports', 'require', ...Object.keys(Lucide), transpiled);
        func(proxiedReact, scope.exports, scope.require, ...Object.values(Lucide));

        const WidgetComponent = scope.exports.default;
        if (!WidgetComponent) {
            throw new Error('No default export found in widget code');
        }

        const tSetup = performance.now();
        // console.error(`[Worker Perf] Setup: ${(tSetup - tInput).toFixed(2)}ms`);

        // 6. Satori Render (React -> SVG)
        const svg = await satori(
            React.createElement(WidgetComponent, props),
            {
                width,
                height,
                fonts: [
                    {
                        name: 'Inter',
                        data: interRegular,
                        weight: 400,
                        style: 'normal',
                    },
                    {
                        name: 'Inter',
                        data: interBold,
                        weight: 700,
                        style: 'normal',
                    },
                ],
            }
        );
        const tSatori = performance.now();
        console.error(`[Worker Perf] Satori Render: ${(tSatori - tSetup).toFixed(2)}ms`);

        // 7. Resvg Render (SVG -> PNG)
        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: width }
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        const tResvg = performance.now();
        console.error(`[Worker Perf] Resvg Render: ${(tResvg - tSatori).toFixed(2)}ms`);
        console.error(`[Worker Perf] Total Worker: ${(tResvg - tStart).toFixed(2)}ms`);

        // 8. Output
        process.stdout.write(pngBuffer);

    } catch (err) {
        console.error('Worker Error:', err);
        process.exit(1);
    }
}

run();
