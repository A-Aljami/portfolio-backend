# ⚡ Quick Start - Deploy Backend in 5 Minutes

## Step 1: Initialize Git (30 seconds)
```bash
cd C:\Users\kalid\OneDrive\Pictures\portfolio\my-portfolio\backend
git init
git add .
git commit -m "Initial backend setup"
```

## Step 2: Push to GitHub (2 minutes)
1. Go to: https://github.com/new
2. Name: `portfolio-backend`
3. Keep it **Private**
4. Click "Create repository"
5. Run these commands (replace YOUR_USERNAME):
```bash
git remote add origin https://github.com/YOUR_USERNAME/portfolio-backend.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render (2 minutes)
1. Go to: https://dashboard.render.com/create?type=web
2. Connect GitHub → Select `portfolio-backend`
3. Fill in:
   - **Name**: `portfolio-backend`
   - **Runtime**: `Node`
   - **Build**: `npm install`
   - **Start**: `npm start`
4. Add Environment Variables:
   ```
   RECAPTCHA_SECRET_KEY = 6LexjfIrAAAAAIy1WbiK8NHdOqWQr0Xhc6zt8jZd
   EMAIL_USER = alialjoamee@gmail.com
   EMAIL_PASS = xfdufxusidssffzv
   ALLOWED_ORIGIN = https://alialjami.dev,https://www.alialjami.dev,http://localhost:5173
   PORT = 3001
   ```
5. Click "Create Web Service"

## Step 4: Get Your Backend URL
Wait 3-5 minutes for deployment. You'll get a URL like:
`https://portfolio-backend-xxxx.onrender.com`

## Step 5: Update Frontend
Update `my-portfolio/.env`:
```env
VITE_API_URL=https://portfolio-backend-xxxx.onrender.com
VITE_RECAPTCHA_SITE_KEY=6LexjfIrAAAAADu1v84UaE-eS52LyW1LR89znBHv
```

Restart dev server:
```bash
npm run dev
```

## Step 6: Update Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_API_URL` to your Render URL
3. Redeploy

## ✅ Done!
Test your contact form at https://alialjami.dev

---

## 📝 After First Deployment
Update `ALLOWED_ORIGIN` in Render to include your Vercel preview domain:
```
https://alialjami.dev,https://www.alialjami.dev,https://your-project.vercel.app,http://localhost:5173
```

---

**Full guide available in DEPLOYMENT_GUIDE.md**

