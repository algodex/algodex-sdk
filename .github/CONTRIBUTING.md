# π₯ Contributing Guidelines

- [Code of Conduct](/CODE_OF_CONDUCT.md)
- [Getting Started](/README.md)

# π Contributing

Title for issues and commit messages must follow [gitmoji](https://gitmoji.dev/) standards and use Unicode characters 
as the prefix. The description can include useful information such as related issues or closing keywords.

#### Commit Message:
```
π Bug: Fix NaN error in X method

instance.getWrongType() returned Infinity

fixes #1234
```


A branch will be created once an issue is assigned to a developer. All work must pass the `eslint` and `jest` tests. There 
are three branches in the **QA/CI** pipeline [`main`, `development`, `next`]. The default branch is `development`, the release
branch is `main`

## π Branch Flow

Non-breaking features branches are created from the `development` branch. Features must be submitted as an issue in order to create a feature branch. 
Work is preformed in the feature branch and submiited as a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
to `development`. 

Once a release candidate is chosen, a Pull Request will be opened from `development` to `main`. 
The semantic release is governed by the commit guidelines.

`next` is a transitionary branch for major code reworking

| Branch          | Category      | Description                             | 
|-----------------|---------------|-----------------------------------------|
| **main**     | π Production | fully released software                 |
 | **development** | β¨ Staging     | mirror of `main` to merge features into |
 |  **next**     | π₯Breaking    | major breaking changes                  | 


## π¨ Commit Guidelines

Contributions follow the [gitmoji](https://gitmoji.dev/) standards with [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
using the [semantic-release-gitmoji](https://github.com/momocow/semantic-release-gitmoji) plugin 

π Release Configuration

| Unicode | Shortcode | Semver |
|---------|-----------|--------|
| π₯      | :boom:    | Major  |
| β¨       | :sparkles: | Minor  |
| π      | :bug:     | Patch  |
| π      | :ambulance:      | Patch  |

## π Issue Guidelines

Find an issue in the [Github Issue Tracker](/issues) or click ["Create new Issue"](/issues/new).
Once the issue is reviewed it will be assigned to a developer.

Issues mirror the commit guidelines with specific categories [`Bugs`, `Features`, `Acceptance`, `Breaking`]. These 
guides are used as [ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE) files but are listed here for reference

### π Bugs:

#### Issue Title:
```
π Bug: Order does not execute
```

#### Issue Description:
```markdown
# βΉ Overview

When placing an order with `price` === 1.234566, the `placeOrder` method throws a `Error`

# π Related Issues

- [ ] #123

# β  Error/Details/Images:

Uncaught Error: Something
at <anonymous>:1:7
```


### β¨ Features:

#### Issue Title:
```
β¨ Feature: Adds X Wallet Connection
```

#### Issue Description:
```markdown
# βΉ Overview

Users should be able to use X companies Algorand Wallet service

# π Related Issues

- [ ] #123

# β  Error/Details/Images:

X Wallet Service API: http://example.com
```

### β Acceptance:

#### Issue Title:
```
β Acceptance: Add Order Unit Test
```

#### Issue Description:
```markdown
# βΉ Overview

Test that an order can be placed

# π Related Issues

- [ ] #123

# β  Error/Details/Images:

Branch coverage report
```

### π₯ Breaking Changes:

Contact the senior development team to request major changes.
#### Issue Title:
```
π₯ Major Release: Module vX.X.X
```

#### Issue Description:
```markdown
# βΉ Overview

A high level overview of the goals of the breaking changes

# π Related Issues

- [ ] #123
- [ ] Refactor someFunction to include {another} property 

# β  Error/Details/Images:

Solves ongoing problem of X which makes Y difficult to implement 
```
