# Carbon Browser Extension System

## Overview

The Carbon Browser Extension is a comprehensive browser extension that provides advanced proxy management, stealth features, UV config injection controls, custom themes, panic modes, and close prevention. All settings are synced with Firebase for seamless experience across devices.

## 🚀 Features

### ✨ UV Config Injection Management
- **Dark Mode Injection**: Automatically inject dark mode CSS into proxied websites
- **Custom CSS Injection**: Enable/disable custom CSS injection capabilities
- **Custom JS Injection**: Enable/disable custom JavaScript injection capabilities  
- **Global Enhancements**: Enhanced scrolling, lazy loading, and Carbon branding

### 🎨 Theme System
- **Dark Theme**: Carbon's signature dark mode
- **Light Theme**: Clean light interface
- **Cappuccino Theme**: Warm brown aesthetic
- **Default Theme**: Original Carbon styling
- **Custom Themes**: Create your own color schemes

### 🥷 Stealth Mode
- **Stealth Browsing**: Hide browsing activity indicators
- **Analytics Blocking**: Block Google Analytics, Facebook tracking, etc.
- **Canvas Spoofing**: Add noise to prevent canvas fingerprinting
- **History Hiding**: Client-side history management

### 🛡️ User Agent Management
- **Pre-configured Agents**: Chrome, Firefox, Safari, Edge, Mobile variants
- **Custom User Agents**: Set any custom user agent string
- **Real-time Updates**: Changes apply immediately

### ⚡ Panic Mode
- **Customizable Hotkeys**: Ctrl+P, Alt+X, Ctrl+Shift+Esc, etc.
- **Multiple Actions**: Close tab, redirect to safe site, minimize window, hide content
- **Instant Activation**: Emergency protection with one keypress

### 🔒 Close Prevention
- **Prevent Accidental Close**: Stop tabs from closing unexpectedly
- **Confirmation Prompts**: Ask before closing important tabs
- **Flexible Controls**: Toggle on/off as needed

### 🔄 Firebase Sync
- **Real-time Sync**: Settings synced across all devices
- **Offline Support**: Works offline, syncs when online
- **Anonymous Auth**: No account required, uses Firebase anonymous authentication

## 📦 Installation

1. **Copy Extension Files**: Ensure all extension files are in your project directory:
   - `manifest.json`
   - `extension-popup.html`
   - `extension-popup.js`
   - `extension-worker.js`
   - `content-script.js`
   - `carbon-protocol-rules.json`

2. **Load Extension**: 
   - Open Chrome/Edge
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select your project directory

## 🎯 Usage

### Opening the Extension

1. **From Browser Toolbar**: Click the Carbon extension icon
2. **From Carbon Browser Menu**: 
   - Click the menu (⋮) in the Carbon browser
   - Select "Extension Control"
3. **Context Menu**: Right-click any page → Carbon Extensions

### Using Carbon:// Protocols

The extension adds special protocol support:

- **carbon://games** - Opens the games hub
- **carbon://settings** - Opens advanced settings

Simply type these URLs in any address bar or click the menu options.

### Configuring UV Injections

1. Open extension popup
2. Navigate to "UV Config Injections" section
3. Toggle individual features:
   - ✅ **Dark Mode Injection**: Inject dark CSS into proxied sites
   - ✅ **Custom CSS Injector**: Enable window.carbonInjectCSS()
   - ✅ **Custom JS Injector**: Enable window.carbonInjectScript()
   - ✅ **Global Enhancements**: Smooth scrolling, lazy loading, branding

### Setting Up Stealth Mode

1. Go to "Stealth Mode Settings"
2. Enable main stealth toggle
3. Configure sub-features:
   - **Hide From History**: Prevent history tracking
   - **Block Analytics**: Block tracking scripts
   - **Spoof Canvas**: Prevent fingerprinting

### Configuring Panic Mode

1. Open "Panic Key Settings"
2. Choose modifier key (Ctrl, Alt, Shift, Ctrl+Shift)
3. Choose trigger key (P, X, Escape, Space)
4. Select panic action:
   - **Close Tab**: Immediately close current tab
   - **Redirect**: Go to safe site (configurable URL)
   - **Minimize**: Minimize browser window
   - **Hide**: Show fake Google search page

### Managing Themes

1. Go to "Theme Settings"
2. Click desired theme button:
   - 🌙 Dark
   - ☀️ Light  
   - ☕ Cappuccino
   - 🎨 Default
3. Theme applies immediately and syncs to Firebase

## 🔧 Integration with Existing Files

### Proxy.html Integration
The extension integrates seamlessly with `proxy.html`:

