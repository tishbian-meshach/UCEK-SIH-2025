# Deployment Guide

This guide covers deploying the Team Formation App to various platforms.

## Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account
- Google Service Account setup (see main README)

### Steps

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings

3. **Environment Variables**
   In Vercel dashboard, add these environment variables:
   \`\`\`
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----"
   SPREADSHEET_ID=your-sheet-id
   \`\`\`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Test your deployed application

### Vercel Configuration

Create `vercel.json` for custom configuration:

\`\`\`json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "GOOGLE_SERVICE_ACCOUNT_EMAIL": "@google_service_account_email",
    "GOOGLE_PRIVATE_KEY": "@google_private_key",
    "SPREADSHEET_ID": "@spreadsheet_id"
  }
}
\`\`\`

## Netlify

### Steps

1. **Build Configuration**
   Create `netlify.toml`:
   \`\`\`toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"

   [build.environment]
     NEXT_PRIVATE_TARGET = "server"
   \`\`\`

2. **Deploy**
   - Connect GitHub repository to Netlify
   - Add environment variables in Netlify dashboard
   - Deploy

## Railway

### Steps

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub

2. **Environment Variables**
   Add in Railway dashboard:
   \`\`\`
   GOOGLE_SERVICE_ACCOUNT_EMAIL
   GOOGLE_PRIVATE_KEY
   SPREADSHEET_ID
   \`\`\`

3. **Deploy**
   Railway will automatically deploy on push

## Docker Deployment

### Dockerfile

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GOOGLE_SERVICE_ACCOUNT_EMAIL=${GOOGLE_SERVICE_ACCOUNT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
      - SPREADSHEET_ID=${SPREADSHEET_ID}
    env_file:
      - .env.local
\`\`\`

### Build and Run

\`\`\`bash
docker build -t team-formation-app .
docker run -p 3000:3000 --env-file .env.local team-formation-app
\`\`\`

## Environment Variables Security

### Production Best Practices

1. **Never commit secrets to git**
2. **Use environment variable management**:
   - Vercel: Built-in environment variables
   - AWS: Parameter Store or Secrets Manager
   - Azure: Key Vault
   - Google Cloud: Secret Manager

3. **Rotate keys regularly**
4. **Use least privilege access**

### Google Service Account Security

1. **Limit permissions**:
   - Only grant access to specific spreadsheet
   - Use read/write permissions only where needed

2. **Monitor usage**:
   - Check Google Cloud Console for API usage
   - Set up alerts for unusual activity

3. **Key rotation**:
   - Rotate service account keys every 90 days
   - Update environment variables after rotation

## Performance Optimization

### Caching

Add caching headers in `next.config.js`:

\`\`\`javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/students',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate'
          }
        ]
      }
    ]
  }
}
\`\`\`

### Database Connection Pooling

For high-traffic applications, consider:
1. Connection pooling for Google Sheets API
2. Redis caching for frequently accessed data
3. Rate limiting to prevent API quota exhaustion

## Monitoring

### Error Tracking

Add error tracking service:

\`\`\`bash
npm install @sentry/nextjs
\`\`\`

Configure in `sentry.client.config.js`:

\`\`\`javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
\`\`\`

### Analytics

Add analytics to track usage:

\`\`\`bash
npm install @vercel/analytics
\`\`\`

### Health Checks

Create health check endpoint in `pages/api/health.ts`:

\`\`\`typescript
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  })
}
\`\`\`

## Backup Strategy

### Google Sheets Backup

1. **Automated backups**:
   - Use Google Apps Script to create daily backups
   - Export to Google Drive or Cloud Storage

2. **Version control**:
   - Enable version history in Google Sheets
   - Regular manual backups before major changes

### Application Backup

1. **Code**: Stored in Git repository
2. **Configuration**: Environment variables documented
3. **Dependencies**: package-lock.json committed

## Scaling Considerations

### High Traffic

For applications with high concurrent usage:

1. **API Rate Limits**:
   - Google Sheets API: 300 requests per minute per project
   - Implement request queuing and retry logic

2. **Alternative Databases**:
   - Consider migrating to PostgreSQL or MongoDB
   - Keep Google Sheets for admin interface

3. **Caching Strategy**:
   - Redis for session data
   - CDN for static assets
   - API response caching

### Multiple Institutions

For multi-tenant deployment:

1. **Separate spreadsheets per institution**
2. **Subdomain routing**
3. **Environment variable per tenant**

## Troubleshooting Deployment

### Common Issues

1. **Build Failures**:
   \`\`\`bash
   # Check build logs
   npm run build
   
   # Fix TypeScript errors
   npm run type-check
   \`\`\`

2. **Environment Variable Issues**:
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure proper escaping of special characters

3. **API Quota Exceeded**:
   - Monitor Google Cloud Console
   - Implement exponential backoff
   - Consider caching strategies

4. **CORS Issues**:
   - Configure proper CORS headers
   - Check domain whitelist settings

### Debug Mode

Enable debug logging in production:

\`\`\`typescript
// In lib/sheets.ts
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
\`\`\`

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Google Cloud Console for API errors
