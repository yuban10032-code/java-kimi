const { query } = require('../config/database');

// In-memory metrics store
const metrics = {
    requests: [],
    slowQueries: [],
    errors: [],
    hourlyStats: new Map(),
    endpoints: new Map()
};

const MAX_STORED = 10000;
const SLOW_THRESHOLD_MS = 500;

function performanceMonitor() {
    return (req, res, next) => {
        const start = process.hrtime.bigint();
        const startTime = Date.now();

        res.on('finish', () => {
            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1_000_000;
            const statusCode = res.statusCode;
            const endpoint = `${req.method} ${req.route?.path || req.path}`;

            const record = {
                timestamp: startTime,
                method: req.method,
                path: req.path,
                endpoint,
                durationMs: Math.round(durationMs * 100) / 100,
                statusCode,
                userAgent: req.get('user-agent')?.substring(0, 100),
                ip: req.ip || req.connection.remoteAddress
            };

            // Store request metrics
            metrics.requests.push(record);
            if (metrics.requests.length > MAX_STORED) {
                metrics.requests = metrics.requests.slice(-MAX_STORED / 2);
            }

            // Endpoint stats
            if (!metrics.endpoints.has(endpoint)) {
                metrics.endpoints.set(endpoint, { count: 0, totalMs: 0, errors: 0, maxMs: 0 });
            }
            const epStats = metrics.endpoints.get(endpoint);
            epStats.count++;
            epStats.totalMs += durationMs;
            epStats.maxMs = Math.max(epStats.maxMs, durationMs);
            if (statusCode >= 400) epStats.errors++;

            // Hourly stats
            const hour = new Date(startTime).toISOString().slice(0, 13);
            if (!metrics.hourlyStats.has(hour)) {
                metrics.hourlyStats.set(hour, { count: 0, errors: 0, totalMs: 0 });
            }
            const hs = metrics.hourlyStats.get(hour);
            hs.count++;
            hs.totalMs += durationMs;
            if (statusCode >= 400) hs.errors++;

            // Slow request logging
            if (durationMs > SLOW_THRESHOLD_MS) {
                metrics.slowQueries.push({
                    ...record,
                    query: req.body?.query || req.query?.q
                });
                if (metrics.slowQueries.length > 1000) {
                    metrics.slowQueries = metrics.slowQueries.slice(-500);
                }
                console.warn(`[SLOW] ${endpoint} took ${durationMs.toFixed(2)}ms`);
            }

            // Error tracking
            if (statusCode >= 500) {
                metrics.errors.push(record);
                if (metrics.errors.length > 1000) {
                    metrics.errors = metrics.errors.slice(-500);
                }
            }
        });

        next();
    };
}

function getStats(timeRange = 3600000) {
    const now = Date.now();
    const cutoff = now - timeRange;
    const recent = metrics.requests.filter(r => r.timestamp > cutoff);

    const totalCount = recent.length;
    const errorCount = recent.filter(r => r.statusCode >= 400).length;
    const avgDuration = totalCount > 0
        ? recent.reduce((sum, r) => sum + r.durationMs, 0) / totalCount
        : 0;

    const statusDistribution = {};
    recent.forEach(r => {
        const bucket = Math.floor(r.statusCode / 100) * 100;
        statusDistribution[bucket] = (statusDistribution[bucket] || 0) + 1;
    });

    const endpointStats = Array.from(metrics.endpoints.entries())
        .map(([endpoint, stats]) => ({
            endpoint,
            count: stats.count,
            avgMs: stats.count > 0 ? Math.round(stats.totalMs / stats.count * 100) / 100 : 0,
            maxMs: Math.round(stats.maxMs * 100) / 100,
            errorRate: stats.count > 0 ? Math.round(stats.errors / stats.count * 10000) / 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    return {
        totalCount,
        errorCount,
        errorRate: totalCount > 0 ? Math.round(errorCount / totalCount * 10000) / 100 : 0,
        avgDuration: Math.round(avgDuration * 100) / 100,
        slowCount: metrics.slowQueries.filter(q => q.timestamp > cutoff).length,
        statusDistribution,
        endpointStats,
        topSlowQueries: metrics.slowQueries.slice(-10).reverse(),
        topErrors: metrics.errors.slice(-10).reverse(),
        hourly: Array.from(metrics.hourlyStats.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-24)
            .map(([hour, stats]) => ({
                hour,
                count: stats.count,
                errors: stats.errors,
                avgMs: stats.count > 0 ? Math.round(stats.totalMs / stats.count * 100) / 100 : 0
            }))
    };
}

async function getDatabaseStats() {
    try {
        const tableSizeResult = await query(`
            SELECT relname AS table_name,
                   pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
                   pg_total_relation_size(relid) AS size_bytes,
                   n_live_tup AS row_count
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(relid) DESC
        `);

        const dbSizeResult = await query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size
        `);

        const connectionResult = await query(`
            SELECT count(*) as active_connections
            FROM pg_stat_activity
            WHERE datname = current_database()
        `);

        const indexResult = await query(`
            SELECT schemaname, tablename, indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);

        return {
            databaseSize: dbSizeResult.rows[0]?.db_size || 'unknown',
            activeConnections: parseInt(connectionResult.rows[0]?.active_connections || 0),
            tables: tableSizeResult.rows,
            indexes: indexResult.rows
        };
    } catch (err) {
        return { error: err.message };
    }
}

function clearMetrics() {
    metrics.requests = [];
    metrics.slowQueries = [];
    metrics.errors = [];
    metrics.hourlyStats.clear();
    metrics.endpoints.clear();
}

module.exports = { performanceMonitor, getStats, getDatabaseStats, clearMetrics };
