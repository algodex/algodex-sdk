# ⚙ Getting Started

### Set up a Github token to make it easy to install the private algodex-sdk npm package.

https://github.com/settings/tokens

Make sure you add the "read:packages" permission.
Copy and save the secret.

In a Linux terminal (git-bash on Windows):

create an ~/.npmrc file with the following contents:
```
//npm.pkg.github.com/:_authToken=tokensecretgoeshere
@algodex:registry=https://npm.pkg.github.com/
```
or you can use npm login with your token
```
$ npm login --scope=@algodex --registry=https://npm.pkg.github.com
> Username: USERNAME
> Password: TOKEN_SECRET
> Email: PUBLIC-EMAIL-ADDRESS
```

### Clone and install the necessary libraries

```
yarn
```
