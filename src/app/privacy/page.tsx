import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 - AI工具库',
  description: '了解AI工具库如何收集、使用和保护您的个人信息。',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">隐私政策</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            我们高度重视您的隐私保护，本政策说明了我们如何收集、使用和保护您的信息。
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <div className="mb-12">
              <p className="text-muted-foreground">
                最后更新日期：2024年1月1日
              </p>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. 信息收集</h2>
                <p className="text-muted-foreground mb-4">
                  我们可能会收集以下类型的信息：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>账户信息：</strong>当您注册账户时，我们会收集您的用户名、邮箱地址和密码。
                  </li>
                  <li>
                    <strong>使用数据：</strong>我们会收集您如何使用我们网站的信息，包括访问的页面、点击的工具等。
                  </li>
                  <li>
                    <strong>设备信息：</strong>我们会收集您的设备类型、浏览器类型、IP地址等技术信息。
                  </li>
                  <li>
                    <strong>Cookie数据：</strong>我们使用Cookie来改善用户体验，您可以在浏览器设置中管理Cookie。
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. 信息使用</h2>
                <p className="text-muted-foreground mb-4">
                  我们使用收集的信息用于：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>提供、维护和改进我们的服务</li>
                  <li>个性化您的用户体验</li>
                  <li>向您发送服务通知和更新</li>
                  <li>分析使用趋势以优化网站功能</li>
                  <li>防止欺诈和滥用行为</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. 信息保护</h2>
                <p className="text-muted-foreground mb-4">
                  我们采取多种安全措施来保护您的信息：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>使用SSL加密技术传输数据</li>
                  <li>定期更新安全系统</li>
                  <li>限制员工访问敏感信息</li>
                  <li>定期进行安全审计</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. 信息共享</h2>
                <p className="text-muted-foreground mb-4">
                  我们不会出售您的个人信息。仅在以下情况下可能共享信息：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    <strong>服务提供商：</strong>我们可能与帮助我们运营网站的第三方服务提供商共享信息。
                  </li>
                  <li>
                    <strong>法律要求：</strong>如法律要求或为了保护我们的权利，我们可能需要披露信息。
                  </li>
                  <li>
                    <strong>业务转让：</strong>在公司合并、收购或资产出售时，信息可能作为资产转让。
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. 您的权利</h2>
                <p className="text-muted-foreground mb-4">
                  根据适用的数据保护法，您享有以下权利：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>访问您的个人信息</li>
                  <li>更正不准确的个人信息</li>
                  <li>删除您的个人信息</li>
                  <li>限制或反对处理您的信息</li>
                  <li>数据可携带权</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. 第三方链接</h2>
                <p className="text-muted-foreground">
                  我们的网站包含指向第三方网站（AI工具官网）的链接。请注意，这些网站有自己的隐私政策，
                  我们不对这些网站的隐私实践负责。我们建议您在向这些网站提交任何个人信息前阅读其隐私政策。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. 儿童隐私</h2>
                <p className="text-muted-foreground">
                  我们的服务不面向13岁以下的儿童。如果我们发现收集了13岁以下儿童的个人信息，
                  我们会立即删除这些信息。如果您认为我们可能收集了儿童的信息，请联系我们。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. 政策更新</h2>
                <p className="text-muted-foreground">
                  我们可能会不时更新本隐私政策。任何变更将在本页面发布，重大变更我们会通过网站公告或邮件通知您。
                  建议您定期查看本页面以了解最新信息。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. 联系我们</h2>
                <p className="text-muted-foreground">
                  如果您对本隐私政策有任何疑问或担忧，请通过以下方式联系我们：
                </p>
                <p className="text-muted-foreground mt-2">
                  邮箱：<a href="mailto:privacy@example.com" className="text-primary hover:underline">privacy@example.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
