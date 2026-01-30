// ==UserScript==
// @name         AliExpress Max Combo Hider
// @namespace    https://github.com/danielrosehill
// @version      1.6
// @description  Hide product listings marked as "Max Combo" on AliExpress search results
// @author       Daniel Rosehill
// @match        https://www.aliexpress.com/*
// @match        https://aliexpress.com/*
// @match        https://*.aliexpress.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let totalHidden = 0;

    function hideMaxComboItems() {
        const allSpans = document.querySelectorAll('span');
        let hiddenCount = 0;

        allSpans.forEach(span => {
            if (span.textContent.trim() === 'Max Combo') {
                // Walk up the DOM to find the outermost card wrapper
                // Structure: hm_b6 search-item-card-wrapper-gallery > k7_kw > card-out-wrapper > search-card-item
                let element = span;
                let targetElement = null;

                for (let i = 0; i < 20; i++) {
                    element = element.parentElement;
                    if (!element) break;

                    const classes = element.className || '';

                    // Target the outermost grid item wrapper (search-item-card-wrapper-gallery)
                    if (classes.includes('search-item-card-wrapper-gallery') ||
                        classes.includes('search-item-card-wrapper')) {
                        targetElement = element;
                        break;
                    }

                    // Fallback: if we hit card-out-wrapper, go up one more to k7_kw, then one more to hm_b6
                    if (classes.includes('card-out-wrapper')) {
                        // k7_kw is parent, hm_b6 is grandparent
                        if (element.parentElement && element.parentElement.parentElement) {
                            targetElement = element.parentElement.parentElement;
                        } else if (element.parentElement) {
                            targetElement = element.parentElement;
                        } else {
                            targetElement = element;
                        }
                        break;
                    }
                }

                if (targetElement && !targetElement.dataset.comboHidden) {
                    targetElement.dataset.comboHidden = 'true';
                    targetElement.remove();
                    hiddenCount++;
                    totalHidden++;
                    console.log(`[Combo Hider] Removed card with class: ${targetElement.className.substring(0, 60)}`);
                }
            }
        });

        return hiddenCount;
    }

    // Run periodically to catch dynamically loaded content
    function startPolling() {
        // Initial runs with short delays
        setTimeout(hideMaxComboItems, 500);
        setTimeout(hideMaxComboItems, 1000);
        setTimeout(hideMaxComboItems, 2000);
        setTimeout(hideMaxComboItems, 3000);

        // Then poll every 2 seconds for infinite scroll
        setInterval(hideMaxComboItems, 2000);
    }

    // Also use MutationObserver as backup
    function startObserver() {
        const observer = new MutationObserver((mutations) => {
            let hasNewNodes = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    hasNewNodes = true;
                    break;
                }
            }
            if (hasNewNodes) {
                // Debounce
                clearTimeout(window._comboHiderTimeout);
                window._comboHiderTimeout = setTimeout(hideMaxComboItems, 100);
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startPolling();
            startObserver();
        });
    } else {
        startPolling();
        startObserver();
    }

    console.log('[AliExpress Combo Hider] v1.6 loaded');
})();
