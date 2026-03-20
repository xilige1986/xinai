# 支付对接材料清单

## 你需要提供的材料

### 1. 商户资质

| 材料 | 微信支付 | 支付宝 | 说明 |
|------|---------|--------|------|
| 营业执照 | ✓ | ✓ | 企业或个体工商户 |
| 法人身份证 | ✓ | ✓ | 正反面照片 |
| 对公银行账户 | ✓ | ✓ | 用于结算 |
| 域名 | ✓ | ✓ | 需要备案的域名 |
| 网站/App | ✓ | ✓ | 展示经营内容 |

### 2. 微信支付专用

**需要在商户平台获取：**

```
1. 商户号 (mchid)
   → 登录商户平台 → 右上角查看

2. APIv3密钥
   → 账户中心 → API安全 → 设置APIv3密钥
   → 32位随机字符串

3. 证书文件
   → 账户中心 → API安全 → 申请API证书
   → 下载: apiclient_cert.pem
   → 下载: apiclient_key.pem

4. 公众号AppID
   → 微信公众平台 → 开发 → 基本配置
```

### 3. 支付宝专用

**需要在开放平台获取：**

```
1. 应用ID (AppID)
   → 控制台 → 应用详情

2. 应用私钥
   → 接口加签方式 → 生成密钥对
   → 保存私钥，上传公钥

3. 支付宝公钥
   → 上传应用公钥后获取
```

### 4. 服务器配置

**必须配置：**

```bash
# 公网服务器 (国内)
- 阿里云ECS / 腾讯云CVM
- 最低配置：1核2G
- 系统：Ubuntu 20.04 / CentOS 8

# 域名
- 已备案的域名
- 建议：your-domain.com

# HTTPS证书
- 免费：Let's Encrypt
- 商业：阿里云/腾讯云SSL证书
```

---

## 配置示例

### 1. 放置证书文件

```bash
# 在项目根目录创建 certs 文件夹
mkdir -p certs

# 将下载的证书放入
certs/
├── apiclient_cert.pem    # 微信支付证书
├── apiclient_key.pem     # 微信支付私钥
└── README.md
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# ========== 微信支付 ==========
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=YourAPIv3Key32CharsLongHere
WECHAT_PAY_APP_ID=wx1234567890abcdef
WECHAT_PAY_CERT_PATH=./certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=./certs/apiclient_key.pem
WECHAT_PAY_SANDBOX=false

# ========== 支付宝 ==========
ALIPAY_APP_ID=2024xxxxxxxxxxxx
ALIPAY_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
ALIPAY_SANDBOX=false

# ========== 通用配置 ==========
# 支付回调地址 (必须公网 HTTPS)
PAY_NOTIFY_URL=https://your-domain.com/api/pay/notify
PAY_SUCCESS_URL=https://your-domain.com/pay/success
```

---

## 申请流程时间

| 步骤 | 微信支付 | 支付宝 | 备注 |
|------|---------|--------|------|
| 商户注册 | 1-3天 | 即时 | 资料审核 |
| 产品开通 | 1-2天 | 1-2天 | 签约审核 |
| 域名备案 | 7-20天 | 7-20天 | 工信部备案 |
| 服务器部署 | 1天 | 1天 | 配置环境 |
| **总计** | **10-30天** | **10-30天** | |

---

## 快速开始 (测试环境)

如果不想等待，可以使用沙箱环境先开发：

### 微信支付沙箱
- 无需资质审核
- 模拟支付流程
- 配置：`WECHAT_PAY_SANDBOX=true`

### 支付宝沙箱
- 开放平台自动提供
- 模拟支付流程
- 配置：`ALIPAY_SANDBOX=true`

---

## 交付清单

请将以下材料发送给开发人员：

```
□ 微信支付商户号
□ 微信支付APIv3密钥
□ 微信支付证书文件 (2个pem文件)
□ 微信公众号AppID
□ 支付宝AppID
□ 支付宝应用私钥
□ 支付宝公钥
□ 已备案的域名
□ 服务器SSH登录信息 (如需代部署)
```
