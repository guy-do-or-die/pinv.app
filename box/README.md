# PinV Box

**Role**: The Privacy Layer / Trust Root.

## Purpose
This directory contains the code that runs inside a **Trusted Execution Environment (TEE)** (Intel SGX/TDX).
unlike `web` (Frontend) or `og` (Rendering), code here operates on **encrypted secrets** that are strictly confidential.

## Responsibilities
1.  **Secret Management**: Storing and decrypting user API keys (e.g. OpenAI keys).
2.  **Authentication**: Verifying cryptographic signatures to authorize "Edit" or "View" requests.
3.  **Private Execution**: Fetching data from external APIs using the decrypted secrets.
    *   *Input*: `EncryptedKey`, `Script`
    *   *Operation*: Decrypt Key -> Run Script -> Fetch Data
    *   *Output*: Public Data (JSON)

## Architecture
-   **Service**: Runs as a secure microservice.
-   **Security**: The private key for this service **never leaves the enclave** (except via cold-storage provisioning).
-   **Platform Agnostic**: While currently built on Oasis, this "Box" pattern can theoretically be migrated to AWS Nitro Enclaves or other TEE providers.
