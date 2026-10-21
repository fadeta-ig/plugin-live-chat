/**
 * AI WooCommerce Sales Assistant - Frontend Script
 *
 * Renders a floating chat widget and communicates with the
 * WordPress REST API endpoint for AI-powered product recommendations.
 */

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('ai-woo-sa-widget-root');
    if (!root) return;

    // Validate that the PHP-injected config object exists
    if (typeof aiWooSaConfig === 'undefined') {
        console.warn('AI Sales Assistant: Configuration not found. Widget disabled.');
        return;
    }

    const botName = aiWooSaConfig.botName || 'AI Sales Assistant';

    // ==========================================
    // MODULE: State
    // ==========================================
    const State = (() => {
        const getSessionId = () => {
            let sid = localStorage.getItem('ai_woo_sa_session_id');
            if (!sid) {
                sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('ai_woo_sa_session_id', sid);
            }
            return sid;
        };

        let sessionId = getSessionId();
        let isWaiting = false;
        let chatHistory = [];

        const resetSession = () => {
            localStorage.removeItem('ai_woo_sa_session_id');
            localStorage.removeItem('ai_woo_sa_history');
            localStorage.removeItem('ai_woo_sa_last_seen_product_id');
            sessionId = getSessionId();
            chatHistory = [];
        };

        const saveHistory = () => {
            localStorage.setItem('ai_woo_sa_history', JSON.stringify({
                session_id: sessionId,
                items: chatHistory,
                timestamp: Date.now()
            }));
        };

        const loadHistory = () => {
            const saved = localStorage.getItem('ai_woo_sa_history');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.session_id === sessionId && (Date.now() - parsed.timestamp) < 86400000) {
                        return parsed.items || [];
                    }
                } catch (e) {}
            }
            return null;
        };

        return {
            getSessionId: () => sessionId,
            getIsWaiting: () => isWaiting,
            setIsWaiting: (val) => { isWaiting = val; },
            getHistory: () => chatHistory,
            setHistory: (history) => { chatHistory = history; },
            pushHistory: (item) => { chatHistory.push(item); },
            resetSession,
            saveHistory,
            loadHistory
        };
    })();

    // ==========================================
    // MODULE: UI Renderer
    // ==========================================
    const UI = (() => {
        // --- HTML Structure Injection ---
        root.innerHTML = `
            <div class="ai-woo-sa-chat-window" id="ai-woo-sa-window">
                <div class="ai-woo-sa-header">
                    <div>
                        <h3>${sanitizeHtml(botName)}</h3>
                        <div class="ai-woo-sa-header-status">
                            <span class="ai-woo-sa-status-dot"></span> Online
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="ai-woo-sa-reset" id="ai-woo-sa-reset-btn" aria-label="Reset chat" style="background:transparent; border:none; color:white; cursor:pointer; opacity:0.8; padding:4px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                        <button class="ai-woo-sa-close" id="ai-woo-sa-close-btn" aria-label="Close chat" style="background:transparent; border:none; color:white; cursor:pointer; padding:4px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="ai-woo-sa-body" id="ai-woo-sa-body"></div>
                <div class="ai-woo-sa-footer">
                    <input type="text" id="ai-woo-sa-input" class="ai-woo-sa-input" placeholder="Tanya sesuatu..." autocomplete="off">
                    <button class="ai-woo-sa-send" id="ai-woo-sa-send-btn" aria-label="Send message">
                        <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <button class="ai-woo-sa-fab" id="ai-woo-sa-fab" aria-label="Open chat">
                <span class="ai-woo-sa-badge" id="ai-woo-sa-badge" style="display:none;">0</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
            <div class="ai-woo-sa-confirm-overlay" id="ai-woo-sa-confirm-overlay">
                <div class="ai-woo-sa-confirm-box">
                    <h4 id="ai-woo-sa-confirm-title">Konfirmasi</h4>
                    <p id="ai-woo-sa-confirm-text"></p>
                    <div class="ai-woo-sa-confirm-actions">
                        <button class="ai-woo-sa-confirm-btn cancel" id="ai-woo-sa-confirm-cancel">Batal</button>
                        <button class="ai-woo-sa-confirm-btn confirm" id="ai-woo-sa-confirm-ok">OK</button>
                    </div>
                </div>
            </div>
        `;

        // --- DOM Elements ---
        const els = {
            chatBody: document.getElementById('ai-woo-sa-body'),
            inputField: document.getElementById('ai-woo-sa-input'),
            sendBtn: document.getElementById('ai-woo-sa-send-btn'),
            fabBtn: document.getElementById('ai-woo-sa-fab'),
            badge: document.getElementById('ai-woo-sa-badge'),
            closeBtn: document.getElementById('ai-woo-sa-close-btn'),
            resetBtn: document.getElementById('ai-woo-sa-reset-btn'),
            chatWindow: document.getElementById('ai-woo-sa-window'),
            confirmOverlay: document.getElementById('ai-woo-sa-confirm-overlay'),
            confirmText: document.getElementById('ai-woo-sa-confirm-text'),
            confirmCancel: document.getElementById('ai-woo-sa-confirm-cancel'),
            confirmOk: document.getElementById('ai-woo-sa-confirm-ok')
        };

        // --- Helper Methods ---
        function sanitizeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        const scrollToBottom = () => {
            els.chatBody.scrollTop = els.chatBody.scrollHeight;
        };

        let unreadCount = 0;

        const playNotificationSound = () => {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                if (ctx.state === 'suspended') return;
                
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } catch (e) {}
        };

        const incrementUnread = () => {
            if (!els.chatWindow.classList.contains('open')) {
                unreadCount++;
                els.badge.textContent = unreadCount;
                els.badge.style.display = 'flex';
                playNotificationSound();
            }
        };

        const toggleChat = () => {
            els.chatWindow.classList.toggle('open');
            els.fabBtn.classList.toggle('open');
            if (els.chatWindow.classList.contains('open')) {
                els.inputField.focus();
                unreadCount = 0;
                els.badge.style.display = 'none';
                els.badge.textContent = '0';
            }
        };

        const clearChat = () => {
            els.chatBody.innerHTML = '';
        };

        // --- Message Rendering ---
        const appendMessage = (text, sender, save = true, isRawHtml = false) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `ai-woo-sa-msg ${sender}`;

            let safeText = text;
            if (!isRawHtml) {
                safeText = sanitizeHtml(text);
                safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
                safeText = safeText.replace(/\n/g, '<br>');
            }

            const now = new Date();
            const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            
            let timeHtml = `<span class="ai-woo-sa-time">${timeString}</span>`;

            msgDiv.innerHTML = `<p>${safeText}</p>${timeHtml}`;
            els.chatBody.appendChild(msgDiv);
            scrollToBottom();
            
            if (sender === 'bot') {
                incrementUnread();
            }

            if (save) {
                State.pushHistory({ type: 'msg', text: text, sender: sender, isRawHtml: isRawHtml });
                State.saveHistory();
            }
            return msgDiv;
        };

        const appendProductCard = (product, save = true) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'ai-woo-sa-product-card';

            const productId = parseInt(product.product_id, 10);
            if (isNaN(productId)) return;

            const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
            const priceFormatted = price.toLocaleString('id-ID');
            const safeTitle = sanitizeHtml(product.title || 'Produk');
            const rawPermalink = product.permalink || '#';
            const permalink = (/^(https?:\/\/|\/)/i.test(rawPermalink)) ? rawPermalink : '#';
            const rawImageUrl = product.image_url || '';
            const imageUrl = (/^https?:\/\//i.test(rawImageUrl)) ? rawImageUrl : '';

            let imageHtml = '';
            if (imageUrl) {
                imageHtml = `<img src="${sanitizeHtml(imageUrl)}" alt="${safeTitle}" class="ai-woo-sa-product-image" loading="lazy" />`;
            }

            cardDiv.innerHTML = `
                ${imageHtml}
                <div class="ai-woo-sa-product-title">${safeTitle}</div>
                <div class="ai-woo-sa-product-price">Rp ${priceFormatted}</div>
                <div class="ai-woo-sa-product-actions">
                    <button class="ai-woo-sa-btn-cart" data-product-id="${productId}">🛒 Tambah ke Keranjang</button>
                    <a href="${sanitizeHtml(permalink)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-link">Lihat Produk</a>
                </div>
            `;

            const cartBtn = cardDiv.querySelector('.ai-woo-sa-btn-cart');
            cartBtn.addEventListener('click', () => {
                // Emit a custom event or call API directly
                document.dispatchEvent(new CustomEvent('aiWooSaAddToCart', { detail: { productId, cartBtn, safeTitle } }));
            });

            els.chatBody.appendChild(cardDiv);
            scrollToBottom();

            if (save) {
                State.pushHistory({ type: 'product', data: product });
                State.saveHistory();
            }
        };

        const appendWhatsAppCard = (waLink, save = true) => {
            if (!waLink || !/^https:\/\/wa\.me\//i.test(waLink)) return;
            const cardDiv = document.createElement('div');
            cardDiv.className = 'ai-woo-sa-product-card';
            cardDiv.innerHTML = `
                <a href="${sanitizeHtml(waLink)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-wa">Chat CS via WhatsApp</a>
            `;
            els.chatBody.appendChild(cardDiv);
            scrollToBottom();

            if (save) {
                State.pushHistory({ type: 'wa', link: waLink });
                State.saveHistory();
            }
        };

        const appendOrderCard = (order, save = true) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'ai-woo-sa-order-card';

            const getStatusClass = (raw) => {
                const map = {
                    'completed': 'status-completed',
                    'processing': 'status-processing',
                    'on-hold': 'status-on-hold',
                    'pending': 'status-pending',
                    'cancelled': 'status-cancelled',
                    'refunded': 'status-refunded',
                    'shipped': 'status-shipped',
                };
                return map[raw] || 'status-default';
            };

            const statusClass = getStatusClass(order.status_raw || '');
            const itemsHtml = (order.items || []).map(item => 
                `<div class="ai-woo-sa-order-item">• ${sanitizeHtml(item.name)} x${item.qty} <span class="ai-woo-sa-order-item-price">Rp ${sanitizeHtml(item.total)}</span></div>`
            ).join('');

            let trackingHtml = '';
            if (order.tracking && order.tracking.tracking_number && order.tracking.tracking_number !== '-') {
                trackingHtml = `
                    <div class="ai-woo-sa-order-tracking">
                        <span class="ai-woo-sa-tracking-label">📦 ${sanitizeHtml(order.tracking.courier)}</span>
                        <span class="ai-woo-sa-tracking-number">${sanitizeHtml(order.tracking.tracking_number)}</span>
                    </div>
                    <div class="ai-woo-sa-order-shipping-status">Status Kirim: ${sanitizeHtml(order.tracking.status_label)}</div>`;
            }

            cardDiv.innerHTML = `
                <div class="ai-woo-sa-order-header">
                    <span class="ai-woo-sa-order-number">Pesanan #${sanitizeHtml(String(order.order_number || order.order_id))}</span>
                    <span class="ai-woo-sa-order-status ${statusClass}">${sanitizeHtml(order.status)}</span>
                </div>
                <div class="ai-woo-sa-order-date">${sanitizeHtml(order.date || '-')}</div>
                <div class="ai-woo-sa-order-items">${itemsHtml}</div>
                ${trackingHtml}
                <div class="ai-woo-sa-order-total">Total: <strong>Rp ${sanitizeHtml(order.total)}</strong></div>
            `;

            els.chatBody.appendChild(cardDiv);
            scrollToBottom();

            if (save) {
                State.pushHistory({ type: 'order', data: order });
                State.saveHistory();
            }
        };

        const appendTrackingRedirectCard = (url, save = true) => {
            const safeUrl = (/^(https?:\/\/|\/)/i.test(url)) ? url : '#';
            const cardDiv = document.createElement('div');
            cardDiv.className = 'ai-woo-sa-product-card';
            cardDiv.innerHTML = `
                <a href="${sanitizeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-tracking">📦 Lacak Pesanan di Website</a>
            `;
            els.chatBody.appendChild(cardDiv);
            scrollToBottom();

            if (save) {
                State.pushHistory({ type: 'tracking_redirect', url: url });
                State.saveHistory();
            }
        };

        let typingInterval = null;

        const showTyping = () => {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'ai-woo-sa-msg bot ai-woo-sa-typing-container';
            typingDiv.id = 'ai-woo-sa-typing';
            
            const getInnerHtml = (text) => `
                <div class="ai-woo-sa-typing-text" style="font-size: 12px; margin-bottom: 4px; color: var(--text-light);">${text}</div>
                <div class="ai-woo-sa-typing">
                    <div class="ai-woo-sa-dot"></div>
                    <div class="ai-woo-sa-dot"></div>
                    <div class="ai-woo-sa-dot"></div>
                </div>
            `;
            
            typingDiv.innerHTML = getInnerHtml('Sedang mengetik...');
            els.chatBody.appendChild(typingDiv);
            scrollToBottom();

            let elapsed = 0;
            typingInterval = setInterval(() => {
                elapsed += 1;
                const el = document.getElementById('ai-woo-sa-typing');
                if (el) {
                    if (elapsed === 3) {
                        el.innerHTML = getInnerHtml('🔍 Mencari produk terkait...');
                    } else if (elapsed === 6) {
                        el.innerHTML = getInnerHtml('💬 Merangkai jawaban...');
                    }
                    scrollToBottom();
                }
            }, 1000);
        };

        const removeTyping = () => {
            if (typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
            }
            const typingDiv = document.getElementById('ai-woo-sa-typing');
            if (typingDiv) {
                typingDiv.remove();
            }
        };

        const initGreeting = (save = true) => {
            let greetingHtml = `<p>Halo! Saya ${sanitizeHtml(botName)}. Ada yang bisa saya bantu hari ini?</p>`;
            if (aiWooSaConfig.currentProduct && aiWooSaConfig.currentProduct.name) {
                const pName = sanitizeHtml(aiWooSaConfig.currentProduct.name);
                const pDesc = sanitizeHtml(aiWooSaConfig.currentProduct.desc || '');
                greetingHtml = `<p>Halo Kak! Sedang melihat <strong>${pName}</strong> ya?</p>`;
                if (pDesc) {
                    greetingHtml += `<p style="font-size: 13px; color: var(--text-light); margin-top: 4px;"><em>${pDesc}</em></p>`;
                }
                greetingHtml += `<p style="margin-top: 4px;">Ada yang ingin ditanyakan tentang produk ini?</p>`;
            }
            
            appendMessage(greetingHtml, 'bot', save, true);

            if (aiWooSaConfig.currentProduct && aiWooSaConfig.currentProduct.id) {
                localStorage.setItem('ai_woo_sa_last_seen_product_id', aiWooSaConfig.currentProduct.id);
            }
        };

        const injectContextNudge = () => {
            if (!aiWooSaConfig.currentProduct || !aiWooSaConfig.currentProduct.id) return;
            
            const currentProductId = String(aiWooSaConfig.currentProduct.id);
            const lastSeenId = localStorage.getItem('ai_woo_sa_last_seen_product_id');
            
            if (currentProductId !== lastSeenId) {
                const pName = sanitizeHtml(aiWooSaConfig.currentProduct.name);
                const nudgeHtml = `<p>Btw Kak, saya lihat Kakak sedang melihat <strong>${pName}</strong> ya? Ada yang bisa saya bantu jelaskan tentang produk ini?</p>`;
                
                const msgDiv = appendMessage(nudgeHtml, 'bot', true, true);
                msgDiv.classList.add('ai-woo-sa-nudge');
                
                localStorage.setItem('ai_woo_sa_last_seen_product_id', currentProductId);
            }
        };

        const showConfirm = (message, onConfirm) => {
            els.confirmText.textContent = message;
            els.confirmOverlay.classList.add('show');
            
            const handleOk = () => {
                cleanup();
                if (onConfirm) onConfirm();
            };
            
            const handleCancel = () => {
                cleanup();
            };
            
            const cleanup = () => {
                els.confirmOverlay.classList.remove('show');
                els.confirmOk.removeEventListener('click', handleOk);
                els.confirmCancel.removeEventListener('click', handleCancel);
            };
            
            els.confirmOk.addEventListener('click', handleOk);
            els.confirmCancel.addEventListener('click', handleCancel);
        };

        return {
            els,
            sanitizeHtml,
            scrollToBottom,
            toggleChat,
            clearChat,
            appendMessage,
            appendProductCard,
            appendWhatsAppCard,
            appendOrderCard,
            appendTrackingRedirectCard,
            showTyping,
            removeTyping,
            initGreeting,
            injectContextNudge,
            incrementUnread,
            showConfirm
        };
    })();

    // ==========================================
    // MODULE: API Client
    // ==========================================
    const API = (() => {
        const addToCartAjax = async (productId, btnElement, productTitle) => {
            btnElement.disabled = true;
            btnElement.innerHTML = '<span class="ai-woo-sa-btn-spinner"></span> Menambahkan...';

            try {
                const formData = new FormData();
                formData.append('product_id', productId);
                formData.append('quantity', 1);

                const response = await fetch(aiWooSaConfig.wcAjaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (data.error) {
                    btnElement.textContent = '⚠ Gagal, coba lagi';
                    btnElement.disabled = false;
                    setTimeout(() => { btnElement.textContent = '🛒 Tambah ke Keranjang'; }, 3000);
                    return;
                }

                btnElement.textContent = '✓ Ditambahkan!';
                btnElement.classList.add('added');

                // Store in virtual cart for LLM context
                if (!aiWooSaConfig.cartItems) aiWooSaConfig.cartItems = [];
                aiWooSaConfig.cartItems.push({ id: productId, name: productTitle, qty: 1 });

                // Trigger WooCommerce cart fragment refresh
                if (typeof jQuery !== 'undefined') {
                    jQuery(document.body).trigger('added_to_cart', [data.fragments, data.cart_hash, jQuery(btnElement)]);
                    jQuery(document.body).trigger('wc_fragment_refresh');
                }

                // Auto-trigger AI Cross-sell (Hidden prompt)
                const hiddenPrompt = `[CROSS-SELL] "${productTitle}" ditambahkan ke keranjang. Ucapkan terima kasih 1 kalimat, lalu rekomendasikan 1 produk pelengkap.`;
                sendMessage(hiddenPrompt, true);

            } catch (error) {
                btnElement.textContent = '⚠ Gagal, coba lagi';
                btnElement.disabled = false;
                setTimeout(() => { btnElement.textContent = '🛒 Tambah ke Keranjang'; }, 3000);
                console.error('AI Woo SA Add-to-Cart Error:', error);
            }
        };

        const sendMessage = async (directQuery = null, hiddenUserMessage = false) => {
            let currentContextProducts = [];
            const text = directQuery || UI.els.inputField.value.trim();
            if (!text || State.getIsWaiting()) return;

            // Emit event so QuickReply module can remove its buttons
            document.dispatchEvent(new Event('aiWooSaRemoveQuickReplies'));

            if (!directQuery && !hiddenUserMessage) {
                UI.appendMessage(text, 'user');
            }

            UI.els.inputField.value = '';
            State.setIsWaiting(true);
            UI.els.sendBtn.disabled = true;

            if (!hiddenUserMessage) {
                UI.showTyping();
            } else {
                setTimeout(UI.showTyping, 300);
            }

            try {
                let response = await fetch(aiWooSaConfig.restUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': aiWooSaConfig.nonce
                    },
                    body: JSON.stringify({
                        message: text,
                        session_id: State.getSessionId(),
                        current_product: aiWooSaConfig.currentProduct,
                        cart_items: aiWooSaConfig.cartItems || [],
                        stream: true
                    })
                });

                if (!response.ok) {
                    console.warn('AI Chat: SSE stream failed (' + response.status + '), retrying without streaming...');
                    response = await fetch(aiWooSaConfig.restUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': aiWooSaConfig.nonce
                        },
                        body: JSON.stringify({
                            message: text,
                            session_id: State.getSessionId(),
                            current_product: aiWooSaConfig.currentProduct,
                            cart_items: aiWooSaConfig.cartItems || [],
                            stream: false
                        })
                    });
                }

                UI.removeTyping();

                if (!response.ok) {
                    console.error('AI Chat Error:', response.status, response.statusText);
                    UI.appendMessage("Maaf, terjadi kesalahan pada server. Silakan coba lagi nanti.", 'bot', false);
                    document.dispatchEvent(new Event('aiWooSaShowInitialQuickReplies'));
                    return;
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/event-stream')) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder('utf-8');
                    
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'ai-woo-sa-msg bot';
                    const pTag = document.createElement('p');
                    msgDiv.appendChild(pTag);
                    UI.els.chatBody.appendChild(msgDiv);
                    UI.scrollToBottom();
                    UI.incrementUnread();

                    let accumulatedText = "";
                    let buffer = "";
                    let streamAborted = false;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done || streamAborted) break;
                        
                        buffer += decoder.decode(value, { stream: true });
                        let lines = buffer.split('\n');
                        buffer = lines.pop();
                        
                        for (let line of lines) {
                            if (streamAborted) break;
                            line = line.trim();
                            if (line.startsWith('data: ')) {
                                const dataStr = line.substring(6);
                                if (dataStr === '[DONE]' || dataStr === '{}') continue;
                                
                                try {
                                    const parsed = JSON.parse(dataStr);
                                    if (parsed.products || parsed.orders) {
                                        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
                                            currentContextProducts = parsed.products;
                                        }
                                        if (parsed.orders) {
                                            if (parsed.orders.guest_redirect) {
                                                UI.appendTrackingRedirectCard(parsed.orders.guest_redirect);
                                            } else if (Array.isArray(parsed.orders.orders) && parsed.orders.orders.length > 0) {
                                                parsed.orders.orders.forEach(o => UI.appendOrderCard(o));
                                            }
                                        }
                                        if (parsed.fallback && parsed.wa_link) {
                                            UI.appendWhatsAppCard(parsed.wa_link);
                                        }
                                    } 
                                    else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                        accumulatedText += parsed.choices[0].delta.content;

                                        if (accumulatedText.includes('TRIGGER_HUMAN_FALLBACK') || accumulatedText.includes('TRIGGER_HUMAN')) {
                                            accumulatedText = "Mohon tunggu, saya sedang menyambungkan Anda dengan Customer Service kami...";
                                            pTag.innerHTML = accumulatedText;
                                            UI.scrollToBottom();
                                            
                                            let waUrl = 'https://wa.me/';
                                            if (aiWooSaConfig.waNumber) {
                                                let cleaned = aiWooSaConfig.waNumber.replace(/\D/g, '');
                                                if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
                                                waUrl += cleaned;
                                            }
                                            UI.appendWhatsAppCard(waUrl, true);
                                            
                                            streamAborted = true;
                                            break;
                                        }

                                        let safeText = UI.sanitizeHtml(accumulatedText);
                                        safeText = safeText.replace(/\[RECOMMEND:.*?(\]|$)/g, '');
                                        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                        safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
                                        safeText = safeText.replace(/\n/g, '<br>');
                                        pTag.innerHTML = safeText;
                                        UI.scrollToBottom();
                                    }
                                } catch (e) {}
                            }
                        }
                    }
                    
                    if (accumulatedText) {
                        const recommendMatch = accumulatedText.match(/\[RECOMMEND:\s*([\d,\s]+)\]/);
                        let finalHtml = accumulatedText;
                        if (recommendMatch) {
                            finalHtml = finalHtml.replace(recommendMatch[0], '');
                            const recommendedIds = recommendMatch[1].split(',').map(id => parseInt(id.trim(), 10));
                            
                            currentContextProducts.forEach(p => {
                                if (p.product_id && recommendedIds.includes(parseInt(p.product_id, 10))) {
                                    UI.appendProductCard(p);
                                }
                            });
                        }

                        let safeText = UI.sanitizeHtml(finalHtml);
                        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
                        safeText = safeText.replace(/\n/g, '<br>');
                        pTag.innerHTML = safeText;

                        State.pushHistory({ type: 'msg', text: finalHtml, sender: 'bot', isRawHtml: false });
                        State.saveHistory();
                    }
                    document.dispatchEvent(new Event('aiWooSaShowInitialQuickReplies'));

                } else {
                    const data = await response.json();
                    if (data.text) {
                        const recommendMatch = data.text.match(/\[RECOMMEND:\s*([\d,\s]+)\]/);
                        let finalHtml = data.text;
                        let recommendedIds = [];
                        
                        if (recommendMatch) {
                            finalHtml = finalHtml.replace(recommendMatch[0], '');
                            recommendedIds = recommendMatch[1].split(',').map(id => parseInt(id.trim(), 10));
                        }
                        
                        UI.appendMessage(finalHtml, 'bot');
                        
                        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                            if (recommendedIds.length > 0) {
                                data.products.forEach(p => {
                                    if (p.product_id && recommendedIds.includes(parseInt(p.product_id, 10))) {
                                        UI.appendProductCard(p);
                                    }
                                });
                            }
                        }
                    } else if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                        // Fallback if no text but there are products
                        data.products.forEach(p => UI.appendProductCard(p));
                    }
                    if (data.orders) {
                        if (data.orders.guest_redirect) {
                            UI.appendTrackingRedirectCard(data.orders.guest_redirect);
                        } else if (Array.isArray(data.orders.orders) && data.orders.orders.length > 0) {
                            data.orders.orders.forEach(o => UI.appendOrderCard(o));
                        }
                    }
                    if (data.fallback && data.wa_link) {
                        UI.appendWhatsAppCard(data.wa_link);
                    }
                    if (data.blocked) {
                        if (UI.els.inputField) {
                            UI.els.inputField.disabled = true;
                            UI.els.inputField.placeholder = "Akses obrolan dinonaktifkan.";
                        }
                        if (UI.els.sendBtn) UI.els.sendBtn.disabled = true;
                    } else {
                        document.dispatchEvent(new Event('aiWooSaShowInitialQuickReplies'));
                    }
                }

            } catch (error) {
                UI.removeTyping();
                UI.appendMessage("Gagal terhubung ke asisten. Periksa koneksi internet Anda.", 'bot');
                console.error('AI Sales Assistant Error:', error);
                document.dispatchEvent(new Event('aiWooSaShowInitialQuickReplies'));
            } finally {
                // Rate Limiting Cooldown (1.5 seconds)
                setTimeout(() => {
                    State.setIsWaiting(false);
                    UI.els.sendBtn.disabled = false;
                    UI.els.inputField.focus();
                }, 1500);
            }
        };

        return {
            sendMessage,
            addToCartAjax
        };
    })();

    // ==========================================
    // MODULE: Quick Reply
    // ==========================================
    const QuickReply = (() => {
        const QUICK_REPLIES = {
            initial: [
                { label: '💄 Produk Kami', type: 'submenu', target: 'categories' },
                { label: '💬 Konsultasi Kulit', type: 'query', query: 'Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?' },
                { label: '📦 Lacak Pesanan', type: 'query', query: 'Saya ingin cek status pesanan saya' },
                { label: '📋 Pesanan Saya', type: 'query', query: 'Tampilkan pesanan terakhir saya' },
                { label: '🕐 Info Toko', type: 'static', response: '📍 Pesanan dikirim dari fasilitas kami di **Sleman, Yogyakarta**.\n\n🛡️ Semua produk Shinyoung diformulasikan **Bebas SLS, Bebas Paraben, dan Non-Alkohol** — aman untuk kulit sensitif.\n\n✅ Pembelian melalui Official Store dijamin **100% asli** dengan layanan *after-sales support*.\n\n🏷️ Slogan kami: *Happy Shine on You* — #ShineBrighterFeelYounger' },
                { label: '📞 Hubungi CS', type: 'action', action: 'whatsapp' }
            ],
            categories: [
                { label: '✨ Perawatan Wajah', type: 'submenu', target: 'face' },
                { label: '💇 Perawatan Rambut', type: 'submenu', target: 'hair' },
                { label: '🧴 Perawatan Tubuh', type: 'submenu', target: 'body' },
                { label: '⬅ Kembali', type: 'submenu', target: 'initial' }
            ],
            face: [
                { label: '🌿 Binahong Cream 15g', type: 'query', query: 'Berikan info lengkap produk Shinyoung Binahong Cream 15g beserta manfaat dan cara pakainya' },
                { label: '💧 Binahong Oil 10ml', type: 'query', query: 'Berikan info lengkap produk Shinyoung Binahong Oil 10ml beserta manfaat dan cara pakainya' },
                { label: '⬅ Kembali', type: 'submenu', target: 'categories' }
            ],
            hair: [
                { label: '🧴 Shampoo Anti Ketombe', type: 'query', query: 'Berikan info lengkap produk Shinyoung Shampoo Anti Ketombe 138ml' },
                { label: '💎 Hair Serum Anti Ketombe', type: 'query', query: 'Berikan info lengkap produk Shinyoung Hair Serum Anti Ketombe 100ml' },
                { label: '🍃 Hair Tonic Anti Ketombe', type: 'query', query: 'Berikan info lengkap produk Shinyoung Hair Tonic Anti Ketombe' },
                { label: '☕ Hair Powder Coffee', type: 'query', query: 'Berikan info lengkap produk Shinyoung Hair Powder Coffee 10gr' },
                { label: '⬅ Kembali', type: 'submenu', target: 'categories' }
            ],
            body: [
                { label: '🧼 Yunso Soap (Anti Jerawat)', type: 'query', query: 'Berikan info lengkap produk Shinyoung Yunso Soap beserta manfaat dan cara pakainya' },
                { label: '✨ Peeling Spray', type: 'query', query: 'Berikan info lengkap produk Shinyoung Peeling Spray beserta manfaat dan cara pakainya' },
                { label: '💧 Hwasa Body Serum 100ml', type: 'query', query: 'Berikan info lengkap produk Shinyoung Hwasa Brightening Body Serum 100ml beserta kandungan Hexylresorcinol dan manfaatnya' },
                { label: '🌸 Deodorant Spray 60ml', type: 'query', query: 'Berikan info lengkap produk Shinyoung Deodorant Spray 60ml' },
                { label: '⬅ Kembali', type: 'submenu', target: 'categories' }
            ]
        };

        const removeQuickReplies = () => {
            const existing = document.getElementById('ai-woo-sa-qr');
            if (existing) existing.remove();
        };

        const renderQuickReplies = (menuId) => {
            removeQuickReplies();
            const buttons = QUICK_REPLIES[menuId];
            if (!buttons) return;

            const container = document.createElement('div');
            container.className = 'ai-woo-sa-quick-replies';
            container.id = 'ai-woo-sa-qr';

            buttons.forEach(btn => {
                const el = document.createElement('button');
                el.className = 'ai-woo-sa-qr-btn';
                el.textContent = btn.label;
                el.addEventListener('click', () => handleQuickReply(btn));
                container.appendChild(el);
            });

            UI.els.chatBody.appendChild(container);
            UI.scrollToBottom();
        };

        const handleQuickReply = (btn) => {
            removeQuickReplies();

            switch (btn.type) {
                case 'static':
                    UI.appendMessage(btn.label, 'user');
                    UI.appendMessage(btn.response, 'bot');
                    renderQuickReplies('initial');
                    break;
                case 'query':
                    UI.appendMessage(btn.label, 'user');
                    API.sendMessage(btn.query);
                    break;
                case 'submenu':
                    renderQuickReplies(btn.target);
                    break;
                case 'action':
                    if (btn.action === 'whatsapp') {
                        const waNum = aiWooSaConfig.waNumber || '';
                        if (waNum) {
                            let cleaned = waNum.replace(/\D/g, '');
                            if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
                            window.open('https://wa.me/' + cleaned + '?text=' + encodeURIComponent('Halo CS Shinyoung, saya butuh bantuan.'), '_blank');
                        } else {
                            UI.appendMessage('Mohon maaf, nomor Customer Service belum dikonfigurasi. Silakan coba lagi nanti.', 'bot');
                            renderQuickReplies('initial');
                        }
                    }
                    break;
            }
        };

        return {
            removeQuickReplies,
            renderQuickReplies
        };
    })();

    // ==========================================
    // MODULE: Event Handlers
    // ==========================================
    const Events = (() => {
        const initListeners = () => {
            UI.els.fabBtn.addEventListener('click', UI.toggleChat);
            UI.els.closeBtn.addEventListener('click', UI.toggleChat);
            
            if (UI.els.resetBtn) {
                UI.els.resetBtn.addEventListener('click', () => {
                    UI.showConfirm("Mulai obrolan baru dan hapus riwayat?", () => {
                        State.resetSession();
                        UI.clearChat();
                        UI.initGreeting(true);
                        QuickReply.renderQuickReplies('initial');
                    });
                });
            }

            UI.els.sendBtn.addEventListener('click', () => API.sendMessage());
            UI.els.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    API.sendMessage();
                }
            });

            // Custom event bindings for loose coupling
            document.addEventListener('aiWooSaRemoveQuickReplies', () => QuickReply.removeQuickReplies());
            document.addEventListener('aiWooSaShowInitialQuickReplies', () => QuickReply.renderQuickReplies('initial'));
            document.addEventListener('aiWooSaAddToCart', (e) => {
                API.addToCartAjax(e.detail.productId, e.detail.cartBtn, e.detail.safeTitle);
            });
        };

        return {
            initListeners
        };
    })();

    // ==========================================
    // Initialization
    // ==========================================
    Events.initListeners();

    const loaded = State.loadHistory();
    if (loaded && loaded.length > 0) {
        State.setHistory(loaded);
        loaded.forEach(item => {
            if (item.type === 'msg') {
                UI.appendMessage(item.text, item.sender, false, !!item.isRawHtml);
            } else if (item.type === 'product') {
                UI.appendProductCard(item.data, false);
            } else if (item.type === 'wa') {
                UI.appendWhatsAppCard(item.link, false);
            } else if (item.type === 'order') {
                UI.appendOrderCard(item.data, false);
            } else if (item.type === 'tracking_redirect') {
                UI.appendTrackingRedirectCard(item.url, false);
            }
        });
        setTimeout(UI.injectContextNudge, 500);
    } else {
        UI.initGreeting(true);
    }
    
    QuickReply.renderQuickReplies('initial');
});
