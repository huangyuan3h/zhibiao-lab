import Link from "next/link";

export const metadata = {
  title: "页面没找到",
  description: "老黄测指标 · 你要找的页面不存在，回到首页看看系列「什么指标不赚钱」全集，或告诉我们你想测哪个指标。",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <p className="text-6xl" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">这个页面不存在</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        老黄测指标 · 可能是链接写错了。看看系列「什么指标不赚钱」全集，或者告诉我们你想测哪个指标。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          回国内版首页
        </Link>
        <Link
          href="/global/"
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
        >
          去海外版首页
        </Link>
        <Link href="/request/" className="rounded-lg px-4 py-2 font-medium text-blue-600 hover:underline">
          我想测的指标 →
        </Link>
      </div>
    </div>
  );
}
