const API_BASE = 'http://localhost:3001/api';

function getToken() {
    return localStorage.getItem('token') || '';
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

function redirectToLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

async function apiRequest(method, endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
        },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (response.status === 401) {
        redirectToLogin();
        throw new Error('登录已过期');
    }

    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.message || '请求失败');
    }

    return result;
}

function apiGet(endpoint) { return apiRequest('GET', endpoint); }
function apiPost(endpoint, data) { return apiRequest('POST', endpoint, data); }
function apiPut(endpoint, data) { return apiRequest('PUT', endpoint, data); }
function apiDelete(endpoint) { return apiRequest('DELETE', endpoint); }

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderSidebar() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const user = getUser();
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const navItems = [
        { page: 'dashboard.html', icon: 'fa-tachometer-alt', label: '数据看板' },
        { page: 'students.html', icon: 'fa-users', label: '学生管理' },
        { page: 'scores.html', icon: 'fa-chart-bar', label: '成绩管理' },
        { page: 'courses.html', icon: 'fa-book', label: '课程管理' },
        { page: 'classes.html', icon: 'fa-users-cog', label: '班级管理' },
        { page: 'agent.html', icon: 'fa-robot', label: 'AI助手' },
        { page: 'logs.html', icon: 'fa-history', label: '操作日志' },
        { page: 'reports.html', icon: 'fa-file-alt', label: '统计报表' },
        { page: 'analytics.html', icon: 'fa-chart-pie', label: '数据分析' },
        { page: 'import.html', icon: 'fa-file-import', label: '数据导入' },
        { page: 'backup.html', icon: 'fa-database', label: '数据备份' },
        { page: 'system.html', icon: 'fa-server', label: '系统监控' },
        { page: 'settings.html', icon: 'fa-cog', label: '系统设置' },
    ];

    const navHtml = navItems.map(item => {
        const active = currentPage === item.page ? 'active' : '';
        return `<a href="${item.page}" class="nav-item ${active}"><i class="fas ${item.icon}"></i><span>${item.label}</span></a>`;
    }).join('');

    const navEl = sidebar.querySelector('.sidebar-nav');
    if (navEl) navEl.innerHTML = navHtml;

    const userNameEl = sidebar.querySelector('.user-details .name');
    const userRoleEl = sidebar.querySelector('.user-details .role');
    if (userNameEl && user) userNameEl.textContent = user.displayName || user.username;
    if (userRoleEl && user) userRoleEl.textContent = user.role === 'admin' ? '管理员' : '教师';
}

function checkAuth() {
    const token = getToken();
    const currentPage = window.location.pathname.split('/').pop() || '';
    
    if (!token && currentPage !== 'index.html' && currentPage !== '') {
        redirectToLogin();
        return false;
    }
    
    if (token) {
        renderSidebar();
    }
    
    return true;
}

function logout() {
    redirectToLogin();
}

function initPage() {
    if (!checkAuth()) return;
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Init notifications
    initNotifications();
}

function initNotifications() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    // Add notification button
    const notifBtn = document.createElement('button');
    notifBtn.className = 'header-btn notification-btn';
    notifBtn.id = 'notificationBtn';
    notifBtn.innerHTML = '<i class="fas fa-bell"></i>';
    notifBtn.setAttribute('data-tooltip', '通知');
    
    const notifBadge = document.createElement('span');
    notifBadge.className = 'notification-badge';
    notifBadge.id = 'notificationBadge';
    notifBadge.style.display = 'none';
    notifBtn.appendChild(notifBadge);

    headerRight.insertBefore(notifBtn, headerRight.firstChild);

    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.id = 'notificationDropdown';
    dropdown.innerHTML = `
        <div class="notification-header">
            <h4>通知</h4>
            <button class="btn btn-sm btn-secondary" id="markAllRead">全部已读</button>
        </div>
        <div class="notification-list" id="notificationList"></div>
        <div class="notification-footer">
            <a href="#" class="btn btn-sm btn-secondary" id="viewAllNotifs">查看全部</a>
        </div>
    `;
    document.body.appendChild(dropdown);

    // Toggle dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
            loadNotifications();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== notifBtn) {
            dropdown.classList.remove('active');
        }
    });

    // Mark all read
    document.getElementById('markAllRead').addEventListener('click', async () => {
        try {
            await apiPut('/notifications/read-all');
            loadNotifications();
        } catch (err) {
            console.error('Mark all read error:', err);
        }
    });

    // Initial load
    loadNotificationCount();
}

