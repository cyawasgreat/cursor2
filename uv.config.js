self.__uv$config = {
  prefix: "/uv/",
  encodeUrl: Ultraviolet.codec.plain.encode,
  decodeUrl: Ultraviolet.codec.plain.decode,
  handler: "https://cdn.jsdelivr.net/npm/@titaniumnetwork-dev/ultraviolet/dist/uv.handler.js",
  client: "https://cdn.jsdelivr.net/npm/@titaniumnetwork-dev/ultraviolet/dist/uv.client.js",
  bundle: "https://cdn.jsdelivr.net/npm/@titaniumnetwork-dev/ultraviolet/dist/uv.bundle.js",
  config: "/uv.config.js",
  sw: "https://cdn.jsdelivr.net/npm/@titaniumnetwork-dev/ultraviolet/dist/uv.sw.js"
};

// Only run in browser context, not in worker
if (typeof window !== "undefined" && typeof document !== "undefined") {
  (function globalEnhancementsInjection() {
    function waitForEvalReady() {
      return new Promise(resolve => {
        if (typeof __uv$eval !== "undefined") return resolve();
        const interval = setInterval(() => {
          if (typeof __uv$eval !== "undefined") {
            clearInterval(interval);
            resolve();
          }
        }, 10);
      });
    }

    // Only run in the proxied iframe, not the main window
    if (window.top === window) return;

    waitForEvalReady().then(() => {
      __uv$eval(`
        (function injectDarkCSS() {
          const darkCSS = \`
            html, body {
              background: #181a1b !important;
              color: #e8e6e3 !important;
              color-scheme: dark !important;
            }
            * {
              background-color: transparent !important;
              border-color: #23272a !important;
              color: inherit !important;
            }
            a, a * {
              color: #8ab4f8 !important;
            }
            [class*="background"], [class*="container"], [class*="scroller"], [class*="content"] {
              background: #181a1b !important;
              color: #e8e6e3 !important;
            }
            ::selection {
              background: #3a3f41 !important;
            }
            ::-webkit-scrollbar {
              background: #23272a !important;
              width: 12px;
            }
            ::-webkit-scrollbar-thumb {
              background: #2c2f33 !important;
            }
          \`;
          let style = document.createElement('style');
          style.id = 'uv-injected-dark-css';
          style.textContent = darkCSS;
          document.head.appendChild(style);
        })();

        // Custom CSS/JS injectors for user
        window.injectCustomCSS = function(css) {
          let styleTag = document.getElementById('custom-css-injector');
          if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-css-injector';
            document.head.appendChild(styleTag);
          }
          styleTag.textContent = css;
        };
        window.injectCustomScript = function(js) {
          let scriptTag = document.createElement('script');
          scriptTag.type = 'text/javascript';
          scriptTag.textContent = js;
          document.body.appendChild(scriptTag);
        };
      `);
    });
  })();
}
