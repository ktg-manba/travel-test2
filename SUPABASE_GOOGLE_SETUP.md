# 在 Supabase 中启用 Google OAuth

## 错误提示
如果看到以下错误：
```
Unsupported provider: provider is not enabled
```

说明需要在 Supabase Dashboard 中启用 Google OAuth provider。

## 配置步骤

### 1. 在 Google Cloud Console 创建 OAuth 凭证

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 进入 **APIs & Services** > **Credentials**
4. 点击 **Create Credentials** > **OAuth client ID**
5. 选择 **Web application**
6. 配置：
   - **Name**: TravelKang (或你喜欢的名称)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (开发环境)
     - `https://your-domain.com` (生产环境)
   - **Authorized redirect URIs**:
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - 可以在 Supabase Dashboard > Authentication > URL Configuration 中找到完整的回调URL
7. 创建后，复制 **Client ID** 和 **Client Secret**

### 2. 在 Supabase Dashboard 中启用 Google Provider

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** > **Providers**
4. 找到 **Google** provider
5. 点击 **Enable Google**
6. 填入以下信息：
   - **Client ID (for OAuth)**: 从 Google Cloud Console 复制的 Client ID
   - **Client Secret (for OAuth)**: 从 Google Cloud Console 复制的 Client Secret
7. 点击 **Save**

### 3. 配置 Supabase Redirect URL

1. 在 Supabase Dashboard 中，进入 **Authentication** > **URL Configuration**
2. 找到 **Redirect URLs** 部分
3. 添加你的应用URL：
   - `http://localhost:3000/auth/callback` (开发环境)
   - `https://your-domain.com/auth/callback` (生产环境)
4. 点击 **Save**

### 4. 更新环境变量（可选）

如果你想通过环境变量控制是否显示Google登录按钮，在 `.env.local` 中添加：

```env
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
```

## 重要提示

1. **回调URL必须正确** - 确保在 Google Cloud Console 中配置的回调URL与 Supabase 提供的回调URL一致
2. **开发和生产环境** - 需要在 Google Cloud Console 中分别配置开发和生产环境的回调URL
3. **Supabase回调URL格式** - 通常是 `https://your-project-id.supabase.co/auth/v1/callback`

## 验证配置

配置完成后：
1. 重启开发服务器
2. 点击登录按钮
3. 点击 "Sign in with Google" 按钮
4. 应该能正常跳转到 Google 登录页面

## 故障排除

如果仍然遇到问题：
1. 检查 Google Cloud Console 中的回调URL是否正确
2. 检查 Supabase Dashboard 中的 Google provider 是否已启用
3. 检查 Supabase 的 Redirect URLs 配置
4. 查看浏览器控制台和服务器日志中的错误信息

