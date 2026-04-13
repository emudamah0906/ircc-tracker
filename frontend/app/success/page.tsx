"use client";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center max-w-md">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re Premium!</h1>
        <p className="text-gray-400 mb-6">
          You&apos;ll now get instant email alerts whenever IRCC processing times
          change for your selected visa type and country.
        </p>
        <a
          href="/"
          className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
