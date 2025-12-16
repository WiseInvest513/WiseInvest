import { Timeline } from '@/components/Timeline'

export default function AboutPage() {
  return (
    <div className="bg-page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-wide font-heading">
            关于我
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-body">
            一名崇尚长期主义的投资者
          </p>
        </div>

        <div className="prose prose-lg max-w-3xl">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-body">
            我是一名崇尚长期主义的投资者。我建立这个网站是为了整理和分享高价值的投资资源，
            帮助更多人在快速变化的市场中找到理性的投资路径。我相信通过系统化的学习和工具，
            每个人都能成为更聪明的投资者。
          </p>
        </div>

        <div className="mt-16">
          <Timeline />
        </div>
      </div>
    </div>
  )
}