async function loadNotifications() {
    try {
        const res = await apiGet('/notifications');
        const list = document.getElementById('notificationList');
        
        if (res.success && res.data.length > 0) {
            list.innerHTML = res.data.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                    <p><strong>${n.title}</strong></p>
                    <p>${n.message}</p>
                    <span>${formatDateTime(n.createdAt)}</span>
                </div>
            `).join('');

            list.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const id = item.dataset.id;
                    await apiPut(`/notifications/${id}/read`);
                    item.classList.remove('unread');
                    loadNotificationCount();
                });
            });
        } else {
            list.innerHTML = '<div class="empty-state" style="padding: 30px;"><i class="fas fa-bell-slash"></i><p>暂无通知</p></div>';
        }
    } catch (err) {
        console.error('Load notifications error:', err);
    }
}

async function loadNotificationCount() {
    try {
        const res = await apiGet('/notifications?unread=true');
        const badge = document.getElementById('notificationBadge');
        if (res.success && res.unreadCount > 0) {
            badge.textContent = res.unreadCount > 99 ? '99+' : res.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error('Load notification count error:', err);
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

/* Legacy compatibility for pages that use old API */
async function api(path, opts = {}) {
    const method = opts.method || 'GET';
    return apiRequest(method, path, opts.body);
}

function setToken(t) { localStorage.setItem('token', t); }
function removeToken() { localStorage.removeItem('token'); }

/* Login form handler */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const result = await apiPost('/auth/login', { username, password });
            if (result.success) {
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                window.location.href = 'dashboard.html';
            } else {
                showToast(result.message || '登录失败', 'error');
            }
        } catch (err) {
            showToast('登录失败: ' + err.message, 'error');
        }
    });
}

/* Auto-load additional scripts */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/* Global Search */
function initGlobalSearch() {
    const overlay = document.createElement('div');
    overlay.className = 'global-search-overlay';
    overlay.id = 'globalSearchOverlay';
    overlay.innerHTML = `
        <div class="global-search-box">
            <input type="text" class="global-search-input" id="globalSearchInput" placeholder="全局搜索... (ESC关闭)">
            <div class="global-search-results" id="globalSearchResults"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            overlay.classList.add('active');
            document.getElementById('globalSearchInput').focus();
        }
        if (e.key === 'Escape') {
            overlay.classList.remove('active');
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    const input = document.getElementById('globalSearchInput');
    let searchTimeout;
    
    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = input.value.trim();
        
        if (query.length < 2) {
            document.getElementById('globalSearchResults').innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(() => performGlobalSearch(query), 300);
    });
}

async function performGlobalSearch(query) {
    try {
        const res = await apiGet(`/search/global?q=${encodeURIComponent(query)}`);
        const resultsDiv = document.getElementById('globalSearchResults');
        
        if (res.success && res.data.total > 0) {
            let html = '';
            
            if (res.data.students.length > 0) {
                html += '<div style="padding: 8px 20px; background: #f8fafc; font-size: 12px; color: var(--gray); font-weight: 500;">学生</div>';
                res.data.students.forEach(s => {
                    html += `
                        <div class="global-search-result-item" onclick="location.href='student-form.html?id=${s.id}'">
                            <div class="type">学生</div>
                            <div class="title">${s.name} (${s.student_no})</div>
                            <div class="subtitle">${s.major || ''} ${s.class_name || ''}</div>
                        </div>
                    `;
                });
            }
            
            if (res.data.scores.length > 0) {
                html += '<div style="padding: 8px 20px; background: #f8fafc; font-size: 12px; color: var(--gray); font-weight: 500;">成绩</div>';
                res.data.scores.forEach(s => {
                    html += `
                        <div class="global-search-result-item" onclick="location.href='scores.html'">
                            <div class="type">成绩</div>
                            <div class="title">${s.name} - ${s.course_name}</div>
                            <div class="subtitle">学号: ${s.student_no}</div>
                        </div>
                    `;
                });
            }
            
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<div class="empty-state" style="padding: 30px;"><i class="fas fa-search"></i><p>未找到结果</p></div>';
        }
    } catch (err) {
        console.error('Global search error:', err);
    }
}

/* WebSocket Real-time Notifications */
let ws = null;
let wsReconnectAttempts = 0;
const MAX_WS_RECONNECT = 5;

function initWebSocket() {
    const token = getToken();
    if (!token || window.location.pathname.includes('index.html')) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            wsReconnectAttempts = 0;
            console.log('WebSocket connected');
            ws.send(JSON.stringify({ type: 'subscribe', channels: ['all', 'students', 'scores'] }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleWebSocketMessage(msg);
            } catch (e) {
                console.error('WS message parse error:', e);
            }
        };

        ws.onclose = () => {
            if (wsReconnectAttempts < MAX_WS_RECONNECT) {
                wsReconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 30000);
                setTimeout(initWebSocket, delay);
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
    } catch (e) {
        console.error('WebSocket init failed:', e);
    }
}

function handleWebSocketMessage(msg) {
    switch (msg.type) {
        case 'notification':
            if (msg.notificationType === 'error') {
                showToast(msg.message || msg.title, 'error');
            } else if (msg.notificationType === 'warning') {
                showToast(msg.message || msg.title, 'warning');
            } else {
                showToast(msg.message || msg.title, 'success');
            }
            loadNotificationCount();
            break;
        case 'connected':
            console.log('WS:', msg.message);
            break;
    }
}

function closeWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
    }
}

/* Service Worker Registration */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                console.log('Service Worker registered:', reg.scope);

                // Check for updates
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showToast('系统已更新，刷新页面以使用最新版本', 'warning');
                        }
                    });
                });
            })
            .catch(err => console.error('Service Worker registration failed:', err));
    }
}

/* Offline mutation queue */
const mutationQueue = [];

function queueMutation(method, url, body) {
    mutationQueue.push({ method, url, body, timestamp: Date.now() });
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-mutations'));
    }
    localStorage.setItem('pendingMutations', JSON.stringify(mutationQueue));
}

async function initApp() {
    try {
        await loadScript('js/utils.js');
        await loadScript('js/components.js');
        await loadScript('js/shortcuts.js');
    } catch (err) {
        console.log('Optional scripts not loaded:', err.message);
    }
    initPage();
    initGlobalSearch();
    initWebSocket();
    registerServiceWorker();
}

window.addEventListener('beforeunload', closeWebSocket);
document.addEventListener('DOMContentLoaded', initApp);
