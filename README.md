<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d38d7f6c-07b8-48af-8cc9-6e75c934ad65

## Run Locally

**Prerequisites:**  Node.js >= 20

### Environment Setup

1. Install Node.js (v24.x recommended):
   ```bash
   # On Debian/Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
   apt install nodejs -y
   ```

2. Verify installation:
   ```bash
   node --version  # Should be v20+
   npm --version
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (not necessary)

5. Run the app:
   ```bash
   npm run dev
   ```

## Configuration Changes

### vite.config.ts
Added `allowedHosts: ['.cnb.run']` to server config to allow access from cnb.run subdomains (required for cloud deployment environments).
