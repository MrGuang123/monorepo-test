/**
 * Hooks 模块
 */

function useCustomHook(value) {
  console.log(`Using custom hook with value: ${value}`);
  return {
    value,
    doubled: value * 2,
  };
}

function useLogger(message) {
  console.log(`[Hook Logger]: ${message}`);
  return message;
}

function useLogger2(message) {
  console.log(`[Hook Logger2]: ${message}`);
  return message;
}

module.exports = {
  useCustomHook,
  useLogger,
  useLogger2,
};
