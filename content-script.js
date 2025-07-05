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
    console.log('Updating UV config with settings:', extensionSettings.uvConfig);
    
    const config = extensionSettings.uvConfig || {};
    
    // Remove existing UV injections
    const existingDark = document.getElementById('carbon-uv-dark-css');
    if (existingDark) existingDark.remove();
    
    // Apply dark mode injection if enabled
    if (config.darkMode) {
        const darkCSS = `
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
        `;
        
        const style = document.createElement('style');
        style.id = 'carbon-uv-dark-css';
        style.textContent = darkCSS;
        document.head.appendChild(style);
        console.log('Dark mode CSS injected');
    }

    // Setup custom CSS injector if enabled
    if (config.customCSS) {
        window.carbonInjectCSS = function(css) {
            let styleTag = document.getElementById('carbon-custom-css');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'carbon-custom-css';
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = css;
            console.log('Custom CSS injected');
        };
    } else {
        delete window.carbonInjectCSS;
    }

    // Setup custom JS injector if enabled
    if (config.customJS) {
        window.carbonInjectScript = function(js) {
            const scriptTag = document.createElement('script');
            scriptTag.type = 'text/javascript';
            scriptTag.textContent = js;
            scriptTag.id = 'carbon-injected-script-' + Date.now();
            document.body.appendChild(scriptTag);
            console.log('Custom script injected');
        };
    } else {
        delete window.carbonInjectScript;
    }

    // Apply global enhancements if enabled
    if (config.globalEnhancements) {
        // Smooth scrolling
        if (window.CSS && CSS.supports('scroll-behavior', 'smooth')) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
        
        // Lazy loading for images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => img.loading = 'lazy');
        
        console.log('Global enhancements applied');
    }
}

// Setup panic key listener
function setupPanicKeyListener() {
    // Remove existing listener
    if (panicKeyHandler) {
        document.removeEventListener('keydown', panicKeyHandler);
        panicKeyHandler = null;
    }
    
    if (!extensionSettings.panic) return;
    
    const { modifier, key } = extensionSettings.panic;
    console.log('Setting up panic key listener:', modifier + '+' + key);
    
    panicKeyHandler = (event) => {
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
            console.log('Panic key triggered!', modifier + '+' + key);
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({ action: 'executePanic' });
        }
    };
    
    document.addEventListener('keydown', panicKeyHandler, true); // Use capture phase
    console.log('Panic key listener setup complete');
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

