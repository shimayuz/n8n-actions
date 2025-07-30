## 🤖 n8n Workflow Pull Request

### 📋 Workflow Information

**Workflow Name**: <!-- Auto-filled by automation -->
**Source File**: <!-- Auto-filled by automation -->
**Target Location**: `workflows/` <!-- Update if different -->

### 🔍 Pre-merge Checklist

#### Validation
- [ ] JSON syntax is valid
- [ ] workflow.md v2025.7 compliance verified
- [ ] All required fields are present
- [ ] `saveDataSuccessExecution` is a string ("all" or "none")
- [ ] `saveDataErrorExecution` is a string ("all" or "none")
- [ ] No hardcoded credentials in the workflow

#### Testing
- [ ] Workflow has been tested in a local n8n instance
- [ ] All nodes execute without errors
- [ ] Expected outputs are produced
- [ ] Error handling works correctly

#### Documentation
- [ ] Workflow has a meaningful name
- [ ] Workflow description explains its purpose
- [ ] Complex nodes have descriptions
- [ ] Any required credentials are documented

### 📝 Description

<!-- Provide a brief description of what this workflow does -->

### 🎯 Purpose & Use Case

<!-- Explain why this workflow was created and what problem it solves -->

### 🔧 Configuration Requirements

#### Credentials Needed
<!-- List any credentials that need to be configured -->
- [ ] None required
- [ ] Credential Type 1: <!-- Specify -->
- [ ] Credential Type 2: <!-- Specify -->

#### Environment Variables
<!-- List any environment variables needed -->
- [ ] None required
- [ ] Variable 1: <!-- Specify -->
- [ ] Variable 2: <!-- Specify -->

### 🧪 Testing Instructions

1. Import the workflow into your n8n instance
2. Configure required credentials (if any)
3. <!-- Add specific testing steps -->
4. Verify the expected output

### 📸 Screenshots (if applicable)

<!-- Add screenshots of the workflow or its output -->

### 🔗 Related Issues/PRs

<!-- Link any related issues or pull requests -->
- Closes #<!-- issue number -->
- Related to #<!-- issue/PR number -->

### 📚 Additional Notes

<!-- Any additional information that reviewers should know -->

---

### 🤖 Automation Metadata

<!-- DO NOT EDIT BELOW THIS LINE - Auto-filled by GitHub Actions -->
- **Generated at**: <!-- timestamp -->
- **Workflow Validation**: ✅ Passed
- **Node Count**: <!-- auto-filled -->
- **GitHub Action Run**: <!-- link to run -->