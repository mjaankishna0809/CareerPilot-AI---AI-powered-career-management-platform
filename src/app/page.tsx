import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">
              CareerPilot AI
            </h1>

            <p className="text-xs text-slate-500">
              AI Resume & Job Tracker
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Sign in
            </Link>

            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
        <p className="mb-4 text-sm font-semibold text-indigo-400">
          AI-powered career management
        </p>

        <h2 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Build better resumes.
          <br />
          Track every opportunity.
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          CareerPilot AI helps you build professional resumes,
          improve them with AI, generate tailored cover letters,
          and manage your complete job application journey.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/sign-up"
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Create free account
          </Link>

          <Link
            href="/auth/login"
            className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-900"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="Resume Builder"
            description="Create and manage professional resumes."
          />

          <FeatureCard
            title="AI Assistant"
            description="Improve resumes using AI recommendations."
          />

          <FeatureCard
            title="Job Tracker"
            description="Track applications from wishlist to offer."
          />

          <FeatureCard
            title="Career Analytics"
            description="Understand your application performance."
          />
        </div>
      </section>
    </main>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-left">
      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </article>
  );
}