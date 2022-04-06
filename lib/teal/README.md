# 📦 @algodex/teal
>Note: This module lives in `@algodex/sdk` until the `@algodex/mailbox` refactor.

## ℹ Overview

Collection of teal and algosdk utilities used across all projects. The primary responsibility
for the library is to provide features outside the native algosdk. This includes creating an
application from the command line, generating test dependencies and compiling custom templates.

### 📁 Folder Structure
```shell
# tree -f -L 2
.
├── ./bin        # Binary Files
├── ./compile    # Compile Namespace
├── ./test       # Test Namespace
├── ./*.teal.js  # Reusable Teal code
├── ./package.json
└── ./yarn.lock
```

 
