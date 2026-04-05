const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  const target = process.env.REACT_APP_DHIS2_URL || 'http://localhost:8080';
  app.use('/api', createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    },
  }));
};
