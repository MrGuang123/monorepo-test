/**
 * 本地测试示例
 * 运行: node example.js
 */

const cli = require("./packages/cli");
const hooks = require("./packages/hooks");

console.log("=== 测试 CLI 包 ===");
console.log(cli.greet("张三"));
console.log(cli.runCommand("build"));

console.log("\n=== 测试 Hooks 包 ===");
console.log(hooks.useCustomHook(10));
console.log(hooks.useLogger("这是一条测试消息"));

console.log("\n✅ 所有功能正常！");
