/**
 * Prometheus-style metrics collector
 * Lightweight implementation without external dependencies
 */

class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();
  }

  // Counter: only increases
  incCounter(name, labels = {}, value = 1) {
    const key = this._makeKey(name, labels);
    const current = this.counters.get(key) || { value: 0, labels };
    current.value += value;
    this.counters.set(key, current);
  }

  // Gauge: can go up or down
  setGauge(name, labels = {}, value) {
    const key = this._makeKey(name, labels);
    this.gauges.set(key, { value, labels });
  }

  // Histogram: track value distributions
  observeHistogram(name, labels = {}, value) {
    const key = this._makeKey(name, labels);
    const current = this.histograms.get(key) || {
      count: 0,
      sum: 0,
      buckets: {},
      labels
    };

    current.count++;
    current.sum += value;

    // Default buckets for response times (in ms)
    const buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    buckets.forEach(bucket => {
      if (!current.buckets[bucket]) current.buckets[bucket] = 0;
      if (value <= bucket) current.buckets[bucket]++;
    });

    this.histograms.set(key, current);
  }

  _makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  _formatLabels(labels) {
    if (!labels || Object.keys(labels).length === 0) return '';
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${labelStr}}`;
  }

  // Generate Prometheus format output
  toPrometheus() {
    const lines = [];

    // Add process metrics
    const memUsage = process.memoryUsage();
    lines.push('# HELP process_memory_heap_bytes Node.js heap memory usage');
    lines.push('# TYPE process_memory_heap_bytes gauge');
    lines.push(`process_memory_heap_bytes ${memUsage.heapUsed}`);

    lines.push('# HELP process_memory_rss_bytes Node.js RSS memory');
    lines.push('# TYPE process_memory_rss_bytes gauge');
    lines.push(`process_memory_rss_bytes ${memUsage.rss}`);

    lines.push('# HELP process_uptime_seconds Process uptime');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);

    lines.push('# HELP nodejs_eventloop_lag_seconds Event loop lag');
    lines.push('# TYPE nodejs_eventloop_lag_seconds gauge');

    // Counters
    const counterGroups = this._groupByName(this.counters);
    for (const [name, entries] of counterGroups) {
      lines.push(`# HELP ${name} Counter metric`);
      lines.push(`# TYPE ${name} counter`);
      for (const [key, data] of entries) {
        lines.push(`${key} ${data.value}`);
      }
    }

    // Gauges
    const gaugeGroups = this._groupByName(this.gauges);
    for (const [name, entries] of gaugeGroups) {
      lines.push(`# HELP ${name} Gauge metric`);
      lines.push(`# TYPE ${name} gauge`);
      for (const [key, data] of entries) {
        lines.push(`${key} ${data.value}`);
      }
    }

    // Histograms
    const histogramGroups = this._groupByName(this.histograms);
    for (const [name, entries] of histogramGroups) {
      lines.push(`# HELP ${name} Histogram metric`);
      lines.push(`# TYPE ${name} histogram`);
      for (const [key, data] of entries) {
        const baseKey = key.replace(/\{.*\}/, '');
        const labelStr = this._formatLabels(data.labels);

        // Bucket values
        const buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
        buckets.forEach(bucket => {
          const bucketLabels = data.labels ? { ...data.labels, le: bucket } : { le: bucket };
          lines.push(`${baseKey}_bucket${this._formatLabels(bucketLabels)} ${data.buckets[bucket] || 0}`);
        });
        const infLabels = data.labels ? { ...data.labels, le: '+Inf' } : { le: '+Inf' };
        lines.push(`${baseKey}_bucket${this._formatLabels(infLabels)} ${data.count}`);
        lines.push(`${baseKey}_sum${labelStr} ${data.sum}`);
        lines.push(`${baseKey}_count${labelStr} ${data.count}`);
      }
    }

    return lines.join('\n');
  }

  _groupByName(map) {
    const groups = new Map();
    for (const [key, value] of map) {
      const name = key.replace(/\{.*\}/, '');
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push([key, value]);
    }
    return groups;
  }

  // Reset all metrics
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

const metrics = new MetricsCollector();

// Express middleware for automatic request metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const labels = {
      method: req.method,
      path: req.route?.path || req.path.replace(/\/[0-9]+/g, '/:id'),
      status: res.statusCode
    };

    metrics.incCounter('http_requests_total', labels);
    metrics.observeHistogram('http_request_duration_ms', labels, duration);
  });

  next();
};

// Metrics endpoint handler
const metricsHandler = (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics.toPrometheus());
};

module.exports = {
  metrics,
  metricsMiddleware,
  metricsHandler
};
