# 全渠道选品 Agent — 配置手册

> ⚠️ 此文件是写死的配置，任何 session 执行选品任务时必须读取此文件

## 环境变量

| 变量名 | 用途 | 来源 |
|--------|------|------|
| `SEMRUSH_API_KEY` | SEO 关键词调研 | 系统环境变量（已配置） |
| `FB_ADS_TOKEN` | Facebook Ads Library 查询 | `.env.local` 或 `$FB_ADS_TOKEN` |
| `NOTION_API_KEY` | Notion Bot DB 去重 | 系统环境变量（已配置，但 DB 未授权） |
| `GEMINI_API_KEY` | AI 翻译/分析 | `~/.bashrc`（已配置） |

## Facebook Ads Token

Token 已保存在 `.env.local`，执行脚本前加载：
```bash
source /tmp/powerful-trendplus/.env.local
# 或 export FB_ADS_TOKEN=<token>
```

**注意：** Token 需要 App 有 `ads_read` 权限。如果返回 error code 10 / subcode 2332002，
说明 App 权限未开启，需要在 https://developers.facebook.com → App Review 申请 "Ads Library API"。

## 竞品列表（固定）

```
photoroom.com, remini.ai, fotor.com, picsart.com, faceapp.com, cutout.pro
```

扩展列表: remove.bg, pixlr.com, lensaai.com

## 去重数据源

1. **Sitemap**: `https://art.myshell.ai/sitemap.xml` → 子 sitemap `enpage.xml`
2. **CMS Base44**: `https://app.base44.com/api` — 已创建 Bot 去重
3. **Notion Bot DB**: `1113f81ff51e802f8056d66c76a9f9e6` — 需要 DB 授权给 Integration

## 输出固定结构

每条记录必须包含以下字段：
```json
{
  "keyword": "blue background",
  "func_cn": "蓝色背景生成",
  "kd": 42,
  "volume": 49500,
  "region": "US",
  "comp_url": "https://...",
  "comp_domain": "photoroom.com",
  "coverage": "new|exists_sitemap|exists_cms|exists_notion|duplicate",
  "dedup_source": "",
  "fb_ads_count": 0,
  "fb_top_advertiser": "",
  "gap_score": 85.2,
  "priority": "high|medium|low"
}
```

## 执行命令

```bash
cd /tmp/powerful-trendplus
source .env.local 2>/dev/null
python3 scripts/run_full_research.py
```

输出: `data/research_YYYY-MM-DD.json` + stdout 表格

## Gap Score 算法

```
gap_score = volume_score(max 40) + kd_score(max 30) + fb_ads_score(max 15) + base(15) + dedup_penalty(-30)
priority: ≥70 = high, ≥45 = medium, <45 = low
```
