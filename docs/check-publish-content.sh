#!/bin/bash

# 这个脚本用于检查 npm publish 会发布哪些文件
# 运行: bash check-publish-content.sh

echo "========================================"
echo "检查 npm publish 会包含哪些文件"
echo "========================================"
echo ""

# 检查 cli 包
echo "📦 @monorepo-test/cli 包将会发布的文件:"
echo "----------------------------------------"
cd packages/cli
npm pack --dry-run 2>&1 | grep -E "^npm notice" | grep -v "package size"
cd ../..
echo ""

# 检查 hooks 包
echo "📦 @monorepo-test/hooks 包将会发布的文件:"
echo "----------------------------------------"
cd packages/hooks
npm pack --dry-run 2>&1 | grep -E "^npm notice" | grep -v "package size"
cd ../..
echo ""

echo "========================================"
echo "✅ 检查完成"
echo "========================================"
echo ""
echo "说明："
echo "- 以上是 npm publish 时会上传的文件"
echo "- Git 提交会包含更多文件（测试、配置等）"
echo "- 使用 .npmignore 可以排除不需要发布的文件"
echo ""
echo "要查看 Git 管理的所有文件，运行:"
echo "  git ls-files"

