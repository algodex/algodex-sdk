# 👥 Contributing Guidelines

- [Code of Conduct](/CODE_OF_CONDUCT.md)
- [Getting Started](/README.md)

# 🎉 Contributing

Title for issues and commit messages must follow [gitmoji](https://gitmoji.dev/) standards and use Unicode characters 
as the prefix. The description can include useful information such as related issues or closing keywords.

#### Commit Message:
```
🐛 Bug: Fix NaN error in X method

instance.getWrongType() returned Infinity

fixes #1234
```


A branch will be created once an issue is assigned to a developer. All work must pass the `eslint` and `jest` tests. There 
are three branches in the **QA/CI** pipeline [`main`, `development`, `next`]. The default branch is `development`, the release
branch is `main`

## 🔀 Branch Flow

Non-breaking features branches are created from the `development` branch. Features must be submitted as an issue in order to create a feature branch. 
Work is preformed in the feature branch and submiited as a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
to `development`. 

Once a release candidate is chosen, a Pull Request will be opened from `development` to `main`. 
The semantic release is governed by the commit guidelines.

`next` is a transitionary branch for major code reworking

| Branch          | Category      | Description                             | 
|-----------------|---------------|-----------------------------------------|
| **main**     | 🚀 Production | fully released software                 |
 | **development** | ✨ Staging     | mirror of `main` to merge features into |
 |  **next**     | 💥Breaking    | major breaking changes                  | 


## 🎨 Commit Guidelines

Contributions follow the [gitmoji](https://gitmoji.dev/) standards with [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
using the [semantic-release-gitmoji](https://github.com/momocow/semantic-release-gitmoji) plugin 

🚀 Release Configuration

| Unicode | Shortcode | Semver |
|---------|-----------|--------|
| 💥      | :boom:    | Major  |
| ✨       | :sparkles: | Minor  |
| 🐛      | :bug:     | Patch  |
| 🚑      | :ambulance:      | Patch  |

## 📝 Issue Guidelines

Find an issue in the [Github Issue Tracker](/issues) or click ["Create new Issue"](/issues/new).
Once the issue is reviewed it will be assigned to a developer.

Issues mirror the commit guidelines with specific categories [`Bugs`, `Features`, `Acceptance`, `Breaking`]. These 
guides are used as [ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE) files but are listed here for reference

### 🐛 Bugs:

#### Issue Title:
```
🐛 Bug: Order does not execute
```

#### Issue Description:
```markdown
# ℹ Overview

When placing an order with `price` === 1.234566, the `placeOrder` method throws a `Error`

# 📝 Related Issues

- [ ] #123

# ⚠ Error/Details/Images:

Uncaught Error: Something
at <anonymous>:1:7
```


### ✨ Features:

#### Issue Title:
```
✨ Feature: Adds X Wallet Connection
```

#### Issue Description:
```markdown
# ℹ Overview

Users should be able to use X companies Algorand Wallet service

# 📝 Related Issues

- [ ] #123

# ⚠ Error/Details/Images:

X Wallet Service API: http://example.com
```

### ✅ Acceptance:

#### Issue Title:
```
✅ Acceptance: Add Order Unit Test
```

#### Issue Description:
```markdown
# ℹ Overview

Test that an order can be placed

# 📝 Related Issues

- [ ] #123

# ⚠ Error/Details/Images:

Branch coverage report
```

### 💥 Breaking Changes:

Contact the senior development team to request major changes.
#### Issue Title:
```
💥 Major Release: Module vX.X.X
```

#### Issue Description:
```markdown
# ℹ Overview

A high level overview of the goals of the breaking changes

# 📝 Related Issues

- [ ] #123
- [ ] Refactor someFunction to include {another} property 

# ⚠ Error/Details/Images:

Solves ongoing problem of X which makes Y difficult to implement 
```