```javascript
// Access extension functions from proxy.html
openCarbonGames()      // Open games hub
openCarbonSettings()   // Open advanced settings  
openExtensionPopup()   // Open extension control panel
applyTheme('dark')     // Apply theme programmatically
updateClosePrevention(true, false) // Enable close prevention
```

### Settings.html Enhancement
Enhanced settings page now includes:
- Extension feature toggles
- User agent management
- Theme selection
- Stealth mode controls
- All with real-time Firebase sync

### UV Config Dynamic Updates
The `uv.config.js` now supports real-time updates:
- Extension settings modify UV behavior
- Injections can be toggled without restart
- Settings persist across browser sessions

## 🌐 Firebase Sync

### Authentication
- Uses Firebase Anonymous Authentication
- No user registration required
- Automatic login on extension load

### Data Structure
Settings stored in Firestore:
```javascript
{
  uvConfig: {
    darkMode: true,
    customCSS: true,
    customJS: true,
    globalEnhancements: true
  },
  userAgent: 'chrome',
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
    confirmClose: true
  }
}
```

### Sync Status
- 🟢 **Connected**: Online and syncing
- 🟡 **Offline**: Working locally, will sync when online
- 🔴 **Sync Error**: Check connection, may retry automatically

## 🎮 Developer API

### Custom CSS Injection
```javascript
// Available in proxied content when enabled
window.carbonInjectCSS(`
  body { background: #000 !important; }
  .custom-style { color: #fff; }
`);
```

### Custom JS Injection
```javascript
// Available in proxied content when enabled  
window.carbonInjectScript(`
  console.log('Custom script injected by Carbon');
  document.body.style.border = '2px solid #00ff00';
`);
```

### Extension Messages
```javascript
// Send message to extension
chrome.runtime.sendMessage({
  action: 'updateUVConfig',
  settings: { darkMode: false }
});

// Listen for extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyTheme') {
    applyTheme(message.theme);
  }
});
```

## 🔍 Troubleshooting

### Extension Not Loading
1. Check if all files are present
2. Verify manifest.json syntax
3. Reload extension in chrome://extensions/
4. Check developer console for errors

### Firebase Sync Issues
1. Check internet connection
2. Verify Firebase config in extension-popup.js
3. Force sync using "Sync Now" button
4. Clear browser cache if needed

### UV Injections Not Working
1. Ensure UV Config toggles are enabled
2. Check if in proxied iframe (not main window)
3. Verify uv.config.js is loading properly
4. Restart browser if needed

### Panic Mode Not Responding
1. Check panic key configuration
2. Verify no other extensions conflict
3. Test different key combinations
4. Check browser permissions

## 📱 Mobile Support

While primarily designed for desktop browsers, the extension includes:
- Mobile user agent options
- Touch-friendly interface elements
- Responsive design for smaller screens
- Mobile Chrome/Safari spoofing

## 🔒 Security Features

- **No Data Collection**: Extension only stores user preferences
- **Local-First**: Works offline, syncs optionally
- **Anonymous Auth**: No personal information required
- **Secure Firebase**: All data encrypted in transit
- **Canvas Spoofing**: Prevents fingerprinting attacks
- **Analytics Blocking**: Stops tracking scripts

## 🎯 Advanced Configuration

### Custom Theme Creation
While not in the initial release, the extension is designed to support custom themes. Theme data structure:

```javascript
const customTheme = {
  primary: '#custom-color',
  secondary: '#custom-color',
  text: '#custom-color',
  accent: '#custom-color'
};
```

### Network Request Modification
The extension can modify:
- User Agent headers
- Block analytics requests
- Add custom headers (future feature)

### Context Menu Integration
Right-click context menu includes:
- Toggle Stealth Mode
- Panic Mode
- Open Games/Settings
- Extension controls

## 📈 Future Enhancements

Planned features for future releases:
- **Custom Theme Editor**: Visual theme creation tool
- **Script Management**: Import/export custom scripts
- **Profile System**: Multiple configuration profiles
- **Advanced Fingerprinting**: WebGL, Audio context spoofing
- **Bookmark Sync**: Cross-device bookmark management
- **Performance Monitoring**: Page load optimization
- **Ad Blocking**: Built-in ad blocker
- **VPN Integration**: Seamless VPN connectivity

## 🤝 Contributing

The Carbon Extension system is designed to be modular and extensible. Key areas for contribution:
- Theme development
- New injection scripts
- Security enhancements
- Performance optimizations
- Mobile support improvements

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review browser console for errors
3. Test with extension disabled to isolate issues
4. Check Firebase console for sync status
5. Report bugs with detailed reproduction steps

---

*The Carbon Browser Extension provides a comprehensive suite of privacy, customization, and productivity features while maintaining simplicity and performance. All features are designed to work seamlessly with the existing Carbon Browser ecosystem.*