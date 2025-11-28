-- ============================================
-- PDF下载表 (pdf_downloads)
-- ============================================
CREATE TABLE IF NOT EXISTS pdf_downloads (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT DEFAULT '',
    cover_image_url TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sort_order INT DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_uuid ON pdf_downloads(uuid);
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_status ON pdf_downloads(status);
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_created_at ON pdf_downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_sort_order ON pdf_downloads(sort_order);

-- ============================================
-- RLS策略 (Row Level Security)
-- ============================================
-- PDF下载表 - 所有人可以查看激活状态的PDF
ALTER TABLE pdf_downloads ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看激活状态的PDF
CREATE POLICY "PDF downloads are viewable by everyone" ON pdf_downloads
    FOR SELECT USING (status = 'active');

-- 注意：如果需要管理员才能创建/更新/删除PDF记录，
-- 需要添加额外的策略或使用服务端客户端（service_role_key）

-- ============================================
-- 更新时间触发器
-- ============================================
-- 为pdf_downloads表添加更新时间触发器
CREATE TRIGGER update_pdf_downloads_updated_at
    BEFORE UPDATE ON pdf_downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 示例数据（可选）
-- ============================================
-- 如果需要插入示例数据，请运行 data/pdf-download-sample-data.sql 文件
-- 或者取消下面的注释并修改URL为实际的PDF文件路径：

-- INSERT INTO pdf_downloads (uuid, file_name, file_url, description, cover_image_url, status, sort_order)
-- VALUES 
--     (
--         'pdf-guide-alipay-wechat',
--         'Alipay and WeChat Pay Setup Guide',
--         '/pdfs/payment-guide.pdf', -- 请替换为实际的PDF文件URL
--         'Complete guide for overseas tourists to set up Alipay and WeChat Pay accounts',
--         '/imgs/pdf/Gemini_Generated_Image_hm2rg7hm2rg7hm2r_副本.png',
--         'active',
--         1
--     ),
--     (
--         'pdf-guide-city-travel',
--         'China City Travel Guides',
--         '/pdfs/city-travel-guides.pdf', -- 请替换为实际的PDF文件URL
--         'Comprehensive travel guides for major Chinese cities including Beijing, Shanghai, Guangzhou, and more',
--         '/imgs/pdf/Gemini_Generated_Image_hwa7pehwa7pehwa7.png',
--         'active',
--         2
--     )
-- ON CONFLICT (uuid) DO UPDATE SET
--     file_name = EXCLUDED.file_name,
--     file_url = EXCLUDED.file_url,
--     description = EXCLUDED.description,
--     cover_image_url = EXCLUDED.cover_image_url,
--     status = EXCLUDED.status,
--     sort_order = EXCLUDED.sort_order,
--     updated_at = NOW();

