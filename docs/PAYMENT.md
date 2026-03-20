# 支付系统对接指南

## 一、准备工作

### 1. 微信支付接入

#### 1.1 申请商户号
- 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
- 注册商户账号并完成实名认证
- 预计审核时间：1-3个工作日

#### 1.2 配置支付产品
- 登录商户平台
- 产品中心 → 申请 JSAPI 支付
- 填写支付场景：H5网页支付
- 配置支付授权目录：`https://your-domain.com/learn/lesson/`

#### 1.3 获取关键信息
1. **商户号 (mchid)**: 登录后右上角查看
2. **APIv3密钥**: 账户中心 → API安全 → 设置APIv3密钥
3. **证书**:
   - 账户中心 → API安全 → 申请API证书
   - 下载 `apiclient_cert.pem` 和 `apiclient_key.pem`
4. **公众号AppID**: [微信公众平台](https://mp.weixin.qq.com/) 获取

#### 1.4 证书文件放置
```
项目根目录/
├── certs/
│   ├── apiclient_cert.pem    # 商户证书
│   ├── apiclient_key.pem     # 商户私钥
│   └── ...
```

---

### 2. 支付宝接入

#### 2.1 创建应用
- 访问 [支付宝开放平台](https://open.alipay.com/)
- 创建网页/移动应用
- 签约产品：手机网站支付

#### 2.2 配置密钥
1. 开放平台 → 控制台 → 应用详情
2. 接口加签方式 → 设置
3. 选择 "公钥证书模式" 或 "公钥模式"
4. 生成密钥对，保存私钥

#### 2.3 获取配置信息
- **AppID**: 应用详情页查看
- **应用私钥**: 上一步生成的私钥
- **支付宝公钥**: 上传应用公钥后获取

---

## 二、环境变量配置

复制 `.env.payment.example` 为 `.env.local`，填写真实配置：

```bash
# 微信支付
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=Your32CharAPIv3KeyHere
WECHAT_PAY_APP_ID=wx1234567890abcdef
WECHAT_PAY_CERT_PATH=./certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=./certs/apiclient_key.pem

# 支付宝
ALIPAY_APP_ID=2024xxxxxxxxxxxx
ALIPAY_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do

# 回调地址 (需配置为公网可访问的 HTTPS 地址)
PAY_NOTIFY_URL=https://your-domain.com/api/pay/notify
```

---

## 三、测试环境配置

### 微信支付沙箱
```bash
WECHAT_PAY_SANDBOX=true
WECHAT_PAY_MCH_ID=sandbox_mchid
WECHAT_PAY_API_KEY=sandbox_key
```

### 支付宝沙箱
```bash
ALIPAY_SANDBOX=true
ALIPAY_GATEWAY_URL=https://openapi.alipaydev.com/gateway.do
ALIPAY_APP_ID=sandbox_app_id
```

---

## 四、域名和 SSL 配置

### 必需配置
1. **公网域名**: 支付回调需要公网可访问
2. **HTTPS 证书**: 微信支付强制要求 HTTPS
3. **备案**: 国内服务器需要域名备案

### 推荐的部署方案
| 方案 | 成本 | 说明 |
|------|------|------|
| 云服务器+备案域名 | ¥300+/年 | 阿里云/腾讯云ECS |
| Serverless + CDN | 按量付费 | Vercel + 国内CDN |

---

## 五、前端支付调用

### 微信支付 (JSAPI)

```typescript
// 1. 创建订单
const response = await fetch('/api/pay/create', {
  method: 'POST',
  body: JSON.stringify({
    courseId: 123,
    payType: 'wechat',
  }),
});

const { data } = await response.json();

// 2. 调起微信支付
if (data.type === 'wechat') {
  // 使用微信 JS-SDK
  WeixinJSBridge.invoke('getBrandWCPayRequest', {
    appId: data.appId,
    timeStamp: data.timeStamp,
    nonceStr: data.nonceStr,
    package: data.package,
    signType: data.signType,
    paySign: data.paySign,
  }, (res) => {
    if (res.err_msg === "get_brand_wcpay_request:ok") {
      // 支付成功
    }
  });
}
```

### 支付宝支付

```typescript
// 1. 创建订单
const response = await fetch('/api/pay/create', {
  method: 'POST',
  body: JSON.stringify({
    courseId: 123,
    payType: 'alipay',
  }),
});

const { data } = await response.json();

// 2. 提交支付宝表单
if (data.type === 'alipay') {
  // data.form 是支付宝返回的 HTML 表单
  document.body.insertAdjacentHTML('beforeend', data.form);
  document.forms['alipay_submit'].submit();
}
```

---

## 六、安全注意事项

1. **密钥保管**
   - 不要将私钥提交到 Git
   - 生产环境使用环境变量
   - 定期更换密钥

2. **回调验签**
   - 必须验证签名
   - 处理幂等性（同一订单多次通知）
   - 返回成功响应避免重复通知

3. **金额校验**
   - 回调时比对订单金额
   - 防止金额篡改

4. **HTTPS 强制**
   - 所有支付相关接口必须 HTTPS
   - 配置 HSTS

---

## 七、常见问题

### Q: 微信支付提示 "商户号未开通 JSAPI 支付"
A: 登录商户平台 → 产品中心 → 申请开通 JSAPI 支付

### Q: 支付宝提示 " insufficient permissions"
A: 应用未签约手机网站支付，需等待审核通过

### Q: 回调收不到通知
A: 检查：
1. 服务器是否公网可访问
2. 防火墙是否放行
3. 回调地址是否正确配置
4. 是否返回了 success/ SUCCESS

---

## 八、完整对接流程图

```
用户点击购买
    ↓
前端创建订单 → 后端生成订单号
    ↓
后端调用微信支付/支付宝下单
    ↓
返回支付参数给前端
    ↓
前端调起支付
    ↓
用户完成支付
    ↓
支付平台发送异步通知
    ↓
后端验证签名 → 更新订单状态
    ↓
用户跳转学习页面
```
