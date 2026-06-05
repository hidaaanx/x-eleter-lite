// ==UserScript==
// @name         X-eleter Lite
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Automates deleting tweets/replies AND removing retweets from your profile via UI clicks. Includes smart scanning, rate-limit delays, auto-scrolling, and a live log.
// @author       You
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Create a floating control panel
    const panel = document.createElement('div');
    panel.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 99999; background: rgba(15, 20, 25, 0.95); color: white; padding: 15px; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; max-width: 320px; border: 1px solid #333; box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: move; user-select: none;';

    panel.innerHTML = `
        <!-- Header with Clear Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <h3 style="margin:0; font-size: 16px;">🗑️ X-eleter Lite</h3>
            <button id="clear-log-btn" style="background: #2f3336; color: #ccc; border: 1px solid #444; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">Clear</button>
        </div>

        <p style="margin-top: 0; margin-bottom: 15px; font-size: 11px; color: #8b98a5;">
            made by: <a href="https://x.com/hidaaan_" target="_blank" rel="noopener noreferrer" style="color: #1d9bf0; text-decoration: none;">@hidaaan_</a>
        </p>

        <!-- How To Use Button -->
        <button id="how-to-use-btn" style="background: #1d9bf0; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-bottom: 10px; font-weight: bold; width: 100%;">❓ How To Use</button>

        <p style="font-size:12px; color:#f4212e; margin-bottom: 15px; line-height: 1.4;">
            ⚠️ <strong>WARNING:</strong> Actions are permanent. Simulates clicks. X may rate-limit you. Only run on YOUR profile.
        </p>

        <button id="start-delete" style="background: #f4212e; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: bold;">Start Deleting</button>
        <button id="unretweet-btn" style="background: #00ba7c; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; margin-bottom: 10px; font-weight: bold;">Remove Retweets</button>
        <button id="stop-delete" style="background: #536471; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; display: none; font-weight: bold;">Stop</button>

        <p id="status" style="margin-top: 12px; font-size: 12px; color: #8b98a5; border-top: 1px solid #333; padding-top: 10px; margin-bottom: 10px;">Ready</p>

        <!-- Live Console Window with Version Footer -->
        <div style="position: relative; margin-bottom: 10px;">
            <div id="log-window" style="background: #000; color: #0f0; font-family: monospace; font-size: 11px; padding: 8px; border-radius: 6px 6px 0 0; height: 160px; overflow-y: auto; border: 1px solid #333; border-bottom: none; line-height: 1.4; cursor: text; user-select: text;">
                <div>[System] Ready. Waiting to start...</div>
            </div>
            <div style="background: #000; border: 1px solid #333; border-top: 1px solid #222; border-radius: 0 0 6px 6px; text-align: right; padding: 2px 8px; font-size: 9px; color: #555; font-family: monospace;">
                v2.1
            </div>
        </div>

        <!-- Ko-fi Support Link -->
        <p style="text-align: center; margin-top: 12px; margin-bottom: 0; font-size: 11px; border-top: 1px solid #333; padding-top: 10px;">
            ☕ <a href="https://ko-fi.com/hidaaan_" target="_blank" rel="noopener noreferrer" style="color: #ff5e5b; text-decoration: none; font-weight: bold;">Support this project on Ko-fi</a>
        </p>
    `;
    document.body.appendChild(panel);

    // 2. Create "How To Use" Modal
    const modal = document.createElement('div');
    modal.id = 'how-to-modal';
    modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); z-index: 100000; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;';
    modal.innerHTML = `
        <div style="background: #15202b; color: white; padding: 25px; border-radius: 12px; max-width: 400px; width: 90%; border: 1px solid #38444d; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            <h3 style="margin-top:0; margin-bottom: 15px; font-size: 18px;">📖 How to use X-eleter Lite</h3>
            <ul style="font-size: 13px; line-height: 1.8; color: #e7e9ea; padding-left: 20px; margin-bottom: 20px;">
                <li>Navigate to your X/Twitter profile page.</li>
                <li>To delete your original tweets and replies, click the <strong>"Replies"</strong> tab on your profile, then click <strong>"Start Deleting"</strong>.</li>
                <li>To remove your retweets and quotes, click the <strong>"Posts"</strong> tab, then click <strong>"Remove Retweets"</strong>.</li>
                <li>The tool will automatically scroll and wait to avoid X's rate limits.</li>
                <li>You can drag this panel anywhere on your screen to keep it out of the way!</li>
            </ul>
            <button id="close-modal-btn" style="background: #1d9bf0; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; font-size: 14px;">Got it!</button>
        </div>
    `;
    document.body.appendChild(modal);

    // --- UI EVENT LISTENERS ---

    // Clear Log Button
    document.getElementById('clear-log-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drag
        const logWindow = document.getElementById('log-window');
        logWindow.innerHTML = '<div>[System] Logs cleared.</div>';
    });

    // How To Use Modal
    document.getElementById('how-to-use-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drag
        modal.style.display = 'flex';
    });

    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal if clicking outside the box
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- DRAGGABLE LOGIC ---
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    panel.addEventListener('mousedown', (e) => {
        // Prevent dragging when interacting with buttons, links, or the log window
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('#log-window')) {
            return;
        }
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            panel.style.left = `${e.clientX - dragOffsetX}px`;
            panel.style.top = `${e.clientY - dragOffsetY}px`;
            panel.style.right = 'auto';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    // -----------------------

    let isRunning = false;
    let currentMode = null; // 'delete' or 'unretweet'
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const startBtn = document.getElementById('start-delete');
    const unretweetBtn = document.getElementById('unretweet-btn');
    const stopBtn = document.getElementById('stop-delete');
    const statusEl = document.getElementById('status');
    const logWindow = document.getElementById('log-window');

    const logAction = (message) => {
        const time = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${time}] ${message}`;
        logWindow.appendChild(logEntry);
        logWindow.scrollTop = logWindow.scrollHeight;
        console.log(`[X-eleter] ${message}`);
    };

    const closeMenu = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    };

    const resetUI = () => {
        isRunning = false;
        currentMode = null;
        startBtn.style.display = 'block';
        unretweetBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        statusEl.textContent = '✅ Finished or stopped.';
        logAction('🏁 Process finished.');
    };

    // ==========================================
    // MODE 1: START DELETING (Original Logic - UNTOUCHED)
    // ==========================================
    startBtn.addEventListener('click', async () => {
        if (!confirm("⚠️ FINAL WARNING: This will start DELETING tweets/replies on your current page via UI clicks. This CANNOT be undone. Are you absolutely sure?")) {
            return;
        }

        const pathParts = window.location.pathname.split('/').filter(p => p);
        const currentUsername = pathParts[0] ? pathParts[0].toLowerCase() : '';

        if (!currentUsername) {
            logAction('❌ Could not detect username from URL. Please run this on your profile page.');
            return;
        }

        isRunning = true;
        currentMode = 'delete';
        startBtn.style.display = 'none';
        unretweetBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        statusEl.textContent = 'Initializing...';
        logAction(`🚀 Target profile detected: @${currentUsername}`);
        logAction('Starting smart scan and deletion process...');

        let deletedCount = 0;
        const processedTweetIds = new Set();
        let consecutiveScrollsWithoutUserTweets = 0;

        while (isRunning && currentMode === 'delete') {
            let articles = document.querySelectorAll('article');
            let targetArticle = null;
            let targetTweetId = null;

            for (const article of articles) {
                const statusLink = article.querySelector('a[href*="/status/"]');
                if (!statusLink) continue;

                const urlParts = statusLink.href.split('/status/');
                if (urlParts.length < 2) continue;
                const tweetId = urlParts[1].split('?')[0];

                if (processedTweetIds.has(tweetId)) continue;

                let isMyTweet = false;
                const authorLinks = article.querySelectorAll('div[data-testid="User-Name"] a');
                for (const link of authorLinks) {
                    if (link.getAttribute('href')?.toLowerCase().startsWith(`/${currentUsername}`)) {
                        isMyTweet = true;
                        break;
                    }
                }

                if (!isMyTweet) {
                    const ariaLabel = article.getAttribute('aria-label') || '';
                    const match = ariaLabel.match(/@([a-zA-Z0-9_]+)/);
                    if (match && match[1].toLowerCase() === currentUsername) {
                        isMyTweet = true;
                    }
                }

                if (isMyTweet) {
                    targetArticle = article;
                    targetTweetId = tweetId;
                    break;
                } else {
                    processedTweetIds.add(tweetId);
                }
            }

            if (!targetArticle) {
                consecutiveScrollsWithoutUserTweets++;

                // UPDATED LIMIT: Increased from 5 to 50 attempts
                if (consecutiveScrollsWithoutUserTweets > 50) {
                    logAction('Scrolled 50 times with no new user tweets. No more tweets to load. Reached the end of your profile.');
                    break;
                }

                logAction(`No unprocessed user tweets on screen. Scrolling down (Attempt ${consecutiveScrollsWithoutUserTweets}/50)...`);
                statusEl.textContent = 'Scrolling for more tweets...';
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                await sleep(3000);
                continue;
            }

            consecutiveScrollsWithoutUserTweets = 0;
            statusEl.textContent = `Processing tweet... (Total deleted: ${deletedCount})`;
            let tweetDeleted = false;

            try {
                const moreBtn = targetArticle.querySelector('div[data-testid="caret"]') || targetArticle.querySelector('button[aria-label="More"]');
                if (!moreBtn) {
                    logAction('No "More" button found, skipping.');
                } else {
                    moreBtn.click();
                    logAction('Clicked "More" (caret).');
                    await sleep(800);

                    const menuItems = document.querySelectorAll('div[role="menuitem"]');
                    let deleteBtn = null;
                    for (const item of menuItems) {
                        if (item.textContent.trim() === 'Delete') {
                            deleteBtn = item;
                            break;
                        }
                    }

                    if (!deleteBtn) {
                        logAction('"Delete" option not found (might be a retweet/pinned). Skipping.');
                        closeMenu();
                        await sleep(500);
                    } else {
                        deleteBtn.click();
                        logAction('Clicked "Delete" in menu.');
                        await sleep(800);

                        const confirmBtn = document.querySelector('div[data-testid="confirmationSheetConfirm"]') ||
                                           Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Delete');

                        if (confirmBtn) {
                            confirmBtn.click();
                            deletedCount++;
                            tweetDeleted = true;
                            logAction(`✅ Successfully deleted tweet. (Total: ${deletedCount})`);
                            statusEl.textContent = `✅ Deleted ${deletedCount} tweets.`;

                            if (deletedCount > 0 && deletedCount % 20 === 0) {
                                logAction(`📜 Reached ${deletedCount} deletions. Auto-scrolling and waiting 10s for new tweets...`);
                                statusEl.textContent = `📜 Scrolling & waiting 10s...`;
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                await sleep(10000);
                                logAction('Wait complete. Resuming deletion...');
                            } else {
                                await sleep(2500);
                            }
                        } else {
                            logAction('❌ Confirmation button not found.');
                            closeMenu();
                            await sleep(500);
                        }
                    }
                }
            } catch (err) {
                logAction(`❌ Error processing tweet: ${err.message}`);
                closeMenu();
                await sleep(1500);
            }

            processedTweetIds.add(targetTweetId);
        }
        resetUI();
    });

    // ==========================================
    // MODE 2: REMOVE RETWEETS (Unchanged Core Logic)
    // ==========================================
    unretweetBtn.addEventListener('click', async () => {
        if (!confirm("⚠️ WARNING: This will start REMOVING your retweets and quotes on the current page via UI clicks. Are you sure?")) {
            return;
        }

        isRunning = true;
        currentMode = 'unretweet';
        startBtn.style.display = 'none';
        unretweetBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        statusEl.textContent = 'Initializing...';
        logAction('🚀 Starting smart scan and retweet removal process...');
        logAction('💡 Tip: Ensure you are on your "Posts" tab for best results.');

        let unretweetedCount = 0;
        const processedTweetIds = new Set();
        let consecutiveScrollsWithoutUserRetweets = 0;

        while (isRunning && currentMode === 'unretweet') {
            let articles = document.querySelectorAll('article');
            let targetArticle = null;
            let targetTweetId = null;

            for (const article of articles) {
                const statusLink = article.querySelector('a[href*="/status/"]');
                if (!statusLink) continue;

                const urlParts = statusLink.href.split('/status/');
                if (urlParts.length < 2) continue;
                const tweetId = urlParts[1].split('?')[0];

                if (processedTweetIds.has(tweetId)) continue;

                // Check for "You reposted" or "You quoted" text
                const articleText = article.textContent || '';
                const isMyRepost = articleText.includes('You reposted') || articleText.includes('You quoted');

                if (isMyRepost) {
                    targetArticle = article;
                    targetTweetId = tweetId;
                    break;
                } else {
                    processedTweetIds.add(tweetId);
                }
            }

            if (!targetArticle) {
                consecutiveScrollsWithoutUserRetweets++;

                // UPDATED LIMIT: Increased from 5 to 50 attempts
                if (consecutiveScrollsWithoutUserRetweets > 50) {
                    logAction('Scrolled 50 times with no new user retweets. No more tweets to load. Reached the end of your profile.');
                    break;
                }

                logAction(`No unprocessed user retweets on screen. Scrolling down (Attempt ${consecutiveScrollsWithoutUserRetweets}/50)...`);
                statusEl.textContent = 'Scrolling for more retweets...';
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                await sleep(3000);
                continue;
            }

            consecutiveScrollsWithoutUserRetweets = 0;
            statusEl.textContent = `Processing retweet... (Total removed: ${unretweetedCount})`;
            let actionSuccessful = false;

            try {
                // ROBUST SELECTOR: Try data-testid first, then fallback to aria-label matching "Repost"
                let rtBtn = targetArticle.querySelector('[data-testid="retweet"], [data-testid="unretweet"]');

                if (!rtBtn) {
                    const buttons = targetArticle.querySelectorAll('[role="button"], div[data-testid]');
                    for (const btn of buttons) {
                        const label = btn.getAttribute('aria-label') || '';
                        if (label.match(/repost/i)) {
                            rtBtn = btn;
                            break;
                        }
                    }
                }

                if (rtBtn) {
                    rtBtn.click();
                    logAction('Clicked Retweet icon to open undo menu.');
                    await sleep(800);

                    const menuItems = document.querySelectorAll('div[role="menuitem"]');
                    let undoBtn = null;
                    for (const item of menuItems) {
                        const text = item.textContent.trim().toLowerCase();
                        if (text === 'undo repost' || text === 'undo quote') {
                            undoBtn = item;
                            break;
                        }
                    }

                    if (undoBtn) {
                        undoBtn.click();
                        logAction(`Clicked "${undoBtn.textContent.trim()}"`);
                        unretweetedCount++;
                        actionSuccessful = true;
                        logAction(`✅ Successfully removed retweet/quote. (Total: ${unretweetedCount})`);
                        statusEl.textContent = `✅ Removed ${unretweetedCount} retweets.`;

                        if (unretweetedCount > 0 && unretweetedCount % 20 === 0) {
                            logAction(`📜 Reached ${unretweetedCount} removals. Auto-scrolling and waiting 10s...`);
                            statusEl.textContent = `📜 Scrolling & waiting 10s...`;
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            await sleep(10000);
                            logAction('Wait complete. Resuming removal...');
                        } else {
                            await sleep(2500);
                        }
                    } else {
                        logAction('Undo option not found in menu. Skipping.');
                        closeMenu();
                        await sleep(500);
                    }
                } else {
                    const debugLabels = Array.from(targetArticle.querySelectorAll('[role="button"]'))
                        .map(b => b.getAttribute('aria-label'))
                        .filter(Boolean)
                        .join(' | ');
                    logAction(`⚠️ Retweet button not found. Debug labels found: ${debugLabels}`);
                    closeMenu();
                    await sleep(500);
                }
            } catch (err) {
                logAction(`❌ Error processing retweet: ${err.message}`);
                closeMenu();
                await sleep(1500);
            }

            processedTweetIds.add(targetTweetId);
        }
        resetUI();
    });

    // ==========================================
    // GLOBAL STOP BUTTON
    // ==========================================
    stopBtn.addEventListener('click', () => {
        isRunning = false;
        currentMode = null;
        logAction('🛑 Stop requested. Will halt after current action...');
    });

})();