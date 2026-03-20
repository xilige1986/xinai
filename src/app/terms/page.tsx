import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '使用条款 - AI工具库',
  description: '使用AI工具库服务前，请仔细阅读并理解我们的使用条款。',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">使用条款</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            欢迎使用AI工具库！使用我们的服务即表示您同意以下条款。
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <div className="mb-12">
              <p className="text-muted-foreground">
                最后更新日期：2026年1月1日
              </p>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. 接受条款</h2>
                <p className="text-muted-foreground">
                  访问或使用AI工具库（以下简称"本网站"）即表示您同意受这些使用条款的约束。
                  如果您不同意这些条款的任何部分，请不要使用我们的服务。我们保留随时修改这些条款的权利，
                  修改后的条款将在本页面发布时生效。继续使用我们的服务即表示您接受修改后的条款。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. 服务说明</h2>
                <p className="text-muted-foreground mb-4">
                  AI工具库是一个AI工具导航平台，为用户提供：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>AI工具的收录、分类和展示</li>
                  <li>工具评测和使用指南</li>
                  <li>用户评论和评分系统</li>
                  <li>行业资讯和学习资源</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  我们努力确保信息的准确性，但不保证所有信息都完全准确或最新。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. 用户账户</h2>
                <p className="text-muted-foreground mb-4">
                  使用某些功能（如收藏、评论）需要注册账户。您同意：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>提供准确、完整的注册信息</li>
                  <li>妥善保管您的账户密码</li>
                  <li>对账户下的所有活动负责</li>
                  <li>发现未经授权的使用时立即通知我们</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  我们有权在怀疑账户存在安全问题时暂停或终止您的账户。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. 用户行为</h2>
                <p className="text-muted-foreground mb-4">
                  使用本网站时，您同意不会：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>发布或传播违法、有害、欺诈、骚扰、诽谤或侵权内容</li>
                  <li>冒充他人或使用虚假身份</li>
                  <li>干扰或破坏网站服务或服务器</li>
                  <li>使用自动化手段（如机器人、爬虫）访问网站</li>
                  <li>收集其他用户的个人信息</li>
                  <li>传播恶意软件或病毒</li>
                  <li>从事任何可能损害未成年人利益的活动</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. 内容发布</h2>
                <p className="text-muted-foreground mb-4">
                  当您在我们的网站发布内容（如评论、评测）时：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>您保留您内容的所有权</li>
                  <li>您授予我们非独占的、全球性的、免费的许可，用于展示、分发和推广您的内容</li>
                  <li>您声明并保证您有权发布该内容，且内容不侵犯第三方权利</li>
                  <li>我们有权删除任何违反这些条款的内容</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. 知识产权</h2>
                <p className="text-muted-foreground mb-4">
                  本网站及其原创内容（不包括用户发布的内容）归我们所有，受知识产权法保护：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>网站设计、标志、图标、界面属于我们的商标</li>
                  <li>网站上的文字、图片、代码受版权保护</li>
                  <li>未经我们书面许可，不得复制、修改、分发或创建衍生作品</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. 第三方链接</h2>
                <p className="text-muted-foreground">
                  本网站包含指向第三方网站（如AI工具官网）的链接。这些链接仅为方便用户而提供，
                  不代表我们认可或控制这些网站。我们不对第三方网站的内容、隐私政策或实践负责。
                  您访问第三方网站的风险由您自行承担。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. 免责声明</h2>
                <p className="text-muted-foreground mb-4">
                  本网站按"现状"和"可用性"提供，我们明确声明不承担任何明示或暗示的保证：
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>我们不保证服务不会中断、及时、安全或无错误</li>
                  <li>我们不保证工具信息的准确性和完整性</li>
                  <li>我们不 endorsement 任何第三方工具</li>
                  <li>使用本网站推荐的工具产生的任何损失，我们不承担责任</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. 责任限制</h2>
                <p className="text-muted-foreground">
                  在法律允许的最大范围内，我们不对任何间接、附带、特殊、后果性或惩罚性损害承担责任，
                  包括但不限于利润损失、数据丢失、商誉损失或其他无形损失，即使我们已被告知可能发生此类损害。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. 赔偿</h2>
                <p className="text-muted-foreground">
                  您同意赔偿并使我们免受任何索赔、责任、损害、损失和费用（包括合理的律师费）的损害，
                  这些损害源于或与您使用本网站、违反这些条款或侵犯他人权利有关。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. 终止</h2>
                <p className="text-muted-foreground">
                  我们可以以任何理由（包括但不限于违反这些条款）随时终止或暂停您访问本网站，
                  无需事先通知或承担责任。终止后，您使用本网站的权利立即停止。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">12. 适用法律</h2>
                <p className="text-muted-foreground">
                  这些条款受中华人民共和国法律管辖，并按其解释。因这些条款引起的任何争议应提交中国法院解决。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">13. 联系我们</h2>
                <p className="text-muted-foreground">
                  如果您对这些使用条款有任何疑问，请通过以下方式联系我们：
                </p>
                <p className="text-muted-foreground mt-2">
                  邮箱：<a href="mailto:legal@example.com" className="text-primary hover:underline">legal@example.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
