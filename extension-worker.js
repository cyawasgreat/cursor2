// Extension service worker
let extensionSettings = {};
let panicKeyListener = null;
let currentUserAgent = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Carbon Extension installed');
    loadSettings();
    setupProtocolHandlers();
    setupContextMenus();
});

// Load settings from storage
async function loadSettings() {
    try {
        const stored = await chrome.storage.local.get('extensionSettings');
        if (stored.extensionSettings) {
            extensionSettings = stored.extensionSettings;
            updatePanicKeyListener();
            updateUserAgent();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Setup protocol handlers for carbon:// URLs
function setupProtocolHandlers() {
    // Handle carbon://games
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (details.url.startsWith('carbon://games')) {
                return { redirectUrl: chrome.runtime.getURL('games.html') };
            }
            if (details.url.startsWith('carbon://settings')) {
                return { redirectUrl: chrome.runtime.getURL('settings.html') };
            }
        },
        { urls: ['*://carbon/*'] },
        ['blocking']
    );
}

// Setup context menus
function setupContextMenus() {
    chrome.contextMenus.create({
        id: 'carbonExtension',
        title: 'Carbon Extensions',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'toggleStealth',
        parentId: 'carbonExtension',
        title: 'Toggle Stealth Mode',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'panicMode',
        parentId: 'carbonExtension',
        title: 'Panic Mode',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'openGames',
        parentId: 'carbonExtension',
        title: 'Open Games',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'openSettings',
        parentId: 'carbonExtension',
        title: 'Open Settings',
        contexts: ['page']
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'toggleStealth':
            toggleStealthMode();
            break;
        case 'panicMode':
            executePanicAction();
            break;
        case 'openGames':
            chrome.tabs.create({ url: 'carbon://games' });
            break;
        case 'openSettings':
            chrome.tabs.create({ url: 'carbon://settings' });
            break;
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'updateUserAgent':
            updateUserAgent(message.userAgent);
            break;
        case 'applyTheme':
            applyTheme(message.theme);
            break;
        case 'toggleStealth':
            toggleStealthMode(message.enabled, message.settings);
            break;
        case 'executePackage':
            executePanicAction(message.panicSettings);
            break;
        case 'updatePanicKey':
            extensionSettings.panic = message.panic;
            updatePanicKeyListener();
            break;
        case 'getSettings':
            sendResponse(extensionSettings);
            break;
    }
});

// Update user agent for all requests
function updateUserAgent(userAgent) {
    currentUserAgent = userAgent;
    
    // Modify user agent header for all requests
    if (chrome.declarativeNetRequest) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: [{
                id: 1,
                priority: 1,
                action: {
                    type: 'modifyHeaders',
                    requestHeaders: [{
                        header: 'User-Agent',
                        operation: 'set',
                        value: userAgent
                    }]
                },
                condition: {
                    urlFilter: '*',
                    resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
                }
            }]
        });
    }
}

// Apply theme to pages
function applyTheme(theme) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'applyTheme',
                theme: theme
            });
        });
    });
}

// Toggle stealth mode
function toggleStealthMode(enabled, settings) {
    if (enabled === undefined) {
        extensionSettings.stealth.enabled = !extensionSettings.stealth.enabled;
    } else {
        extensionSettings.stealth.enabled = enabled;
        if (settings) {
            extensionSettings.stealth = { ...extensionSettings.stealth, ...settings };
        }
    }

    // Apply stealth settings
    if (extensionSettings.stealth.enabled) {
        enableStealthFeatures();
    } else {
        disableStealthFeatures();
    }

    // Save settings
    chrome.storage.local.set({ extensionSettings });
}

// Enable stealth features
function enableStealthFeatures() {
    // Block analytics if enabled
    if (extensionSettings.stealth.blockAnalytics) {
        setupAnalyticsBlocking();
    }

    // Send stealth mode to all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'enableStealth',
                settings: extensionSettings.stealth
            });
        });
    });
}

// Disable stealth features
function disableStealthFeatures() {
    // Remove analytics blocking
    removeAnalyticsBlocking();

    // Send disable stealth to all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'disableStealth'
            });
        });
    });
}

// Setup analytics blocking
function setupAnalyticsBlocking() {
    const analyticsUrls = [
        '*://www.google-analytics.com/*',
        '*://analytics.google.com/*',
        '*://googletagmanager.com/*',
        '*://facebook.com/tr/*',
        '*://connect.facebook.net/*',
        '*://hotjar.com/*',
        '*://fullstory.com/*',
        '*://mixpanel.com/*'
    ];

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [2],
        addRules: [{
            id: 2,
            priority: 1,
            action: { type: 'block' },
            condition: {
                urlFilter: analyticsUrls.join('|'),
                resourceTypes: ['script', 'xmlhttprequest', 'image']
            }
        }]
    });
}

// Remove analytics blocking
function removeAnalyticsBlocking() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [2]
    });
}

// Execute panic action
function executePanicAction(panicSettings) {
    const settings = panicSettings || extensionSettings.panic;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab) return;

        switch (settings.action) {
            case 'close':
                chrome.tabs.remove(activeTab.id);
                break;
            case 'redirect':
                chrome.tabs.update(activeTab.id, { url: settings.redirectUrl || 'https://google.com' });
                break;
            case 'minimize':
                chrome.windows.update(activeTab.windowId, { state: 'minimized' });
                break;
            case 'hide':
                chrome.tabs.sendMessage(activeTab.id, { action: 'hideAllContent' });
                break;
        }
    });
}

// Update panic key listener
function updatePanicKeyListener() {
    if (!extensionSettings.panic) return;

    // Send updated panic key settings to all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'updatePanicKey',
                panic: extensionSettings.panic
            });
        });
    });
}

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Inject settings into newly loaded pages
        chrome.tabs.sendMessage(tabId, {
            action: 'initializeExtension',
            settings: extensionSettings
        });
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will be handled by the popup
});

// Periodic sync with Firebase (if needed)
setInterval(async () => {
    try {
        // Check if settings have been updated externally
        const stored = await chrome.storage.local.get('extensionSettings');
        if (stored.extensionSettings && JSON.stringify(stored.extensionSettings) !== JSON.stringify(extensionSettings)) {
            extensionSettings = stored.extensionSettings;
            updatePanicKeyListener();
            updateUserAgent();
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}, 30000); // Sync every 30 seconds

// Handle before unload for close prevention
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // This will be handled by content script
});

// Initialize on startup
loadSettings();