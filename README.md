<img style="width: 128px; height: 128px" src="static/favicon.svg" /><h1 style="font-size: 48px"><a href="https://bliptext.com">Bliptext.com</a> - the wiki where you edit a word each 5min</h1>
[Privacy Policy](https://bliptext.com/legal/privacy) | [Terms of Service](https://bliptext.com/legal/terms) | [License](LICENSE.md) | [YouTube video](about:blank)

## About
We ported **2,112,863** (2.1 million) Wikipedia articles and removed edit restrictions.

Create an account, find any article (or pick from the most active ones), and edit it live alongside others.

https://github.com/user-attachments/assets/1be617e2-c907-4d90-8d79-86b9216b6169

Get your friends to vandalize pages, completely rewrite them and shape Bliptext into a misinformation-fest!

## Images
Desktop

![Main Page - Light Mode](/github_assets/main_page_lightmode.png)

Mobile

<div style="display: flex; gap: 10px;">
    <img src="github_assets/mobile_bliptext_1.png" width="200" />
    <img src="github_assets/mobile_bliptext_2.png" width="200" />
    <img src="github_assets/mobile_bliptext_3.png" width="200" />
</div>

Custom markdown flavor
1. Summary tag (intended for one-time use)
<div style="display: flex; gap: 10px;">
    <img src="github_assets/format_1.png" width="300" />
    <img src="github_assets/format_2.png" width="300" />
</div>
2. Wikibox tag (intended for multiple visual examples)
<div style="display: flex; gap: 10px;">
    <img src="github_assets/format_3.png" width="300" />
    <img src="github_assets/format_4.png" width="300" />
</div>

## Note
- Our Markdown format differs from Wikipedia's utter horrendousness.
- While we've automatically converted Wikipedia articles to our simplified format, some information may be missing. This project is meant to be a fun alternative, not a replacement or competitor to Wikipedia.
- Only administrators can create new articles. This helps maintain quality by building upon our existing collection of well-structured content.

## Self-host

### 1. Installation

```bash
npm install
cp .env.example .env
```

Configure your environment variables in `.env`:
```plaintext
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
BETTER_AUTH_SECRET=<generate-a-random-string>
PUBLIC_BETTER_AUTH_URL=http://localhost:3000
PUBLIC_WEBSOCKET_URL=ws://localhost:8080
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>
JWT_SECRET=<generate-a-random-string>
REDIS_URL=<your-redis-url>
SITE_URL=http://localhost:3000
PUBLIC_TURNSTILE_SITE_KEY=<your-turnstile-site-key>
TURNSTILE_SECRET_KEY=<your-turnstile-secret-key>
```

### 2. Database Setup

Start PostgreSQL using Docker:
```bash
npm run db:start
```

Push the database schema:
```bash
npm run db:push
```

### 3. Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### EXTRA: WebSocket Server

The WebSocket server is required for real-time features.

1. Run these commands:

```bash
cd websocket
cp .env.example .env
```

2. Then configure the `.env` variables:
```plaintext
REDIS_URL=<your-redis-url>
SITE_URL=http://localhost:3000
TURNSTILE_SECRET_KEY=<your-turnstile-secret-key>
```

3. Run the server:
```
bun main.ts
```

## EXTRA: Database

Build and run using Docker:
```bash
docker build \
  --build-arg DISCORD_CLIENT_ID=your_discord_id \
  --build-arg DISCORD_CLIENT_SECRET=your_discord_secret \
  --build-arg DATABASE_URL=your_database_url \
  --build-arg REDIS_URL=your_redis_url \
  --build-arg REDIS_TOKEN=your_redis_token \
  -t app-name .

# Run the container
docker run -p 3000:3000 app-name
```

# Contributing
If you wish to contribute, you are free to do so. Please keep in mind:
- Don't open pull requests that simply fix grammatical issues or such. Open an issue instead.
- Don't submit "troll" pull requests.
- Don't submit pull requests that rewrite a big part of the project. **Please create a GitHub issue and ask if such a rewrite is welcome before starting.**
  - Examples of "big rewrites" include:
    - Changing the core architecture (programming language / structure)
    - Switching to a different framework or major library
  - Why this matters:
    - They may conflict with planned future changes
    - The maintainers might already be working on similar improvements
    - We don't want to waste your & our time

# License
This project is licensed under **Attribution-NonCommercial 2.0 International**.
### You are free to:
- 📩✅ Share — copy and redistribute the material in any medium or format
- 🔁✅ Adapt — remix, transform, and build upon the material

The licensor cannot revoke these freedoms as long as you follow the license terms.

### Under the following terms:
- 👤✅ Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
- 💵❌ NonCommercial — You may not use the material for commercial purposes.
- 📜❌ No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.

### Please refer to [CC BY-NC 2.0](https://creativecommons.org/licenses/by-nc/2.0/deed.en) for more information.

Created by FaceDev under [outpoot](https://outpoot.com).
