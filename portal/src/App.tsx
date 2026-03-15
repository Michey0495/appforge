import { Routes, Route, Link } from 'react-router-dom'
import { Home } from './pages/Home'
import { AppPage } from './pages/AppPage'
import { Logo } from './components/Logo'

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <span className="text-[11px] text-gray-400 tracking-wide">
            AI-Driven Development
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app/:appId" element={<AppPage />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between">
          <span className="text-[11px] text-gray-300">
            AI駆動開発で作る業務効率化アプリケーション集
          </span>
          <span className="text-[11px] text-gray-300">
            Givery Inc.
          </span>
        </div>
      </footer>
    </div>
  )
}
