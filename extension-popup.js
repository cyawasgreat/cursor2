// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4ilHYP1T-kdXbWPoHJHhD2aj0pNWmMec",
    authDomain: "carbon-services.firebaseapp.com",
    projectId: "carbon-services",
    storageBucket: "carbon-services.appspot.com",
    messagingSenderId: "288385472070",
    appId: "1:288385472070:web:c4be3ff186e248fc645c47",
    measurementId: "G-Y2K1RQYE74"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Extension state
let extensionSettings = {
    uvConfig: {
        darkMode: true,
        customCSS: true,
        customJS: true,
        globalEnhancements: true
    },
    userAgent: 'default',
    customUserAgent: '',
    theme: 'dark',
    stealth: {
        enabled: false,
        hideFromHistory: false,
        blockAnalytics: false,
        spoofCanvas: false
    },
    panic: {
        modifier: 'ctrl',
        key: 'p',
        action: 'close',
        redirectUrl: 'https://google.com'
    },
    closePrevention: {
        preventClose: false,
        confirmClose: false
    }
};

// User Agents
const userAgents = {
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    'mobile-chrome': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    'mobile-safari': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
};

// Theme configurations
const themes = {
    dark: {
        primary: '#1f1d2e',
        secondary: '#26233a',
        text: '#e0def4',
        accent: '#9ccfd8'
    },
    light: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        text: '#212529',
        accent: '#0d6efd'
    },
    cappuccino: {
        primary: '#2d1b14',
        secondary: '#3c2a1e',
        text: '#f4e4bc',
        accent: '#d4a574'
    },
    default: {
        primary: '#191724',
        secondary: '#1f1d2e',
        text: '#e0def4',
        accent: '#c4a7e7'
    }
};

// Initialize extension
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
    initializeAuth();
    updateUI();
});

// Authentication
async function initializeAuth() {
    try {
        await auth.signInAnonymously();
        updateSyncStatus('Connected', true);
    } catch (error) {
        console.error('Auth error:', error);
        updateSyncStatus('Offline', false);
    }
}

