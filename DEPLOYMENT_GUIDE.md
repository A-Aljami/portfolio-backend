# 🚀 Deploy Backend to Render - Step-by-Step Guide

## Prerequisites
- GitHub account
- Render account (free) - Sign up at https://render.com
- Your backend code ready

---

## Step 1: Push Backend to GitHub

### 1.1 Initialize Git Repository
```bash
cd C:\Users\kalid\OneDrive\Pictures\portfolio\my-portfolio\backend
git init
```

### 1.2 Create Initial Commit
```bash
git add .
git commit -m "Initial backend setup for portfolio contact form"
```

### 1.3 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `portfolio-backend` (or any name you prefer)
3. Description: "Backend API for portfolio contact form with reCAPTCHA v3"
4. **Keep it Private** (since it contains sensitive configurations)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 1.4 Push to GitHub
Copy the commands from GitHub's "push an existing repository" section:
```bash
git remote add origin https://github.com/YOUR_USERNAME/portfolio-backend.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Render

### 2.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** button → Select **"Web Service"**
3. Connect your GitHub account if not already connected
4. Find and select your `portfolio-backend` repository
5. Click **"Connect"**

### 2.2 Configure Web Service

Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `portfolio-backend` (or any name) |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

| Key | Value |
|-----|-------|
| `RECAPTCHA_SECRET_KEY` | `6LexjfIrAAAAAIy1WbiK8NHdOqWQr0Xhc6zt8jZd` |
| `EMAIL_USER` | `alialjoamee@gmail.com` |
| `EMAIL_PASS` | `xfdufxusidssffzv` |
| `ALLOWED_ORIGIN` | `https://alialjami.dev,https://www.alialjami.dev,http://localhost:5173` |
| `PORT` | `3001` |

**Note:** Add your Vercel preview domain later once you know it (e.g., `https://my-portfolio-xyz.vercel.app`)

### 2.4 Deploy
1. Click **"Create Web Service"** at the bottom
2. Render will automatically:
   - Build your app (`npm install`)
   - Start your server (`npm start`)
   - Assign a URL like: `https://portfolio-backend-xxxx.onrender.com`

⏱️ **Wait 2-5 minutes** for the first deployment to complete.

---

## Step 3: Verify Deployment

### 3.1 Test Health Endpoint
Once deployed, you'll see a URL like: `https://portfolio-backend-xxxx.onrender.com`

1. Copy your Render URL
2. Open in browser: `https://YOUR-RENDER-URL.onrender.com/api/health`
3. You should see: `{"status":"OK","message":"Server is running"}`

✅ If you see this, your backend is live!

### 3.2 Test CORS (Optional)
Open browser console on `http://localhost:5173` and run:
```javascript
fetch('https://YOUR-RENDER-URL.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## Step 4: Connect Frontend to Backend

### 4.1 Update Local Frontend `.env`
```env
VITE_API_URL=https://YOUR-RENDER-URL.onrender.com
VITE_RECAPTCHA_SITE_KEY=6LexjfIrAAAAADu1v84UaE-eS52LyW1LR89znBHv
```

### 4.2 Test Locally
1. Restart Vite dev server: `npm run dev`
2. Open contact form
3. Submit a test message
4. Check your email!

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Configure Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com`
   - `VITE_RECAPTCHA_SITE_KEY` = `6LexjfIrAAAAADu1v84UaE-eS52LyW1LR89znBHv`
5. Apply to: **Production, Preview, and Development**

### 5.2 Redeploy Frontend
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
   - OR push a new commit to trigger auto-deploy

### 5.3 Update Backend CORS (Important!)
Once you have your Vercel URL (e.g., `https://my-portfolio-xyz.vercel.app`):

1. Go back to Render Dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Update `ALLOWED_ORIGIN` to include your Vercel domains:
   ```
   https://alialjami.dev,https://www.alialjami.dev,https://my-portfolio-xyz.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Step 6: Update reCAPTCHA Domains

1. Go to https://www.google.com/recaptcha/admin
2. Select your site key
3. Under **Domains**, add:
   - `alialjami.dev`
   - `www.alialjami.dev`
   - `localhost` (for testing)
   - Your Vercel preview domains if needed
4. Save

---

## 🎉 You're Done!

### Test End-to-End:
1. Visit https://alialjami.dev
2. Fill out contact form
3. Submit
4. Check your email inbox!

---

## 📊 Monitor Your Backend

### Render Dashboard Features:
- **Logs**: View real-time server logs
- **Metrics**: CPU, Memory usage
- **Events**: Deployment history
- **Shell**: Access terminal if needed

### Useful Render Commands:
- **Manual Deploy**: Click "Manual Deploy" → "Deploy latest commit"
- **Restart**: Click "Manual Deploy" → "Clear build cache & deploy"
- **Environment**: Update env vars anytime (triggers redeploy)

---

## 🚨 Troubleshooting

### Problem: CORS Error
**Solution**: Make sure `ALLOWED_ORIGIN` includes your frontend domain

### Problem: reCAPTCHA Failed
**Solution**: 
- Check `RECAPTCHA_SECRET_KEY` matches your site key
- Verify domains in Google reCAPTCHA admin
- Check console for score (must be >= 0.5)

### Problem: Email Not Sending
**Solution**:
- Verify `EMAIL_USER` and `EMAIL_PASS` are correct
- Make sure Gmail "App Passwords" is enabled (not regular password)
- Check Render logs for errors

### Problem: 503 Service Unavailable
**Solution**: Free Render services sleep after 15 min of inactivity. First request will wake it up (takes ~30 seconds)

---

## 💡 Pro Tips

1. **Keep Render awake**: Use a service like UptimeRobot to ping your backend every 14 minutes
2. **Monitor logs**: Check Render logs regularly for any errors
3. **Use .env.example**: Create a template without real credentials for Git
4. **Enable auto-deploy**: Render auto-deploys on new commits to `main` branch
5. **Upgrade if needed**: Free tier sleeps after inactivity; $7/mo keeps it always-on

---

## 📚 Additional Resources

- Render Docs: https://render.com/docs
- Node.js on Render: https://render.com/docs/deploy-node-express-app
- Environment Variables: https://render.com/docs/environment-variables

---

**Need help?** Check Render's excellent documentation or their community forum!