// Apply theme globally to all pages
function applyTheme(themeName) {
    console.log('Applying global theme:', themeName);
    
    const themes = {
        dark: {
            background: '#1f1d2e',
            surface: '#2a273f',
            text: '#e8e6e3',
            textSecondary: '#9893a5',
            accent: '#00ff88',
            border: '#3b3851'
        },
        light: {
            background: '#ffffff',
            surface: '#f8f9fa',
            text: '#333333',
            textSecondary: '#666666',
            accent: '#0066cc',
            border: '#e1e5e9'
        },
        cappuccino: {
            background: '#2d1b14',
            surface: '#3d2b1f',
            text: '#f4f1de',
            textSecondary: '#d4c5a9',
            accent: '#e07a5f',
            border: '#4d3b2f'
        },
        default: {
            background: '#191724',
            surface: '#26233a',
            text: '#e0def4',
            textSecondary: '#908caa',
            accent: '#c4a7e7',
            border: '#403d52'
        }
    };

    const theme = themes[themeName] || themes.default;
    
    // Remove existing theme styles
    const existingTheme = document.getElementById('carbon-global-theme');
    if (existingTheme) {
        existingTheme.remove();
    }
    
    // Create comprehensive theme CSS that affects the ENTIRE page
    const themeCSS = `
        :root {
            --carbon-bg: ${theme.background} !important;
            --carbon-surface: ${theme.surface} !important;
            --carbon-text: ${theme.text} !important;
            --carbon-text-secondary: ${theme.textSecondary} !important;
            --carbon-accent: ${theme.accent} !important;
            --carbon-border: ${theme.border} !important;
        }
        
        /* Apply to HTML and body */
        html, body {
            background-color: ${theme.background} !important;
            color: ${theme.text} !important;
            transition: background-color 0.3s ease, color 0.3s ease !important;
        }
        
        /* Apply to ALL elements */
        * {
            color: inherit !important;
            border-color: ${theme.border} !important;
        }
        
        /* Override all background elements */
        div, section, article, header, footer, nav, main, aside, span,
        .bg-white, .bg-gray-50, .bg-gray-100, .bg-gray-200, .bg-gray-300,
        .bg-gray-800, .bg-gray-900, .bg-black, .bg-primary, .bg-secondary,
        [class*="bg-"], [style*="background"] {
            background-color: ${theme.background} !important;
            color: ${theme.text} !important;
        }
        
        /* Cards and containers */
        .card, .container, .wrapper, .content, .panel, .box, .modal,
        [class*="card"], [class*="container"], [class*="wrapper"],
        [class*="panel"], [class*="box"] {
            background-color: ${theme.surface} !important;
            color: ${theme.text} !important;
            border-color: ${theme.border} !important;
        }
        
        /* Form elements */
        input, textarea, select, button {
            background-color: ${theme.surface} !important;
            color: ${theme.text} !important;
            border-color: ${theme.border} !important;
        }
        
        input:focus, textarea:focus, select:focus {
            border-color: ${theme.accent} !important;
            box-shadow: 0 0 0 2px ${theme.accent}40 !important;
        }
        
        button:hover {
            background-color: ${theme.accent} !important;
            color: ${theme.background} !important;
        }
        
        /* Links */
        a, a * {
            color: ${theme.accent} !important;
        }
        
        a:hover {
            color: ${theme.text} !important;
        }
        
        /* Text elements */
        h1, h2, h3, h4, h5, h6, p, span, strong, em, label, td, th {
            color: ${theme.text} !important;
        }
        
        /* Tables */
        table, tr, td, th {
            background-color: ${theme.surface} !important;
            color: ${theme.text} !important;
            border-color: ${theme.border} !important;
        }
        
        /* Lists */
        ul, ol, li {
            color: ${theme.text} !important;
        }
        
        /* Scrollbars */
        ::-webkit-scrollbar {
            background-color: ${theme.background} !important;
            width: 12px;
        }
        
        ::-webkit-scrollbar-thumb {
            background-color: ${theme.border} !important;
            border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background-color: ${theme.accent} !important;
        }
        
        /* Selection */
        ::selection {
            background-color: ${theme.accent}60 !important;
            color: ${theme.text} !important;
        }
        
        /* Code blocks */
        code, pre, .code, [class*="code"] {
            background-color: ${theme.surface} !important;
            color: ${theme.text} !important;
            border-color: ${theme.border} !important;
        }
        
        /* Common framework classes */
        .text-white, .text-black, .text-gray-900, .text-gray-800,
        .text-primary, .text-secondary, [class*="text-"] {
            color: ${theme.text} !important;
        }
        
        /* Override inline styles */
        [style*="background-color"], [style*="color"] {
            background-color: ${theme.background} !important;
            color: ${theme.text} !important;
        }
        
        /* Carbon extension specific */
        .carbon-theme-${themeName} {
            background-color: ${theme.background} !important;
            color: ${theme.text} !important;
        }
        
        /* Tailwind and framework overrides */
        .bg-gradient-to-br, .bg-gradient-to-r, .bg-gradient-to-l,
        [class*="gradient"] {
            background: linear-gradient(135deg, ${theme.background}, ${theme.surface}) !important;
        }
        
        /* Shadow elements */
        [class*="shadow"] {
            box-shadow: 0 4px 6px ${theme.background}40 !important;
        }
    `;
    
    // Inject theme CSS with highest priority
    const themeStyle = document.createElement('style');
    themeStyle.id = 'carbon-global-theme';
    themeStyle.textContent = themeCSS;
    document.head.appendChild(themeStyle);
    
    // Add theme class to body and html
    document.documentElement.className = document.documentElement.className.replace(/carbon-theme-\w+/g, '');
    document.body.className = document.body.className.replace(/carbon-theme-\w+/g, '');
    document.documentElement.classList.add(`carbon-theme-${themeName}`);
    document.body.classList.add(`carbon-theme-${themeName}`);
    
    // Store theme in all available storage methods
    localStorage.setItem('carbonCurrentTheme', themeName);
    localStorage.setItem('carbonExtensionSettings', JSON.stringify({
        ...extensionSettings,
        theme: { current: themeName }
    }));
    
    // Update extension settings
    extensionSettings.theme = { current: themeName };
    
    // Trigger settings update event
    window.dispatchEvent(new CustomEvent('carbonSettingsUpdate', {
        detail: extensionSettings
    }));
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
        action: 'updateTheme', 
        theme: themeName,
        settings: extensionSettings 
    });
    
    console.log(`Global theme applied: ${themeName}`, theme);
    
    // Apply to all iframes after a short delay
    setTimeout(() => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    const iframeStyle = iframe.contentDocument.createElement('style');
                    iframeStyle.textContent = themeCSS;
                    iframe.contentDocument.head.appendChild(iframeStyle);
                }
            } catch (e) {
                // Cross-origin iframe, can't access
                console.log('Cannot theme cross-origin iframe');
            }
        });
    }, 500);
}

