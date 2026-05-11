const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// In-memory notifications store (replace with Redis in production)
const notifications = [];
let notificationId = 1;

function addNotification(userId, type, title, message, data = null) {
    const notification = {
        id: notificationId++,
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date().toISOString(),
    };
    notifications.push(notification);
    
    // Keep only last 100 notifications per user
    const userNotifications = notifications.filter(n => n.userId === userId);
    if (userNotifications.length > 100) {
        const toRemove = userNotifications.slice(0, userNotifications.length - 100);
        toRemove.forEach(n => {
            const idx = notifications.findIndex(x => x.id === n.id);
            if (idx > -1) notifications.splice(idx, 1);
        });
    }
    
    return notification;
}

router.get('/', (req, res) => {
    const userId = req.user.userId;
    const unreadOnly = req.query.unread === 'true';
    
    let userNotifications = notifications.filter(n => n.userId === userId);
    if (unreadOnly) {
        userNotifications = userNotifications.filter(n => !n.read);
    }
    
    res.json({
        success: true,
        data: userNotifications.sort((a, b) => b.id - a.id),
        unreadCount: notifications.filter(n => n.userId === userId && !n.read).length,
    });
});

router.put('/:id/read', (req, res) => {
    const userId = req.user.userId;
    const id = parseInt(req.params.id);
    
    const notification = notifications.find(n => n.id === id && n.userId === userId);
    if (!notification) {
        return res.status(404).json({ success: false, message: '通知不存在' });
    }
    
    notification.read = true;
    res.json({ success: true, data: notification });
});

router.put('/read-all', (req, res) => {
    const userId = req.user.userId;
    notifications.filter(n => n.userId === userId && !n.read).forEach(n => n.read = true);
    res.json({ success: true, message: '全部已读' });
});

router.delete('/:id', (req, res) => {
    const userId = req.user.userId;
    const id = parseInt(req.params.id);
    
    const idx = notifications.findIndex(n => n.id === id && n.userId === userId);
    if (idx === -1) {
        return res.status(404).json({ success: false, message: '通知不存在' });
    }
    
    notifications.splice(idx, 1);
    res.json({ success: true, message: '删除成功' });
});

module.exports = { router, addNotification };
