# Stripe 支付配置指南

## 环境变量配置

在 `.env.local` 文件中添加以下 Stripe 相关环境变量：

```env
# Stripe Keys
STRIPE_PRIVATE_KEY=sk_test_...  # Stripe Secret Key (测试环境)
STRIPE_PUBLIC_KEY=pk_test_...   # Stripe Publishable Key (测试环境)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook Secret (从 Stripe Dashboard 获取)

# 支付相关 URL
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_PAY_SUCCESS_URL=/my-orders
NEXT_PUBLIC_PAY_CANCEL_URL=/products
NEXT_PUBLIC_PAY_FAIL_URL=/products
```

## 获取 Stripe Keys

### 1. 创建 Stripe 账户
访问 [Stripe Dashboard](https://dashboard.stripe.com/)

### 2. 获取 API Keys
1. 进入 **Developers** > **API keys**
2. 复制 **Secret key** (以 `sk_test_` 或 `sk_live_` 开头)
3. 复制 **Publishable key** (以 `pk_test_` 或 `pk_live_` 开头)

### 3. 配置 Webhook
1. 进入 **Developers** > **Webhooks**
2. 点击 **Add endpoint**
3. 设置 Endpoint URL: `https://your-domain.com/api/stripe-notify`
4. 选择要监听的事件：
   - `checkout.session.completed` - 支付完成
   - `customer.subscription.deleted` - 订阅取消
   - `customer.subscription.updated` - 订阅更新
   - `invoice.payment_succeeded` - 订阅续费成功
   - `invoice.payment_failed` - 订阅续费失败
5. 复制 **Signing secret** (以 `whsec_` 开头)

## 支付流程

### 1. 创建支付会话 (`/api/checkout`)
- 用户选择产品并点击购买
- 前端调用 `/api/checkout` 创建 Stripe Checkout Session
- 返回 `session_id` 和 `public_key`
- 前端使用 Stripe.js 重定向到支付页面

### 2. 支付完成处理
有两种方式处理支付完成：

**方式 1: 支付成功页面回调** (`/pay-success/[session_id]`)
- Stripe 重定向到成功页面
- 服务器端验证 session 并更新订单状态

**方式 2: Webhook 回调** (`/api/stripe-notify`)
- Stripe 发送 webhook 事件
- 服务器端处理订单状态更新（推荐，更可靠）

### 3. 订单状态更新
- 订单状态从 `created` 更新为 `paid`
- 如果订单包含 credits，增加用户积分
- 处理推荐奖励（如果有）

## 支持的支付方式

### 国际支付
- 信用卡/借记卡 (Card)

### 中国支付（CNY 货币）
- 微信支付 (WeChat Pay)
- 支付宝 (Alipay)
- 信用卡/借记卡 (Card)

## 订阅管理

### 订阅类型
- `month` - 月度订阅
- `year` - 年度订阅
- `one-time` - 一次性支付

### 订阅事件处理
- `customer.subscription.deleted` - 订阅取消时，更新订单状态
- `customer.subscription.updated` - 订阅更新时，同步状态
- `invoice.payment_succeeded` - 订阅续费成功
- `invoice.payment_failed` - 订阅续费失败，发送通知

## 测试

### 测试卡号
使用以下测试卡号进行测试：

**成功支付:**
- 卡号: `4242 4242 4242 4242`
- 过期日期: 任意未来日期
- CVC: 任意 3 位数字
- 邮编: 任意 5 位数字

**需要 3D Secure:**
- 卡号: `4000 0025 0000 3155`

**支付失败:**
- 卡号: `4000 0000 0000 0002`

### 测试 Webhook
使用 Stripe CLI 测试 webhook：

```bash
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 转发 webhook 到本地
stripe listen --forward-to localhost:3000/api/stripe-notify
```

## 生产环境部署

### 1. 切换到生产环境
- 在 Stripe Dashboard 切换到 **Live mode**
- 更新环境变量为生产环境的 keys

### 2. 配置生产环境 Webhook
- Endpoint URL: `https://your-domain.com/api/stripe-notify`
- 选择需要的事件类型
- 复制生产环境的 Webhook Secret

### 3. 更新环境变量
```env
STRIPE_PRIVATE_KEY=sk_live_...  # 生产环境 Secret Key
STRIPE_PUBLIC_KEY=pk_live_...   # 生产环境 Publishable Key
STRIPE_WEBHOOK_SECRET=whsec_... # 生产环境 Webhook Secret
NEXT_PUBLIC_WEB_URL=https://your-domain.com
```

## 常见问题

### Q: Webhook 没有收到事件？
A: 检查：
1. Webhook URL 是否正确配置
2. Webhook Secret 是否正确
3. 服务器是否可以从外网访问
4. 使用 Stripe CLI 测试本地开发

### Q: 支付成功但订单状态未更新？
A: 检查：
1. Webhook 是否正常接收事件
2. 订单号是否正确传递
3. 数据库连接是否正常
4. 查看服务器日志

### Q: 订阅续费失败怎么办？
A: Stripe 会自动重试，如果多次失败：
1. 监听 `invoice.payment_failed` 事件
2. 发送通知给用户
3. 提供更新支付方式的链接

