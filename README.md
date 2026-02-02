# Statsig Node.js Server Integration Guide

A production-ready implementation for using Statsig Feature Gates, Dynamic Configs, and Parameter Store in Node.js with Express.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: v16 or higher
- **npm** or **yarn**
- **Statsig Account**: Get your Server Secret Key from [Statsig Console](https://console.statsig.com/)
- **TypeScript**: v4.5 or higher (recommended)

---

## Installation

### Start the Server

#### Development Mode (with auto-reload):

```bash
npm run dev
```

#### Production Mode:

```bash
# Build TypeScript to JavaScript
npm run build

# Start the server
npm start
```

---

## Project Structure

```
your-project/
├── server.ts              # Express server with routes
├── statsig.ts             # TeladocStatsig wrapper class
├── teladoc-user.ts        # TeladocUser utility class
├── .env                   # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## Configuration

### 1. Create `.env` File

Create a `.env` file in your project root:

```env
# Statsig Configuration
STATSIG_SERVER_SECRET=secret-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration (optional)
PORT=3000
NODE_ENV=development
```

**⚠️ Important:** Never commit your `.env` file. Add it to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### 2. Get Your Statsig Server Secret Key

1. Go to [Statsig Console](https://console.statsig.com/)
2. Navigate to **Settings** → **API Keys**
3. Copy your **Server Secret Key** (starts with `secret-`)
4. Paste it in your `.env` file

---

## API Endpoints

### 1. Feature Gates

Check if a feature is enabled for a user.

**Endpoint:** `GET /gate/:name`

**Parameters:**
- `:name` (path) - Gate name from Statsig console
- `userId` (query, optional) - User ID (defaults to "guest")
- `country` (query, optional) - User country (defaults to "US")
- `plan` (query, optional) - User plan (defaults to "free")

**Examples:**

```bash
# Check if feature is enabled for guest user
curl "http://localhost:3000/gate/new_feature"

# Check for specific user with premium plan
curl "http://localhost:3000/gate/new_feature?userId=user123&plan=premium"

# Check with country targeting
curl "http://localhost:3000/gate/new_feature?userId=user456&country=IN"
```

**Response:**

```json
{
  "enabled": true
}
```

---

### 2. Dynamic Config

Get configuration values that can change without redeployment.

**Endpoint:** `GET /config/:name`

**Parameters:**
- `:name` (path) - Config name from Statsig console
- `key` (query, optional) - Specific key to retrieve
- `userId`, `country`, `plan` (query, optional) - User attributes

**Examples:**

```bash
# Get entire config object
curl "http://localhost:3000/config/ui_settings?userId=user123"

# Get specific key from config
curl "http://localhost:3000/config/ui_settings?key=header_color&userId=user123"
```

**Response (full config):**

```json
{
  "header_color": "#1a73e8",
  "timeout": 5000,
  "features": {
    "dark_mode": true,
    "notifications": false
  }
}
```

**Response (specific key):**

```json
"#1a73e8"
```

---

### 3. Parameter Store

Get parameters - simpler than configs, typically single values or flat objects.

**Endpoint:** `GET /params/:name`

**Parameters:**
- `:name` (path) - Parameter store name from Statsig console
- `key` (query, optional) - Specific parameter key
- `userId`, `country`, `plan` (query, optional) - User attributes

**Examples:**

```bash
# Get all parameters
curl "http://localhost:3000/params/api_limits?userId=user123&plan=premium"

# Get specific parameter
curl "http://localhost:3000/params/api_limits?key=max_requests&userId=user123"
```

**Response (full params):**

```json
{
  "parameter": "api_limits",
  "value": {
    "max_requests": 10000,
    "rate_limit": 100
  }
}
```

**Response (specific key):**

```json
{
  "parameter": "api_limits",
  "value": 10000
}
```

---

## Architecture

### User Targeting

All endpoints support user targeting through query parameters:

- **`userId`**: Unique user identifier
- **`country`**: ISO country code (e.g., "US", "IN", "UK")
- **`plan`**: Custom attribute for plan type (e.g., "free", "premium", "enterprise")

You can extend this in `buildUser()` function to add more attributes.

### Environment Configuration

The SDK is initialized with an environment tier:

```typescript
const rollout = new TeladocStatsig({
  token,
  environment: { tier: "development" }, // or "staging", "production"
});
```

This allows you to have different configurations per environment in Statsig Console.

---

## Troubleshooting

### Common Issues

#### 1. **"STATSIG_SERVER_SECRET missing in .env"**

**Solution:** Create a `.env` file and add your Statsig Server Secret Key:

```env
STATSIG_SERVER_SECRET=secret-your-key-here
```

#### 2. **"Statsig SDK not initialized"**

**Solution:** Ensure `await rollout.initialize()` is called before starting the server. The provided code already handles this in `startServer()`.

#### 3. **Empty or null values returned**

**Possible causes:**
- Feature gate/config/parameter doesn't exist in Statsig Console
- Name mismatch (check spelling and casing)
- User doesn't match targeting rules
- SDK not fully initialized

**Debug steps:**
- Check console logs for `[Statsig Debug]` messages
- Verify the name exists in Statsig Console
- Try with default user first: `curl "http://localhost:3000/gate/your_gate"`

#### 4. **TypeScript errors**

**Solution:** Ensure all type definitions are installed:

```bash
npm install -D @types/express @types/node
```

---

## Testing in Statsig Console

### 1. Create a Feature Gate

1. Go to **Feature Gates** → **Create New**
2. Name it `new_feature`
3. Add targeting rules (optional)
4. Enable for 100% of users
5. Save

### 2. Create a Dynamic Config

1. Go to **Dynamic Configs** → **Create New**
2. Name it `ui_settings`
3. Add key-value pairs:
   ```json
   {
     "header_color": "#1a73e8",
     "timeout": 5000
   }
   ```
4. Save

### 3. Create a Parameter Store

1. Go to **Parameter Store** → **Create New**
2. Name it `api_limits`
3. Add parameters:
   ```json
   {
     "max_requests": 1000,
     "rate_limit": 10
   }
   ```
4. Save

---


## Production Deployment

### Environment Variables for Production

```env
STATSIG_SERVER_SECRET=secret-production-key
NODE_ENV=production
PORT=3000
```

## Additional Resources

- [Statsig Documentation](https://docs.statsig.com/)
- [Statsig Node.js SDK Reference](https://docs.statsig.com/server-core/node-core)
- [Statsig Console](https://console.statsig.com/)
- [Feature Flags Best Practices](https://docs.statsig.com/guides/best-practices)

---

## Support

For issues with:
- **This implementation**: Check the troubleshooting section above
- **Statsig SDK**: Visit [Statsig Support](https://www.statsig.com/contact)
- **General questions**: Open an issue in your repository

---

## License

MIT License - feel free to use this in your projects.

---

**Happy Feature Flagging! 🚀**