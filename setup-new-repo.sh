#!/bin/bash

echo "🚀 新しいGitHubリポジトリへの接続設定"
echo ""
echo "GitHubで新しいリポジトリを作成しましたか？ (y/n)"
read -r created

if [ "$created" != "y" ]; then
    echo ""
    echo "📋 GitHubで新しいリポジトリを作成してください："
    echo ""
    echo "1. https://github.com/new にアクセス"
    echo "2. Repository name: n8n-ai-workflow-generator"
    echo "3. Public リポジトリとして作成"
    echo "4. READMEやgitignoreは追加しない"
    echo "5. MIT Licenseを選択"
    echo ""
    exit 1
fi

echo ""
echo "GitHubユーザー名を入力してください："
read -r username

echo ""
echo "リポジトリ名を入力してください (デフォルト: n8n-ai-workflow-generator)："
read -r reponame
reponame=${reponame:-n8n-ai-workflow-generator}

# 新しいリモートURLを設定
NEW_REMOTE="https://github.com/$username/$reponame.git"

echo ""
echo "📝 設定内容："
echo "  ユーザー名: $username"
echo "  リポジトリ: $reponame"
echo "  URL: $NEW_REMOTE"
echo ""
echo "この内容で設定しますか？ (y/n)"
read -r confirm

if [ "$confirm" != "y" ]; then
    echo "キャンセルしました"
    exit 1
fi

echo ""
echo "🔧 Git設定を更新中..."

# 現在のリモートを確認
echo "現在のリモート設定:"
git remote -v

# 既存のoriginを削除（存在する場合）
if git remote | grep -q "^origin$"; then
    echo "既存のoriginを削除..."
    git remote remove origin
fi

# 新しいoriginを追加
echo "新しいoriginを追加..."
git remote add origin "$NEW_REMOTE"

echo ""
echo "✅ リモート設定完了！"
echo ""
echo "📋 次のステップ："
echo ""
echo "1. 変更をコミット（まだの場合）："
echo "   git add ."
echo "   git commit -m \"feat: initial commit - AI-powered n8n workflow generator\""
echo ""
echo "2. メインブランチにpush："
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. その他のブランチがある場合："
echo "   git push origin feature/ai-workflow-compiler"
echo ""
echo "🎉 準備完了！"