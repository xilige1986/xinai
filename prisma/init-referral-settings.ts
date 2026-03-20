// 初始化多级推广系统配置
// 在数据库中运行此脚本设置默认值

import { prisma } from '../src/lib/db';

async function initMultiLevelReferralSettings() {
  const settings = [
    { key: 'referralLevel2Enabled', value: 'true', description: '是否启用2级推广奖励' },
    { key: 'referralLevel3Enabled', value: 'true', description: '是否启用3级推广奖励' },
    { key: 'referralLevel2Reward', value: '5', description: '2级推广奖励积分' },
    { key: 'referralLevel3Reward', value: '3', description: '3级推广奖励积分' },
    { key: 'referralFounderOnly', value: 'true', description: '多级推广奖励是否仅限创始股东' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {}, // 如果存在则不更新
      create: setting,
    });
    console.log(`已设置: ${setting.key} = ${setting.value}`);
  }

  console.log('\n多级推广系统配置完成！');
  console.log('配置说明：');
  console.log('- referralLevel2Enabled: 是否启用2级推广');
  console.log('- referralLevel3Enabled: 是否启用3级推广');
  console.log('- referralLevel2Reward: 2级推广每邀请奖励积分（默认5）');
  console.log('- referralLevel3Reward: 3级推广每邀请奖励积分（默认3）');
  console.log('- referralFounderOnly: 多级推广是否仅限创始股东（默认true）');
}

initMultiLevelReferralSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
