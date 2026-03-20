/**
 * 常用汉字转拼音映射表（简化版）
 * 包含常见汉字，用于生成 URL 友好的 slug
 */
const pinyinMap: Record<string, string> = {
  // A
  '阿': 'a', '啊': 'a', '埃': 'ai', '挨': 'ai', '唉': 'ai', '哀': 'ai', '皑': 'ai', '癌': 'ai',
  '矮': 'ai', '艾': 'ai', '爱': 'ai', '隘': 'ai', '碍': 'ai', '安': 'an', '氨': 'an', '俺': 'an',
  '岸': 'an', '按': 'an', '案': 'an', '暗': 'an', '昂': 'ang', '盎': 'ang', '凹': 'ao', '熬': 'ao',
  '翱': 'ao', '袄': 'ao', '傲': 'ao', '奥': 'ao', '澳': 'ao', '懊': 'ao', '八': 'ba', '巴': 'ba',
  '叭': 'ba', '扒': 'ba', '吧': 'ba', '疤': 'ba', '拔': 'ba', '跋': 'ba', '把': 'ba', '靶': 'ba',
  '坝': 'ba', '爸': 'ba', '罢': 'ba', '霸': 'ba', '白': 'bai', '百': 'bai', '柏': 'bai', '摆': 'bai',
  '拜': 'bai', '班': 'ban', '斑': 'ban', '搬': 'ban', '板': 'ban', '版': 'ban', '办': 'ban', '半': 'ban',
  '伴': 'ban', '扮': 'ban', '拌': 'ban', '瓣': 'ban', '邦': 'bang', '帮': 'bang', '绑': 'bang', '榜': 'bang',
  '膀': 'bang', '傍': 'bang', '棒': 'bang', '谤': 'bang', '包': 'bao', '胞': 'bao', '剥': 'bao', '薄': 'bao',
  '宝': 'bao', '饱': 'bao', '保': 'bao', '堡': 'bao', '报': 'bao', '抱': 'bao', '豹': 'bao', '爆': 'bao',
  '卑': 'bei', '杯': 'bei', '悲': 'bei', '碑': 'bei', '北': 'bei', '贝': 'bei', '备': 'bei', '背': 'bei',
  '倍': 'bei', '被': 'bei', '辈': 'bei', '本': 'ben', '苯': 'ben', '笨': 'ben', '崩': 'beng', '绷': 'beng',
  '泵': 'beng', '蹦': 'beng', '逼': 'bi', '鼻': 'bi', '比': 'bi', '彼': 'bi', '笔': 'bi', '币': 'bi',
  '必': 'bi', '毕': 'bi', '闭': 'bi', '辟': 'bi', '壁': 'bi', '避': 'bi', '臂': 'bi', '边': 'bian',
  '编': 'bian', '鞭': 'bian', '扁': 'bian', '辨': 'bian', '辩': 'bian', '标': 'biao', '表': 'biao', '别': 'bie',
  '宾': 'bin', '滨': 'bin', '兵': 'bing', '冰': 'bing', '丙': 'bing', '柄': 'bing', '饼': 'bing', '并': 'bing',
  '病': 'bing', '玻': 'bo', '波': 'bo', '剥': 'bo', '播': 'bo', '脖': 'bo', '伯': 'bo', '博': 'bo',
  '薄': 'bo', '搏': 'bo', '膊': 'bo', '卜': 'bo', '补': 'bu', '捕': 'bu', '不': 'bu', '布': 'bu',
  '步': 'bu', '部': 'bu', '擦': 'ca', '猜': 'cai', '才': 'cai', '材': 'cai', '财': 'cai', '裁': 'cai',
  '采': 'cai', '彩': 'cai', '菜': 'cai', '蔡': 'cai', '参': 'can', '餐': 'can', '残': 'can', '蚕': 'can',
  '惨': 'can', '灿': 'can', '仓': 'cang', '苍': 'cang', '舱': 'cang', '藏': 'cang', '操': 'cao', '糙': 'cao',
  '曹': 'cao', '槽': 'cao', '草': 'cao', '册': 'ce', '侧': 'ce', '测': 'ce', '策': 'ce', '层': 'ceng',
  '曾': 'ceng', '叉': 'cha', '差': 'cha', '插': 'cha', '茶': 'cha', '查': 'cha', '察': 'cha', '岔': 'cha',
  '差': 'chai', '拆': 'chai', '柴': 'chai', '缠': 'chan', '产': 'chan', '铲': 'chan', '颤': 'chan', '昌': 'chang',
  '长': 'chang', '肠': 'chang', '尝': 'chang', '偿': 'chang', '厂': 'chang', '场': 'chang', '敞': 'chang', '畅': 'chang',
  '倡': 'chang', '唱': 'chang', '超': 'chao', '抄': 'chao', '吵': 'chao', '炒': 'chao', '车': 'che', '扯': 'che',
  '彻': 'che', '撤': 'che', '沉': 'chen', '陈': 'chen', '晨': 'chen', '衬': 'chen', '称': 'cheng', '趁': 'chen',
  '称': 'cheng', '撑': 'cheng', '成': 'cheng', '承': 'cheng', '城': 'cheng', '乘': 'cheng', '程': 'cheng', '惩': 'cheng',
  '秤': 'cheng', '吃': 'chi', '池': 'chi', '迟': 'chi', '持': 'chi', '尺': 'chi', '齿': 'chi', '耻': 'chi',
  '斥': 'chi', '赤': 'chi', '翅': 'chi', '充': 'chong', '冲': 'chong', '虫': 'chong', '崇': 'chong', '抽': 'chou',
  '仇': 'chou', '筹': 'chou', '酬': 'chou', '丑': 'chou', '臭': 'chou', '出': 'chu', '初': 'chu', '除': 'chu',
  '础': 'chu', '储': 'chu', '楚': 'chu', '处': 'chu', '触': 'chu', '川': 'chuan', '穿': 'chuan', '传': 'chuan',
  '船': 'chuan', '喘': 'chuan', '串': 'chuan', '窗': 'chuang', '床': 'chuang', '创': 'chuang', '吹': 'chui', '垂': 'chui',
  '锤': 'chui', '春': 'chun', '纯': 'chun', '唇': 'chun', '词': 'ci', '辞': 'ci', '慈': 'ci', '磁': 'ci',
  '雌': 'ci', '此': 'ci', '次': 'ci', '刺': 'ci', '从': 'cong', '匆': 'cong', '葱': 'cong', '聪': 'cong',
  '丛': 'cong', '凑': 'cou', '粗': 'cu', '促': 'cu', '醋': 'cu', '催': 'cui', '摧': 'cui', '存': 'cun',
  '寸': 'cun', '措': 'cuo', '错': 'cuo', '达': 'da', '答': 'da', '打': 'da', '大': 'da', '呆': 'dai',
  '代': 'dai', '带': 'dai', '待': 'dai', '怠': 'dai', '贷': 'dai', '袋': 'dai', '逮': 'dai', '戴': 'dai',
  '丹': 'dan', '单': 'dan', '担': 'dan', '胆': 'dan', '旦': 'dan', '但': 'dan', '诞': 'dan', '弹': 'dan',
  '蛋': 'dan', '当': 'dang', '挡': 'dang', '党': 'dang', '荡': 'dang', '刀': 'dao', '导': 'dao', '岛': 'dao',
  '倒': 'dao', '蹈': 'dao', '到': 'dao', '盗': 'dao', '道': 'dao', '稻': 'dao', '得': 'de', '德': 'de',
  '灯': 'deng', '登': 'deng', '等': 'deng', '邓': 'deng', '堤': 'di', '低': 'di', '滴': 'di', '迪': 'di',
  '敌': 'di', '笛': 'di', '底': 'di', '抵': 'di', '地': 'di', '弟': 'di', '帝': 'di', '递': 'di',
  '第': 'di', '颠': 'dian', '典': 'dian', '点': 'dian', '电': 'dian', '店': 'dian', '垫': 'dian', '殿': 'dian',
  '雕': 'diao', '吊': 'diao', '钓': 'diao', '调': 'diao', '掉': 'diao', '爹': 'die', '跌': 'die', '叠': 'die',
  '蝶': 'die', '丁': 'ding', '叮': 'ding', '盯': 'ding', '钉': 'ding', '顶': 'ding', '订': 'ding', '定': 'ding',
  '丢': 'diu', '东': 'dong', '冬': 'dong', '董': 'dong', '懂': 'dong', '动': 'dong', '冻': 'dong', '洞': 'dong',
  '都': 'dou', '斗': 'dou', '抖': 'dou', '陡': 'dou', '豆': 'dou', '督': 'du', '毒': 'du', '读': 'du',
  '独': 'du', '堵': 'du', '赌': 'du', '杜': 'du', '肚': 'du', '度': 'du', '渡': 'du', '端': 'duan',
  '短': 'duan', '段': 'duan', '断': 'duan', '队': 'dui', '对': 'dui', '吨': 'dun', '蹲': 'dun', '盾': 'dun',
  '顿': 'dun', '多': 'duo', '夺': 'duo', '朵': 'duo', '躲': 'duo', '鹅': 'e', '额': 'e', '恶': 'e',
  '饿': 'e', '恩': 'en', '儿': 'er', '而': 'er', '耳': 'er', '二': 'er', '发': 'fa', '乏': 'fa',
  '伐': 'fa', '罚': 'fa', '法': 'fa', '帆': 'fan', '番': 'fan', '翻': 'fan', '凡': 'fan', '烦': 'fan',
  '繁': 'fan', '反': 'fan', '返': 'fan', '犯': 'fan', '泛': 'fan', '饭': 'fan', '范': 'fan', '贩': 'fan',
  '方': 'fang', '坊': 'fang', '芳': 'fang', '防': 'fang', '妨': 'fang', '房': 'fang', '肪': 'fang', '仿': 'fang',
  '访': 'fang', '纺': 'fang', '放': 'fang', '飞': 'fei', '非': 'fei', '菲': 'fei', '肥': 'fei', '废': 'fei',
  '沸': 'fei', '费': 'fei', '分': 'fen', '芬': 'fen', '吩': 'fen', '纷': 'fen', '坟': 'fen', '粉': 'fen',
  '份': 'fen', '奋': 'fen', '愤': 'fen', '粪': 'fen', '丰': 'feng', '风': 'feng', '枫': 'feng', '封': 'feng',
  '疯': 'feng', '峰': 'feng', '锋': 'feng', '蜂': 'feng', '冯': 'feng', '逢': 'feng', '缝': 'feng', '讽': 'feng',
  '凤': 'feng', '奉': 'feng', '佛': 'fo', '否': 'fou', '夫': 'fu', '肤': 'fu', '伏': 'fu', '扶': 'fu',
  '服': 'fu', '浮': 'fu', '符': 'fu', '幅': 'fu', '福': 'fu', '抚': 'fu', '府': 'fu', '斧': 'fu',
  '俯': 'fu', '辅': 'fu', '腐': 'fu', '付': 'fu', '妇': 'fu', '负': 'fu', '附': 'fu', '咐': 'fu',
  '复': 'fu', '赴': 'fu', '副': 'fu', '傅': 'fu', '富': 'fu', '腹': 'fu', '覆': 'fu', '该': 'gai',
  '改': 'gai', '盖': 'gai', '概': 'gai', '干': 'gan', '甘': 'gan', '杆': 'gan', '肝': 'gan', '赶': 'gan',
  '敢': 'gan', '感': 'gan', '干': 'gan', '刚': 'gang', '岗': 'gang', '纲': 'gang', '钢': 'gang', '缸': 'gang',
  '港': 'gang', '高': 'gao', '搞': 'gao', '稿': 'gao', '告': 'gao', '戈': 'ge', '哥': 'ge', '胳': 'ge',
  '鸽': 'ge', '割': 'ge', '搁': 'ge', '歌': 'ge', '阁': 'ge', '革': 'ge', '格': 'ge', '隔': 'ge',
  '葛': 'ge', '个': 'ge', '各': 'ge', '给': 'gei', '根': 'gen', '跟': 'gen', '更': 'geng', '耕': 'geng',
  '工': 'gong', '弓': 'gong', '公': 'gong', '功': 'gong', '攻': 'gong', '供': 'gong', '宫': 'gong', '恭': 'gong',
  '巩': 'gong', '共': 'gong', '贡': 'gong', '勾': 'gou', '沟': 'gou', '钩': 'gou', '狗': 'gou', '够': 'gou',
  '购': 'gou', '估': 'gu', '姑': 'gu', '孤': 'gu', '骨': 'gu', '鼓': 'gu', '固': 'gu', '故': 'gu',
  '顾': 'gu', '瓜': 'gua', '刮': 'gua', '挂': 'gua', '乖': 'guai', '拐': 'guai', '怪': 'guai', '关': 'guan',
  '观': 'guan', '官': 'guan', '馆': 'guan', '管': 'guan', '贯': 'guan', '惯': 'guan', '灌': 'guan', '光': 'guang',
  '广': 'guang', '逛': 'guang', '归': 'gui', '龟': 'gui', '规': 'gui', '轨': 'gui', '鬼': 'gui', '柜': 'gui',
  '贵': 'gui', '桂': 'gui', '滚': 'gun', '锅': 'guo', '国': 'guo', '果': 'guo', '裹': 'guo', '过': 'guo',
  '哈': 'ha', '孩': 'hai', '海': 'hai', '害': 'hai', '含': 'han', '寒': 'han', '韩': 'han', '罕': 'han',
  '喊': 'han', '汉': 'han', '汗': 'han', '旱': 'han', '杭': 'hang', '航': 'hang', '毫': 'hao', '豪': 'hao',
  '好': 'hao', '号': 'hao', '浩': 'hao', '喝': 'he', '合': 'he', '何': 'he', '和': 'he', '河': 'he',
  '核': 'he', '荷': 'he', '贺': 'he', '黑': 'hei', '痕': 'hen', '很': 'hen', '狠': 'hen', '恨': 'hen',
  '哼': 'heng', '恒': 'heng', '横': 'heng', '衡': 'heng', '轰': 'hong', '哄': 'hong', '红': 'hong', '宏': 'hong',
  '洪': 'hong', '虹': 'hong', '侯': 'hou', '喉': 'hou', '猴': 'hou', '吼': 'hou', '厚': 'hou', '候': 'hou',
  '后': 'hou', '乎': 'hu', '呼': 'hu', '忽': 'hu', '胡': 'hu', '壶': 'hu', '湖': 'hu', '糊': 'hu',
  '蝴': 'hu', '虎': 'hu', '互': 'hu', '户': 'hu', '护': 'hu', '花': 'hua', '华': 'hua', '划': 'hua',
  '滑': 'hua', '化': 'hua', '划': 'hua', '画': 'hua', '话': 'hua', '怀': 'huai', '坏': 'huai', '欢': 'huan',
  '还': 'huan', '环': 'huan', '缓': 'huan', '幻': 'huan', '唤': 'huan', '换': 'huan', '患': 'huan', '荒': 'huang',
  '慌': 'huang', '皇': 'huang', '黄': 'huang', '灰': 'hui', '恢': 'hui', '挥': 'hui', '回': 'hui', '悔': 'hui',
  '汇': 'hui', '会': 'hui', '绘': 'hui', '惠': 'hui', '昏': 'hun', '婚': 'hun', '浑': 'hun', '魂': 'hun',
  '混': 'hun', '活': 'huo', '火': 'huo', '伙': 'huo', '或': 'huo', '货': 'huo', '获': 'huo', '祸': 'huo',
  '惑': 'huo', '击': 'ji', '饥': 'ji', '机': 'ji', '肌': 'ji', '鸡': 'ji', '积': 'ji', '基': 'ji',
  '迹': 'ji', '激': 'ji', '及': 'ji', '吉': 'ji', '级': 'ji', '即': 'ji', '急': 'ji', '疾': 'ji',
  '集': 'ji', '籍': 'ji', '极': 'ji', '即': 'ji', '急': 'ji', '疾': 'ji', '集': 'ji', '籍': 'ji',
  '几': 'ji', '己': 'ji', '挤': 'ji', '计': 'ji', '记': 'ji', '纪': 'ji', '技': 'ji', '际': 'ji',
  '剂': 'ji', '济': 'ji', '既': 'ji', '继': 'ji', '寄': 'ji', '加': 'jia', '夹': 'jia', '佳': 'jia',
  '家': 'jia', '嘉': 'jia', '甲': 'jia', '价': 'jia', '驾': 'jia', '架': 'jia', '假': 'jia', '嫁': 'jia',
  '尖': 'jian', '坚': 'jian', '间': 'jian', '肩': 'jian', '艰': 'jian', '兼': 'jian', '监': 'jian', '煎': 'jian',
  '拣': 'jian', '捡': 'jian', '减': 'jian', '剪': 'jian', '检': 'jian', '简': 'jian', '见': 'jian', '件': 'jian',
  '建': 'jian', '剑': 'jian', '荐': 'jian', '贱': 'jian', '健': 'jian', '舰': 'jian', '渐': 'jian', '践': 'jian',
  '鉴': 'jian', '键': 'jian', '江': 'jiang', '将': 'jiang', '姜': 'jiang', '浆': 'jiang', '僵': 'jiang', '疆': 'jiang',
  '讲': 'jiang', '奖': 'jiang', '匠': 'jiang', '降': 'jiang', '交': 'jiao', '郊': 'jiao', '浇': 'jiao', '娇': 'jiao',
  '骄': 'jiao', '胶': 'jiao', '教': 'jiao', '焦': 'jiao', '蕉': 'jiao', '礁': 'jiao', '嚼': 'jiao', '角': 'jiao',
  '饺': 'jiao', '脚': 'jiao', '搅': 'jiao', '叫': 'jiao', '较': 'jiao', '教': 'jiao', '阶': 'jie', '皆': 'jie',
  '接': 'jie', '揭': 'jie', '街': 'jie', '节': 'jie', '杰': 'jie', '洁': 'jie', '结': 'jie', '捷': 'jie',
  '截': 'jie', '姐': 'jie', '解': 'jie', '介': 'jie', '戒': 'jie', '界': 'jie', '借': 'jie', '巾': 'jin',
  '今': 'jin', '斤': 'jin', '金': 'jin', '津': 'jin', '筋': 'jin', '仅': 'jin', '紧': 'jin', '锦': 'jin',
  '尽': 'jin', '劲': 'jin', '近': 'jin', '进': 'jin', '晋': 'jin', '浸': 'jin', '尽': 'jin', '京': 'jing',
  '经': 'jing', '茎': 'jing', '惊': 'jing', '晶': 'jing', '睛': 'jing', '精': 'jing', '鲸': 'jing', '井': 'jing',
  '颈': 'jing', '景': 'jing', '警': 'jing', '净': 'jing', '静': 'jing', '境': 'jing', '镜': 'jing', '竞': 'jing',
  '竟': 'jing', '敬': 'jing', '境': 'jing', '究': 'jiu', '纠': 'jiu', '揪': 'jiu', '九': 'jiu', '久': 'jiu',
  '酒': 'jiu', '旧': 'jiu', '救': 'jiu', '就': 'jiu', '舅': 'jiu', '居': 'ju', '拘': 'ju', '居': 'ju',
  '局': 'ju', '菊': 'ju', '橘': 'ju', '举': 'ju', '巨': 'ju', '拒': 'ju', '具': 'ju', '俱': 'ju',
  '剧': 'ju', '惧': 'ju', '据': 'ju', '距': 'ju', '卷': 'juan', '决': 'jue', '绝': 'jue', '觉': 'jue',
  '掘': 'jue', '嚼': 'jue', '军': 'jun', '君': 'jun', '均': 'jun', '菌': 'jun', '俊': 'jun', '峻': 'jun',
  '卡': 'ka', '开': 'kai', '凯': 'kai', '慨': 'kai', '刊': 'kan', '看': 'kan', '坎': 'kan', '砍': 'kan',
  '看': 'kan', '康': 'kang', '抗': 'kang', '炕': 'kang', '考': 'kao', '烤': 'kao', '靠': 'kao', '科': 'ke',
  '棵': 'ke', '颗': 'ke', '科': 'ke', '柯': 'ke', '咳': 'ke', '壳': 'ke', '可': 'ke', '渴': 'ke',
  '克': 'ke', '刻': 'ke', '客': 'ke', '课': 'ke', '肯': 'ken', '坑': 'keng', '空': 'kong', '孔': 'kong',
  '恐': 'kong', '控': 'kong', '口': 'kou', '扣': 'kou', '苦': 'ku', '库': 'ku', '裤': 'ku', '酷': 'ku',
  '夸': 'kua', '垮': 'kua', '挎': 'kua', '跨': 'kua', '块': 'kuai', '快': 'kuai', '宽': 'kuan', '款': 'kuan',
  '狂': 'kuang', '况': 'kuang', '矿': 'kuang', '框': 'kuang', '亏': 'kui', '葵': 'kui', '愧': 'kui', '溃': 'kui',
  '困': 'kun', '扩': 'kuo', '括': 'kuo', '阔': 'kuo', '垃': 'la', '拉': 'la', '啦': 'la', '腊': 'la',
  '辣': 'la', '来': 'lai', '赖': 'lai', '兰': 'lan', '拦': 'lan', '栏': 'lan', '蓝': 'lan', '览': 'lan',
  '懒': 'lan', '烂': 'lan', '滥': 'lan', '狼': 'lang', '廊': 'lang', '朗': 'lang', '浪': 'lang', '捞': 'lao',
  '劳': 'lao', '牢': 'lao', '老': 'lao', '姥': 'lao', '涝': 'lao', '乐': 'le', '勒': 'le', '雷': 'lei',
  '累': 'lei', '泪': 'lei', '类': 'lei', '冷': 'leng', '愣': 'leng', '厘': 'li', '梨': 'li', '狸': 'li',
  '离': 'li', '璃': 'li', '黎': 'li', '礼': 'li', '李': 'li', '里': 'li', '理': 'li', '鲤': 'li',
  '力': 'li', '历': 'li', '厉': 'li', '立': 'li', '丽': 'li', '利': 'li', '励': 'li', '例': 'li',
  '隶': 'li', '粒': 'li', '俩': 'lia', '连': 'lian', '帘': 'lian', '怜': 'lian', '莲': 'lian', '联': 'lian',
  '廉': 'lian', '镰': 'lian', '练': 'lian', '炼': 'lian', '恋': 'lian', '良': 'liang', '凉': 'liang', '梁': 'liang',
  '粮': 'liang', '两': 'liang', '亮': 'liang', '谅': 'liang', '辆': 'liang', '辽': 'liao', '疗': 'liao', '聊': 'liao',
  '僚': 'liao', '寥': 'liao', '了': 'liao', '料': 'liao', '列': 'lie', '劣': 'lie', '烈': 'lie', '猎': 'lie',
  '裂': 'lie', '林': 'lin', '临': 'lin', '淋': 'lin', '琳': 'lin', '磷': 'lin', '鳞': 'lin', '邻': 'lin',
  '林': 'lin', '临': 'lin', '淋': 'lin', '吝': 'lin', '伶': 'ling', '灵': 'ling', '岭': 'ling', '领': 'ling',
  '另': 'ling', '令': 'ling', '溜': 'liu', '刘': 'liu', '流': 'liu', '留': 'liu', '硫': 'liu', '榴': 'liu',
  '柳': 'liu', '六': 'liu', '龙': 'long', '聋': 'long', '笼': 'long', '隆': 'long', '垄': 'long', '拢': 'long',
  '楼': 'lou', '搂': 'lou', '篓': 'lou', '漏': 'lou', '陋': 'lou', '露': 'lu', '卢': 'lu', '芦': 'lu',
  '炉': 'lu', '掳': 'lu', '鲁': 'lu', '陆': 'lu', '录': 'lu', '鹿': 'lu', '滤': 'lu', '碌': 'lu',
  '路': 'lu', '露': 'lu', '驴': 'lv', '旅': 'lv', '铝': 'lv', '屡': 'lv', '律': 'lv', '虑': 'lv',
  '绿': 'lv', '氯': 'lv', '略': 'lve', '妈': 'ma', '麻': 'ma', '马': 'ma', '码': 'ma', '蚂': 'ma',
  '骂': 'ma', '吗': 'ma', '埋': 'mai', '买': 'mai', '迈': 'mai', '麦': 'mai', '卖': 'mai', '脉': 'mai',
  '蛮': 'man', '满': 'man', '曼': 'man', '慢': 'man', '漫': 'man', '忙': 'mang', '芒': 'mang', '盲': 'mang',
  '茫': 'mang', '莽': 'mang', '猫': 'mao', '毛': 'mao', '矛': 'mao', '茅': 'mao', '茂': 'mao', '冒': 'mao',
  '贸': 'mao', '帽': 'mao', '貌': 'mao', '么': 'me', '没': 'mei', '枚': 'mei', '玫': 'mei', '眉': 'mei',
  '梅': 'mei', '媒': 'mei', '煤': 'mei', '霉': 'mei', '每': 'mei', '美': 'mei', '妹': 'mei', '昧': 'mei',
  '谜': 'mi', '眯': 'mi', '迷': 'mi', '米': 'mi', '泌': 'mi', '秘': 'mi', '密': 'mi', '蜜': 'mi',
  '眠': 'mian', '绵': 'mian', '棉': 'mian', '免': 'mian', '勉': 'mian', '缅': 'mian', '面': 'mian', '苗': 'miao',
  '描': 'miao', '瞄': 'miao', '秒': 'miao', '妙': 'miao', '庙': 'miao', '灭': 'mie', '蔑': 'mie', '民': 'min',
  '敏': 'min', '皿': 'min', '悯': 'min', '闽': 'min', '名': 'ming', '明': 'ming', '鸣': 'ming', '命': 'ming',
  '摸': 'mo', '模': 'mo', '膜': 'mo', '磨': 'mo', '摩': 'mo', '魔': 'mo', '抹': 'mo', '末': 'mo',
  '沫': 'mo', '陌': 'mo', '莫': 'mo', '漠': 'mo', '墨': 'mo', '默': 'mo', '谋': 'mou', '某': 'mou',
  '母': 'mu', '亩': 'mu', '牡': 'mu', '姆': 'mu', '拇': 'mu', '木': 'mu', '目': 'mu', '牧': 'mu',
  '墓': 'mu', '幕': 'mu', '慕': 'mu', '暮': 'mu', '拿': 'na', '哪': 'na', '内': 'na', '那': 'na',
  '纳': 'na', '娜': 'na', '乃': 'nai', '奶': 'nai', '奈': 'nai', '耐': 'nai', '男': 'nan', '南': 'nan',
  '难': 'nan', '囊': 'nang', '挠': 'nao', '恼': 'nao', '脑': 'nao', '闹': 'nao', '呢': 'ne', '馁': 'nei',
  '嫩': 'nen', '能': 'neng', '尼': 'ni', '泥': 'ni', '你': 'ni', '拟': 'ni', '逆': 'ni', '年': 'nian',
  '粘': 'nian', '念': 'nian', '娘': 'niang', '酿': 'niang', '鸟': 'niao', '尿': 'niao', '捏': 'nie', '宁': 'ning',
  '凝': 'ning', '牛': 'niu', '扭': 'niu', '纽': 'niu', '浓': 'nong', '农': 'nong', '弄': 'nong', '奴': 'nu',
  '努': 'nu', '怒': 'nu', '女': 'nv', '暖': 'nuan', '虐': 'nve', '挪': 'nuo', '懦': 'nuo', '糯': 'nuo',
  '欧': 'ou', '殴': 'ou', '偶': 'ou', '爬': 'pa', '怕': 'pa', '拍': 'pai', '排': 'pai', '牌': 'pai',
  '派': 'pai', '攀': 'pan', '盘': 'pan', '判': 'pan', '叛': 'pan', '盼': 'pan', '乓': 'pang', '旁': 'pang',
  '胖': 'pang', '抛': 'pao', '炮': 'pao', '袍': 'pao', '跑': 'pao', '泡': 'pao', '呸': 'pei', '胚': 'pei',
  '陪': 'pei', '培': 'pei', '赔': 'pei', '佩': 'pei', '配': 'pei', '喷': 'pen', '盆': 'pen', '朋': 'peng',
  '蓬': 'peng', '棚': 'peng', '鹏': 'peng', '碰': 'peng', '批': 'pi', '披': 'pi', '劈': 'pi', '皮': 'pi',
  '疲': 'pi', '脾': 'pi', '匹': 'pi', '屁': 'pi', '僻': 'pi', '片': 'pian', '偏': 'pian', '篇': 'pian',
  '骗': 'pian', '飘': 'piao', '漂': 'piao', '票': 'piao', '撇': 'pie', '拼': 'pin', '贫': 'pin', '频': 'pin',
  '品': 'pin', '聘': 'pin', '乒': 'ping', '平': 'ping', '评': 'ping', '凭': 'ping', '苹': 'ping', '屏': 'ping',
  '瓶': 'ping', '坡': 'po', '泼': 'po', '颇': 'po', '婆': 'po', '迫': 'po', '破': 'po', '魄': 'po',
  '剖': 'pou', '扑': 'pu', '铺': 'pu', '葡': 'pu', '朴': 'pu', '圃': 'pu', '浦': 'pu', '普': 'pu',
  '七': 'qi', '妻': 'qi', '戚': 'qi', '欺': 'qi', '漆': 'qi', '齐': 'qi', '其': 'qi', '奇': 'qi',
  '骑': 'qi', '棋': 'qi', '旗': 'qi', '乞': 'qi', '企': 'qi', '岂': 'qi', '启': 'qi', '起': 'qi',
  '气': 'qi', '弃': 'qi', '汽': 'qi', '砌': 'qi', '器': 'qi', '恰': 'qia', '洽': 'qia', '千': 'qian',
  '迁': 'qian', '牵': 'qian', '铅': 'qian', '谦': 'qian', '签': 'qian', '前': 'qian', '钱': 'qian', '钳': 'qian',
  '浅': 'qian', '遣': 'qian', '谴': 'qian', '欠': 'qian', '枪': 'qiang', '腔': 'qiang', '强': 'qiang', '墙': 'qiang',
  '抢': 'qiang', '悄': 'qiao', '敲': 'qiao', '锹': 'qiao', '乔': 'qiao', '桥': 'qiao', '瞧': 'qiao', '巧': 'qiao',
  '窍': 'qiao', '切': 'qie', '茄': 'qie', '且': 'qie', '窃': 'qie', '亲': 'qin', '侵': 'qin', '钦': 'qin',
  '琴': 'qin', '禽': 'qin', '勤': 'qin', '擒': 'qin', '寝': 'qin', '沁': 'qin', '青': 'qing', '轻': 'qing',
  '氢': 'qing', '倾': 'qing', '卿': 'qing', '清': 'qing', '蜻': 'qing', '情': 'qing', '晴': 'qing', '擎': 'qing',
  '顷': 'qing', '请': 'qing', '庆': 'qing', '穷': 'qiong', '丘': 'qiu', '秋': 'qiu', '蚯': 'qiu', '求': 'qiu',
  '球': 'qiu', '区': 'qu', '曲': 'qu', '驱': 'qu', '屈': 'qu', '躯': 'qu', '趋': 'qu', '渠': 'qu',
  '取': 'qu', '娶': 'qu', '去': 'qu', '趣': 'qu', '圈': 'quan', '权': 'quan', '全': 'quan', '泉': 'quan',
  '拳': 'quan', '犬': 'quan', '劝': 'quan', '券': 'quan', '缺': 'que', '却': 'que', '雀': 'que', '确': 'que',
  '鹊': 'que', '裙': 'qun', '群': 'qun', '然': 'ran', '燃': 'ran', '染': 'ran', '嚷': 'rang', '壤': 'rang',
  '让': 'rang', '饶': 'rao', '扰': 'rao', '绕': 'rao', '惹': 're', '热': 're', '人': 'ren', '仁': 'ren',
  '忍': 'ren', '认': 'ren', '任': 'ren', '刃': 'ren', '纫': 'ren', '扔': 'reng', '仍': 'reng', '日': 'ri',
  '绒': 'rong', '容': 'rong', '溶': 'rong', '熔': 'rong', '荣': 'rong', '融': 'rong', '冗': 'rong', '柔': 'rou',
  '揉': 'rou', '肉': 'rou', '如': 'ru', '儒': 'ru', '孺': 'ru', '辱': 'ru', '乳': 'ru', '入': 'ru',
  '软': 'ruan', '锐': 'rui', '瑞': 'rui', '若': 'ruo', '弱': 'ruo', '撒': 'sa', '洒': 'sa', '塞': 'sai',
  '赛': 'sai', '三': 'san', '伞': 'san', '散': 'san', '桑': 'sang', '嗓': 'sang', '丧': 'sang', '搔': 'sao',
  '骚': 'sao', '扫': 'sao', '嫂': 'sao', '色': 'se', '涩': 'se', '森': 'sen', '僧': 'seng', '杀': 'sha',
  '沙': 'sha', '纱': 'sha', '刹': 'sha', '砂': 'sha', '傻': 'sha', '煞': 'sha', '厦': 'sha', '筛': 'shai',
  '晒': 'shai', '山': 'shan', '杉': 'shan', '衫': 'shan', '删': 'shan', '闪': 'shan', '陕': 'shan', '扇': 'shan',
  '善': 'shan', '擅': 'shan', '膳': 'shan', '赡': 'shan', '伤': 'shang', '商': 'shang', '赏': 'shang', '上': 'shang',
  '尚': 'shang', '捎': 'shao', '梢': 'shao', '烧': 'shao', '稍': 'shao', '勺': 'shao', '少': 'shao', '绍': 'shao',
  '哨': 'shao', '奢': 'she', '舌': 'she', '蛇': 'she', '舍': 'she', '设': 'she', '社': 'she', '射': 'she',
  '涉': 'she', '摄': 'she', '申': 'shen', '伸': 'shen', '身': 'shen', '深': 'shen', '神': 'shen', '审': 'shen',
  '婶': 'shen', '肾': 'shen', '甚': 'shen', '渗': 'shen', '慎': 'shen', '升': 'sheng', '生': 'sheng', '声': 'sheng',
  '牲': 'sheng', '胜': 'sheng', '绳': 'sheng', '省': 'sheng', '圣': 'sheng', '剩': 'sheng', '尸': 'shi', '失': 'shi',
  '师': 'shi', '诗': 'shi', '狮': 'shi', '施': 'shi', '湿': 'shi', '十': 'shi', '什': 'shi', '石': 'shi',
  '时': 'shi', '识': 'shi', '实': 'shi', '拾': 'shi', '食': 'shi', '蚀': 'shi', '史': 'shi', '使': 'shi',
  '始': 'shi', '驶': 'shi', '士': 'shi', '氏': 'shi', '世': 'shi', '市': 'shi', '示': 'shi', '式': 'shi',
  '事': 'shi', '侍': 'shi', '势': 'shi', '视': 'shi', '试': 'shi', '饰': 'shi', '室': 'shi', '是': 'shi',
  '适': 'shi', '逝': 'shi', '释': 'shi', '誓': 'shi', '收': 'shou', '手': 'shou', '守': 'shou', '首': 'shou',
  '寿': 'shou', '受': 'shou', '兽': 'shou', '售': 'shou', '授': 'shou', '瘦': 'shou', '书': 'shu', '抒': 'shu',
  '枢': 'shu', '叔': 'shu', '殊': 'shu', '梳': 'shu', '淑': 'shu', '疏': 'shu', '舒': 'shu', '输': 'shu',
  '蔬': 'shu', '熟': 'shu', '暑': 'shu', '黍': 'shu', '署': 'shu', '蜀': 'shu', '鼠': 'shu', '属': 'shu',
  '术': 'shu', '束': 'shu', '述': 'shu', '树': 'shu', '竖': 'shu', '恕': 'shu', '庶': 'shu', '数': 'shu',
  '刷': 'shua', '耍': 'shua', '衰': 'shuai', '摔': 'shuai', '甩': 'shuai', '帅': 'shuai', '拴': 'shuan', '霜': 'shuang',
  '双': 'shuang', '爽': 'shuang', '谁': 'shui', '水': 'shui', '税': 'shui', '睡': 'shui', '顺': 'shun', '瞬': 'shun',
  '说': 'shuo', '丝': 'si', '司': 'si', '私': 'si', '思': 'si', '斯': 'si', '撕': 'si', '死': 'si',
  '四': 'si', '寺': 'si', '似': 'si', '饲': 'si', '肆': 'si', '松': 'song', '怂': 'song', '耸': 'song',
  '讼': 'song', '宋': 'song', '送': 'song', '诵': 'song', '颂': 'song', '苏': 'su', '酥': 'su', '俗': 'su',
  '诉': 'su', '肃': 'su', '素': 'su', '速': 'su', '宿': 'su', '塑': 'su', '溯': 'su', '酸': 'suan',
  '蒜': 'suan', '算': 'suan', '虽': 'sui', '随': 'sui', '岁': 'sui', '祟': 'sui', '遂': 'sui', '碎': 'sui',
  '穗': 'sui', '孙': 'sun', '损': 'sun', '笋': 'sun', '蓑': 'suo', '梭': 'suo', '唆': 'suo', '缩': 'suo',
  '所': 'suo', '索': 'suo', '锁': 'suo', '他': 'ta', '它': 'ta', '她': 'ta', '塌': 'ta', '踏': 'ta',
  '塔': 'ta', '胎': 'tai', '台': 'tai', '抬': 'tai', '太': 'tai', '汰': 'tai', '态': 'tai', '泰': 'tai',
  '贪': 'tan', '摊': 'tan', '滩': 'tan', '瘫': 'tan', '坛': 'tan', '谈': 'tan', '痰': 'tan', '潭': 'tan',
  '檀': 'tan', '坦': 'tan', '毯': 'tan', '叹': 'tan', '炭': 'tan', '探': 'tan', '碳': 'tan', '汤': 'tang',
  '唐': 'tang', '堂': 'tang', '塘': 'tang', '膛': 'tang', '糖': 'tang', '倘': 'tang', '淌': 'tang', '躺': 'tang',
  '烫': 'tang', '涛': 'tao', '掏': 'tao', '滔': 'tao', '逃': 'tao', '桃': 'tao', '陶': 'tao', '萄': 'tao',
  '讨': 'tao', '套': 'tao', '特': 'te', '疼': 'teng', '腾': 'teng', '藤': 'teng', '梯': 'ti', '踢': 'ti',
  '啼': 'ti', '提': 'ti', '题': 'ti', '蹄': 'ti', '体': 'ti', '屉': 'ti', '剃': 'ti', '替': 'ti',
  '天': 'tian', '添': 'tian', '田': 'tian', '填': 'tian', '甜': 'tian', '挑': 'tiao', '条': 'tiao', '迢': 'tiao',
  '跳': 'tiao', '贴': 'tie', '铁': 'tie', '帖': 'tie', '厅': 'ting', '听': 'ting', '烃': 'ting', '廷': 'ting',
  '亭': 'ting', '庭': 'ting', '停': 'ting', '挺': 'ting', '艇': 'ting', '通': 'tong', '同': 'tong', '桐': 'tong',
  '铜': 'tong', '童': 'tong', '统': 'tong', '桶': 'tong', '筒': 'tong', '痛': 'tong', '偷': 'tou', '投': 'tou',
  '头': 'tou', '透': 'tou', '凸': 'tu', '秃': 'tu', '突': 'tu', '图': 'tu', '徒': 'tu', '涂': 'tu',
  '途': 'tu', '屠': 'tu', '土': 'tu', '吐': 'tu', '兔': 'tu', '团': 'tuan', '推': 'tui', '颓': 'tui',
  '腿': 'tui', '退': 'tui', '吞': 'tun', '屯': 'tun', '臀': 'tun', '托': 'tuo', '拖': 'tuo', '脱': 'tuo',
  '驮': 'tuo', '陀': 'tuo', '妥': 'tuo', '拓': 'tuo', '唾': 'tuo', '挖': 'wa', '哇': 'wa', '蛙': 'wa',
  '娃': 'wa', '瓦': 'wa', '袜': 'wa', '歪': 'wai', '外': 'wai', '弯': 'wan', '湾': 'wan', '丸': 'wan',
  '完': 'wan', '玩': 'wan', '顽': 'wan', '挽': 'wan', '晚': 'wan', '碗': 'wan', '万': 'wan', '汪': 'wang',
  '亡': 'wang', '王': 'wang', '网': 'wang', '往': 'wang', '枉': 'wang', '妄': 'wang', '忘': 'wang', '旺': 'wang',
  '威': 'wei', '微': 'wei', '危': 'wei', '韦': 'wei', '围': 'wei', '违': 'wei', '唯': 'wei', '惟': 'wei',
  '维': 'wei', '伟': 'wei', '伪': 'wei', '尾': 'wei', '纬': 'wei', '委': 'wei', '萎': 'wei', '卫': 'wei',
  '未': 'wei', '位': 'wei', '味': 'wei', '畏': 'wei', '胃': 'wei', '谓': 'wei', '喂': 'wei', '尉': 'wei',
  '蔚': 'wei', '慰': 'wei', '魏': 'wei', '温': 'wen', '文': 'wen', '纹': 'wen', '蚊': 'wen', '闻': 'wen',
  '吻': 'wen', '稳': 'wen', '问': 'wen', '翁': 'weng', '窝': 'wo', '我': 'wo', '沃': 'wo', '卧': 'wo',
  '握': 'wo', '乌': 'wu', '污': 'wu', '呜': 'wu', '巫': 'wu', '诬': 'wu', '屋': 'wu', '无': 'wu',
  '吴': 'wu', '吾': 'wu', '梧': 'wu', '蜈': 'wu', '五': 'wu', '午': 'wu', '伍': 'wu', '武': 'wu',
  '侮': 'wu', '鹉': 'wu', '舞': 'wu', '勿': 'wu', '戊': 'wu', '务': 'wu', '坞': 'wu', '物': 'wu',
  '误': 'wu', '悟': 'wu', '晤': 'wu', '西': 'xi', '吸': 'xi', '希': 'xi', '昔': 'xi', '析': 'xi',
  '牺': 'xi', '息': 'xi', '惜': 'xi', '悉': 'xi', '蟋': 'xi', '锡': 'xi', '熙': 'xi', '嘻': 'xi',
  '嬉': 'xi', '膝': 'xi', '习': 'xi', '席': 'xi', '袭': 'xi', '洗': 'xi', '系': 'xi', '细': 'xi',
  '隙': 'xi', '虾': 'xia', '瞎': 'xia', '峡': 'xia', '狭': 'xia', '霞': 'xia', '下': 'xia', '夏': 'xia',
  '仙': 'xian', '先': 'xian', '纤': 'xian', '掀': 'xian', '鲜': 'xian', '闲': 'xian', '贤': 'xian', '咸': 'xian',
  '涎': 'xian', '衔': 'xian', '嫌': 'xian', '显': 'xian', '险': 'xian', '县': 'xian', '现': 'xian', '限': 'xian',
  '线': 'xian', '宪': 'xian', '陷': 'xian', '馅': 'xian', '羡': 'xian', '献': 'xian', '腺': 'xian', '乡': 'xiang',
  '相': 'xiang', '香': 'xiang', '箱': 'xiang', '详': 'xiang', '祥': 'xiang', '享': 'xiang', '响': 'xiang', '想': 'xiang',
  '向': 'xiang', '巷': 'xiang', '项': 'xiang', '象': 'xiang', '像': 'xiang', '橡': 'xiang', '削': 'xiao', '消': 'xiao',
  '宵': 'xiao', '硝': 'xiao', '销': 'xiao', '小': 'xiao', '孝': 'xiao', '效': 'xiao', '校': 'xiao', '笑': 'xiao',
  '些': 'xie', '歇': 'xie', '蝎': 'xie', '协': 'xie', '邪': 'xie', '胁': 'xie', '斜': 'xie', '谐': 'xie',
  '携': 'xie', '鞋': 'xie', '写': 'xie', '泄': 'xie', '泻': 'xie', '屑': 'xie', '械': 'xie', '懈': 'xie',
  '心': 'xin', '辛': 'xin', '新': 'xin', '薪': 'xin', '信': 'xin', '兴': 'xing', '星': 'xing', '腥': 'xing',
  '刑': 'xing', '行': 'xing', '形': 'xing', '型': 'xing', '醒': 'xing', '杏': 'xing', '姓': 'xing', '幸': 'xing',
  '性': 'xing', '凶': 'xiong', '兄': 'xiong', '匈': 'xiong', '胸': 'xiong', '雄': 'xiong', '熊': 'xiong', '休': 'xiu',
  '修': 'xiu', '朽': 'xiu', '秀': 'xiu', '袖': 'xiu', '锈': 'xiu', '需': 'xu', '须': 'xu', '虚': 'xu',
  '徐': 'xu', '许': 'xu', '叙': 'xu', '畜': 'xu', '绪': 'xu', '续': 'xu', '絮': 'xu', '婿': 'xu',
  '蓄': 'xu', '宣': 'xuan', '悬': 'xuan', '旋': 'xuan', '选': 'xuan', '癣': 'xuan', '炫': 'xuan', '眩': 'xuan',
  '绚': 'xuan', '靴': 'xue', '学': 'xue', '穴': 'xue', '雪': 'xue', '血': 'xue', '勋': 'xun', '熏': 'xun',
  '寻': 'xun', '巡': 'xun', '询': 'xun', '循': 'xun', '训': 'xun', '讯': 'xun', '迅': 'xun', '压': 'ya',
  '呀': 'ya', '鸦': 'ya', '鸭': 'ya', '牙': 'ya', '芽': 'ya', '蚜': 'ya', '崖': 'ya', '涯': 'ya',
  '衙': 'ya', '雅': 'ya', '亚': 'ya', '咽': 'yan', '烟': 'yan', '淹': 'yan', '延': 'yan', '严': 'yan',
  '言': 'yan', '岩': 'yan', '炎': 'yan', '沿': 'yan', '研': 'yan', '盐': 'yan', '蜒': 'yan', '颜': 'yan',
  '掩': 'yan', '眼': 'yan', '演': 'yan', '厌': 'yan', '宴': 'yan', '验': 'yan', '雁': 'yan', '焰': 'yan',
  '燕': 'yan', '央': 'yang', '殃': 'yang', '秧': 'yang', '扬': 'yang', '羊': 'yang', '阳': 'yang', '杨': 'yang',
  '佯': 'yang', '洋': 'yang', '仰': 'yang', '养': 'yang', '氧': 'yang', '痒': 'yang', '样': 'yang', '腰': 'yao',
  '邀': 'yao', '窑': 'yao', '谣': 'yao', '摇': 'yao', '遥': 'yao', '肴': 'yao', '姚': 'yao', '咬': 'yao',
  '舀': 'yao', '药': 'yao', '要': 'yao', '耀': 'yao', '爷': 'ye', '耶': 'ye', '野': 'ye', '也': 'ye',
  '冶': 'ye', '页': 'ye', '夜': 'ye', '液': 'ye', '一': 'yi', '衣': 'yi', '医': 'yi', '依': 'yi',
  '伊': 'yi', '揖': 'yi', '仪': 'yi', '夷': 'yi', '宜': 'yi', '移': 'yi', '遗': 'yi', '疑': 'yi',
  '乙': 'yi', '已': 'yi', '以': 'yi', '矣': 'yi', '蚁': 'yi', '椅': 'yi', '义': 'yi', '亿': 'yi',
  '忆': 'yi', '艺': 'yi', '议': 'yi', '亦': 'yi', '异': 'yi', '役': 'yi', '抑': 'yi', '译': 'yi',
  '易': 'yi', '疫': 'yi', '益': 'yi', '谊': 'yi', '逸': 'yi', '意': 'yi', '溢': 'yi', '毅': 'yi',
  '翼': 'yi', '因': 'yin', '阴': 'yin', '音': 'yin', '姻': 'yin', '吟': 'yin', '银': 'yin', '引': 'yin',
  '饮': 'yin', '隐': 'yin', '印': 'yin', '应': 'ying', '英': 'ying', '婴': 'ying', '樱': 'ying', '鹰': 'ying',
  '迎': 'ying', '盈': 'ying', '营': 'ying', '蝇': 'ying', '赢': 'ying', '影': 'ying', '映': 'ying', '硬': 'ying',
  '哟': 'yo', '拥': 'yong', '佣': 'yong', '痈': 'yong', '庸': 'yong', '雍': 'yong', '永': 'yong', '泳': 'yong',
  '勇': 'yong', '涌': 'yong', '用': 'yong', '优': 'you', '忧': 'you', '幽': 'you', '悠': 'you', '尤': 'you',
  '由': 'you', '邮': 'you', '犹': 'you', '油': 'you', '游': 'you', '友': 'you', '有': 'you', '又': 'you',
  '右': 'you', '幼': 'you', '诱': 'you', '于': 'yu', '予': 'yu', '余': 'yu', '鱼': 'yu', '娱': 'yu',
  '渔': 'yu', '愉': 'yu', '愚': 'yu', '榆': 'yu', '与': 'yu', '屿': 'yu', '宇': 'yu', '羽': 'yu',
  '雨': 'yu', '语': 'yu', '玉': 'yu', '育': 'yu', '郁': 'yu', '狱': 'yu', '浴': 'yu', '预': 'yu',
  '域': 'yu', '欲': 'yu', '喻': 'yu', '寓': 'yu', '御': 'yu', '裕': 'yu', '遇': 'yu', '愈': 'yu',
  '誉': 'yu', '豫': 'yu', '冤': 'yuan', '元': 'yuan', '园': 'yuan', '员': 'yuan', '原': 'yuan', '圆': 'yuan',
  '袁': 'yuan', '援': 'yuan', '缘': 'yuan', '源': 'yuan', '猿': 'yuan', '远': 'yuan', '怨': 'yuan', '院': 'yuan',
  '愿': 'yuan', '曰': 'yue', '约': 'yue', '月': 'yue', '岳': 'yue', '悦': 'yue', '阅': 'yue', '跃': 'yue',
  '越': 'yue', '云': 'yun', '匀': 'yun', '允': 'yun', '孕': 'yun', '运': 'yun', '酝': 'yun', '韵': 'yun',
  '蕴': 'yun', '匝': 'za', '杂': 'za', '砸': 'za', '灾': 'zai', '栽': 'zai', '宰': 'zai', '载': 'zai',
  '再': 'zai', '在': 'zai', '咱': 'zan', '攒': 'zan', '暂': 'zan', '赞': 'zan', '赃': 'zang', '脏': 'zang',
  '葬': 'zang', '遭': 'zao', '糟': 'zao', '凿': 'zao', '早': 'zao', '枣': 'zao', '澡': 'zao', '藻': 'zao',
  '皂': 'zao', '造': 'zao', '噪': 'zao', '燥': 'zao', '躁': 'zao', '则': 'ze', '责': 'ze', '择': 'ze',
  '泽': 'ze', '贼': 'zei', '怎': 'zen', '增': 'zeng', '憎': 'zeng', '赠': 'zeng', '扎': 'zha', '渣': 'zha',
  '札': 'zha', '轧': 'zha', '闸': 'zha', '炸': 'zha', '诈': 'zha', '榨': 'zha', '摘': 'zhai', '宅': 'zhai',
  '窄': 'zhai', '债': 'zhai', '寨': 'zhai', '沾': 'zhan', '粘': 'zhan', '斩': 'zhan', '展': 'zhan', '盏': 'zhan',
  '崭': 'zhan', '占': 'zhan', '战': 'zhan', '站': 'zhan', '绽': 'zhan', '章': 'zhang', '张': 'zhang', '彰': 'zhang',
  '樟': 'zhang', '涨': 'zhang', '掌': 'zhang', '丈': 'zhang', '仗': 'zhang', '帐': 'zhang', '账': 'zhang', '胀': 'zhang',
  '障': 'zhang', '招': 'zhao', '找': 'zhao', '召': 'zhao', '兆': 'zhao', '照': 'zhao', '罩': 'zhao', '遮': 'zhe',
  '折': 'zhe', '哲': 'zhe', '者': 'zhe', '这': 'zhe', '浙': 'zhe', '针': 'zhen', '侦': 'zhen', '珍': 'zhen',
  '真': 'zhen', '诊': 'zhen', '枕': 'zhen', '阵': 'zhen', '振': 'zhen', '镇': 'zhen', '震': 'zhen', '睁': 'zheng',
  '争': 'zheng', '征': 'zheng', '挣': 'zheng', '睁': 'zheng', '筝': 'zheng', '蒸': 'zheng', '整': 'zheng', '正': 'zheng',
  '证': 'zheng', '郑': 'zheng', '政': 'zheng', '症': 'zheng', '之': 'zhi', '支': 'zhi', '只': 'zhi', '汁': 'zhi',
  '芝': 'zhi', '枝': 'zhi', '知': 'zhi', '织': 'zhi', '肢': 'zhi', '脂': 'zhi', '蜘': 'zhi', '执': 'zhi',
  '直': 'zhi', '值': 'zhi', '职': 'zhi', '植': 'zhi', '殖': 'zhi', '止': 'zhi', '旨': 'zhi', '址': 'zhi',
  '指': 'zhi', '趾': 'zhi', '志': 'zhi', '制': 'zhi', '帜': 'zhi', '治': 'zhi', '质': 'zhi', '致': 'zhi',
  '秩': 'zhi', '智': 'zhi', '置': 'zhi', '稚': 'zhi', '中': 'zhong', '忠': 'zhong', '终': 'zhong', '钟': 'zhong',
  '肿': 'zhong', '种': 'zhong', '仲': 'zhong', '众': 'zhong', '重': 'zhong', '州': 'zhou', '舟': 'zhou', '周': 'zhou',
  '洲': 'zhou', '粥': 'zhou', '宙': 'zhou', '昼': 'zhou', '皱': 'zhou', '骤': 'zhou', '朱': 'zhu', '株': 'zhu',
  '珠': 'zhu', '诸': 'zhu', '猪': 'zhu', '竹': 'zhu', '烛': 'zhu', '逐': 'zhu', '主': 'zhu', '煮': 'zhu',
  '嘱': 'zhu', '住': 'zhu', '助': 'zhu', '注': 'zhu', '驻': 'zhu', '柱': 'zhu', '祝': 'zhu', '著': 'zhu',
  '筑': 'zhu', '铸': 'zhu', '抓': 'zhua', '爪': 'zhua', '专': 'zhuan', '砖': 'zhuan', '转': 'zhuan', '赚': 'zhuan',
  '庄': 'zhuang', '桩': 'zhuang', '装': 'zhuang', '壮': 'zhuang', '状': 'zhuang', '撞': 'zhuang', '追': 'zhui', '准': 'zhun',
  '捉': 'zhuo', '桌': 'zhuo', '卓': 'zhuo', '啄': 'zhuo', '浊': 'zhuo', '资': 'zi', '姿': 'zi', '滋': 'zi',
  '紫': 'zi', '仔': 'zi', '籽': 'zi', '子': 'zi', '字': 'zi', '自': 'zi', '宗': 'zong', '棕': 'zong',
  '踪': 'zong', '总': 'zong', '纵': 'zong', '走': 'zou', '奏': 'zou', '租': 'zu', '足': 'zu', '卒': 'zu',
  '族': 'zu', '阻': 'zu', '组': 'zu', '祖': 'zu', '钻': 'zuan', '嘴': 'zui', '最': 'zui', '罪': 'zui',
  '醉': 'zui', '遵': 'zun', '昨': 'zuo', '左': 'zuo', '佐': 'zuo', '作': 'zuo', '坐': 'zuo', '座': 'zuo',
  '做': 'zuo',
};

