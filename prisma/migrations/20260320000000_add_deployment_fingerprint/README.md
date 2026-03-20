# 部署指纹追踪迁移

## 迁移信息
- **名称**: 20260320000000_add_deployment_fingerprint
- **日期**: 2026-03-20
- **用途**: 添加部署指纹追踪表，用于开源项目统计

## 新增表

### DeploymentFingerprint
用于追踪项目部署实例的匿名统计信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| fingerprint | VARCHAR(64) | 部署唯一指纹（SHA256哈希） |
| domain | VARCHAR(200) | 部署域名（可选） |
| firstSeenAt | DATETIME | 首次上报时间 |
| lastSeenAt | DATETIME | 最后上报时间 |
| reportCount | INT | 上报次数 |
| version | VARCHAR(30) | 项目版本号 |
| isActive | BOOLEAN | 是否活跃 |

## 索引
- `fingerprint`: UNIQUE 索引 + 普通索引
- `lastSeenAt`: 用于查询活跃部署
- `isActive`: 用于筛选活跃部署

## 执行迁移

### 方法一: 使用 Prisma Migrate
```bash
npx prisma migrate dev --name add_deployment_fingerprint
```

### 方法二: 直接执行 SQL
```bash
mysql -u username -p ai_tools < migration.sql
```

## 隐私说明

此表仅收集匿名部署数据：
- ✅ 部署指纹（哈希值，无法反向识别）
- ✅ 域名（来自环境变量）
- ✅ 版本号和时间戳
- ✅ 上报次数

**不包含任何用户数据或个人身份信息**

## 禁用追踪

如需禁用部署追踪，在 `.env` 文件中添加：
```bash
DISABLE_TRACKING=true
```

## 开源许可

本项目采用 AGPL-3.0 许可证，商业使用需获得授权。
