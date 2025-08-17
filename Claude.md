# Claude Code Spec-Driven Development

This project implements Kiro-style Spec-Driven Development for Claude Code using hooks and slash commands.

## CRITICAL n8n Workflow Settings Rules

**NEVER FORGET**: In n8n workflow JSON files, both `saveDataSuccessExecution` and `saveDataErrorExecution` MUST be strings with same values:
- `saveExecutionProgress`: boolean (true/false)
- `saveDataSuccessExecution`: Must be "all" or "none" (STRING!)
- `saveDataErrorExecution`: Must be "all" or "none" (STRING!)

Example:
```json
"settings": {
  "executionOrder": "v1",
  "saveExecutionProgress": true,          // boolean
  "saveDataSuccessExecution": "all",      // STRING! Must be "all" or "none"
  "saveDataErrorExecution": "all"         // STRING! Must be "all" or "none"
}
```

## n8n公式ノード正確なリスト（実在確認済み）

### 必ず使用すべき正確なノード名

#### トリガーノード（起動ノード）
- `n8n-nodes-base.webhook` - Webhookトリガー（v1.1）
- `n8n-nodes-base.scheduleTrigger` - スケジュール実行（v1.1） 
- `n8n-nodes-base.manualTrigger` - 手動実行（v1）
- `n8n-nodes-base.emailReadImapV2` - メール受信（v2）

#### コアノード（基本処理）
- `n8n-nodes-base.set` - データ設定（v3.3）
- `n8n-nodes-base.code` - JavaScriptコード（v2）
- `n8n-nodes-base.httpRequest` - HTTPリクエスト（v4.1）
- `n8n-nodes-base.if` - 条件分岐（v2）
- `n8n-nodes-base.switch` - 複数条件分岐（v3）
- `n8n-nodes-base.merge` - データ結合（v3）
- `n8n-nodes-base.splitInBatches` - バッチ処理（v3）

#### AI/LLMノード（最新版）
- `@n8n/n8n-nodes-langchain.agent` - AIエージェント（v1）
- `@n8n/n8n-nodes-langchain.lmChatOpenAi` - OpenAI Chat（v1）
- `@n8n/n8n-nodes-langchain.toolCode` - AIツール用コード（v1）
- `@n8n/n8n-nodes-langchain.memoryBufferWindow` - 会話メモリ（v1）

#### 統合ノード（外部サービス）
- `n8n-nodes-base.slack` - Slack（v2.1）
- `n8n-nodes-base.discord` - Discord（v2）
- `n8n-nodes-base.postgres` - PostgreSQL（v2.4）
- `n8n-nodes-base.googleSheets` - Google Sheets（v4）

### よくある間違いと正解

❌ **間違い**: `n8n-nodes-base.openai`
✅ **正解**: `@n8n/n8n-nodes-langchain.lmChatOpenAi`

❌ **間違い**: `n8n-nodes-base.gpt`
✅ **正解**: `@n8n/n8n-nodes-langchain.agent` + `@n8n/n8n-nodes-langchain.lmChatOpenAi`

❌ **間違い**: `webhook` (短縮名)
✅ **正解**: `n8n-nodes-base.webhook` (フルネーム必須)

### 接続パターン（必須遵守）

