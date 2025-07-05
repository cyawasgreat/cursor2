// Content script for Carbon Extension
let extensionSettings = {};
let panicKeyHandler = null;
let stealthMode = false;
let closePreventionEnabled = false;
let originalUVConfig = null;

// Initialize extension features
function initializeExtension(settings) {
    extensionSettings = settings || {};
    
    // Initialize UV config modifications
    updateUVConfig();
    
    // Setup panic key listener
    setupPanicKeyListener();
    
    // Apply theme
    applyCurrentTheme();
    
    // Setup stealth mode
    if (extensionSettings.stealth?.enabled) {
        enableStealthMode();
    }
    
    // Setup close prevention
    updateClosePrevention();
    
    console.log('Carbon Extension initialized');
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'initializeExtension':
            initializeExtension(message.settings);
            break;
        case 'updateUVConfig':
            extensionSettings.uvConfig = message.settings;
            updateUVConfig();
            break;
        case 'enableStealth':
            extensionSettings.stealth = message.settings;
            enableStealthMode();
            break;
        case 'disableStealth':
            disableStealthMode();
            break;
        case 'applyTheme':
            applyTheme(message.theme);
            break;
        case 'updatePanicKey':
            extensionSettings.panic = message.panic;
            setupPanicKeyListener();
            break;
        case 'updateClosePrevention':
            extensionSettings.closePrevention = message.settings;
            updateClosePrevention();
            break;
        case 'hideAllContent':
            hideAllContent();
            break;
    }
});

