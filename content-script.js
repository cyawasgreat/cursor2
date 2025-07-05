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

// Apply theme
function applyTheme(theme, themeName) {
    console.log('Applying theme:', themeName, theme);
    
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
        
        .carbon-themed, .bg-gray-900, .bg-gray-800, .bg-surface, .bg-overlay {
            background-color: var(--carbon-secondary) !important;
            color: var(--carbon-text) !important;
            border-color: var(--carbon-accent) !important;
        }
        
        .text-white, .text-text {
            color: var(--carbon-text) !important;
        }
        
        .text-cyan-400, .text-foam {
            color: var(--carbon-accent) !important;
        }
        
        /* Apply theme to common Carbon elements */
        .bg-gradient-to-br {
            background: var(--carbon-primary) !important;
        }
        
        input, textarea, select {
            background-color: var(--carbon-secondary) !important;
            color: var(--carbon-text) !important;
            border-color: var(--carbon-accent) !important;
        }
        
        button {
            background-color: var(--carbon-secondary) !important;
            color: var(--carbon-text) !important;
        }
        
        .hover\\:bg-highlight-med:hover {
            background-color: var(--carbon-accent) !important;
        }
    `;
    
    document.head.appendChild(themeStyle);
    
    // Store theme preference
    localStorage.setItem('carbonTheme', themeName);
    console.log('Theme applied successfully:', themeName);
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