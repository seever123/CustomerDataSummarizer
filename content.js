// Content script for Customer Data Summarizer Extension
// This script runs on all pages and handles portal interaction

class PortalInteractionHandler {
    constructor() {
        this.isSubscriberPage = false;
        this.isCallDetailsTab = false;
        this.tableObserver = null;
        this.init();
    }
    
    init() {
        this.detectPageType();
        this.setupTableObserver();
        this.setupMessageListener();
    }
    
    detectPageType() {
        // Detect if we're on the Subscriber page with Call Details Record tab
        const pageTitle = document.title.toLowerCase();
        const pageContent = document.body.textContent.toLowerCase();
        
        this.isSubscriberPage = pageTitle.includes('subscriber') || 
                               pageContent.includes('subscriber') ||
                               document.querySelector('h1, h2, h3')?.textContent?.toLowerCase().includes('subscriber');
        
        this.isCallDetailsTab = pageContent.includes('call details record') ||
                               document.querySelector('[role="tab"], .tab, .nav-tab')?.textContent?.toLowerCase().includes('call details');
        
        // Send page info to extension
        if (this.isSubscriberPage && this.isCallDetailsTab) {
            this.notifyExtension('pageReady', {
                isSubscriberPage: this.isSubscriberPage,
                isCallDetailsTab: this.isCallDetailsTab,
                hasTable: !!document.querySelector('tbody')
            });
        }
    }
    
