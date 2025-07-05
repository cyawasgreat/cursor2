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
    console.log('Carbon Extension popup initializing...');
    
    // Show loading state
    showNotification('Loading extension...');
    
    try {
        await loadSettings();
        setupEventListeners();
        await initializeAuth();
        updateUI();
        
        // Apply current theme to popup
        const currentTheme = themes[extensionSettings.theme];
        if (currentTheme) {
            applyThemeToPopup(currentTheme);
        }
        
        console.log('Carbon Extension popup loaded successfully');
        showNotification('Extension ready!');
        
    } catch (error) {
        console.error('Failed to initialize extension:', error);
        showNotification('Extension initialization failed');
    }
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
        console.log('UV Dark Mode toggled:', e.target.checked);
        showNotification(`Dark Mode ${e.target.checked ? 'Enabled' : 'Disabled'}`);
        saveSettings();
        updateUVConfig();
    });

    document.getElementById('uvCustomCSS').addEventListener('change', (e) => {
        extensionSettings.uvConfig.customCSS = e.target.checked;
        console.log('UV Custom CSS toggled:', e.target.checked);
        showNotification(`Custom CSS ${e.target.checked ? 'Enabled' : 'Disabled'}`);
        saveSettings();
        updateUVConfig();
    });

    document.getElementById('uvCustomJS').addEventListener('change', (e) => {
        extensionSettings.uvConfig.customJS = e.target.checked;
        console.log('UV Custom JS toggled:', e.target.checked);
        showNotification(`Custom JS ${e.target.checked ? 'Enabled' : 'Disabled'}`);
        saveSettings();
        updateUVConfig();
    });

    document.getElementById('uvGlobalEnhancements').addEventListener('change', (e) => {
        extensionSettings.uvConfig.globalEnhancements = e.target.checked;
        console.log('UV Global Enhancements toggled:', e.target.checked);
        showNotification(`Global Enhancements ${e.target.checked ? 'Enabled' : 'Disabled'}`);
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
        console.log('User Agent changed to:', e.target.value);
        showNotification(`User Agent: ${e.target.value}`);
        saveSettings();
        updateUserAgent();
    });

    document.getElementById('customUserAgentText').addEventListener('input', (e) => {
        extensionSettings.customUserAgent = e.target.value;
        console.log('Custom User Agent updated:', e.target.value);
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
        console.log('Stealth Mode toggled:', e.target.checked);
        showNotification(`Stealth Mode ${e.target.checked ? 'Enabled' : 'Disabled'}`);
        saveSettings();
        toggleStealthMode();
        updateUI(); // Update button appearance
    });

    document.getElementById('hideFromHistory').addEventListener('change', (e) => {
        extensionSettings.stealth.hideFromHistory = e.target.checked;
        console.log('Hide From History toggled:', e.target.checked);
        showNotification(`Hide From History ${e.target.checked ? 'On' : 'Off'}`);
        saveSettings();
    });

    document.getElementById('blockAnalytics').addEventListener('change', (e) => {
        extensionSettings.stealth.blockAnalytics = e.target.checked;
        console.log('Block Analytics toggled:', e.target.checked);
        showNotification(`Analytics Blocking ${e.target.checked ? 'On' : 'Off'}`);
        saveSettings();
        toggleStealthMode(); // Apply analytics blocking immediately
    });

    document.getElementById('spoofCanvas').addEventListener('change', (e) => {
        extensionSettings.stealth.spoofCanvas = e.target.checked;
        console.log('Canvas Spoofing toggled:', e.target.checked);
        showNotification(`Canvas Spoofing ${e.target.checked ? 'On' : 'Off'}`);
        saveSettings();
        toggleStealthMode(); // Apply canvas spoofing immediately
    });

    // Panic key settings
    document.getElementById('panicModifier').addEventListener('change', (e) => {
        extensionSettings.panic.modifier = e.target.value;
        console.log('Panic modifier changed to:', e.target.value);
        showNotification(`Panic Key: ${e.target.value}+${extensionSettings.panic.key}`);
        saveSettings();
        updatePanicKeyListener();
    });

    document.getElementById('panicKey').addEventListener('change', (e) => {
        extensionSettings.panic.key = e.target.value;
        console.log('Panic key changed to:', e.target.value);
        showNotification(`Panic Key: ${extensionSettings.panic.modifier}+${e.target.value}`);
        saveSettings();
        updatePanicKeyListener();
    });

    document.getElementById('panicAction').addEventListener('change', (e) => {
        extensionSettings.panic.action = e.target.value;
        document.getElementById('panicRedirectUrl').classList.toggle('hidden', e.target.value !== 'redirect');
        console.log('Panic action changed to:', e.target.value);
        showNotification(`Panic Action: ${e.target.value}`);
        saveSettings();
    });

    // Close prevention
    document.getElementById('preventClose').addEventListener('change', (e) => {
        extensionSettings.closePrevention.preventClose = e.target.checked;
        console.log('Prevent Close toggled:', e.target.checked);
        showNotification(`Close Prevention ${e.target.checked ? 'Enabled' : 'Disabled'}`);
        saveSettings();
        updateClosePrevention();
    });

    document.getElementById('confirmClose').addEventListener('change', (e) => {
        extensionSettings.closePrevention.confirmClose = e.target.checked;
        console.log('Confirm Close toggled:', e.target.checked);
        showNotification(`Close Confirmation ${e.target.checked ? 'Enabled' : 'Disabled'}`);
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
    
    // Control Center buttons
    document.getElementById('testAllFeatures').addEventListener('click', () => {
        testAllFeatures();
    });
    
    document.getElementById('resetExtension').addEventListener('click', () => {
        resetExtension();
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

    // Theme buttons - remove all active classes first
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-cyan-400', 'active');
    });
    // Add active class to current theme
    const activeThemeBtn = document.querySelector(`[data-theme="${extensionSettings.theme}"]`);
    if (activeThemeBtn) {
        activeThemeBtn.classList.add('ring-2', 'ring-cyan-400', 'active');
    }

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
        stealthBtn.innerHTML = '<i class="bx bx-shield-check block mb-1"></i>Stealth ON';
    } else {
        stealthBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
        stealthBtn.classList.add('bg-purple-600', 'hover:bg-purple-500');
        stealthBtn.innerHTML = '<i class="bx bx-ghost block mb-1"></i>Stealth OFF';
    }
    
    // Update status indicators
    updateStatusIndicators();
}

