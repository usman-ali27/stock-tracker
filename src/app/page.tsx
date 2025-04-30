import LoginForm from '@/components/auth/LoginForm';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md p-6 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl my-5 font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Asset Tracker
          </h2>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
