// 通用组件库

const Components = {
    // 确认对话框
    confirm(title, message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle"></i> ${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirmCancel">取消</button>
                    <button class="btn btn-primary" id="confirmOk">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#confirmCancel').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });

        modal.querySelector('#confirmOk').addEventListener('click', () => {
            modal.remove();
            if (onConfirm) onConfirm();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        });
    },

    // 提示框
    alert(title, message, type = 'info') {
        const icons = { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle' };
        const colors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas ${icons[type]}" style="color: ${colors[type]}"></i> ${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    // 加载遮罩
    loading(show, message = '加载中...') {
        let overlay = document.getElementById('loadingOverlay');

        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.style.cssText = `
                    position: fixed; inset: 0; background: rgba(255,255,255,0.8);
                    z-index: 1000; display: flex; align-items: center; justify-content: center;
                    flex-direction: column; gap: 15px;
                `;
                overlay.innerHTML = `
                    <div class="loading-spinner" style="width: 40px; height: 40px;"></div>
                    <p style="color: var(--gray); font-size: 14px;">${message}</p>
                `;
                document.body.appendChild(overlay);
            }
        } else {
            if (overlay) overlay.remove();
        }
    },

    // 数据表格
    createTable(containerId, data, columns, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h4>暂无数据</h4></div>`;
            return;
        }

        let html = '<div class="table-container"><table><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col.title}</th>`;
        });
        if (options.actions) html += '<th>操作</th>';
        html += '</tr></thead><tbody>';

        data.forEach((row, index) => {
            html += '<tr>';
            columns.forEach(col => {
                const value = col.render ? col.render(row[col.key], row, index) : (row[col.key] || '-');
                html += `<td>${value}</td>`;
            });
            if (options.actions) {
                html += '<td>' + options.actions.map(a => 
                    `<button class="btn btn-sm ${a.class || 'btn-primary'}" onclick="${a.onclick}(${row.id || index})">${a.label}</button>`
                ).join('') + '</td>';
            }
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    },

    // 分页组件
    createPagination(containerId, pagination, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container || !pagination || pagination.totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = `<button ${pagination.page === 1 ? 'disabled' : ''} onclick="${onPageChange}(${pagination.page - 1})"><i class="fas fa-chevron-left"></i></button>`;
        
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i === 1 || i === pagination.totalPages || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
                html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
            } else if (i === pagination.page - 2 || i === pagination.page + 2) {
                html += `<span>...</span>`;
            }
        }

        html += `<button ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="${onPageChange}(${pagination.page + 1})"><i class="fas fa-chevron-right"></i></button>`;
        container.innerHTML = html;
    }
};

// 全局可用
window.Components = Components;
