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
    console.log('Setting up carbon:// protocol handlers');
    
    // Handle carbon:// protocol in navigation
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            console.log('Request intercepted:', details.url);
            
            if (details.url.includes('carbon://games') || details.url.includes('carbon:/games')) {
                const gamesUrl = chrome.runtime.getURL('games.html');
                console.log('Redirecting to games:', gamesUrl);
                return { redirectUrl: gamesUrl };
            }
            if (details.url.includes('carbon://settings') || details.url.includes('carbon:/settings')) {
                const settingsUrl = chrome.runtime.getURL('settings.html');
                console.log('Redirecting to settings:', settingsUrl);
                return { redirectUrl: settingsUrl };
            }
        },
        { urls: ['<all_urls>'] },
        ['blocking']
    );
    
    // Also handle through declarative net request
    if (chrome.declarativeNetRequest) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [100, 101],
            addRules: [
                {
                    id: 100,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        redirect: { url: chrome.runtime.getURL('games.html') }
                    },
                    condition: {
                        urlFilter: '*carbon://games*',
                        resourceTypes: ['main_frame']
                    }
                },
                {
                    id: 101,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        redirect: { url: chrome.runtime.getURL('settings.html') }
                    },
                    condition: {
                        urlFilter: '*carbon://settings*',
                        resourceTypes: ['main_frame']
                    }
                }
            ]
        }).then(() => {
            console.log('Carbon protocol redirect rules created');
        }).catch(error => {
            console.error('Failed to create protocol redirect rules:', error);
        });
    }
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
    console.log('Background received message:', message.action);
    
    switch (message.action) {
        case 'updateUserAgent':
            updateUserAgent(message.userAgent);
            break;
        case 'resetUserAgent':
            resetUserAgent();
            break;
        case 'updateUVConfig':
            updateUVConfigGlobally(message.settings);
            break;
        case 'applyTheme':
            applyTheme(message.theme, message.themeName);
            break;
        case 'toggleStealth':
            toggleStealthMode(message.enabled, message.settings);
            break;
        case 'executePanic':
            executePanicAction(message.panicSettings);
            break;
        case 'updatePanicKey':
            extensionSettings.panic = message.panic;
            updatePanicKeyListener();
            break;
        case 'getSettings':
            sendResponse(extensionSettings);
            return true; // Keep message channel open for async response
        case 'updateSettings':
            extensionSettings = { ...extensionSettings, ...message.settings };
            chrome.storage.local.set({ extensionSettings });
            break;
    }
});

// Update user agent for all requests
function updateUserAgent(userAgent) {
    currentUserAgent = userAgent;
    console.log('Setting user agent to:', userAgent);
    
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
        }).then(() => {
            console.log('User agent rule updated successfully');
        }).catch(error => {
            console.error('Failed to update user agent rule:', error);
        });
    }
}

// Reset user agent to default
function resetUserAgent() {
    currentUserAgent = null;
    console.log('Resetting user agent to default');
    
    if (chrome.declarativeNetRequest) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        }).then(() => {
            console.log('User agent rule removed successfully');
        }).catch(error => {
            console.error('Failed to remove user agent rule:', error);
        });
    }
}

// Apply theme to pages
function applyTheme(theme, themeName) {
    console.log('Applying theme:', themeName, theme);
    
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'applyTheme',
                theme: theme,
                themeName: themeName
            }).catch(() => {}); // Ignore errors for tabs that can't receive messages
        });
    });
}

// Update UV config globally
function updateUVConfigGlobally(settings) {
    console.log('Updating UV config globally:', settings);
    
    // Store in extension settings
    extensionSettings.uvConfig = settings;
    chrome.storage.local.set({ extensionSettings });
    
    // Send to all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'updateUVConfig',
                settings: settings
            }).catch(() => {}); // Ignore errors
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
    console.log('Setting up analytics blocking');
    
    const analyticsUrls = [
        '*://www.google-analytics.com/*',
        '*://analytics.google.com/*',
        '*://googletagmanager.com/*',
        '*://facebook.com/tr/*',
        '*://connect.facebook.net/*',
        '*://hotjar.com/*',
        '*://fullstory.com/*',
        '*://mixpanel.com/*',
        '*://doubleclick.net/*',
        '*://googlesyndication.com/*',
        '*://amazon-adsystem.com/*'
    ];

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [2],
        addRules: analyticsUrls.map((url, index) => ({
            id: 2 + index,
            priority: 1,
            action: { type: 'block' },
            condition: {
                urlFilter: url,
                resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame']
            }
        }))
    }).then(() => {
        console.log('Analytics blocking rules updated successfully');
    }).catch(error => {
        console.error('Failed to update analytics blocking rules:', error);
    });
}

// Remove analytics blocking
function removeAnalyticsBlocking() {
    console.log('Removing analytics blocking');
    
    // Remove all analytics blocking rules (IDs 2-12)
    const ruleIds = Array.from({length: 11}, (_, i) => 2 + i);
    
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
    }).then(() => {
        console.log('Analytics blocking rules removed successfully');
    }).catch(error => {
        console.error('Failed to remove analytics blocking rules:', error);
    });
}

// Execute panic action
function executePanicAction(panicSettings) {
    const settings = panicSettings || extensionSettings.panic;
    console.log('Executing panic action:', settings.action);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab) {
            console.error('No active tab found for panic action');
            return;
        }

        switch (settings.action) {
            case 'close':
                console.log('Closing tab:', activeTab.id);
                chrome.tabs.remove(activeTab.id);
                break;
            case 'redirect':
                const redirectUrl = settings.redirectUrl || 'https://google.com';
                console.log('Redirecting to:', redirectUrl);
                chrome.tabs.update(activeTab.id, { url: redirectUrl });
                break;
            case 'minimize':
                console.log('Minimizing window:', activeTab.windowId);
                chrome.windows.update(activeTab.windowId, { state: 'minimized' });
                break;
            case 'hide':
                console.log('Hiding content in tab:', activeTab.id);
                chrome.tabs.sendMessage(activeTab.id, { action: 'hideAllContent' });
                break;
            default:
                console.error('Unknown panic action:', settings.action);
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