    setupTableObserver() {
        // Watch for changes in the table data
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target.tagName === 'TBODY') {
                    this.notifyExtension('tableUpdated', {
                        rowCount: mutation.target.querySelectorAll('tr').length
                    });
                }
            });
        });
        
        const tbody = document.querySelector('tbody');
        if (tbody) {
            observer.observe(tbody, {
                childList: true,
                subtree: true
            });
        }
        
        this.tableObserver = observer;
    }
    
    setupMessageListener() {
        // Listen for messages from the extension popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getPageInfo':
                    sendResponse({
                        isSubscriberPage: this.isSubscriberPage,
                        isCallDetailsTab: this.isCallDetailsTab,
                        hasTable: !!document.querySelector('tbody'),
                        url: window.location.href
                    });
                    break;
                    
                case 'applyFilters':
                    this.applyFilters(request.filters)
                        .then(result => sendResponse({success: true, result}))
                        .catch(error => sendResponse({success: false, error: error.message}));
                    return true; // Keep message channel open for async response
                    
                case 'extractData':
                    this.extractTableData()
                        .then(data => sendResponse({success: true, data}))
                        .catch(error => sendResponse({success: false, error: error.message}));
                    return true;
                    
                default:
                    sendResponse({success: false, error: 'Unknown action'});
            }
        });
    }
    
    async applyFilters(filters) {
        try {
            // Find datetime inputs
            const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');
            
            if (dateTimeInputs.length >= 2) {
                // Set start time
                if (filters.startTime) {
                    dateTimeInputs[0].value = filters.startTime;
                    dateTimeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                    dateTimeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // Set end time
                if (filters.endTime) {
                    dateTimeInputs[1].value = filters.endTime;
                    dateTimeInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
                    dateTimeInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            
            // Find and set dropdown values
            const selects = document.querySelectorAll('select');
            
            // Category dropdown (usually first select)
            if (filters.category && selects.length > 0) {
                const categorySelect = this.findSelectByOptions(selects, ['Loan', 'SMS Service', 'Activation']);
                if (categorySelect) {
                    categorySelect.value = filters.category;
                    categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.delay(500); // Wait for dependent dropdowns to update
                }
            }
            
            // Service Type dropdown
            if (filters.serviceType && selects.length > 1) {
                const serviceSelect = this.findSelectByPartialText(selects, 'service');
                if (serviceSelect) {
                    // Wait a bit more for the dropdown to be populated
                    await this.delay(1000);
                    serviceSelect.value = filters.serviceType;
                    serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.delay(500);
                }
            }
            
            // Flow Type dropdown
            if (filters.flowType && selects.length > 2) {
                const flowSelect = this.findSelectByPartialText(selects, 'flow');
                if (flowSelect) {
                    await this.delay(1000);
                    flowSelect.value = filters.flowType;
                    flowSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            
            // Click search button
            await this.delay(1000);
            const searchButton = this.findSearchButton();
            if (searchButton) {
                searchButton.click();
                await this.delay(2000); // Wait for search results
                return { message: 'Filters applied and search executed' };
            } else {
                throw new Error('Search button not found');
            }
            
        } catch (error) {
            console.error('Error applying filters:', error);
            throw error;
        }
    }
    
    findSelectByOptions(selects, expectedOptions) {
        for (let select of selects) {
            const options = Array.from(select.options).map(opt => opt.text || opt.value);
            if (expectedOptions.some(expected => options.some(opt => opt.includes(expected)))) {
                return select;
            }
        }
        return null;
    }
    
    findSelectByPartialText(selects, searchText) {
        const searchLower = searchText.toLowerCase();
        for (let select of selects) {
            const parent = select.closest('div, td, th, label');
            if (parent && parent.textContent.toLowerCase().includes(searchLower)) {
                return select;
            }
        }
        return null;
    }
    
    findSearchButton() {
        // Look for search button with various possible selectors
        const possibleSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Search")',
            'input[value*="Search"]',
            '.search-btn',
            '#searchBtn',
            '.btn-search'
        ];
        
        for (let selector of possibleSelectors) {
            const button = document.querySelector(selector);
            if (button) return button;
        }
        
        // Fallback: look for any button with "search" in text
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (let button of buttons) {
            const text = (button.textContent || button.value || '').toLowerCase();
            if (text.includes('search')) {
                return button;
            }
        }
        
        return null;
    }
    
    async extractTableData() {
        try {
            const tbody = document.querySelector('tbody');
            if (!tbody) {
                throw new Error('Call Details Record table not found. Please ensure you are on the Subscriber page with the Call Details Record tab active.');
            }
            
            const rows = tbody.querySelectorAll('tr');
            const data = [];
            
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td, th');
                
                // Skip header rows or rows with insufficient data
                if (cells.length < 15) return;
                
                try {
                    const record = {
                        rowIndex: index,
                        chargedNumber: this.getCellText(cells[0]),
                        callingLocation: this.getCellText(cells[1]), // Hidden/encrypted
                        peerNumber: this.getCellText(cells[2]),
                        category: this.getCellText(cells[3]),
                        serviceType: this.getCellText(cells[4]),
                        flowType: this.getCellText(cells[5]),
                        roamingType: this.getCellText(cells[6]),
                        billCycle: this.getCellText(cells[7]),
                        startEndTime: this.getCellText(cells[8]),
                        actualVolume: this.parseNumber(this.getCellText(cells[9])),
                        unit: this.getCellText(cells[10]),
                        currency: this.getCellText(cells[11]) || 'IQD',
                        relatedAccountChanges: this.parseNumber(this.getCellText(cells[12])),
                        relatedAccountRemaining: this.parseNumber(this.getCellText(cells[13])),
                        relatedOfferingName: this.getCellText(cells[14]),
                        beforeBalance: this.parseNumber(this.getCellText(cells[15])),
                        afterBalance: this.parseNumber(this.getCellText(cells[16])),
                        vowfi: this.getCellText(cells[17]),
                        businessRemark: this.getCellText(cells[18])
                    };
                    
                    // Only add records that have meaningful data
                    if (record.chargedNumber || record.category || record.serviceType) {
                        data.push(record);
                    }
                    
                } catch (recordError) {
                    console.warn(`Error processing row ${index}:`, recordError);
                }
            });
            
            if (data.length === 0) {
                throw new Error('No valid records found in the table. The table might be empty or have a different structure than expected.');
            }
            
            return data;
            
        } catch (error) {
            console.error('Error extracting table data:', error);
            throw error;
        }
    }
    
    getCellText(cell) {
        if (!cell) return '';
        
        // Handle nested divs or spans within cells
        const textNode = cell.querySelector('div, span') || cell;
        return (textNode.textContent || textNode.innerText || '').trim();
    }
    
    parseNumber(text) {
        if (!text) return 0;
        
        // Remove any non-numeric characters except decimal point and minus sign
        const cleanText = text.replace(/[^\d.-]/g, '');
        const number = parseFloat(cleanText);
        
        return isNaN(number) ? 0 : number;
    }
    
    notifyExtension(type, data) {
        chrome.runtime.sendMessage({
            type: type,
            data: data,
            timestamp: Date.now()
        }).catch(error => {
            // Extension might not be listening, that's okay
            console.debug('Could not notify extension:', error);
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    destroy() {
        if (this.tableObserver) {
            this.tableObserver.disconnect();
        }
    }
}

// Initialize the portal interaction handler
let portalHandler = null;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHandler);
} else {
    initializeHandler();
}

function initializeHandler() {
    // Clean up existing handler
    if (portalHandler) {
        portalHandler.destroy();
    }
    
    // Create new handler
    portalHandler = new PortalInteractionHandler();
}

// Reinitialize on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(initializeHandler, 1000); // Delay to let page load
    }
}).observe(document, { subtree: true, childList: true });

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (portalHandler) {
        portalHandler.destroy();
    }
});