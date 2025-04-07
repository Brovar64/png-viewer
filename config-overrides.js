const path = require('path');

module.exports = function override(config, env) {
  // Clone the config for our second entry point
  const transparentConfig = { ...config };
  
  // Add the second entry point for the transparent window
  config.entry = {
    main: [config.entry],
    'transparent-app': [path.resolve(__dirname, 'src/transparentApp.js')]
  };
  
  // Change output filename to use [name] for multiple entry points
  config.output.filename = 'static/js/[name].js';
  
  // Update plugins to use [name] in filenames where applicable
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'MiniCssExtractPlugin') {
      plugin.options.filename = 'static/css/[name].css';
    }
  });

  return config;
};
