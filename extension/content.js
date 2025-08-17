// Content script to handle keyboard shortcuts on web pages
(function() {
    'use strict';
    
    // Listen for keyboard shortcut on the page
    document.addEventListener('keydown', function(event) {
        // Check for Ctrl+Shift+S (or Cmd+Shift+S on Mac)
        const isShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S';
        
        if (isShortcut) {
            event.preventDefault();
            event.stopPropagation();
            
            console.log('[Content Script] Keyboard shortcut detected, triggering save...');
            
            // Send message to background script to save data
            chrome.runtime.sendMessage({
                action: 'saveData',
                source: 'content-script-shortcut'
            }).then(response => {
                if (response && response.success) {
                    console.log('[Content Script] Data save triggered successfully');
                    
                    // Show a brief visual feedback to the user
                    showSaveNotification('Data queued for sending to Google Sheets!');
                } else {
                    console.error('[Content Script] Failed to save data:', response?.error);
                    showSaveNotification('Failed to queue data. Check extension settings.', true);
                }
            }).catch(error => {
                console.error('[Content Script] Error sending save message:', error);
                showSaveNotification('Extension error. Please try again.', true);
            });
        }
    });
    
    function showSaveNotification(message, isError = false) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            background: ${isError ? '#ff4444' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(100%);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    console.log('[Content Script] Facebook page data saver loaded. Use Ctrl+Shift+S (⌘+Shift+S on Mac) to save page data.');
})();