# OneKot API Deployment Guide

## Vercel Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- Vercel CLI installed (optional): `npm install -g vercel`

### Environment Variables

Before deploying, you need to configure the following environment variables in Vercel:

#### Required Variables:

```bash
NODE_ENV=production
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://adityatechdevelopers_db_user:<YOUR_PASSWORD>@onekotmap.3smudkz.mongodb.net/?appName=OnekotMap
MONGODB_DB_NAME=onekot_map_api

# JWT Configuration
JWT_SECRET=<GENERATE_STRONG_SECRET_KEY>
JWT_EXPIRE=7d

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Deployment Steps

#### Method 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub** (Already done ✓)
   ```bash
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import from GitHub: `OneKotApp/OnekotAPI`

3. **Configure Environment Variables**
   - In project settings → Environment Variables
   - Add all required variables listed above
   - **Important:** Use different values for production!

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically detect the configuration

#### Method 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables via CLI**
   ```bash
   vercel env add MONGODB_URI production
   vercel env add JWT_SECRET production
   vercel env add ALLOWED_ORIGINS production
   # Add other variables...
   ```

### Post-Deployment Configuration

#### 1. Update CORS Origins
After deployment, update `ALLOWED_ORIGINS` with your Vercel domain:
```bash
ALLOWED_ORIGINS=https://onekotapi.vercel.app,https://your-flutter-web-app.vercel.app
```

#### 2. MongoDB Atlas Network Access
- Go to MongoDB Atlas → Network Access
- Add Vercel's IP addresses or allow access from anywhere (0.0.0.0/0) for serverless functions

#### 3. Update Flutter App Base URL
In your Flutter app, update the API base URL to your Vercel deployment:
```dart
final String baseUrl = 'https://onekotapi.vercel.app';
```

### Vercel Configuration Files

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Important Notes

1. **JWT Secret**: Generate a strong secret for production:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **MongoDB Password**: Use a strong password and URL-encode special characters

3. **Rate Limiting**: Adjust rate limits based on your usage patterns

4. **CORS**: Only add trusted domains to ALLOWED_ORIGINS

5. **Logs**: View logs in Vercel dashboard → Your Project → Deployments → Logs

### Monitoring & Debugging

#### View Logs
- Go to Vercel Dashboard → Your Project
- Click on the deployment
- View "Functions" logs in real-time

#### Health Check
After deployment, test the health endpoint:
```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "OneKot API is running",
  "timestamp": "2026-01-30T10:00:00.000Z",
  "environment": "production"
}
```

#### API Documentation
Visit your deployed API docs:
```
https://your-app.vercel.app/api/v1
```

### Troubleshooting

#### Issue: MongoDB Connection Failed
- **Solution**: Check if MongoDB Atlas allows connections from 0.0.0.0/0 or add Vercel IPs

#### Issue: Environment Variables Not Working
- **Solution**: Ensure variables are set in Vercel dashboard and redeploy

#### Issue: CORS Errors
- **Solution**: Add your frontend domain to ALLOWED_ORIGINS environment variable

#### Issue: Rate Limit Too Low
- **Solution**: Increase RATE_LIMIT_MAX_REQUESTS in environment variables

#### Issue: 504 Gateway Timeout
- **Solution**: Vercel functions have a 10-second timeout. Optimize long-running queries.

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update ALLOWED_ORIGINS to include your custom domain

### Continuous Deployment

Once set up, Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Security Checklist

Before going live, ensure:

- [ ] Strong JWT_SECRET set
- [ ] MongoDB password is strong and URL-encoded
- [ ] CORS origins are restricted to your domains only
- [ ] Rate limiting is configured appropriately
- [ ] MongoDB Atlas network access is configured
- [ ] All environment variables are set in production
- [ ] .env file is in .gitignore (not pushed to repo)
- [ ] API endpoints tested in production

### Performance Optimization

1. **Database Indexes**: All critical queries have indexes (already configured)
2. **Response Compression**: Enabled via compression middleware
3. **Rate Limiting**: Protects against abuse
4. **Caching**: Consider implementing Redis for session management

### Support

For issues specific to:
- **Vercel Platform**: https://vercel.com/support
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/support
- **OneKot API**: Create an issue on GitHub

---

**Deployment Status**: Ready to Deploy ✅  
**Last Updated**: January 30, 2026
