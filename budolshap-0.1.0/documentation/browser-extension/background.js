// Configuration - Update these URLs for your environment
const CONFIG = {
    // Local development
    localUrl: 'http://localhost:3000/documentation/knowledge-base.html',
    // Production (update with your actual domain)
    productionUrl: 'https://your-domain.com/documentation/knowledge-base.html',
    // Use local or production
    useLocal: true
};

// Get the knowledge base URL based on configuration
function getKnowledgeBaseUrl() {
    return CONFIG.useLocal ? CONFIG.localUrl : CONFIG.productionUrl;
}

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-knowledge-base') {
        openKnowledgeBase();
    }
});

// Function to open knowledge base
function openKnowledgeBase() {
    const kbUrl = getKnowledgeBaseUrl();
    
    // Check if knowledge base is already open in any tab
    chrome.tabs.query({}, (tabs) => {
        const existingTab = tabs.find(tab => tab.url && tab.url.includes('knowledge-base.html'));
        
        if (existingTab) {
            // Focus existing tab
            chrome.tabs.update(existingTab.id, { active: true });
            chrome.windows.update(existingTab.windowId, { focused: true });
        } else {
            // Open new tab
            chrome.tabs.create({ url: kbUrl });
        }
    });
}

// Listen for messages from popup and website
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openKB') {
        openKnowledgeBase();
        sendResponse({ success: true });
    } else if (request.action === 'openWithAuth') {
        // Open main app first, then knowledge base
        const baseUrl = CONFIG.useLocal 
            ? 'http://localhost:3000' 
            : CONFIG.productionUrl.replace('/documentation/knowledge-base.html', '');
        
        chrome.tabs.create({ url: baseUrl }, (tab) => {
            // Wait a bit for page to load, then open KB
            setTimeout(() => {
                chrome.tabs.create({ url: getKnowledgeBaseUrl() });
            }, 1000);
        });
        sendResponse({ success: true });
    } else if (request.action === 'ping') {
        // Website checking if extension is installed
        sendResponse({ installed: true, name: 'BudolShap Knowledge Base Shortcut' });
    }
    return true;
});

// Context menu item (optional)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openKB',
        title: 'Open Knowledge Base',
        contexts: ['page', 'selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openKB') {
        openKnowledgeBase();
    }
});

// Inject script to mark extension as installed (for website detection)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Only inject on BudolShap domain
        if (tab.url.includes('localhost:3000') || tab.url.includes('budolshap')) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    window.kbExtensionInstalled = true;
                }
            }).catch(() => {
                // Ignore errors (might not have permission on some pages)
            });
        }
    }
});

