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

// Carbon Extension UV Config Integration
// Load extension settings from storage or defaults
let carbonExtensionSettings = {
  uvConfig: {
    darkMode: true,
    customCSS: true,
    customJS: true,
    globalEnhancements: true
  }
};

// Try to load from extension storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get('extensionSettings', (result) => {
    if (result.extensionSettings) {
      carbonExtensionSettings = result.extensionSettings;
    }
  });
}

// Only run in browser context, not in worker
if (typeof window !== "undefined" && typeof document !== "undefined") {
  (function carbonExtensionEnhancedInjection() {
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
      const config = carbonExtensionSettings.uvConfig || {};
      
      // Inject Dark Mode CSS if enabled
      if (config.darkMode !== false) {
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
              input, textarea, select {
                background: #23272a !important;
                color: #e8e6e3 !important;
                border-color: #3a3f41 !important;
              }
              button {
                background: #2c2f33 !important;
                color: #e8e6e3 !important;
                border-color: #3a3f41 !important;
              }
              .carbon-dark-theme {
                background: #181a1b !important;
                color: #e8e6e3 !important;
              }
            \`;
            let style = document.createElement('style');
            style.id = 'carbon-uv-dark-css';
            style.textContent = darkCSS;
            document.head.appendChild(style);
          })();
        `);
      }

      // Custom CSS/JS injectors if enabled
      if (config.customCSS !== false) {
        __uv$eval(`
          window.carbonInjectCSS = function(css) {
            let styleTag = document.getElementById('carbon-custom-css');
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = 'carbon-custom-css';
              document.head.appendChild(styleTag);
            }
            styleTag.textContent = css;
          };
        `);
      }

      if (config.customJS !== false) {
        __uv$eval(`
          window.carbonInjectScript = function(js) {
            let scriptTag = document.createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.textContent = js;
            scriptTag.id = 'carbon-injected-script-' + Date.now();
            document.body.appendChild(scriptTag);
          };
        `);
      }

      // Global enhancements if enabled
      if (config.globalEnhancements !== false) {
        __uv$eval(`
          (function carbonGlobalEnhancements() {
            // Enhanced scrolling
            if (window.CSS && CSS.supports('scroll-behavior', 'smooth')) {
              document.documentElement.style.scrollBehavior = 'smooth';
            }
            
            // Better image loading
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              if (!img.loading) {
                img.loading = 'lazy';
              }
            });
            
            // Add Carbon branding
            if (!document.getElementById('carbon-branding')) {
              const branding = document.createElement('div');
              branding.id = 'carbon-branding';
              branding.innerHTML = '⚡ Powered by Carbon';
              branding.style.cssText = \`
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: #00ff88;
                padding: 4px 8px;
                border-radius: 12px;
                font-family: monospace;
                font-size: 10px;
                z-index: 9999;
                pointer-events: none;
                opacity: 0.8;
              \`;
              document.body.appendChild(branding);
              
              // Fade out after 3 seconds
              setTimeout(() => {
                branding.style.transition = 'opacity 1s';
                branding.style.opacity = '0';
                setTimeout(() => branding.remove(), 1000);
              }, 3000);
            }
            
            // Console styling
            console.log('%c🔥 Carbon Browser - Enhanced Browsing Experience', 
              'background: linear-gradient(45deg, #00ff88, #0099ff); color: black; padding: 8px 12px; border-radius: 8px; font-weight: bold;');
          })();
        `);
      }

      // Listen for extension updates
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.action === 'updateUVConfig') {
            carbonExtensionSettings.uvConfig = message.settings;
            // Reload the page to apply new settings
            window.location.reload();
          }
        });
      }
    });
  })();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = self.__uv$config;
}