// Load settings from storage and Firebase
async function loadSettings() {
    try {
        // Load from local storage first
        const stored = await chrome.storage.local.get('extensionSettings');
        if (stored.extensionSettings) {
            extensionSettings = { ...extensionSettings, ...stored.extensionSettings };
        }

        // Try to sync with Firebase
        if (auth.currentUser) {
            const doc = await db.collection('userSettings').doc(auth.currentUser.uid).get();
            if (doc.exists) {
                const firebaseSettings = doc.data();
                extensionSettings = { ...extensionSettings, ...firebaseSettings };
                await saveSettingsLocal();
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save settings locally
async function saveSettingsLocal() {
    await chrome.storage.local.set({ extensionSettings });
}

// Save settings to Firebase
async function saveSettingsFirebase() {
    if (!auth.currentUser) return;
    
    try {
        await db.collection('userSettings').doc(auth.currentUser.uid).set(extensionSettings);
        updateSyncStatus('Synced', true);
    } catch (error) {
        console.error('Firebase sync error:', error);
        updateSyncStatus('Sync Error', false);
    }
}

// Update sync status
function updateSyncStatus(status, success) {
    const statusEl = document.getElementById('syncStatus');
    statusEl.textContent = status;
    statusEl.className = `text-sm ${success ? 'text-green-400' : 'text-red-400'}`;
}

// Setup event listeners
function setupEventListeners() {
    // UV Config toggles
    document.getElementById('uvDarkMode').addEventListener('change', (e) => {
        extensionSettings.uvConfig.darkMode = e.target.checked;
        saveSettings();
        updateUVConfig();
    });

    document.getElementById('uvCustomCSS').addEventListener('change', (e) => {
        extensionSettings.uvConfig.customCSS = e.target.checked;
        saveSettings();
        updateUVConfig();
    });

    document.getElementById('uvCustomJS').addEventListener('change', (e) => {
        extensionSettings.uvConfig.customJS = e.target.checked;
        saveSettings();
        updateUVConfig();
    });

    document.getElementById('uvGlobalEnhancements').addEventListener('change', (e) => {
        extensionSettings.uvConfig.globalEnhancements = e.target.checked;
        saveSettings();
        updateUVConfig();
    });

    // Toggle all UV configs
    document.getElementById('uvConfigToggleAll').addEventListener('click', () => {
        const allEnabled = Object.values(extensionSettings.uvConfig).every(v => v);
        const newState = !allEnabled;
        
        Object.keys(extensionSettings.uvConfig).forEach(key => {
            extensionSettings.uvConfig[key] = newState;
        });
        
        saveSettings();
        updateUI();
        updateUVConfig();
    });

    // Quick actions
    document.getElementById('openGames').addEventListener('click', () => {
        console.log('Opening games page');
        chrome.tabs.create({ url: chrome.runtime.getURL('games.html') });
    });

    document.getElementById('openSettings').addEventListener('click', () => {
        console.log('Opening settings page');
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });

    document.getElementById('toggleStealth').addEventListener('click', () => {
        extensionSettings.stealth.enabled = !extensionSettings.stealth.enabled;
        saveSettings();
        updateUI();
        toggleStealthMode();
    });

    document.getElementById('panicButton').addEventListener('click', () => {
        executePanicAction();
    });

    // User agent selection
    document.getElementById('userAgentSelect').addEventListener('change', (e) => {
        extensionSettings.userAgent = e.target.value;
        document.getElementById('customUserAgent').classList.toggle('hidden', e.target.value !== 'custom');
        saveSettings();
        updateUserAgent();
    });

    document.getElementById('customUserAgentText').addEventListener('input', (e) => {
        extensionSettings.customUserAgent = e.target.value;
        saveSettings();
        updateUserAgent();
    });

    // Theme selection
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            extensionSettings.theme = e.currentTarget.dataset.theme;
            saveSettings();
            updateUI();
            applyTheme();
        });
    });

    // Custom theme
    document.getElementById('customThemeBtn').addEventListener('click', () => {
        // Open custom theme editor
        chrome.tabs.create({ url: chrome.runtime.getURL('theme-editor.html') });
    });

    // Stealth mode settings
    document.getElementById('stealthMode').addEventListener('change', (e) => {
        extensionSettings.stealth.enabled = e.target.checked;
        saveSettings();
        toggleStealthMode();
    });

    document.getElementById('hideFromHistory').addEventListener('change', (e) => {
        extensionSettings.stealth.hideFromHistory = e.target.checked;
        saveSettings();
    });

    document.getElementById('blockAnalytics').addEventListener('change', (e) => {
        extensionSettings.stealth.blockAnalytics = e.target.checked;
        saveSettings();
    });

    document.getElementById('spoofCanvas').addEventListener('change', (e) => {
        extensionSettings.stealth.spoofCanvas = e.target.checked;
        saveSettings();
    });

    // Panic key settings
    document.getElementById('panicModifier').addEventListener('change', (e) => {
        extensionSettings.panic.modifier = e.target.value;
        saveSettings();
        updatePanicKeyListener();
    });

    document.getElementById('panicKey').addEventListener('change', (e) => {
        extensionSettings.panic.key = e.target.value;
        saveSettings();
        updatePanicKeyListener();
    });

    document.getElementById('panicAction').addEventListener('change', (e) => {
        extensionSettings.panic.action = e.target.value;
        document.getElementById('panicRedirectUrl').classList.toggle('hidden', e.target.value !== 'redirect');
        saveSettings();
    });

    // Close prevention
    document.getElementById('preventClose').addEventListener('change', (e) => {
        extensionSettings.closePrevention.preventClose = e.target.checked;
        saveSettings();
        updateClosePrevention();
    });

    document.getElementById('confirmClose').addEventListener('change', (e) => {
        extensionSettings.closePrevention.confirmClose = e.target.checked;
        saveSettings();
        updateClosePrevention();
    });

    // Force sync
    document.getElementById('forceSyncBtn').addEventListener('click', () => {
        saveSettingsFirebase();
    });

    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadSettings().then(updateUI);
    });
}

