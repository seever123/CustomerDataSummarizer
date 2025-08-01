// Fixed popup.js with improved error handling and debugging

class CustomerDataSummarizer {
    constructor() {
        console.log('CustomerDataSummarizer: Initializing...');
        this.serviceTypeMap = {
            'Voice': ['On-net voice', 'Call without border', 'Off-net voice', 'IDD', 'International Roaming', 'International Call', 'Special number of a non-zero-tariff voice', 'Voice special number with 0 tariff', 'Voice mail', 'Long distance', 'National roaming voice'],
            'SMS Service': ['On-net SMS', 'Off-net SMS', 'International SMS'],
            'MMS service': ['On-net MMS', 'Off-net MMS', 'International MMS'],
            'GPRS charging': ['Data usage', 'Internet browsing', 'Email'],
            'Recharge': ['Credit Recharge', 'Voucher Recharge', 'Online Recharge'],
            'Recurring charge': ['Monthly Fee', 'Weekly Fee', 'Daily Fee']
        };
        
        this.flowTypeMap = {
            'On-net voice': ['Outbound Call', 'Inbound Call', 'Call Forward'],
            'Off-net voice': ['Outbound Call', 'Inbound Call'],
            'IDD': ['Outbound Call'],
            'On-net SMS': ['Outbound SMS', 'Inbound SMS'],
            'Data usage': ['Internet browsing', 'Email', 'Social Media'],
            'Credit Recharge': ['Account Top-up', 'Balance Transfer']
        };
        
        this.init();
    }
    
    init() {
        console.log('CustomerDataSummarizer: Setting up...');
        this.setupEventListeners();
        this.setupDateDefaults();
        this.updateStatus('Ready to analyze customer data');
    }
    
