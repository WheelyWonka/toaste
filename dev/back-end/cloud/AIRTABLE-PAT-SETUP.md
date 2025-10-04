# Airtable Personal Access Token (PAT) Setup

## 🚨 Important: API Keys Deprecated

**Airtable deprecated API keys in February 2024.** You must now use Personal Access Tokens (PATs).

## 🔑 How to Create a Personal Access Token

### Step 1: Go to Airtable Account Settings
1. **Log into Airtable**: https://airtable.com
2. **Click your profile** (top right)
3. **Go to "Account"**

### Step 2: Create Personal Access Token
1. **Scroll down** to "Personal access tokens"
2. **Click "Create new token"**
3. **Configure the token**:
   - **Name**: `Toasté Bike Polo Orders`
   - **Scopes**: 
     - ✅ `data.records:read`
     - ✅ `data.records:write`
   - **Bases**: Select your `Toasté Bike Polo Orders` base
4. **Click "Create token"**

### Step 3: Copy the Token
1. **Copy the token immediately** (starts with `pat`)
2. **You won't see it again!** Save it securely
3. **Format**: `patXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🔧 Environment Variable Setup

### In Netlify Dashboard:
```
AIRTABLE_PAT=patXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### In Local .env File:
```
AIRTABLE_PAT=patXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
NODE_ENV=production
```

## 🔒 Security Benefits of PATs

- ✅ **Scoped permissions**: Only access what you specify
- ✅ **Base-specific**: Only works with selected bases
- ✅ **Revocable**: Can be deleted anytime
- ✅ **Audit trail**: Track when and how it's used
- ✅ **More secure**: Better than old API keys

## 🚨 Important Notes

1. **Token Format**: Always starts with `pat`
2. **One-time view**: Copy immediately, can't see it again
3. **Secure storage**: Never commit to git or share publicly
4. **Base access**: Only works with bases you select during creation
5. **Scopes**: Only has permissions you explicitly grant

## 🔧 Troubleshooting

### "Invalid API key" Error
- ✅ Check token starts with `pat`
- ✅ Verify token is copied completely
- ✅ Ensure token hasn't expired
- ✅ Check token has correct scopes

### "Base not found" Error
- ✅ Verify Base ID is correct (starts with `app`)
- ✅ Ensure token has access to the base
- ✅ Check base name matches exactly

### "Insufficient permissions" Error
- ✅ Verify token has `data.records:read` scope
- ✅ Verify token has `data.records:write` scope
- ✅ Check token is linked to correct base

## 📚 Migration from API Keys

If you have old API keys:
1. **Create new PAT** following steps above
2. **Update environment variables** to use `AIRTABLE_PAT`
3. **Test the connection**
4. **Delete old API key** (if still accessible)

## 🎯 Quick Checklist

- [ ] Created PAT with correct name
- [ ] Selected correct scopes (read + write)
- [ ] Selected correct base
- [ ] Copied token (starts with `pat`)
- [ ] Updated environment variables
- [ ] Tested API connection
- [ ] Stored token securely