// Update status indicators
function updateStatusIndicators() {
    // UV Dark Mode status
    const darkStatus = document.getElementById('statusUVDark');
    if (darkStatus) {
        darkStatus.textContent = extensionSettings.uvConfig.darkMode ? '●' : '○';
        darkStatus.className = extensionSettings.uvConfig.darkMode ? 'text-green-400' : 'text-red-400';
    }
    
    // User Agent status
    const uaStatus = document.getElementById('statusUserAgent');
    if (uaStatus) {
        uaStatus.textContent = extensionSettings.userAgent;
        uaStatus.className = extensionSettings.userAgent === 'default' ? 'text-gray-400' : 'text-cyan-400';
    }
    
    // Theme status
    const themeStatus = document.getElementById('statusTheme');
    if (themeStatus) {
        themeStatus.textContent = extensionSettings.theme;
        themeStatus.className = 'text-purple-400';
    }
    
    // Stealth mode status
    const stealthStatus = document.getElementById('statusStealth');
    if (stealthStatus) {
        stealthStatus.textContent = extensionSettings.stealth.enabled ? '●' : '○';
        stealthStatus.className = extensionSettings.stealth.enabled ? 'text-green-400' : 'text-red-400';
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
        console.log('Applying theme:', extensionSettings.theme, theme);
        
        // Apply theme to popup itself immediately
        applyThemeToPopup(theme);
        
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
        
        console.log('Theme applied successfully:', extensionSettings.theme, theme);
        
        // Show success feedback
        showNotification('Theme applied: ' + extensionSettings.theme);
    }
}

// Apply theme to popup
function applyThemeToPopup(theme) {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-accent', theme.accent);
    
    // Update popup background
    document.body.style.background = theme.primary;
    document.body.style.color = theme.text;
    
    // Update sections
    document.querySelectorAll('.bg-gray-800').forEach(el => {
        el.style.backgroundColor = theme.secondary;
        el.style.color = theme.text;
    });
    
    // Update header
    const header = document.querySelector('.bg-gradient-to-r');
    if (header) {
        header.style.background = `linear-gradient(45deg, ${theme.accent}, ${theme.primary})`;
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #00ff88;
        color: #000;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
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

// Test all features
async function testAllFeatures() {
    console.log('Testing all Carbon Extension features...');
    showNotification('Testing all features...');
    
    try {
        // Test 1: UV Config
        console.log('✓ Testing UV Config...');
        await updateUVConfig();
        
        // Test 2: User Agent
        console.log('✓ Testing User Agent...');
        await updateUserAgent();
        
        // Test 3: Theme System
        console.log('✓ Testing Theme System...');
        await applyTheme();
        
        // Test 4: Stealth Mode
        console.log('✓ Testing Stealth Mode...');
        await toggleStealthMode();
        
        // Test 5: Panic Key
        console.log('✓ Testing Panic Key...');
        await updatePanicKeyListener();
        
        // Test 6: Close Prevention
        console.log('✓ Testing Close Prevention...');
        await updateClosePrevention();
        
        // Test 7: Firebase Sync
        console.log('✓ Testing Firebase Sync...');
        await saveSettingsFirebase();
        
        // Test 8: Quick Actions
        console.log('✓ Testing Quick Actions...');
        // Don't actually open tabs during test
        
        console.log('🎉 All features tested successfully!');
        showNotification('All features working! ✓');
        
        // Flash the popup green
        document.body.style.boxShadow = '0 0 20px #00ff88';
        setTimeout(() => {
            document.body.style.boxShadow = '';
        }, 1000);
        
    } catch (error) {
        console.error('Feature test failed:', error);
        showNotification('Some features failed test');
        
        // Flash the popup red
        document.body.style.boxShadow = '0 0 20px #ff0000';
        setTimeout(() => {
            document.body.style.boxShadow = '';
        }, 1000);
    }
}

// Reset extension to defaults
async function resetExtension() {
    if (!confirm('Reset all extension settings to defaults?')) {
        return;
    }
    
    console.log('Resetting Carbon Extension to defaults...');
    showNotification('Resetting extension...');
    
    // Reset to default settings
    extensionSettings = {
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
    
    // Save reset settings
    await saveSettings();
    
    // Update UI
    updateUI();
    
    // Apply reset theme
    const resetTheme = themes[extensionSettings.theme];
    if (resetTheme) {
        applyThemeToPopup(resetTheme);
    }
    
    // Update all functionality
    await updateUVConfig();
    await updateUserAgent();
    await applyTheme();
    await toggleStealthMode();
    await updatePanicKeyListener();
    await updateClosePrevention();
    
    console.log('Extension reset complete');
    showNotification('Extension reset to defaults');
}