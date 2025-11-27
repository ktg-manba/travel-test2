# Supabase 配置指南

## 错误提示
如果看到以下错误：
```
signup failed: Your project's URL and Key are required to create a Supabase client!
```

说明需要配置 Supabase 环境变量。

## 配置步骤

### 1. 获取 Supabase 凭证

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目（如果没有，先创建一个新项目）
3. 进入 **Settings** > **API**
4. 复制以下信息：
   - **Project URL** (例如: `https://xxxxx.supabase.co`)
   - **anon/public key** (以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 开头)

### 2. 创建环境变量文件

在项目根目录创建 `.env.local` 文件（如果不存在），添加以下内容：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 可选：Service Role Key（用于服务器端操作）
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL
NEXT_PUBLIC_WEB_URL=http://localhost:3000

# Google OAuth (可选)
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Stripe (用于支付功能)
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_PRIVATE_KEY=your_stripe_private_key
```

### 3. 替换示例值

将以下值替换为你的实际值：
- `your_supabase_project_url` → 你的 Supabase Project URL
- `your_supabase_anon_key` → 你的 Supabase anon/public key
- `your_supabase_service_role_key` → 你的 Supabase service_role key（可选）

### 4. 重启开发服务器

配置完成后，重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm dev
```

## 示例配置

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example
NEXT_PUBLIC_WEB_URL=http://localhost:3000
```

## 注意事项

1. **不要提交 `.env.local` 到 Git** - 该文件已添加到 `.gitignore`
2. **环境变量必须以 `NEXT_PUBLIC_` 开头** - 才能在客户端使用
3. **重启服务器** - 修改环境变量后必须重启开发服务器才能生效

## Google OAuth 配置（可选）

如果你想使用 Google 登录功能，需要：

1. **在 Supabase Dashboard 中启用 Google Provider**
   - 进入 **Authentication** > **Providers**
   - 找到 **Google** provider 并启用
   - 填入 Google OAuth Client ID 和 Secret

2. **详细配置步骤** - 请参考 `SUPABASE_GOOGLE_SETUP.md` 文件

## 验证配置

配置完成后，尝试注册一个新账户。如果仍然出现错误，请检查：
1. 环境变量是否正确设置
2. Supabase 项目是否已创建
3. 是否已重启开发服务器

## 常见错误

### 错误：Unsupported provider: provider is not enabled
**解决方案**：需要在 Supabase Dashboard > Authentication > Providers 中启用 Google provider。详见 `SUPABASE_GOOGLE_SETUP.md`

