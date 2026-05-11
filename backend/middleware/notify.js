const { broadcast } = require('../websocket');

function notifyMiddleware(channel = 'all') {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = function(data) {
            if (data && data.success) {
                const method = req.method;
                const path = req.path;
                const entity = path.split('/')[1] || 'data';

                let action = 'update';
                if (method === 'POST') action = 'create';
                if (method === 'DELETE') action = 'delete';

                broadcast({
                    type: 'notification',
                    channel,
                    action,
                    entity,
                    path: req.originalUrl,
                    user: req.user?.username || 'system',
                    message: `${entity} ${action} 操作成功`,
                    data: { id: data.data?.id, count: data.data?.count }
                }, channel);
            }
            return originalJson(data);
        };

        next();
    };
}

function notifyEvent(title, message, type = 'info', channel = 'all') {
    return broadcast({
        type: 'notification',
        channel,
        notificationType: type,
        title,
        message,
        entity: 'system'
    }, channel);
}

module.exports = { notifyMiddleware, notifyEvent };