// Update UI with current settings
function updateUI() {
    // UV Config
    document.getElementById('uvDarkMode').checked = extensionSettings.uvConfig.darkMode;
    document.getElementById('uvCustomCSS').checked = extensionSettings.uvConfig.customCSS;
    document.getElementById('uvCustomJS').checked = extensionSettings.uvConfig.customJS;
    document.getElementById('uvGlobalEnhancements').checked = extensionSettings.uvConfig.globalEnhancements;

    // User Agent
    document.getElementById('userAgentSelect').value = extensionSettings.userAgent;
    document.getElementById('customUserAgent').classList.toggle('hidden', extensionSettings.userAgent !== 'custom');
    document.getElementById('customUserAgentText').value = extensionSettings.customUserAgent;

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('ring-2', btn.dataset.theme === extensionSettings.theme);
        btn.classList.toggle('ring-cyan-400', btn.dataset.theme === extensionSettings.theme);
    });

    // Stealth mode
    document.getElementById('stealthMode').checked = extensionSettings.stealth.enabled;
    document.getElementById('hideFromHistory').checked = extensionSettings.stealth.hideFromHistory;
    document.getElementById('blockAnalytics').checked = extensionSettings.stealth.blockAnalytics;
    document.getElementById('spoofCanvas').checked = extensionSettings.stealth.spoofCanvas;

    // Panic key
    document.getElementById('panicModifier').value = extensionSettings.panic.modifier;
    document.getElementById('panicKey').value = extensionSettings.panic.key;
    document.getElementById('panicAction').value = extensionSettings.panic.action;
    document.getElementById('panicRedirectUrl').classList.toggle('hidden', extensionSettings.panic.action !== 'redirect');

    // Close prevention
    document.getElementById('preventClose').checked = extensionSettings.closePrevention.preventClose;
    document.getElementById('confirmClose').checked = extensionSettings.closePrevention.confirmClose;

    // Update stealth button appearance
    const stealthBtn = document.getElementById('toggleStealth');
    if (extensionSettings.stealth.enabled) {
        stealthBtn.classList.remove('bg-purple-600', 'hover:bg-purple-500');
        stealthBtn.classList.add('bg-green-600', 'hover:bg-green-500');
    } else {
        stealthBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
        stealthBtn.classList.add('bg-purple-600', 'hover:bg-purple-500');
    }
}

// Save settings (both local and Firebase)
async function saveSettings() {
    await saveSettingsLocal();
    await saveSettingsFirebase();
}

// Update UV config injection
async function updateUVConfig() {
    try {
        // Send to background script
        chrome.runtime.sendMessage({
            action: 'updateUVConfig',
            settings: extensionSettings.uvConfig
        });
        
        // Update all tabs
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'updateUVConfig',
                settings: extensionSettings.uvConfig
            }).catch(() => {}); // Ignore errors for tabs that can't receive messages
        });
        
        console.log('UV Config updated:', extensionSettings.uvConfig);
    } catch (error) {
        console.error('Error updating UV config:', error);
    }
}

// Update user agent
async function updateUserAgent() {
    const ua = extensionSettings.userAgent === 'custom' 
        ? extensionSettings.customUserAgent 
        : userAgents[extensionSettings.userAgent];
    
    if (ua && extensionSettings.userAgent !== 'default') {
        // Send to background script to update user agent
        chrome.runtime.sendMessage({
            action: 'updateUserAgent',
            userAgent: ua
        });
        console.log('User agent updated to:', ua);
    } else {
        // Reset to default
        chrome.runtime.sendMessage({
            action: 'resetUserAgent'
        });
        console.log('User agent reset to default');
    }
}

// Apply theme
async function applyTheme() {
    const theme = themes[extensionSettings.theme];
    if (theme) {
        // Send to background script
        chrome.runtime.sendMessage({
            action: 'applyTheme',
            theme: theme,
            themeName: extensionSettings.theme
        });
        
        // Apply to all tabs
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'applyTheme',
                theme: theme,
                themeName: extensionSettings.theme
            }).catch(() => {}); // Ignore errors
        });
        
        console.log('Theme applied:', extensionSettings.theme, theme);
    }
}

// Toggle stealth mode
async function toggleStealthMode() {
    // Send to background script
    chrome.runtime.sendMessage({
        action: 'toggleStealth',
        enabled: extensionSettings.stealth.enabled,
        settings: extensionSettings.stealth
    });
    
    // Update all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
            action: extensionSettings.stealth.enabled ? 'enableStealth' : 'disableStealth',
            settings: extensionSettings.stealth
        }).catch(() => {}); // Ignore errors
    });
    
    console.log('Stealth mode toggled:', extensionSettings.stealth.enabled);
}

// Execute panic action
async function executePanicAction() {
    console.log('Executing panic action:', extensionSettings.panic.action);
    
    // Send to background script
    chrome.runtime.sendMessage({
        action: 'executePanic',
        panicSettings: extensionSettings.panic
    });
    
    // Close popup after panic
    window.close();
}

// Update panic key listener
async function updatePanicKeyListener() {
    chrome.runtime.sendMessage({
        action: 'updatePanicKey',
        panic: extensionSettings.panic
    });
}

// Update close prevention
async function updateClosePrevention() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateClosePrevention',
                settings: extensionSettings.closePrevention
            });
        }
    } catch (error) {
        console.error('Error updating close prevention:', error);
    }
}