const appJson = require("./app.json");

module.exports = ({ config }) => {
  const baseConfig = appJson.expo || config || {};
  return {
    ...baseConfig,
    extra: {
      ...(baseConfig.extra || {}),
      ADMOB_MODE: process.env.ADMOB_MODE || "TEST",
    },
  };
};
