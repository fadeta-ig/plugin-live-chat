(function() {
    function testApi(btnId, statusId, action, getPayload) {
        var btn = document.getElementById(btnId);
        var statusBox = document.getElementById(statusId);
        if (!btn) return;
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            btn.classList.add('loading');
            btn.disabled = true;
            statusBox.textContent = '';
            statusBox.className = 'ai-woo-sa-status-box';
            statusBox.style.display = 'none';

            var payload = getPayload();
            var formData = new FormData();
            formData.append('action', action);
            formData.append('_wpnonce', aiWooSaAdminParams.nonce);
            for (var key in payload) {
                formData.append(key, payload[key]);
            }

            fetch(aiWooSaAdminParams.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                btn.classList.remove('loading');
                btn.disabled = false;
                statusBox.style.display = 'inline-block';
                if (data.success) {
                    statusBox.textContent = '✅ ' + data.data.message;
                    statusBox.className = 'ai-woo-sa-status-box success';
                } else {
                    statusBox.textContent = '❌ ' + data.data.message;
                    statusBox.className = 'ai-woo-sa-status-box error';
                }
            })
            .catch(function(err) {
                btn.classList.remove('loading');
                btn.disabled = false;
                statusBox.style.display = 'inline-block';
                statusBox.textContent = '❌ Network error: ' + err.message;
                statusBox.className = 'ai-woo-sa-status-box error';
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        testApi('ai-woo-sa-test-gemini', 'ai-woo-sa-gemini-status', 'ai_woo_sa_test_gemini', function() {
            var el = document.getElementById('gemini_api_key');
            return { api_key: el ? el.value : '' };
        });
        testApi('ai-woo-sa-test-groq', 'ai-woo-sa-groq-status', 'ai_woo_sa_test_groq', function() {
            var el = document.getElementById('groq_api_key');
            return { api_key: el ? el.value : '' };
        });
        testApi('ai-woo-sa-test-pinecone', 'ai-woo-sa-pinecone-status', 'ai_woo_sa_test_pinecone', function() {
            var keyEl = document.getElementById('pinecone_api_key');
            var hostEl = document.getElementById('pinecone_host');
            return {
                api_key: keyEl ? keyEl.value : '',
                host_url: hostEl ? hostEl.value : ''
            };
        });

        // Tab Switching Logic (Settings, Sync, Security)
        var tabItems = [
            { btn: document.getElementById('nav-tab-settings'), content: document.getElementById('tab-settings') },
            { btn: document.getElementById('nav-tab-sync'), content: document.getElementById('tab-sync') },
            { btn: document.getElementById('nav-tab-security'), content: document.getElementById('tab-security') }
        ];

        tabItems.forEach(function(targetTab) {
            if (!targetTab.btn || !targetTab.content) return;
            targetTab.btn.addEventListener('click', function(e) {
                e.preventDefault();
                tabItems.forEach(function(t) {
                    if (t.btn && t.content) {
                        t.btn.classList.remove('nav-tab-active');
                        t.content.style.display = 'none';
                    }
                });
                targetTab.btn.classList.add('nav-tab-active');
                targetTab.content.style.display = 'block';
            });
        });

        // Bulk Sync Logic
        var btnBulkSync = document.getElementById('btn-bulk-sync');
        var statusBulkSync = document.getElementById('bulk-sync-status');
        if (btnBulkSync) {
            btnBulkSync.addEventListener('click', function(e) {
                e.preventDefault();
                btnBulkSync.disabled = true;
                btnBulkSync.classList.add('loading');
                statusBulkSync.style.display = 'none';
                statusBulkSync.className = 'ai-woo-sa-status-box';

                var formData = new FormData();
                formData.append('action', 'ai_woo_sa_bulk_sync');
                formData.append('_wpnonce', aiWooSaAdminParams.nonce);

                fetch(aiWooSaAdminParams.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        statusBulkSync.style.display = 'block';
                        statusBulkSync.classList.add('success');
                        statusBulkSync.innerHTML = '✅ ' + res.data.message + '<div id="ai-woo-sa-progress-container" style="margin-top:10px; background:#e0e0e0; border-radius:4px; height:20px; width:100%; overflow:hidden;"><div id="ai-woo-sa-progress-bar" style="background:#8C9B81; height:100%; width:0%; transition:width 0.5s ease;"></div></div><div id="ai-woo-sa-progress-text" style="font-size:12px; margin-top:4px; text-align:right;">Mulai sinkronisasi...</div>';
                        
                        // Start polling
                        pollSyncStatus();
                    } else {
                        btnBulkSync.disabled = false;
                        btnBulkSync.classList.remove('loading');
                        statusBulkSync.style.display = 'inline-block';
                        statusBulkSync.classList.add('error');
                        statusBulkSync.innerHTML = '❌ ' + (res.data.message || 'Gagal antre sinkronisasi');
                    }
                })
                .catch(err => {
                    btnBulkSync.disabled = false;
                    btnBulkSync.classList.remove('loading');
                    statusBulkSync.style.display = 'inline-block';
                    statusBulkSync.classList.add('error');
                    statusBulkSync.innerHTML = '❌ Network error';
                });
            });

            function pollSyncStatus() {
                var formData = new FormData();
                formData.append('action', 'ai_woo_sa_sync_status');
                formData.append('_wpnonce', aiWooSaAdminParams.nonce);

                fetch(aiWooSaAdminParams.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        var data = res.data;
                        var progressBar = document.getElementById('ai-woo-sa-progress-bar');
                        var progressText = document.getElementById('ai-woo-sa-progress-text');
                        
                        if (progressBar) progressBar.style.width = data.percentage + '%';
                        if (progressText) {
                            var processed = data.total - data.remaining;
                            progressText.innerHTML = processed + ' / ' + data.total + ' Produk Tersinkronisasi (' + data.percentage + '%)';
                        }

                        if (data.remaining > 0) {
                            setTimeout(pollSyncStatus, 3000);
                        } else {
                            btnBulkSync.disabled = false;
                            btnBulkSync.classList.remove('loading');
                            if (progressText) progressText.innerHTML = '✅ Sinkronisasi Selesai (' + data.total + ' Produk)';
                        }
                    } else {
                        setTimeout(pollSyncStatus, 5000); // Retry on error
                    }
                })
                .catch(err => {
                    setTimeout(pollSyncStatus, 5000); // Retry on error
                });
            }
        }

        // ==========================================
        // Security: Unblock IP Handler (Event Delegation)
        // ==========================================
        var blockedTbody = document.getElementById('blocked-ips-tbody');
        var blockedCountEl = document.getElementById('blocked-count');

        if (blockedTbody) {
            blockedTbody.addEventListener('click', function(e) {
                var btn = e.target.closest('.btn-unblock-ip');
                if (!btn) return;

                var ip = btn.getAttribute('data-ip');
                if (!ip || !confirm('Buka pemblokiran untuk IP ' + ip + '?')) return;

                btn.disabled = true;
                btn.textContent = '...';

                var formData = new FormData();
                formData.append('action', 'ai_woo_sa_unblock_ip');
                formData.append('ip', ip);
                formData.append('_wpnonce', aiWooSaAdminParams.nonce);

                fetch(aiWooSaAdminParams.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.success) {
                        var safeIpId = ip.replace(/[.:]/g, '-');
                        var row = document.getElementById('row-ip-' + safeIpId);
                        if (row) row.remove();

                        if (blockedCountEl) {
                            var currentCount = parseInt(blockedCountEl.textContent, 10) || 0;
                            blockedCountEl.textContent = Math.max(0, currentCount - 1);
                        }

                        if (blockedTbody.children.length === 0) {
                            blockedTbody.innerHTML = '<tr id="no-blocked-row"><td colspan="5" style="text-align:center;padding:40px;color:#888;">Belum ada IP yang diblokir. Sistem aman dari intrusi.</td></tr>';
                        }
                    } else {
                        alert(data.data.message || 'Gagal unblock IP.');
                        btn.disabled = false;
                        btn.textContent = 'Unblock';
                    }
                })
                .catch(function(err) {
                    alert('Error: ' + err.message);
                    btn.disabled = false;
                    btn.textContent = 'Unblock';
                });
            });
        }

        // ==========================================
        // Security: Manual Block IP Handler
        // ==========================================
        var btnManualBlock = document.getElementById('btn-manual-block-ip');
        var inputIp = document.getElementById('manual_block_ip');
        var inputReason = document.getElementById('manual_block_reason');
        var selectHours = document.getElementById('manual_block_hours');
        var statusManual = document.getElementById('manual-block-status');

        if (btnManualBlock && inputIp) {
            btnManualBlock.addEventListener('click', function(e) {
                e.preventDefault();
                var ip = inputIp.value.trim();
                var reason = inputReason ? inputReason.value.trim() : '';
                var hours = selectHours ? selectHours.value : '24';

                if (!ip) {
                    alert('Silakan masukkan alamat IP yang valid.');
                    return;
                }

                btnManualBlock.disabled = true;
                statusManual.style.display = 'none';

                var formData = new FormData();
                formData.append('action', 'ai_woo_sa_block_ip');
                formData.append('ip', ip);
                formData.append('reason', reason);
                formData.append('hours', hours);
                formData.append('_wpnonce', aiWooSaAdminParams.nonce);

                fetch(aiWooSaAdminParams.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    btnManualBlock.disabled = false;
                    statusManual.style.display = 'inline-block';
                    if (data.success) {
                        statusManual.textContent = '✅ ' + data.data.message;
                        statusManual.className = 'ai-woo-sa-status-box success';
                        inputIp.value = '';
                        if (inputReason) inputReason.value = '';
                        setTimeout(function() { window.location.reload(); }, 1000);
                    } else {
                        statusManual.textContent = '❌ ' + data.data.message;
                        statusManual.className = 'ai-woo-sa-status-box error';
                    }
                })
                .catch(function(err) {
                    btnManualBlock.disabled = false;
                    statusManual.style.display = 'inline-block';
                    statusManual.textContent = '❌ Error: ' + err.message;
                    statusManual.className = 'ai-woo-sa-status-box error';
                });
            });
        }
    });
})();

