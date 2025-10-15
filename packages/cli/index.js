/**
 * CLI 工具模块
 */

function greet(name) {
  return `Hello from CLI, ${name}!`;
}

function runCommand(command) {
  console.log(`Executing command: ${command}`);
  return `Command ${command} executed successfully`;
}

module.exports = {
  greet,
  runCommand,
};
