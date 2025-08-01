// Debug version of popup.js with extensive logging

class CustomerDataSummarizerDebug {
    constructor() {
        console.log('CustomerDataSummarizer Debug: Initializing...');
        this.serviceTypeMap = {
            'Voice': ['On-net voice', 'Call without border', 'Off-net voice', 'IDD', 'International Roaming', 'International Call', 'Special number of a non-zero-tariff voice', 'Voice special number with 0 tariff', 'Voice mail', 'Long distance', 'National roaming voice'],
            'SMS Service': ['On-net SMS', 'Off-net SMS', 'International SMS'],
            'MMS service': ['On-net MMS', 'Off-net MMS', 'International MMS'],
            'GPRS charging': ['Data usage', 'Internet browsing', 'Email']
        };
        
        this.flowTypeMap = {
            'On-net voice': ['Outbound Call', 'Inbound Call', 'Call Forward'],
            'Off-net voice': ['Outbound Call', 'Inbound Call'],
            'IDD': ['Outbound Call']
        };
        
        this.init();
    }
    
    init() {
        console.log('CustomerDataSummarizer Debug: Setting up...');
        this.setupEventListeners();
        this.setupDateDefaults();
        this.updateStatus('Debug version ready - check console for logs');
    }
    
    setupEventListeners() {
        console.log('CustomerDataSummarizer Debug: Setting up event listeners...');
        
        // Quick date filters
        document.getElementById('todayBtn').addEventListener('click', () => {
            console.log('Today button clicked');
            this.setDateRange('today');
        });
        document.getElementById('weekBtn').addEventListener('click', () => {
            console.log('Week button clicked');
            this.setDateRange('week');
        });
        document.getElementById('monthBtn').addEventListener('click', () => {
            console.log('Month button clicked');
            this.setDateRange('month');
        });
        
        // Dropdown dependencies
        document.getElementById('category').addEventListener('change', (e) => {
            console.log('Category changed to:', e.target.value);
            this.updateServiceTypes(e.target.value);
        });
        document.getElementById('serviceType').addEventListener('change', (e) => {
            console.log('Service type changed to:', e.target.value);
            this.updateFlowTypes(e.target.value);
        });
        
        // Action buttons
        document.getElementById('searchBtn').addEventListener('click', () => {
            console.log('Search button clicked - starting analysis...');
            this.searchAndAnalyze();
        });
        document.getElementById('resetBtn').addEventListener('click', () => {
            console.log('Reset button clicked');
            this.resetFilters();
        });
    }
    
