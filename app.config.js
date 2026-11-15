// Serves the web build from a sub-path (e.g. GitHub Pages) when EXPO_BASE_URL is set.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL || '' },
});