#### 正しい接続形式
```json
"connections": {
  "Webhook": {
    "main": [
      [
        {
          "node": "Set",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

#### AIエージェントの正しい構成
1. Agent ノード
2. LM Chat OpenAI ノード（Agentに接続）
3. Tool ノード（必要に応じてAgentに接続）
4. Memory ノード（オプション、Agentに接続）

## Project Context

### Project Steering
- Product overview: `.kiro/steering/product.md`
- Technology stack: `.kiro/steering/tech.md`
- Project structure: `.kiro/steering/structure.md`
- Custom steering docs for specialized contexts

### Active Specifications
- Current spec: Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress
- `line-gemini-multimodal-bot`: LINE Messaging APIとGemini Native Nodeを統合したマルチモーダルAI機能（画像生成、テキストチャット、音声文字起こし）

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)

### n8n Workflow作成サポートの指針

- 本プロジェクトでは、「n8n workflow」関連の作成・設計・JSON 実装など n8n に関するタスクが指示された場合、`workflow.md`（n8n ワークフロー仕様・記述ルールガイド）を **常に参照** し、その内容に厳格に従って実装・レビューを行うこと。
- `workflow.md` が存在しない・未整備の場合は、現時点の n8n 公式仕様およびプロジェクト標準を基に **暫定対応** し、`workflow.md` の整備を促すコメントを残すこと。
- n8n workflow タスクでは、ユーザー指示の有無にかかわらず、`workflow.md` で規定された **必須フィールド・品質基準** を必ず満たした成果物のみ提出すること。
- 「n8n で〇〇を自動化したい」などユーザー意図が入力で検出された場合にのみ `workflow.md` を参照する（常時ロードはしない）。
- Spec‑Driven Development の全工程（Requirements → Design → Tasks → Implementation）でも、n8n 関連内容は随時 `workflow.md` を参照し、指針逸脱が無いように維持する。
- `workflow.md` がプロジェクトの **steering ドキュメント** の一つとして扱われる場合、下記 *Steering Configuration* に従いインクルージョンモード（Always / Conditional / Manual）を適切に設定する。
- **重要**: n8nワークフロー開発時は必ず`.github/USAGE_GUIDE.md`の「n8n ワークフロー開発必須ルール」セクションに従うこと。

### n8n Workflow → GitHub PR 完全フロー

**注意**: n8nワークフロー開発は必ず以下の手順に従うこと：
1. Kiroコマンドで仕様作成（`/kiro:spec-init`, `/kiro:spec-requirements`, `/kiro:spec-design`, `/kiro:spec-tasks`）
2. tasks.mdに従って1タスクずつ実装
3. 各タスク完了時にJSON検証とn8nインポートテスト
4. 詳細は`.github/USAGE_GUIDE.md`を参照

n8n用ワークフローの作成からGitHubへのPR作成まで、以下の一連の流れで実行する：

⏺ **n8n Workflow Development & GitHub Integration**
  ⎿  ☐ **gitステータスの確認**
     - `git status` でワーキングディレクトリの状態確認
     - 未コミットの変更があれば適切に処理
     - 現在のブランチ位置を確認
     
     ☐ **新しいブランチの作成**
     - フィーチャーブランチ作成: `git checkout -b feature/workflow-[workflow-name]`
     - ブランチ名はワークフロー名に対応させる
     - 例: `feature/workflow-discord-ai-chatbot`
     
     ☐ **ワークフローファイルのコミット**
     - 生成されたワークフローJSON を適切なディレクトリに配置
     - `workflows/` または `projects/[workflow-name]/` 配下
     - `git add` でステージング
     - 意味のあるコミットメッセージで `git commit`
     - 例: `feat: add Discord AI chatbot workflow with multimodal support`
     
     ☐ **GitHubへのプッシュ**
     - リモートブランチへプッシュ: `git push origin feature/workflow-[workflow-name]`
     - プッシュ成功を確認
     
     ☐ **プルリクエストの作成**
     - GitHub UI または GitHub CLI を使用
     - PR タイトル: `feat: Add [workflow-name] workflow`
     - PR 説明に以下を含める:
       - ワークフローの目的と機能
       - 使用ノードとその役割
       - テスト方法（可能であれば）
       - workflow.md v2025.7 準拠であることを明記
     - レビュアーの指定（必要に応じて）

**注意事項:**
- 各ステップは順次実行し、エラーが発生した場合は適切に対処
- ワークフローファイルは `.workflow.json` の仕様に準拠
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式を推奨
- PR作成前に workflow.md の品質基準をクリアしていることを確認

## Spec-Driven Development Workflow

### Phase 0: Steering Generation (Recommended)

#### Kiro Steering (`.kiro/steering/`)
```bash
/kiro:steering               # Intelligently create or update steering documents
/kiro:steering-custom        # Create custom steering for specialized contexts
```

**Steering Management:**
- **`/kiro:steering`**: Unified command that intelligently detects existing files and handles them appropriately. Creates new files if needed, updates existing ones while preserving user customizations.

**Note**: For new features or empty projects, steering is recommended but not required. You can proceed directly to spec‑requirements if needed.

### Phase 1: Specification Creation
```bash
/kiro:spec-init [feature-name]           # Initialize spec structure only
/kiro:spec-requirements [feature-name]   # Generate requirements → Review → Edit if needed
/kiro:spec-design [feature-name]         # Generate technical design → Review → Edit if needed
/kiro:spec-tasks [feature-name]          # Generate implementation tasks → Review → Edit if needed
```

### Phase 2: Progress Tracking
```bash
/kiro:spec-status [feature-name]         # Check current progress and phases
```

## Spec-Driven Development Workflow

Kiro's spec-driven development follows a strict **3‑phase approval workflow**:

### Phase 1: Requirements Generation & Approval
1. **Generate**: `/kiro:spec-requirements [feature-name]` – Generate requirements document
2. **Review**: Human reviews `requirements.md` and edits if needed
3. **Approve**: See Phase 2 for streamlined approval

### Phase 2: Design Generation & Approval
1. **Generate**: `/kiro:spec-design [feature-name]` – Interactive approval prompt appears
2. **Review confirmation**: "requirements.mdをレビューしましたか？ [y/N]"
3. **Approve**: Reply 'y' to approve and proceed, or manually update `spec.json`

### Phase 3: Tasks Generation & Approval
1. **Generate**: `/kiro:spec-tasks [feature-name]` – Interactive approval prompts appear
2. **Review confirmation**: Confirms both requirements and design have been reviewed
3. **Approve**: Reply 'y' to approve all phases, or manually update `spec.json`

### Implementation
Only after all three phases are approved can implementation begin.

**Key Principle**: Each phase requires explicit human approval before proceeding to the next phase, ensuring quality and accuracy throughout the development process.

## Development Rules

1. **Consider steering**: Run `/kiro:steering` before major development (optional for new features)
2. **Follow the 3‑phase approval workflow**: Requirements → Design → Tasks → Implementation
3. **Approval required**: Each phase requires human review (interactive prompt or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro:steering` after significant changes
7. **Check spec compliance**: Use `/kiro:spec-status` to verify alignment

