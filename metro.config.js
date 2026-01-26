// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reduce worker count to prevent process termination
config.maxWorkers = Math.max(1, Math.floor(require("os").cpus().length / 2));

// Increase worker memory limit
config.transformer = {
  ...config.transformer,
  workerThreads: false, // Disable worker threads to prevent crashes
};

module.exports = config;