/**
 * 将单个中文字符转换为拼音
 * 如果字符不在映射表中，返回原字符
 */
function charToPinyin(char: string): string {
  return pinyinMap[char] || char;
}

/**
 * 检测字符是否为中文
 */
function isChinese(char: string): boolean {
  return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * 将文本转换为拼音（中文转拼音，其他字符保留）
 */
function toPinyin(text: string): string {
  return text
    .split('')
    .map((char) => {
      if (isChinese(char)) {
        return charToPinyin(char);
      }
      return char;
    })
    .join('');
}

/**
 * 将文本转换为 URL 友好的 slug
 * 支持中文自动转拼音
 */
export function slugify(text: string): string {
  if (!text || text.trim() === '') {
    return '';
  }

  // 先转换为拼音
  const pinyinText = toPinyin(text);

  const slug = pinyinText
    .toLowerCase()
    .trim()
    // 只保留小写字母、数字、空格和连字符
    .replace(/[^a-z0-9\s-]/g, '')
    // 将空格替换为连字符
    .replace(/\s+/g, '-')
    // 将多个连字符替换为单个
    .replace(/-+/g, '-')
    // 去除首尾连字符
    .replace(/^-+|-+$/g, '')
    // 限制长度
    .substring(0, 100);

  // 如果处理后的 slug 为空，使用时间戳
  if (!slug) {
    return 'item-' + Date.now().toString(36);
  }

  return slug;
}

/**
 * 生成工具 slug
 * 用于工具提交页面
 */
export function generateToolSlug(name: string): string {
  return slugify(name);
}

/**
 * 生成资讯 slug
 * 用于资讯提交页面
 */
export function generateNewsSlug(title: string): string {
  return slugify(title);
}

export default slugify;
