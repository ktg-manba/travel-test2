# Google OAuth 配置指南（使用 Next-Auth）

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
     - `http://localhost:3000/api/auth/callback/google` (开发环境)
     - `https://your-domain.com/api/auth/callback/google` (生产环境)
7. 创建后，复制 **Client ID** 和 **Client Secret**

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```env
# Google OAuth Configuration
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Next-Auth Secret (必需)
AUTH_SECRET=your_random_secret_string
```

### 3. 生成 AUTH_SECRET

可以使用以下命令生成一个随机的 secret：

```bash
openssl rand -base64 32
```

或者访问：https://generate-secret.vercel.app/32

### 4. 重启开发服务器

配置完成后，重启开发服务器：

```bash
pnpm dev
```

## 重要提示

1. **回调URL格式** - Next-Auth 的回调URL格式是：`/api/auth/callback/google`
2. **AUTH_SECRET 是必需的** - Next-Auth 需要这个secret来加密session
3. **环境变量命名** - `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET` 不需要 `NEXT_PUBLIC_` 前缀（服务器端使用）

## 验证配置

配置完成后：
1. 重启开发服务器
2. 点击登录按钮
3. 点击 "Sign in with Google" 按钮
4. 应该能正常跳转到 Google 登录页面
5. 登录成功后会自动跳转回你的网站

## 故障排除

如果遇到问题：
1. 检查 Google Cloud Console 中的回调URL是否正确
2. 检查环境变量是否正确设置
3. 确保 `AUTH_SECRET` 已设置
4. 查看浏览器控制台和服务器日志中的错误信息

