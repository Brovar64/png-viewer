const path = require('path');
const fs = require('fs');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function override(config, env) {
  // Modify entry points for multiple builds
  config.entry = {
    main: config.entry,
    'transparent-app': path.resolve(__dirname, 'src/transparentApp.js')
  };

  // Update output filename to use [name] for multiple entry points
  config.output.filename = 'static/js/[name].js';
  
  // Adjust splitChunks to correctly handle multiple entries
  if (config.optimization) {
    // Disable chunks for our transparent app to keep it in a single file
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
  }

  // Update plugins to use [name] in filenames where applicable
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'MiniCssExtractPlugin') {
      plugin.options.filename = 'static/css/[name].css';
    }
  });

  // In development mode, copy the built file to public folder for easy access
  if (env === 'development') {
    // Write a file to public folder that loads the transparent app correctly
    const devCode = `
      // This file is auto-generated for development
      // It loads the transparent-app.js bundle from the webpack dev server
      const script = document.createElement('script');
      script.src = '/static/js/transparent-app.js';
      document.body.appendChild(script);
    `;
    
    try {
      fs.writeFileSync('./public/transparent-app.js', devCode);
      console.log('Created development transparent-app.js loader');
    } catch (err) {
      console.error('Failed to write transparent-app.js loader:', err);
    }
  }

  return config;
};