// Apply current theme from settings
function applyCurrentTheme() {
    // Try to load theme from multiple sources
    let currentTheme = 'dark'; // default
    
    // Check extension settings
    if (extensionSettings.theme?.current) {
        currentTheme = extensionSettings.theme.current;
    } else if (extensionSettings.theme) {
        currentTheme = extensionSettings.theme;
    }
    
    // Check localStorage
    const storedTheme = localStorage.getItem('carbonCurrentTheme');
    if (storedTheme) {
        currentTheme = storedTheme;
    }
    
    console.log('Applying current theme:', currentTheme);
    applyTheme(currentTheme);
}

// Get current UV config settings
function getCurrentUVConfig() {
    return extensionSettings.uvConfig || {
        darkMode: true,
        customCSS: true,
        customJS: true,
        globalEnhancements: true
    };
}

// Update all storage locations when settings change
function updateAllStorageLocations() {
    // Update localStorage
    localStorage.setItem('carbonExtensionSettings', JSON.stringify(extensionSettings));
    
    // Update Chrome storage
    chrome.storage.local.set({ extensionSettings });
    
    // Update window object
    window.carbonExtensionSettings = extensionSettings;
    
    // Trigger UV config update event
    window.dispatchEvent(new CustomEvent('carbonSettingsUpdate', {
        detail: extensionSettings
    }));
    
    console.log('Updated all storage locations with settings:', extensionSettings);
}

// Update close prevention
function updateClosePrevention() {
    const settings = extensionSettings.closePrevention || {};
    console.log('Updating close prevention:', settings);
    
    // Remove existing listeners
    window.removeEventListener('beforeunload', closePreventionHandler);
    
    if (settings.preventClose || settings.confirmClose) {
        closePreventionEnabled = true;
        window.addEventListener('beforeunload', closePreventionHandler);
        console.log('Close prevention enabled');
    } else {
        closePreventionEnabled = false;
        console.log('Close prevention disabled');
    }
}

// Close prevention handler
function closePreventionHandler(event) {
    const settings = extensionSettings.closePrevention || {};
    console.log('Close prevention triggered:', settings);
    
    if (settings.preventClose) {
        console.log('Preventing close');
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
    
    if (settings.confirmClose) {
        const message = 'Are you sure you want to leave this page?';
        console.log('Showing close confirmation');
        event.returnValue = message;
        return message;
    }
}

// Hide all content (panic action)
function hideAllContent() {
    console.log('Hiding all content - panic mode activated');
    
    // Remove existing overlay if present
    const existingOverlay = document.getElementById('carbon-panic-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    // Create overlay to hide content
    const overlay = document.createElement('div');
    overlay.id = 'carbon-panic-overlay';
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #ffffff !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-direction: column !important;
        font-family: Arial, sans-serif !important;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center;">
            <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google" style="margin-bottom: 30px; max-width: 272px;">
            <div style="max-width: 600px; text-align: center;">
                <input type="text" placeholder="Search Google or type a URL" style="
                    width: 500px;
                    max-width: 90vw;
                    padding: 10px 15px;
                    border: 1px solid #ddd;
                    border-radius: 25px;
                    font-size: 16px;
                    outline: none;
                    box-sizing: border-box;
                ">
            </div>
            <div style="margin-top: 30px; font-size: 14px; color: #666;">
                Press Ctrl+Shift+R to restore
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Listen for restore key combination
    const restoreHandler = (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
            console.log('Restoring content from panic mode');
            overlay.remove();
            document.removeEventListener('keydown', restoreHandler);
        }
    };
    
    document.addEventListener('keydown', restoreHandler);
    console.log('Panic overlay created - press Ctrl+Shift+R to restore');
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