// Update UV configuration injection
function updateUVConfig() {
    // Only modify uv.config.js if we're in the main window context
    if (window.self !== window.top || !window.__uv$config) return;
    
    if (!originalUVConfig) {
        originalUVConfig = JSON.parse(JSON.stringify(window.__uv$config));
    }
    
    const config = extensionSettings.uvConfig || {};
    
    // Create a new config based on settings
    const newConfig = `
self.__uv$config = ${JSON.stringify(originalUVConfig)};

// Carbon Extension UV Config Modifications
if (typeof window !== "undefined" && typeof document !== "undefined") {
  (function carbonExtensionInjection() {
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
      ${config.darkMode ? `
      __uv$eval(\`
        (function injectDarkCSS() {
          const darkCSS = \\\`
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
          \\\`;
          let style = document.createElement('style');
          style.id = 'uv-injected-dark-css';
          style.textContent = darkCSS;
          document.head.appendChild(style);
        })();
      \`);` : ''}

      ${config.customCSS ? `
      // Custom CSS/JS injectors for user
      window.injectCustomCSS = function(css) {
        let styleTag = document.getElementById('custom-css-injector');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'custom-css-injector';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = css;
      };` : ''}

      ${config.customJS ? `
      window.injectCustomScript = function(js) {
        let scriptTag = document.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.textContent = js;
        document.body.appendChild(scriptTag);
      };` : ''}
    });
  })();
}
`;

    // Inject the modified config
    try {
        eval(newConfig);
        console.log('UV Config updated by Carbon Extension');
    } catch (error) {
        console.error('Error updating UV config:', error);
    }
}

// Setup panic key listener
function setupPanicKeyListener() {
    // Remove existing listener
    if (panicKeyHandler) {
        document.removeEventListener('keydown', panicKeyHandler);
    }
    
    if (!extensionSettings.panic) return;
    
    panicKeyHandler = (event) => {
        const { modifier, key } = extensionSettings.panic;
        
        let modifierPressed = false;
        
        switch (modifier) {
            case 'ctrl':
                modifierPressed = event.ctrlKey && !event.shiftKey && !event.altKey;
                break;
            case 'alt':
                modifierPressed = event.altKey && !event.ctrlKey && !event.shiftKey;
                break;
            case 'shift':
                modifierPressed = event.shiftKey && !event.ctrlKey && !event.altKey;
                break;
            case 'ctrl+shift':
                modifierPressed = event.ctrlKey && event.shiftKey && !event.altKey;
                break;
        }
        
        let keyPressed = false;
        
        switch (key) {
            case 'p':
                keyPressed = event.key.toLowerCase() === 'p';
                break;
            case 'x':
                keyPressed = event.key.toLowerCase() === 'x';
                break;
            case 'esc':
                keyPressed = event.key === 'Escape';
                break;
            case 'space':
                keyPressed = event.key === ' ';
                break;
        }
        
        if (modifierPressed && keyPressed) {
            event.preventDefault();
            chrome.runtime.sendMessage({ action: 'executePanic' });
        }
    };
    
    document.addEventListener('keydown', panicKeyHandler);
}

// Enable stealth mode features
function enableStealthMode() {
    stealthMode = true;
    
    const settings = extensionSettings.stealth || {};
    
    // Spoof canvas fingerprinting
    if (settings.spoofCanvas) {
        spoofCanvasFingerprinting();
    }
    
    // Hide from history (client-side indication)
    if (settings.hideFromHistory) {
        addToHistoryIndicator();
    }
    
    // Add stealth mode indicator
    addStealthModeIndicator();
    
    console.log('Stealth mode enabled');
}

// Disable stealth mode
function disableStealthMode() {
    stealthMode = false;
    
    // Remove stealth mode indicator
    removeStealthModeIndicator();
    
    // Remove history indicator
    removeHistoryIndicator();
    
    console.log('Stealth mode disabled');
}

// Spoof canvas fingerprinting
function spoofCanvasFingerprinting() {
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
            
            HTMLCanvasElement.prototype.getContext = function(...args) {
                const context = originalGetContext.apply(this, args);
                if (context && args[0] === '2d') {
                    const originalFillText = context.fillText;
                    context.fillText = function(...args) {
                        // Add slight randomization to text rendering
                        const originalGlobalAlpha = this.globalAlpha;
                        this.globalAlpha = Math.random() * 0.01 + 0.99;
                        const result = originalFillText.apply(this, args);
                        this.globalAlpha = originalGlobalAlpha;
                        return result;
                    };
                }
                return context;
            };
            
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                // Add noise to canvas output
                const imageData = this.getContext('2d').getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] = Math.min(255, imageData.data[i] + Math.random() * 2 - 1);
                }
                this.getContext('2d').putImageData(imageData, 0, 0);
                return originalToDataURL.apply(this, args);
            };
        })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
}

// Add stealth mode indicator
function addStealthModeIndicator() {
    if (document.getElementById('carbon-stealth-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'carbon-stealth-indicator';
    indicator.innerHTML = '🥷 Stealth Mode';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        padding: 5px 10px;
        border-radius: 15px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        border: 1px solid #00ff00;
    `;
    document.body.appendChild(indicator);
}

// Remove stealth mode indicator
function removeStealthModeIndicator() {
    const indicator = document.getElementById('carbon-stealth-indicator');
    if (indicator) indicator.remove();
}