    setupEventListeners() {
        console.log('CustomerDataSummarizer: Setting up event listeners...');
        
        // Quick date filters
        document.getElementById('todayBtn')?.addEventListener('click', () => {
            console.log('Today button clicked');
            this.setDateRange('today');
        });
        document.getElementById('weekBtn')?.addEventListener('click', () => {
            console.log('Week button clicked');
            this.setDateRange('week');
        });
        document.getElementById('monthBtn')?.addEventListener('click', () => {
            console.log('Month button clicked');
            this.setDateRange('month');
        });
        
        // Dropdown dependencies
        document.getElementById('category')?.addEventListener('change', (e) => {
            console.log('Category changed to:', e.target.value);
            this.updateServiceTypes(e.target.value);
        });
        document.getElementById('serviceType')?.addEventListener('change', (e) => {
            console.log('Service type changed to:', e.target.value);
            this.updateFlowTypes(e.target.value);
        });
        
        // Action buttons
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            console.log('Search button clicked - starting analysis...');
            this.searchAndAnalyze();
        });
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            console.log('Reset button clicked');
            this.resetFilters();
        });
    }
    
    setupDateDefaults() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');
        
        if (startTimeEl && endTimeEl) {
            startTimeEl.value = this.formatDateTime(today);
            endTimeEl.value = this.formatDateTime(endOfDay);
            console.log('Date defaults set:', this.formatDateTime(today), 'to', this.formatDateTime(endOfDay));
        }
    }
    
    formatDateTime(date) {
        return date.toISOString().slice(0, 16);
    }
    
    setDateRange(range) {
        console.log('Setting date range:', range);
        // Remove active class from all buttons
        document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
        
        const now = new Date();
        let startDate, endDate;
        
        switch(range) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
                document.getElementById('todayBtn')?.classList.add('active');
                break;
                
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                startDate = startOfWeek;
                endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
                document.getElementById('weekBtn')?.classList.add('active');
                break;
                
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                document.getElementById('monthBtn')?.classList.add('active');
                break;
        }
        
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');
        
        if (startTimeEl && endTimeEl) {
            startTimeEl.value = this.formatDateTime(startDate);
            endTimeEl.value = this.formatDateTime(endDate);
            console.log('Date range set to:', this.formatDateTime(startDate), 'to', this.formatDateTime(endDate));
        }
    }
    
    updateServiceTypes(category) {
        console.log('Updating service types for category:', category);
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) return;
        
        serviceSelect.innerHTML = '<option value="">All Services</option>';
        
        if (this.serviceTypeMap[category]) {
            this.serviceTypeMap[category].forEach(service => {
                const option = document.createElement('option');
                option.value = service;
                option.textContent = service;
                serviceSelect.appendChild(option);
            });
            console.log('Added', this.serviceTypeMap[category].length, 'service type options');
        }
        
        this.updateFlowTypes('');
    }
    
    updateFlowTypes(serviceType) {
        console.log('Updating flow types for service type:', serviceType);
        const flowSelect = document.getElementById('flowType');
        if (!flowSelect) return;
        
        flowSelect.innerHTML = '<option value="">All Flow Types</option>';
        
        if (this.flowTypeMap[serviceType]) {
            this.flowTypeMap[serviceType].forEach(flow => {
                const option = document.createElement('option');
                option.value = flow;
                option.textContent = flow;
                flowSelect.appendChild(option);
            });
            console.log('Added', this.flowTypeMap[serviceType].length, 'flow type options');
        }
    }
    
    resetFilters() {
        console.log('Resetting all filters...');
        const categoryEl = document.getElementById('category');
        const serviceTypeEl = document.getElementById('serviceType');
        const flowTypeEl = document.getElementById('flowType');
        
        if (categoryEl) categoryEl.selectedIndex = 0;
        if (serviceTypeEl) serviceTypeEl.innerHTML = '<option value="">All Services</option>';
        if (flowTypeEl) flowTypeEl.innerHTML = '<option value="">All Flow Types</option>';
        
        document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
        this.setupDateDefaults();
        this.hideAllSections();
        this.updateStatus('Filters reset - ready to analyze');
    }
    
    async searchAndAnalyze() {
        console.log('=== STARTING SEARCH AND ANALYZE ===');
        this.showLoading();
        this.updateStatus('Checking current page...');
        
        try {
            // Get current tab
            console.log('Getting current tab...');
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            console.log('Current tab:', tab.url);
            
            // Check if we're on the right page
            this.updateStatus('Verifying page compatibility...');
            const pageCheckResult = await this.checkPageCompatibility(tab.id);
            console.log('Page check result:', pageCheckResult);
            
            if (!pageCheckResult.isCompatible) {
                throw new Error(pageCheckResult.message);
            }
            
            // Get filter values
            const filters = this.getFilterValues();
            console.log('Filter values:', filters);
            
            // Apply filters
            this.updateStatus('Applying filters...');
            await this.applyFilters(tab.id, filters);
            
            // Wait for search results
            this.updateStatus('Waiting for search results...');
            await this.delay(3000);
            
            // Extract data
            this.updateStatus('Extracting table data...');
            const data = await this.extractTableData(tab.id);
            console.log('Extracted data:', data);
            
            if (!data || data.length === 0) {
                throw new Error('No data found. Please ensure the search returned results.');
            }
            
            // Generate and show summary
            const summary = this.generateSummary(data);
            console.log('Generated summary:', summary);
            
            this.showSummary(summary);
            this.updateStatus(`Analysis complete - ${data.length} records processed`);
            console.log('=== SEARCH AND ANALYZE COMPLETE ===');
            
        } catch (error) {
            console.error('=== SEARCH AND ANALYZE ERROR ===');
            console.error('Error details:', error);
            this.showError(`Error: ${error.message}`);
            this.updateStatus('Analysis failed');
        }
    }
    
    async checkPageCompatibility(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: () => {
                    const title = document.title.toLowerCase();
                    const bodyText = document.body.textContent.toLowerCase();
                    const hasTable = !!document.querySelector('tbody');
                    const hasDateInputs = document.querySelectorAll('input[type="datetime-local"]').length >= 2;
                    const hasSelects = document.querySelectorAll('select').length > 0;
                    
                    const isSubscriberPage = title.includes('subscriber') || 
                                           bodyText.includes('subscriber') ||
                                           bodyText.includes('call details');
                    
                    return {
                        title: document.title,
                        hasTable,
                        hasDateInputs,
                        hasSelects,
                        isSubscriberPage,
                        tableRowCount: document.querySelectorAll('tbody tr').length
                    };
                }
            });
            
            const pageInfo = results[0].result;
            console.log('Page info:', pageInfo);
            
            if (!pageInfo.isSubscriberPage) {
                return {
                    isCompatible: false,
                    message: 'Please navigate to the Subscriber page with Call Details Record tab active.'
                };
            }
            
            if (!pageInfo.hasTable) {
                return {
                    isCompatible: false,
                    message: 'Call Details Record table not found on this page.'
                };
            }
            
            if (!pageInfo.hasDateInputs || !pageInfo.hasSelects) {
                return {
                    isCompatible: false,
                    message: 'Required filter controls not found. Please ensure all filters are visible.'
                };
            }
            
            return {
                isCompatible: true,
                message: 'Page is compatible',
                pageInfo
            };
            
        } catch (error) {
            console.error('Error checking page compatibility:', error);
            return {
                isCompatible: false,
                message: 'Could not analyze the current page. Please refresh and try again.'
            };
        }
    }
    
    async applyFilters(tabId, filters) {
        try {
            const results = await chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: (filters) => {
                    console.log('Applying filters:', filters);
                    
                    // Set datetime inputs
                    const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
                    if (dateInputs.length >= 2) {
                        if (filters.startTime) {
                            dateInputs[0].value = filters.startTime;
                            dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        if (filters.endTime) {
                            dateInputs[1].value = filters.endTime;
                            dateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                    
                    // Set category dropdown
                    const selects = document.querySelectorAll('select');
                    if (filters.category && selects.length > 0) {
                        const categorySelect = selects[0]; // Usually first select is category
                        for (let option of categorySelect.options) {
                            if (option.value === filters.category || option.text === filters.category) {
                                categorySelect.value = option.value;
                                categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
                                break;
                            }
                        }
                    }
                    
                    // Trigger search
                    setTimeout(() => {
                        const searchBtn = document.querySelector('button[onclick*="search"], .btn-primary, button:contains("Search")') ||
                                        Array.from(document.querySelectorAll('button')).find(btn => 
                                            btn.textContent.toLowerCase().includes('search'));
                        
                        if (searchBtn) {
                            console.log('Clicking search button');
                            searchBtn.click();
                        } else {
                            console.warn('Search button not found');
                        }
                    }, 1000);
                    
                    return { success: true };
                },
                args: [filters]
            });
            
            return results[0].result;
            
        } catch (error) {
            console.error('Error applying filters:', error);
            throw new Error('Failed to apply filters: ' + error.message);
        }
    }
    
    async extractTableData(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: () => {
                    console.log('Extracting table data...');
                    
                    const tbody = document.querySelector('tbody');
                    if (!tbody) {
                        throw new Error('Table body not found');
                    }
                    
                    const rows = tbody.querySelectorAll('tr');
                    console.log('Found', rows.length, 'rows');
                    
                    const data = [];
                    
                    rows.forEach((row, index) => {
                        const cells = row.querySelectorAll('td, th');
                        
                        if (cells.length < 15) {
                            console.log(`Skipping row ${index}: only ${cells.length} cells`);
                            return;
                        }
                        
                        // Check for "no data" messages
                        const firstCellText = cells[0]?.textContent?.trim().toLowerCase() || '';
                        if (firstCellText.includes('no records') || 
                            firstCellText.includes('no data') || 
                            firstCellText.includes('no matching')) {
                            console.log(`Skipping row ${index}: no data message`);
                            return;
                        }
                        
                        try {
                            const record = {
                                chargedNumber: cells[0]?.textContent?.trim() || '',
                                callingLocation: cells[1]?.textContent?.trim() || '',
                                peerNumber: cells[2]?.textContent?.trim() || '',
                                category: cells[3]?.textContent?.trim() || '',
                                serviceType: cells[4]?.textContent?.trim() || '',
                                flowType: cells[5]?.textContent?.trim() || '',
                                roamingType: cells[6]?.textContent?.trim() || '',
                                billCycle: cells[7]?.textContent?.trim() || '',
                                startEndTime: cells[8]?.textContent?.trim() || '',
                                actualVolume: parseFloat(cells[9]?.textContent?.replace(/[^\d.-]/g, '') || '0'),
                                unit: cells[10]?.textContent?.trim() || '',
                                currency: cells[11]?.textContent?.trim() || 'IQD',
                                relatedAccountChanges: parseFloat(cells[12]?.textContent?.replace(/[^\d.-]/g, '') || '0'),
                                relatedAccountRemaining: parseFloat(cells[13]?.textContent?.replace(/[^\d.-]/g, '') || '0'),
                                relatedOfferingName: cells[14]?.textContent?.trim() || '',
                                beforeBalance: parseFloat(cells[15]?.textContent?.replace(/[^\d.-]/g, '') || '0'),
                                afterBalance: parseFloat(cells[16]?.textContent?.replace(/[^\d.-]/g, '') || '0'),
                                vowfi: cells[17]?.textContent?.trim() || '',
                                businessRemark: cells[18]?.textContent?.trim() || ''
                            };
                            
                            // Only add records with meaningful data
                            if (record.chargedNumber || record.category) {
                                data.push(record);
                                console.log(`Added record ${data.length}:`, record.category, record.serviceType);
                            }
                            
                        } catch (recordError) {
                            console.warn(`Error processing row ${index}:`, recordError);
                        }
                    });
                    
                    console.log('Extraction complete. Total records:', data.length);
                    return data;
                }
            });
            
            return results[0].result;
            
        } catch (error) {
            console.error('Error extracting table data:', error);
            throw new Error('Failed to extract table data: ' + error.message);
        }
    }
    
    getFilterValues() {
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');
        const categoryEl = document.getElementById('category');
        const serviceTypeEl = document.getElementById('serviceType');
        const flowTypeEl = document.getElementById('flowType');
        
        const filters = {
            startTime: startTimeEl?.value || '',
            endTime: endTimeEl?.value || '',
            category: categoryEl?.value || '',
            serviceType: serviceTypeEl?.value || '',
            flowType: flowTypeEl?.value || ''
        };
        
        console.log('Getting filter values:', filters);
        return filters;
    }
    
    generateSummary(data) {
        console.log('Generating summary for', data.length, 'records');
        
        if (!data || data.length === 0) {
            return 'No customer data found for the selected criteria.';
        }
        
        const totalTransactions = data.length;
        const firstRecord = data[0];
        const lastRecord = data[data.length - 1];
        
        const startBalance = firstRecord.beforeBalance || 0;
        const endBalance = lastRecord.afterBalance || 0;
        const balanceChange = endBalance - startBalance;
        
        const totalRelatedChanges = data.reduce((sum, record) => sum + (record.relatedAccountChanges || 0), 0);
        
        // Group by category
        const categoryBreakdown = {};
        data.forEach(record => {
            const category = record.category || 'Unknown';
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = {
                    count: 0,
                    totalChanges: 0,
                    services: new Set()
                };
            }
            categoryBreakdown[category].count++;
            categoryBreakdown[category].totalChanges += (record.relatedAccountChanges || 0);
            if (record.serviceType) {
                categoryBreakdown[category].services.add(record.serviceType);
            }
        });
        
        let summary = `Customer Activity Summary:\n\n`;
        summary += `📊 Total Transactions: ${totalTransactions}\n`;
        summary += `💰 Balance Change: ${startBalance.toFixed(2)} → ${endBalance.toFixed(2)} IQD (${balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(2)} IQD)\n`;
        summary += `💳 Total Account Changes: ${totalRelatedChanges.toFixed(2)} IQD\n\n`;
        
        summary += `📋 Activity Breakdown:\n`;
        Object.entries(categoryBreakdown).forEach(([category, info]) => {
            summary += `• ${category}: ${info.count} transactions, ${info.totalChanges.toFixed(2)} IQD\n`;
            if (info.services.size > 0) {
                summary += `  Services: ${Array.from(info.services).join(', ')}\n`;
            }
        });
        
        return summary;
    }
    
    showLoading() {
        this.hideAllSections();
        const loadingEl = document.getElementById('loadingSection');
        if (loadingEl) loadingEl.style.display = 'block';
    }
    
    showSummary(summary) {
        this.hideAllSections();
        const summaryEl = document.getElementById('summarySection');
        const contentEl = document.getElementById('summaryContent');
        if (summaryEl && contentEl) {
            contentEl.textContent = summary;
            summaryEl.style.display = 'block';
        }
    }
    
    showError(message) {
        this.hideAllSections();
        const errorEl = document.getElementById('errorSection');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
    
    hideAllSections() {
        const sections = ['summarySection', 'loadingSection', 'errorSection'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log('Status:', message);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing CustomerDataSummarizer...');
    try {
        new CustomerDataSummarizer();
    } catch (error) {
        console.error('Failed to initialize CustomerDataSummarizer:', error);
    }
});