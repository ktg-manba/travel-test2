# PDF 指南功能设置说明

## 概述

PDF 指南功能允许用户在 `/pdf-guides` 页面浏览、预览和下载 PDF 文件。PDF 信息存储在 Supabase 的 `pdf_downloads` 表中。

## 数据库设置

### 1. 创建表结构

在 Supabase SQL Editor 中运行以下文件之一：

- **完整版本**（包含 RLS 策略和触发器）：`data/pdf-download-table.sql`
- **完整数据库**（包含所有表）：`data/supabase-install.sql`
- **简化版本**（仅表结构）：`data/supabase-simple.sql`

### 2. 插入示例数据

运行 `data/pdf-download-sample-data.sql` 文件插入示例 PDF 数据：

```sql
INSERT INTO pdf_downloads (uuid, file_name, file_url, description, cover_image_url, status, sort_order)
VALUES 
    (
        'pdf-guide-alipay-wechat',
        'Alipay and WeChat Pay Setup Guide',
        '/pdfs/payment-guide.pdf',
        'Complete guide for overseas tourists to set up Alipay and WeChat Pay accounts',
        '/imgs/pdf/Gemini_Generated_Image_hm2rg7hm2rg7hm2r_副本.png',
        'active',
        1
    ),
    (
        'pdf-guide-city-travel',
        'China City Travel Guides',
        '/pdfs/city-travel-guides.pdf',
        'Comprehensive travel guides for major Chinese cities',
        '/imgs/pdf/Gemini_Generated_Image_hwa7pehwa7pehwa7.png',
        'active',
        2
    );
```

**注意**：请将 `file_url` 替换为实际的 PDF 文件 URL。

## 表结构说明

### pdf_downloads 表字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGSERIAL | 主键（自增） |
| uuid | VARCHAR(255) | 唯一标识符 |
| file_name | VARCHAR(255) | PDF 文件名 |
| file_url | TEXT | PDF 下载链接 |
| description | TEXT | PDF 描述信息 |
| cover_image_url | TEXT | PDF 封面图链接 |
| status | VARCHAR(50) | 状态：`active`（激活）/ `inactive`（停用） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间（自动更新） |
| sort_order | INT | 排序顺序 |

## 功能说明

### 1. PDF 列表展示

- 页面自动从数据库获取所有 `status = 'active'` 的 PDF
- 显示 PDF 封面图、文件名和描述
- 支持响应式布局（移动端和桌面端）

### 2. PDF 预览

- 点击卡片上的"预览"按钮可以查看大图预览
- 预览对话框显示封面图和详细信息

### 3. PDF 下载

- 用户需要登录才能下载 PDF
- 用户需要购买 PDF Bundle 或 Premium 套餐才能下载
- 下载时会检查用户订单权限

## 文件结构

```
app/
├── [locale]/(default)/(console)/pdf-guides/
│   └── page.tsx                    # PDF 指南页面
├── api/download-pdf/
│   └── route.ts                     # PDF 下载 API
models/
└── pdf.ts                           # PDF 数据模型
types/
└── pdf.d.ts                         # PDF 类型定义
data/
├── pdf-download-table.sql          # PDF 表创建 SQL
└── pdf-download-sample-data.sql    # 示例数据 SQL
public/
└── imgs/pdf/                        # PDF 封面图片
    ├── Gemini_Generated_Image_hm2rg7hm2rg7hm2r_副本.png
    └── Gemini_Generated_Image_hwa7pehwa7pehwa7.png
```

## API 接口

### GET /api/download-pdf

获取所有可用的 PDF 列表（无需登录）

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "pdfs": [
      {
        "uuid": "pdf-guide-alipay-wechat",
        "file_name": "Alipay and WeChat Pay Setup Guide",
        "file_url": "/pdfs/payment-guide.pdf",
        "description": "Complete guide...",
        "cover_image_url": "/imgs/pdf/...",
        "status": "active",
        "sort_order": 1
      }
    ]
  }
}
```

### POST /api/download-pdf

下载 PDF（需要登录和购买权限）

**请求体**：
```json
{
  "pdf_uuid": "pdf-guide-alipay-wechat"
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "pdf_url": "/pdfs/payment-guide.pdf",
    "download_url": "/pdfs/payment-guide.pdf",
    "file_name": "Alipay and WeChat Pay Setup Guide"
  }
}
```

## 使用步骤

1. **创建数据库表**
   - 在 Supabase SQL Editor 中运行 `data/pdf-download-table.sql`

2. **插入 PDF 数据**
   - 运行 `data/pdf-download-sample-data.sql` 或手动插入数据
   - 确保 `file_url` 指向实际的 PDF 文件位置
   - 确保 `cover_image_url` 指向实际的封面图片位置

3. **上传 PDF 文件**
   - 将 PDF 文件上传到 `public/pdfs/` 目录，或使用云存储服务
   - 如果使用云存储，更新 `file_url` 为完整的 URL

4. **访问页面**
   - 访问 `http://localhost:3000/pdf-guides` 查看 PDF 列表

## 注意事项

1. **图片路径**：封面图片路径应该以 `/` 开头（相对于 `public` 目录）
2. **PDF 文件**：PDF 文件可以存储在 `public/pdfs/` 目录或云存储服务中
3. **权限控制**：下载功能需要用户登录并购买相应套餐
4. **RLS 策略**：表已启用 RLS，所有人可以查看 `active` 状态的 PDF，但创建/更新/删除需要使用服务端客户端

## 自定义

### 添加新的 PDF

在 Supabase SQL Editor 中执行：

```sql
INSERT INTO pdf_downloads (uuid, file_name, file_url, description, cover_image_url, status, sort_order)
VALUES (
    'your-pdf-uuid',
    'Your PDF Name',
    '/pdfs/your-pdf.pdf',
    'PDF description',
    '/imgs/pdf/your-cover.png',
    'active',
    3
);
```

### 更新 PDF 信息

```sql
UPDATE pdf_downloads
SET file_name = 'New Name',
    description = 'New Description'
WHERE uuid = 'your-pdf-uuid';
```

### 停用 PDF

```sql
UPDATE pdf_downloads
SET status = 'inactive'
WHERE uuid = 'your-pdf-uuid';
```