// Add history indicator
function addToHistoryIndicator() {
    // This is just a visual indicator; actual history management would be in background script
    if (document.getElementById('carbon-history-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'carbon-history-indicator';
    indicator.innerHTML = '🕳️ Hidden';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #ff9500;
        padding: 5px 10px;
        border-radius: 15px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        border: 1px solid #ff9500;
    `;
    document.body.appendChild(indicator);
}

// Remove history indicator
function removeHistoryIndicator() {
    const indicator = document.getElementById('carbon-history-indicator');
    if (indicator) indicator.remove();
}

// Apply theme
function applyTheme(theme) {
    const themeId = 'carbon-extension-theme';
    let existingTheme = document.getElementById(themeId);
    
    if (existingTheme) {
        existingTheme.remove();
    }
    
    const themeStyle = document.createElement('style');
    themeStyle.id = themeId;
    themeStyle.textContent = `
        :root {
            --carbon-primary: ${theme.primary} !important;
            --carbon-secondary: ${theme.secondary} !important;
            --carbon-text: ${theme.text} !important;
            --carbon-accent: ${theme.accent} !important;
        }
        
        body {
            background-color: var(--carbon-primary) !important;
            color: var(--carbon-text) !important;
        }
        
        .carbon-themed {
            background-color: var(--carbon-secondary) !important;
            color: var(--carbon-text) !important;
            border-color: var(--carbon-accent) !important;
        }
    `;
    
    document.head.appendChild(themeStyle);
}

// Apply current theme from settings
function applyCurrentTheme() {
    if (!extensionSettings.theme) return;
    
    const themes = {
        dark: { primary: '#1f1d2e', secondary: '#26233a', text: '#e0def4', accent: '#9ccfd8' },
        light: { primary: '#ffffff', secondary: '#f8f9fa', text: '#212529', accent: '#0d6efd' },
        cappuccino: { primary: '#2d1b14', secondary: '#3c2a1e', text: '#f4e4bc', accent: '#d4a574' },
        default: { primary: '#191724', secondary: '#1f1d2e', text: '#e0def4', accent: '#c4a7e7' }
    };
    
    const theme = themes[extensionSettings.theme];
    if (theme) {
        applyTheme(theme);
    }
}

// Update close prevention
function updateClosePrevention() {
    const settings = extensionSettings.closePrevention || {};
    
    // Remove existing listeners
    window.removeEventListener('beforeunload', closePreventionHandler);
    
    if (settings.preventClose || settings.confirmClose) {
        closePreventionEnabled = true;
        window.addEventListener('beforeunload', closePreventionHandler);
    } else {
        closePreventionEnabled = false;
    }
}

// Close prevention handler
function closePreventionHandler(event) {
    const settings = extensionSettings.closePrevention || {};
    
    if (settings.preventClose) {
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
    
    if (settings.confirmClose) {
        const message = 'Are you sure you want to leave this page?';
        event.returnValue = message;
        return message;
    }
}

// Hide all content (panic action)
function hideAllContent() {
    // Create overlay to hide content
    const overlay = document.createElement('div');
    overlay.id = 'carbon-panic-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #ffffff;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        font-family: Arial, sans-serif;
    `;
    
    overlay.innerHTML = `
        <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google" style="margin-bottom: 30px;">
        <div style="max-width: 600px; text-align: center;">
            <input type="text" placeholder="Search Google or type a URL" style="
                width: 500px;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 25px;
                font-size: 16px;
                outline: none;
            ">
        </div>
        <div style="margin-top: 30px; font-size: 14px; color: #666;">
            Press Ctrl+Shift+R to restore
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Listen for restore key combination
    const restoreHandler = (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
            overlay.remove();
            document.removeEventListener('keydown', restoreHandler);
        }
    };
    
    document.addEventListener('keydown', restoreHandler);
}

// Handle carbon:// protocol redirects
function handleCarbonProtocol() {
    if (window.location.protocol === 'carbon:') {
        const path = window.location.hostname + window.location.pathname;
        
        if (path === 'games' || path === 'games/') {
            window.location.href = chrome.runtime.getURL('games.html');
        } else if (path === 'settings' || path === 'settings/') {
            window.location.href = chrome.runtime.getURL('settings.html');
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        handleCarbonProtocol();
        // Request current settings from background script
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            if (response) {
                initializeExtension(response);
            }
        });
    });
} else {
    handleCarbonProtocol();
    // Request current settings from background script
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response) {
            initializeExtension(response);
        }
    });
}

// Handle page visibility changes for stealth mode
document.addEventListener('visibilitychange', () => {
    if (stealthMode && document.hidden) {
        // Page is hidden, could add additional stealth features here
        console.log('Page hidden - stealth mode active');
    }
});