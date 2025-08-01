// Background script for Customer Data Summarizer Extension
// Handles extension lifecycle and communication between components

class BackgroundService {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupInstallHandler();
        this.setupMessageHandlers();
        this.setupTabHandlers();
    }
    
    setupInstallHandler() {
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('Customer Data Summarizer Extension installed/updated');
            
            if (details.reason === 'install') {
                // First time installation
                this.showWelcomeNotification();
            } else if (details.reason === 'update') {
                // Extension updated
                console.log('Extension updated to version:', chrome.runtime.getManifest().version);
            }
        });
    }
    
    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'pageReady':
                    this.handlePageReady(message.data, sender);
                    break;
                    
                case 'tableUpdated':
                    this.handleTableUpdate(message.data, sender);
                    break;
                    
                case 'getTabInfo':
                    this.getTabInfo(sender.tab.id)
                        .then(info => sendResponse({ success: true, info }))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true; // Keep message channel open
                    
                case 'executeScript':
                    this.executeScriptInTab(message.tabId, message.script, message.args)
                        .then(result => sendResponse({ success: true, result }))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true;
                    
                default:
                    console.log('Unknown message type:', message.type);
            }
        });
    }
    
    setupTabHandlers() {
        // Handle tab updates to detect navigation to subscriber pages
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.checkIfSubscriberPage(tab);
            }
        });
        
        // Handle tab activation
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            this.checkIfSubscriberPage(tab);
        });
    }
    
    async checkIfSubscriberPage(tab) {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            return;
        }
        
        try {
            // Inject content script if not already present
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // Check if our handler is already present
                    return window.hasOwnProperty('portalHandler');
                }
            });
        } catch (error) {
            // Content script injection failed, tab might not be ready
            console.debug('Could not inject content script:', error);
        }
    }
    
    handlePageReady(data, sender) {
        console.log('Subscriber page ready:', data);
        
        // Update extension badge to show page is compatible
        if (data.isSubscriberPage && data.isCallDetailsTab) {
            chrome.action.setBadgeText({
                text: '✓',
                tabId: sender.tab.id
            });
            chrome.action.setBadgeBackgroundColor({
                color: '#0078d4',
                tabId: sender.tab.id
            });
        }
    }
    
    handleTableUpdate(data, sender) {
        console.log('Table updated with', data.rowCount, 'rows');
        
        // Notify popup if it's open
        chrome.runtime.sendMessage({
            type: 'tableDataChanged',
            data: data,
            tabId: sender.tab.id
        }).catch(() => {
            // Popup might not be open, that's okay
        });
    }
    
    async getTabInfo(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            
            // Execute script to get page information
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        hasTable: !!document.querySelector('tbody'),
                        isSubscriberPage: document.body.textContent.toLowerCase().includes('subscriber'),
                        tableRowCount: document.querySelectorAll('tbody tr').length
                    };
                }
            });
            
            return {
                tab: tab,
                pageInfo: results[0].result
            };
            
        } catch (error) {
            throw new Error(`Could not get tab info: ${error.message}`);
        }
    }
    
    async executeScriptInTab(tabId, scriptFunction, args = []) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: scriptFunction,
                args: args
            });
            
            return results[0].result;
            
        } catch (error) {
            throw new Error(`Script execution failed: ${error.message}`);
        }
    }
    
    showWelcomeNotification() {
        // Could show a notification or open a welcome page
        console.log('Welcome to Customer Data Summarizer Extension!');
        console.log('Navigate to your internal portal\'s Subscriber page > Call Details Record tab to begin.');
    }
    
    // Utility method to check if extension context is valid
    isContextValid() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            return false;
        }
    }
}

// Initialize background service
let backgroundService = null;

try {
    backgroundService = new BackgroundService();
} catch (error) {
    console.error('Failed to initialize background service:', error);
}

// Handle extension context invalidation
chrome.runtime.onSuspend?.addListener(() => {
    console.log('Extension context being suspended');
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundService;
}