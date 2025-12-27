import Link from 'next/link';

export default function NewPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">New Page</h1>
      <p className="text-lg mb-8">This is a demonstration of Next.js performance features.</p>
      <Link href="/" className="text-blue-400 hover:underline">
        Go back to Home
      </Link>
    </div>
  );
}
