# ⚙️ CI/CD Pipeline & Code Quality (SonarCloud)

Project use **Github Actions** and [SonarCloud](https://sonarcloud.io) to automatively check quality of code before **Merge Pull Request**
### 1. CI/CD Workflow

For every Pull Request targeting the `main` branch, the pipeline automatically executes the following process:

**Step 1: Path Detection**
The pipeline detects which directory contains the modified code (`Backend` or `Frontend`) to trigger the appropriate jobs.

**Step 2: Execution**

- 🐳 **If changes are in the `Backend` folder:**
  - Setup **.NET SDK**.
  - Setup **Java JDK** (Prerequisite for SonarCloud Scanner).
  - Activate **SonarCloud Scanner** to analyze code quality and detect vulnerabilities.
  - Trigger `docker_ci.yml` to automatically build and push the new image to **Docker Hub**.

- 📱 **If changes are in the `Frontend` folder:**
  - Setup **Java JDK** (Required for Android build and SonarCloud).
  - Activate **SonarCloud Scanner** to analyze code quality.

---

### 2. Environment Variables & Configurations

- **Node.js Version:** Set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` to suppress deprecation warnings from older GitHub Actions workflows.
- **Skip Coverage:** Since Unit Tests are not yet implemented for this project, code coverage is temporarily bypassed in SonarCloud to prevent the pipeline from failing.
