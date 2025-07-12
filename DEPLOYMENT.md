# 🚀 Deployment Guide: Hosting Your Multiplayer Game Server

## Quick Start - Railway (Recommended)

**Railway is the easiest way to deploy your server:**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway add
   railway deploy
   ```

3. **Configure Environment Variables**
   - Go to your Railway dashboard
   - Add these environment variables:
     ```
     NODE_ENV=production
     PORT=3001
     ```

4. **Update Client Connection**
   - Get your Railway URL (e.g., `https://your-app-name.railway.app`)
   - Update `src/multiplayer/MultiplayerManager.ts`:
     ```typescript
     public connect(serverUrl: string = 'https://your-app-name.railway.app'): Promise<boolean>
     ```

## Alternative Deployment Options

### 1. Render (Free Tier Available)

1. **Create Account**: [render.com](https://render.com)
2. **Connect GitHub**: Link your repository
3. **Create Web Service**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `NODE_ENV=production`

### 2. Heroku

```bash
# Install Heroku CLI
heroku create your-game-server-name
heroku config:set NODE_ENV=production
git push heroku main
```

### 3. DigitalOcean App Platform

1. **Create Account**: [digitalocean.com](https://digitalocean.com)
2. **App Platform**: Create new app
3. **Connect Repository**: Link GitHub
4. **Configure**:
   - Build Command: `npm install`
   - Run Command: `npm start`

## Client Configuration

After deploying, update your client to connect to the production server:

**Update `src/multiplayer/MultiplayerManager.ts`:**
```typescript
public connect(serverUrl: string = 'https://YOUR-DEPLOYED-URL.com'): Promise<boolean>
```

**Update server CORS in `server/index.js`:**
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://your-game-domain.com", "https://your-game-domain.netlify.app"]
    : ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true
};
```

## Environment Variables

Set these on your hosting platform:

```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

## Testing Your Deployment

1. **Health Check**: Visit `https://your-server.com/health`
2. **Status Check**: Visit `https://your-server.com/status`
3. **Game Connection**: Players should be able to connect and challenge each other

## Security Considerations

- **CORS**: Update allowed origins for production
- **Rate Limiting**: Consider adding rate limiting for production
- **SSL/TLS**: All major platforms provide HTTPS automatically

## Troubleshooting

**Common Issues:**
- **Connection Failed**: Check CORS settings
- **Port Issues**: Ensure `PORT` environment variable is set
- **WebSocket Errors**: Verify WebSocket support on your platform

**Logs:**
- Railway: `railway logs`
- Heroku: `heroku logs --tail`
- Render: Check dashboard logs

## Cost Estimates

- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier available
- **Heroku**: $7/month (Basic dyno)
- **DigitalOcean**: $5/month (Basic app)

## Next Steps

1. Deploy your server using Railway
2. Update client connection URL
3. Share your game URL with friends
4. Monitor server health and logs
5. Scale up as needed

Your multiplayer game server is now ready for global PvP battles! 🎮⚔️ 