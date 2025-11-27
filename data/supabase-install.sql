-- TravelKang Supabase Database Schema
-- 运行此SQL脚本在Supabase SQL Editor中创建所有必需的表

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nickname VARCHAR(255) DEFAULT '',
    avatar_url VARCHAR(255) DEFAULT '',
    locale VARCHAR(50) DEFAULT 'en',
    signin_type VARCHAR(50) DEFAULT 'email',
    signin_ip VARCHAR(255) DEFAULT '',
    signin_provider VARCHAR(50) DEFAULT 'email',
    signin_openid VARCHAR(255) DEFAULT '',
    invite_code VARCHAR(255) NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by VARCHAR(255) NOT NULL DEFAULT '',
    is_affiliate BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT unique_email_provider UNIQUE (email, signin_provider)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- ============================================
-- 2. 订单表 (orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_uuid VARCHAR(255) NOT NULL DEFAULT '',
    user_email VARCHAR(255) NOT NULL DEFAULT '',
    amount INT NOT NULL DEFAULT 0,
    interval VARCHAR(50) DEFAULT 'one-time',
    expired_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    stripe_session_id VARCHAR(255) DEFAULT '',
    credits INT NOT NULL DEFAULT 0,
    currency VARCHAR(50) DEFAULT 'USD',
    sub_id VARCHAR(255) DEFAULT '',
    sub_interval_count INT DEFAULT 0,
    sub_cycle_anchor INT DEFAULT 0,
    sub_period_end INT DEFAULT 0,
    sub_period_start INT DEFAULT 0,
    sub_times INT DEFAULT 0,
    product_id VARCHAR(255) DEFAULT '',
    product_name VARCHAR(255) DEFAULT '',
    valid_months INT DEFAULT 0,
    order_detail TEXT DEFAULT '',
    paid_at TIMESTAMPTZ,
    paid_email VARCHAR(255) DEFAULT '',
    paid_detail TEXT DEFAULT ''
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_user_uuid ON orders(user_uuid);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- 3. API密钥表 (apikeys)
-- ============================================
CREATE TABLE IF NOT EXISTS apikeys (
    id BIGSERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(100) DEFAULT '',
    user_uuid VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_apikeys_api_key ON apikeys(api_key);
CREATE INDEX IF NOT EXISTS idx_apikeys_user_uuid ON apikeys(user_uuid);
CREATE INDEX IF NOT EXISTS idx_apikeys_status ON apikeys(status);

-- ============================================
-- 4. 积分表 (credits)
-- ============================================
CREATE TABLE IF NOT EXISTS credits (
    id BIGSERIAL PRIMARY KEY,
    trans_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_uuid VARCHAR(255) NOT NULL,
    trans_type VARCHAR(50) NOT NULL,
    credits INT NOT NULL DEFAULT 0,
    order_no VARCHAR(255) DEFAULT '',
    expired_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_credits_trans_no ON credits(trans_no);
CREATE INDEX IF NOT EXISTS idx_credits_user_uuid ON credits(user_uuid);
CREATE INDEX IF NOT EXISTS idx_credits_trans_type ON credits(trans_type);
CREATE INDEX IF NOT EXISTS idx_credits_order_no ON credits(order_no);
CREATE INDEX IF NOT EXISTS idx_credits_expired_at ON credits(expired_at);

-- ============================================
-- 5. 文章表 (posts)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) DEFAULT '',
    title VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT '',
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft',
    cover_url VARCHAR(255) DEFAULT '',
    author_name VARCHAR(255) DEFAULT '',
    author_avatar_url VARCHAR(255) DEFAULT '',
    locale VARCHAR(50) DEFAULT 'en'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_uuid ON posts(uuid);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_locale ON posts(locale);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- 6. 联盟营销表 (affiliates)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
    id BIGSERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    invited_by VARCHAR(255) NOT NULL,
    paid_order_no VARCHAR(255) NOT NULL DEFAULT '',
    paid_amount INT NOT NULL DEFAULT 0,
    reward_percent INT NOT NULL DEFAULT 0,
    reward_amount INT NOT NULL DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_affiliates_user_uuid ON affiliates(user_uuid);
CREATE INDEX IF NOT EXISTS idx_affiliates_invited_by ON affiliates(invited_by);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_paid_order_no ON affiliates(paid_order_no);
CREATE INDEX IF NOT EXISTS idx_affiliates_created_at ON affiliates(created_at DESC);

-- ============================================
-- 7. 反馈表 (feedbacks)
-- ============================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    user_uuid VARCHAR(255),
    content TEXT DEFAULT '',
    rating INT DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_uuid ON feedbacks(user_uuid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- ============================================
-- 启用 Row Level Security (RLS)
-- ============================================
-- 注意：根据你的安全需求，你可能需要调整这些策略

-- 用户表 - 用户可以查看和更新自己的数据
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = uuid OR auth.email() = email);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = uuid OR auth.email() = email);

-- 订单表 - 用户可以查看自己的订单
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (
        user_uuid IN (SELECT uuid FROM users WHERE email = auth.email())
        OR user_email = auth.email()
    );

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (
        user_uuid IN (SELECT uuid FROM users WHERE email = auth.email())
        OR user_email = auth.email()
    );

-- API密钥表 - 用户可以管理自己的API密钥
ALTER TABLE apikeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own apikeys" ON apikeys
    FOR ALL USING (
        user_uuid IN (SELECT uuid FROM users WHERE email = auth.email())
    );

-- 积分表 - 用户可以查看自己的积分记录
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON credits
    FOR SELECT USING (
        user_uuid IN (SELECT uuid FROM users WHERE email = auth.email())
    );

-- 反馈表 - 用户可以创建和查看自己的反馈
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedbacks" ON feedbacks
    FOR ALL USING (
        user_uuid IN (SELECT uuid FROM users WHERE email = auth.email())
    );

-- 联盟营销表 - 用户可以查看自己的联盟记录
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliates" ON affiliates
    FOR SELECT USING (
        user_uuid IN (SELECT uuid FROM users WHERE email = auth.email())
        OR invited_by IN (SELECT uuid FROM users WHERE email = auth.email())
    );

-- 文章表 - 公开读取，只有管理员可以写入（需要额外配置）
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'published');

-- ============================================
-- 创建更新时间触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为users表添加更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为posts表添加更新时间触发器
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成提示
-- ============================================
-- 所有表已创建完成！
-- 
-- 注意事项：
-- 1. RLS策略可能需要根据你的具体需求进行调整
-- 2. 如果你的应用需要服务端访问（使用service_role_key），
--    可能需要创建绕过RLS的策略或使用服务端客户端
-- 3. 确保在Supabase Dashboard中配置了正确的认证提供者（Email和Google）

