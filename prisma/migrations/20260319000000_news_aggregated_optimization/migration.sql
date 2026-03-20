-- ============================================
-- 资讯系统优化 - 增量 SQL
-- 执行日期: 2026-03-19
-- 包含: News 表优化 + NewsSource 表 + NewsCrawlLog 表
-- ============================================

-- ============================================
-- 1. News 表优化（聚合新闻支持）
-- ============================================

-- 1.1 修改 content 字段为可选（NULL）
ALTER TABLE `News` MODIFY COLUMN `content` LONGTEXT NULL;

-- 1.2 新增 isAggregated 字段（标记是否为聚合新闻）
ALTER TABLE `News` ADD COLUMN `isAggregated` BOOLEAN NOT NULL DEFAULT false;

-- 1.3 为 isAggregated 添加索引
CREATE INDEX `News_isAggregated_idx` ON `News`(`isAggregated`);

-- ============================================
-- 2. 创建 NewsSource 表（新闻源配置）
-- ============================================
CREATE TABLE `NewsSource` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,                    -- 源站名称，如：机器之心
    `type` VARCHAR(20) NOT NULL,                     -- rss | api | manual
    `category` VARCHAR(50) NOT NULL DEFAULT 'AI资讯', -- 分类
    `rssUrl` VARCHAR(500) NULL,                      -- RSS订阅地址
    `apiUrl` VARCHAR(500) NULL,                      -- API端点
    `apiKey` VARCHAR(200) NULL,                      -- API密钥
    `apiParams` JSON NULL,                           -- 额外参数 {q: 'AI', language: 'zh'}
    `fetchInterval` INT NOT NULL DEFAULT 60,         -- 抓取间隔（分钟）
    `isActive` BOOLEAN NOT NULL DEFAULT true,        -- 是否启用
    `lastFetchedAt` DATETIME(3) NULL,                -- 上次抓取时间
    `fieldMapping` JSON NULL,                        -- 字段映射配置
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    INDEX `NewsSource_type_idx`(`type`),
    INDEX `NewsSource_isActive_idx`(`isActive`),
    INDEX `NewsSource_lastFetchedAt_idx`(`lastFetchedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 3. 创建 NewsCrawlLog 表（抓取日志）
-- ============================================
CREATE TABLE `NewsCrawlLog` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sourceId` INT NOT NULL,                         -- 新闻源ID
    `sourceType` VARCHAR(20) NOT NULL,               -- rss | api
    `status` VARCHAR(20) NOT NULL,                   -- success | error | partial
    `message` TEXT NULL,                             -- 日志信息
    `fetchedCount` INT NOT NULL DEFAULT 0,           -- 本次抓取数量
    `errorMessage` TEXT NULL,                        -- 错误详情
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `NewsCrawlLog_sourceId_idx`(`sourceId`),
    INDEX `NewsCrawlLog_status_idx`(`status`),
    INDEX `NewsCrawlLog_createdAt_idx`(`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 可选：迁移现有数据
-- 将已有 sourceUrl 的资讯标记为聚合新闻
-- ============================================
-- UPDATE `News` SET `isAggregated` = true WHERE `sourceUrl` IS NOT NULL AND `sourceUrl` != '';

-- ============================================
-- 回滚语句（如需回滚，请按相反顺序执行）
-- ============================================
-- DROP TABLE IF EXISTS `NewsCrawlLog`;
-- DROP TABLE IF EXISTS `NewsSource`;
-- DROP INDEX `News_isAggregated_idx` ON `News`;
-- ALTER TABLE `News` DROP COLUMN `isAggregated`;
-- ALTER TABLE `News` MODIFY COLUMN `content` LONGTEXT NOT NULL;
