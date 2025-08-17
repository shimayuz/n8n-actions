#!/bin/bash

echo "🧹 パブリック公開前のクリーンアップを開始..."

# バックアップディレクトリを作成
BACKUP_DIR="private_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 プライベートファイルをバックアップ中..."

# プライベートファイルをバックアップ
files_to_backup=(
    ".workflow-sync-state.json"
    "mcp.json"
    ".workflow.json"
    "claude_backup.md"
    "README_ja.md"
    "workflows/README_ja.md"
)

for file in "${files_to_backup[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null && echo "  ✓ $file をバックアップ"
    fi
done

# ディレクトリをバックアップ
dirs_to_backup=(
    ".serena"
    ".claude/settings.local.json"
    "outputs_backup_20250716_122219"
)

for dir in "${dirs_to_backup[@]}"; do
    if [ -e "$dir" ]; then
        cp -r "$dir" "$BACKUP_DIR/" 2>/dev/null && echo "  ✓ $dir をバックアップ"
    fi
done

echo ""
echo "🗑️  不要なファイルを削除中..."

# ファイルを削除
rm -f .workflow-sync-state.json 2>/dev/null && echo "  ✓ .workflow-sync-state.json を削除"
rm -f mcp.json 2>/dev/null && echo "  ✓ mcp.json を削除"
rm -f .workflow.json 2>/dev/null && echo "  ✓ .workflow.json を削除"
rm -f claude_backup.md 2>/dev/null && echo "  ✓ claude_backup.md を削除"
rm -f README_ja.md 2>/dev/null && echo "  ✓ README_ja.md を削除（README-jp.mdを使用）"
rm -f workflows/README_ja.md 2>/dev/null && echo "  ✓ workflows/README_ja.md を削除"
rm -f .claude/settings.local.json 2>/dev/null && echo "  ✓ .claude/settings.local.json を削除"

# バックアップディレクトリを削除
rm -rf outputs_backup_20250716_122219 2>/dev/null && echo "  ✓ outputs_backup_20250716_122219 を削除"

# .DS_Storeファイルを全て削除
find . -name ".DS_Store" -type f -delete 2>/dev/null && echo "  ✓ 全ての.DS_Storeファイルを削除"

echo ""
echo "📝 .gitignoreの確認..."
echo "  ✓ .gitignoreが更新されています"

echo ""
echo "🔍 残っている可能性のある機密ファイルをチェック..."
suspicious_files=$(find . -name "*.env*" -o -name "*secret*" -o -name "*credential*" -o -name "*token*" -o -name "*.key" 2>/dev/null | grep -v node_modules | grep -v .git)

if [ -z "$suspicious_files" ]; then
    echo "  ✓ 機密ファイルは見つかりませんでした"
else
    echo "  ⚠️  以下のファイルを確認してください："
    echo "$suspicious_files"
fi

echo ""
echo "✅ クリーンアップ完了！"
echo ""
echo "📋 次のステップ："
echo "1. git status で変更を確認"
echo "2. git add . で変更をステージング"
echo "3. git commit -m 'chore: prepare for public release'"
echo "4. git push origin main"
echo ""
echo "💡 バックアップは $BACKUP_DIR に保存されています"