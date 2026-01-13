'use client';

import { useEffect, useRef } from 'react';

const IFRAME_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; background: transparent; color: white; font-family: sans-serif; overflow: hidden; }
    /* Hide scrollbars */
    ::-webkit-scrollbar { display: none; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    // --- Lucide React Shim ---
    // Converts window.lucide.icons (vanilla JS definitions) into React components
    window.LucideReact = {};
    if (window.lucide && window.lucide.icons) {
      Object.keys(window.lucide.icons).forEach(iconName => {
        const iconDef = window.lucide.icons[iconName];
        // iconDef usually: [ tag, attrs, children ] (if new format) OR logic from createElement
        // Actually lucide version varies. Let's assume standard behavior or fallback.
        // Lucide 0.x exports object of params.
        
        window.LucideReact[iconName] = (props) => {
          const { color = "currentColor", size = 24, strokeWidth = 2, children, ...rest } = props;
          
          // Basic SVG wrapper matching Lucide defaults
          return React.createElement('svg', {
            xmlns: "http://www.w3.org/2000/svg",
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: color,
            strokeWidth: strokeWidth,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            ...rest,
            // Render children (paths) from iconDef if available. 
            // NOTE: Parsing the exact lucide definition structure here safely is complex.
            // For robustness, we will try to use the 'lucide.createIcons' logic OR 
            // just render a placeholder if parsing fails.
            //
            // BETTER: Use 'dangerouslySetInnerHTML' if we can get the SVG string? No.
            //
            // Hack for MVP: Render the generic Lucide structure if it's an array.
            // [tag, attrs, children]
            
          }, (Array.isArray(iconDef) ? iconDef : []).map(([tag, attrs, subChildren], i) => 
             React.createElement(tag, { ...attrs, key: i })
          ));
        };
        // Add PascalCase alias if key is mixed (Lucide keys are usually PascalCase already)
      });
    }

    // --- Main Executor ---
    window.addEventListener('message', (event) => {
      const { code } = event.data;
      if (!code) return;

      try {
        let cleanCode = code;
        
        // 1. Shim Imports
        // Replace "import { X, Y } from 'lucide-react'" with "const { X, Y } = window.LucideReact"
        // Regex handles newlines and spaces roughly
        cleanCode = cleanCode.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g, 'const { $1 } = window.LucideReact || {};');

        // 2. Extract Return Statement
        if (cleanCode.includes('export default')) {
          cleanCode = cleanCode.replace(/export\s+default\s+(function\s+\w+|class\s+\w+|const\s+\w+|async\s+function\s+\w+|function\()*?/, 'return $1');
          cleanCode = cleanCode.replace(/export\s+default\s+([a-zA-Z0-9_]+);?/, 'return $1;');
        }
        
        const transformedCode = Babel.transform(cleanCode, { presets: ['react'] }).code;
        
        const getComponent = new Function('React', 'return (function() { ' + transformedCode + ' })()');
        const WidgetComponent = getComponent(React);

        if (!WidgetComponent) {
          throw new Error('No component returned. Did you forget "export default"?');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<WidgetComponent />);
        
        // Send height update
        const resizeObserver = new ResizeObserver(() => {
          window.parent.postMessage({ type: 'resize', height: document.body.scrollHeight }, '*');
        });
        resizeObserver.observe(document.body);

      } catch (err) {
        console.error("Sandbox Error:", err);
        document.getElementById('root').innerHTML = '<div class="text-red-500 p-4 font-mono text-sm">Runtime Error: ' + err.message + '</div>';
      }
    });
  </script>
</body>
</html>
`;

export default function SandboxRunner({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      // Send code to iframe
      // Small delay to ensure iframe is ready
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ code }, '*');
      }, 100);
    }
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'resize' && iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height}px`;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={IFRAME_TEMPLATE}
      className="w-full border-none transition-all duration-200"
      style={{ minHeight: '100px' }}
      sandbox="allow-scripts"
    />
  );
}
