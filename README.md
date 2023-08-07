# WorkOS for Six-Figure SaaS Contracts

Landing a six-figure contract as a SaaS company is a huge milestone. To make sure your company is ready to win the big deals, you'll need to be ready to meet enterprise-level expectations around user management:

- SSO
- Directory Sync
- Audit Logging

[WorkOS](https://lwj.dev/workos) makes it possible to set all of this up quickly in a fully self-serve workflow. No sales calls required!

This demo app shows how to implement SSO for a Node app using WorkOS for SSO and Okta as an identity provider.

## Local Dev

### Prerequisites

- A WorkOS account
- An Okta account (the free developer preview is great for testing this out if you don't have an Okta account already)
- Create a WorkOS connection to Okta
- Create an Okta app to allow SAML 2.0 sign-in
- Add your app's redirect URL (`http://localhost:3000/auth/sso/redirect` for development) to WorkOS

### Add environment variables

Create a `.env` file with the following values:

```bash
SESSION_SECRET='minimum 32-character key for user sessions'
WORKOS_API_KEY='your_workos_api_key'
WORKOS_CLIENT_ID='your_workos_client_id'
WORKOS_ORG_ID='your_workos_organization_id'
```

### Install dependencies

```bash
npm i
```

### Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000` to see the app and log in using your SSO connection.