    setupDateDefaults() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        document.getElementById('startTime').value = this.formatDateTime(today);
        document.getElementById('endTime').value = this.formatDateTime(endOfDay);
        console.log('Date defaults set:', this.formatDateTime(today), 'to', this.formatDateTime(endOfDay));
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
                document.getElementById('todayBtn').classList.add('active');
                break;
                
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                startDate = startOfWeek;
                endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
                document.getElementById('weekBtn').classList.add('active');
                break;
                
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                document.getElementById('monthBtn').classList.add('active');
                break;
        }
        
        document.getElementById('startTime').value = this.formatDateTime(startDate);
        document.getElementById('endTime').value = this.formatDateTime(endDate);
        console.log('Date range set to:', this.formatDateTime(startDate), 'to', this.formatDateTime(endDate));
    }
    
    updateServiceTypes(category) {
        console.log('Updating service types for category:', category);
        const serviceSelect = document.getElementById('serviceType');
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
        document.getElementById('category').selectedIndex = 0;
        document.getElementById('serviceType').innerHTML = '<option value="">All Services</option>';
        document.getElementById('flowType').innerHTML = '<option value="">All Flow Types</option>';
        document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active'));
        this.setupDateDefaults();
        this.hideAllSections();
        this.updateStatus('Filters reset - ready to analyze');
    }
    
    async searchAndAnalyze() {
        console.log('=== STARTING SEARCH AND ANALYZE ===');
        this.showLoading();
        this.updateStatus('Applying filters and searching...');
        
        try {
            // Get current tab
            console.log('Getting current tab...');
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            console.log('Current tab:', tab.url);
            
            // Get filter values
            const filters = this.getFilterValues();
            console.log('Filter values:', filters);
            
            // Apply filters to the portal page
            console.log('Applying filters to portal page...');
            const filterResults = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: this.applyFiltersToPortal,
                args: [filters]
            });
            console.log('Filter results:', filterResults);
            
            // Wait a moment for the page to update
            console.log('Waiting for page to update...');
            await this.delay(3000); // Increased delay for debugging
            
            // Extract and analyze data
            console.log('Extracting table data...');
            const results = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: this.extractTableData
            });
            
            console.log('Raw results from extraction:', results);
            
            // Check if we got valid results
            if (!results || !results[0]) {
                throw new Error('No results returned from content script');
            }
            
            if (!results[0].result) {
                throw new Error('Results object is null or undefined');
            }
            
            const result = results[0].result;
            console.log('Parsed result:', result);
            
            // Check for error in the result
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Check if we have data
            if (!result.data) {
                throw new Error('No data property in result');
            }
            
            const data = result.data;
            console.log('Extracted data:', data);
            console.log('Number of records:', data.length);
            
            const summary = this.generateSummary(data);
            console.log('Generated summary:', summary);
            
            this.showSummary(summary);
            this.updateStatus(`Analysis complete - ${data.length} records processed`);
            console.log('=== SEARCH AND ANALYZE COMPLETE ===');
            
        } catch (error) {
            console.error('=== SEARCH AND ANALYZE ERROR ===');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            this.showError(`Error: ${error.message}`);
            this.updateStatus('Analysis failed - check console for details');
        }
    }
    
    getFilterValues() {
        const filters = {
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            category: document.getElementById('category').value,
            serviceType: document.getElementById('serviceType').value,
            flowType: document.getElementById('flowType').value
        };
        console.log('Getting filter values:', filters);
        return filters;
    }
    
    // This function runs in the content script context
    applyFiltersToPortal(filters) {
        console.log('=== APPLYING FILTERS TO PORTAL ===');
        console.log('Filters to apply:', filters);
        
        try {
            // Find and set datetime inputs
            const allDateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');
            console.log('Found', allDateTimeInputs.length, 'datetime inputs');
            
            if (allDateTimeInputs.length >= 2) {
                if (filters.startTime) {
                    allDateTimeInputs[0].value = filters.startTime;
                    allDateTimeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('Set start time to:', filters.startTime);
                }
                
                if (filters.endTime) {
                    allDateTimeInputs[1].value = filters.endTime;
                    allDateTimeInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('Set end time to:', filters.endTime);
                }
            } else {
                console.warn('Not enough datetime inputs found');
            }
            
            // Find and set dropdowns
            const allSelects = document.querySelectorAll('select');
            console.log('Found', allSelects.length, 'select elements');
            
            if (filters.category && allSelects.length > 0) {
                allSelects[0].value = filters.category;
                allSelects[0].dispatchEvent(new Event('change', { bubbles: true }));
                console.log('Set category to:', filters.category);
            }
            
            // Trigger search button
            setTimeout(() => {
                const searchButtons = document.querySelectorAll('button');
                console.log('Found', searchButtons.length, 'buttons');
                
                let searchButton = null;
                for (let btn of searchButtons) {
                    const text = btn.textContent.toLowerCase();
                    if (text.includes('search') || btn.classList.contains('btn-primary')) {
                        searchButton = btn;
                        break;
                    }
                }
                
                if (searchButton) {
                    console.log('Clicking search button:', searchButton.textContent);
                    searchButton.click();
                } else {
                    console.warn('Search button not found');
                }
            }, 1000);
            
            console.log('=== FILTERS APPLIED ===');
            return { success: true };
            
        } catch (error) {
            console.error('Error applying filters:', error);
            return { error: 'Failed to apply filters: ' + error.message };
        }
    }
    
    // This function runs in the content script context
    extractTableData() {
        console.log('=== EXTRACTING TABLE DATA ===');
        
        try {
            const tbody = document.querySelector('tbody');
            if (!tbody) {
                console.error('No tbody element found');
                return { error: 'Call Details Record table not found. Please navigate to the Subscriber page > Call Details Record tab.' };
            }
            
            const rows = tbody.querySelectorAll('tr');
            console.log('Found', rows.length, 'rows in tbody');
            
            if (rows.length === 0) {
                return { error: 'No data rows found in the table.' };
            }
            
            const data = [];
            
            rows.forEach((row, index) => {
                const cells = row.querySelectorAll('td, th');
                console.log(`Row ${index}: ${cells.length} cells`);
                
                if (cells.length < 15) {
                    console.log(`Skipping row ${index}: insufficient cells`);
                    return;
                }
                
                // Check for "no data" messages
                const firstCellText = cells[0]?.textContent?.trim().toLowerCase() || '';
                if (firstCellText.includes('no records') || firstCellText.includes('no data')) {
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
                        actualVolume: parseFloat(cells[9]?.textContent?.trim() || '0'),
                        unit: cells[10]?.textContent?.trim() || '',
                        currency: cells[11]?.textContent?.trim() || 'IQD',
                        relatedAccountChanges: parseFloat(cells[12]?.textContent?.trim() || '0'),
                        relatedAccountRemaining: parseFloat(cells[13]?.textContent?.trim() || '0'),
                        relatedOfferingName: cells[14]?.textContent?.trim() || '',
                        beforeBalance: parseFloat(cells[15]?.textContent?.trim() || '0'),
                        afterBalance: parseFloat(cells[16]?.textContent?.trim() || '0'),
                        vowfi: cells[17]?.textContent?.trim() || '',
                        businessRemark: cells[18]?.textContent?.trim() || ''
                    };
                    
                    if (record.chargedNumber || record.category) {
                        data.push(record);
                        console.log(`Added record ${data.length}:`, record.category, record.serviceType);
                    }
                    
                } catch (recordError) {
                    console.warn(`Error processing row ${index}:`, recordError);
                }
            });
            
            console.log('=== EXTRACTION COMPLETE ===');
            console.log('Total valid records found:', data.length);
            
            if (data.length === 0) {
                return { error: 'No valid customer records found in the table. The table might be empty or filters may have excluded all records.' };
            }
            
            return { data: data };
            
        } catch (error) {
            console.error('Error extracting table data:', error);
            return { error: `Failed to extract table data: ${error.message}` };
        }
    }
    
    generateSummary(data) {
        console.log('=== GENERATING SUMMARY ===');
        console.log('Input data length:', data.length);
        
        if (!data || data.length === 0) {
            return 'No customer data found for the selected criteria.';
        }
        
        const totalTransactions = data.length;
        const firstRecord = data[0];
        const lastRecord = data[data.length - 1];
        
        console.log('First record:', firstRecord);
        console.log('Last record:', lastRecord);
        
        const startBalance = firstRecord.beforeBalance;
        const endBalance = lastRecord.afterBalance;
        const balanceChange = endBalance - startBalance;
        
        const totalRelatedChanges = data.reduce((sum, record) => sum + record.relatedAccountChanges, 0);
        
        console.log('Balance calculation:', {
            startBalance,
            endBalance,
            balanceChange,
            totalRelatedChanges
        });
        
        // Group by category and service type
        const categoryBreakdown = {};
        
        data.forEach(record => {
            if (!categoryBreakdown[record.category]) {
                categoryBreakdown[record.category] = {};
            }
            
            if (!categoryBreakdown[record.category][record.serviceType]) {
                categoryBreakdown[record.category][record.serviceType] = {
                    totalVolume: 0,
                    totalChanges: 0,
                    unit: record.unit,
                    count: 0
                };
            }
            
            categoryBreakdown[record.category][record.serviceType].totalVolume += record.actualVolume;
            categoryBreakdown[record.category][record.serviceType].totalChanges += record.relatedAccountChanges;
            categoryBreakdown[record.category][record.serviceType].count += 1;
        });
        
        console.log('Category breakdown:', categoryBreakdown);
        
        let summary = `Here's a summary of the customer's activity:\n\n`;
        summary += `The customer had a total of **${totalTransactions} transactions**.\n`;
        summary += `Their overall balance started at **${startBalance.toFixed(2)} IQD** and ended at **${endBalance.toFixed(2)} IQD**, resulting in a change of **${balanceChange >= 0 ? '+' : ''}${balanceChange.toFixed(2)} IQD**.\n`;
        summary += `There were **${totalRelatedChanges.toFixed(2)} IQD** in related account changes, which typically reflects deductions for services or offers.\n\n`;
        
        summary += `Breaking down the activity by service type:\n`;
        
        Object.keys(categoryBreakdown).forEach(category => {
            if (category) {
                summary += `- For **${category}** services:\n`;
                Object.keys(categoryBreakdown[category]).forEach(serviceType => {
                    if (serviceType) {
                        const service = categoryBreakdown[category][serviceType];
                        summary += `  - **${serviceType}**: ${service.count} transactions, total volume of **${service.totalVolume.toFixed(2)} ${service.unit}** and related account changes of **${service.totalChanges.toFixed(2)} IQD**.\n`;
                    }
                });
            }
        });
        
        console.log('Generated summary:', summary);
        return summary;
    }
    
    showLoading() {
        this.hideAllSections();
        document.getElementById('loadingSection').style.display = 'block';
    }
    
    showSummary(summary) {
        this.hideAllSections();
        document.getElementById('summaryContent').textContent = summary;
        document.getElementById('summarySection').style.display = 'block';
    }
    
    showError(message) {
        this.hideAllSections();
        document.getElementById('errorSection').textContent = message;
        document.getElementById('errorSection').style.display = 'block';
    }
    
    hideAllSections() {
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
    }
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
        console.log('Status update:', message);
    }
    
    delay(ms) {
        console.log(`Waiting ${ms}ms...`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the extension when popup loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing CustomerDataSummarizer Debug...');
    new CustomerDataSummarizerDebug();
});