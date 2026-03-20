-- ============================================
-- 部署指纹追踪表 - 用于开源项目统计
-- ============================================
-- 创建时间: 2026-03-20
-- 用途: 统计项目部署数量，防止商业盗用
-- 注意: 此表仅存储匿名部署信息，不包含任何用户数据
-- ============================================

-- 创建 DeploymentFingerprint 表
CREATE TABLE `DeploymentFingerprint` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `fingerprint` VARCHAR(64) NOT NULL,
    `domain` VARCHAR(200) NULL,
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL,
    `reportCount` INT NOT NULL DEFAULT 1,
    `version` VARCHAR(30) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `DeploymentFingerprint_fingerprint_key` (`fingerprint`),
    INDEX `DeploymentFingerprint_fingerprint_idx` (`fingerprint`),
    INDEX `DeploymentFingerprint_lastSeenAt_idx` (`lastSeenAt`),
    INDEX `DeploymentFingerprint_isActive_idx` (`isActive`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 可选: 添加表注释说明用途
-- ============================================
-- ALTER TABLE `DeploymentFingerprint` COMMENT = '开源项目部署指纹追踪表，用于统计部署数量';

-- ============================================
-- 验证表创建成功
-- ============================================
-- DESCRIBE `DeploymentFingerprint`;

-- ============================================
-- 禁用追踪方法:
-- 在 .env 文件中设置: DISABLE_TRACKING=true
-- ============================================