## Automation

This project uses Claude Code hooks to:
- Automatically track task progress in tasks.md
- Check spec compliance
- Preserve context during compaction
- Detect steering drift

### Task Progress Tracking

When working on implementation:
1. **Manual tracking**: Update tasks.md checkboxes manually as you complete tasks
2. **Progress monitoring**: Use `/kiro:spec-status` to view current completion status
3. **TodoWrite integration**: Use TodoWrite tool to track active work items
4. **Status visibility**: Checkbox parsing shows completion percentage

## Getting Started

1. Initialize steering documents: `/kiro:steering`
2. Create your first spec: `/kiro:spec-init [your-feature-name]`
3. Follow the workflow through requirements, design, and tasks

## Kiro Steering Details

Kiro-style steering provides persistent project knowledge through markdown files:

### Core Steering Documents
- **product.md**: Product overview, features, use cases, value proposition
- **tech.md**: Architecture, tech stack, dev environment, commands, ports
- **structure.md**: Directory organization, code patterns, naming conventions

### Custom Steering
Create specialized steering documents for:
- API standards
- Testing approaches
- Code style guidelines
- Security policies
- Database conventions
- Performance standards
- Deployment workflows

### Inclusion Modes
- **Always Included**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., `"*.test.js"`)
- **Manual**: Loaded on-demand with `#filename` reference

## Kiro Steering Configuration

### Current Steering Files
The `/kiro:steering` command manages these files automatically. Manual updates to this section reflect changes made through steering commands.

### Active Steering Files
- `product.md`: Always included – Product context and business objectives
- `tech.md`:    Always included – Technology stack and architectural decisions  
- `structure.md`: Always included – File organization and code patterns

### Custom Steering Files
<!-- Added by /kiro:steering-custom command -->
<!-- Example entries: -->
- `workflow.md`: Conditional - `"*.n8n.json"`, `"n8n/**/*"`, `"*.workflow.json"` - n8nワークフロー作成・実装・レビュー時に必ず参照
- `api-standards.md`: Conditional - `"src/api/**/*"`, `"**/*api*"` - API design guidelines
- `testing-approach.md`: Conditional - `"**/*.test.*"`, `"**/spec/**/*"` - Testing conventions
- `security-policies.md`: Manual - Security review guidelines (reference with @security-policies.md)

### Usage Notes
- **Always files**: Automatically loaded in every interaction
- **Conditional files**: Loaded when working on matching file patterns
- **Manual files**: Reference explicitly with `@filename.md` syntax when needed
- **Updating**: Use `/kiro:steering` or `/kiro:steering-custom` commands to modify this configuration

