## 📌 Git Commit Convention

To maintain a clean, readable, and trackable commit history, all team members **MUST** adhere to the following commit guidelines.

### 1. Standard Syntax
`<type>(<scope>): <short_description>`

### 2. Allowed Types

| Icon | Type | Description | Example |
| :---: | :--- | :--- | :--- |
| ✨ | **feat** | Adds a new feature to the application. | `feat(auth): add JWT login API` |
| 🐛 | **fix** | Patches a bug or resolves an issue. | `fix(cart): resolve incorrect total price calculation` |
| ♻️ | **refactor**| Restructures code without changing existing logic or adding features. | `refactor(product): clean up IProductService interface` |
| 📝 | **docs** | Adds or updates documentation (README, diagrams, etc.). | `docs(ci): update SonarCloud workflow` |
| 🔧 | **chore** | Maintenance tasks, configurations, or dependency updates. | `chore(deps): bump Newtonsoft.Json to 10.0.4` |
| 🚀 | **perf** | Code changes that improve performance. | `perf(db): add index to Product table for faster queries` |

### 3. Golden Rules
- The `type` and `scope` MUST strictly be in **lowercase**.
- The description must be clear, concise, and straight to the point.
- **NEVER** push code with meaningless commit messages such as: `update`, `fix bug`, `done part A`, `asdfgh`.

Reference: [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/)
