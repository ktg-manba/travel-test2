-- ============================================
-- PDF下载表示例数据
-- ============================================
-- 注意：需要先运行 pdf-download-table.sql 或 supabase-install.sql 创建表结构
-- 此文件用于插入示例PDF数据

INSERT INTO pdf_downloads (uuid, file_name, file_url, description, cover_image_url, status, sort_order)
VALUES 
    (
        'pdf-guide-alipay-wechat',
        'Alipay and WeChat Pay Setup Guide',
        '/pdfs/payment-guide.pdf', -- 请替换为实际的PDF文件URL
        'Complete guide for overseas tourists to set up Alipay and WeChat Pay accounts',
        '/imgs/pdf/Gemini_Generated_Image_hm2rg7hm2rg7hm2r_副本.png',
        'active',
        1
    ),
    (
        'pdf-guide-city-travel',
        'China City Travel Guides',
        '/pdfs/city-travel-guides.pdf', -- 请替换为实际的PDF文件URL
        'Comprehensive travel guides for major Chinese cities including Beijing, Shanghai, Guangzhou, and more',
        '/imgs/pdf/Gemini_Generated_Image_hwa7pehwa7pehwa7.png',
        'active',
        2
    )
ON CONFLICT (uuid) DO UPDATE SET
    file_name = EXCLUDED.file_name,
    file_url = EXCLUDED.file_url,
    description = EXCLUDED.description,
    cover_image_url = EXCLUDED.cover_image_url,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

