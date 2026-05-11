// 键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // 忽略输入框中的快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
    }

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;

    // Ctrl + / 显示快捷键帮助
    if (ctrl && key === '/') {
        e.preventDefault();
        showShortcutsHelp();
    }

    // Ctrl + S 保存（表单页面）
    if (ctrl && key === 's') {
        e.preventDefault();
        const saveBtn = document.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.click();
    }

    // ESC 关闭弹窗
    if (key === 'escape') {
        const modal = document.querySelector('.modal-overlay.active');
        if (modal) modal.classList.remove('active');
    }

    // 数字键导航
    if (!ctrl) {
        const navMap = {
            '1': 'dashboard.html',
            '2': 'students.html',
            '3': 'scores.html',
            '4': 'courses.html',
            '5': 'classes.html',
            '6': 'agent.html',
        };
        if (navMap[key]) {
            e.preventDefault();
            window.location.href = navMap[key];
        }
    }

    // Ctrl + R 刷新
    if (ctrl && key === 'r') {
        e.preventDefault();
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.click();
        else window.location.reload();
    }

    // / 聚焦搜索框
    if (key === '/' && !ctrl) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }

    // N 新增（列表页面）
    if (key === 'n' && !ctrl) {
        const addBtn = document.getElementById('addScoreBtn') || document.querySelector('a[href*="form"]');
        if (addBtn) addBtn.click();
    }
});

function showShortcutsHelp() {
    const shortcuts = [
        { key: 'Ctrl + /', desc: '显示快捷键帮助' },
        { key: 'Ctrl + S', desc: '保存表单' },
        { key: 'Ctrl + R', desc: '刷新页面' },
        { key: 'ESC', desc: '关闭弹窗' },
        { key: '/', desc: '聚焦搜索框' },
        { key: 'N', desc: '新增记录' },
        { key: '1', desc: '数据看板' },
        { key: '2', desc: '学生管理' },
        { key: '3', desc: '成绩管理' },
        { key: '4', desc: '课程管理' },
        { key: '5', desc: '班级管理' },
        { key: '6', desc: 'AI助手' },
    ];

    let html = '<div style="display: grid; grid-template-columns: auto 1fr; gap: 10px 20px;">';
    shortcuts.forEach(s => {
        html += `<code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${s.key}</code><span style="font-size: 14px;">${s.desc}</span>`;
    });
    html += '</div>';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3><i class="fas fa-keyboard"></i> 键盘快捷键</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">${html}</div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
