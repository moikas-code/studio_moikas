import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 via-base-200 to-base-300">
      <div className="text-center space-y-8 p-12 max-w-xl animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse"></div>
          <h2 className="text-8xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent relative animate-wiggle">
            404
          </h2>
          <div className="text-2xl text-base-content/60 mt-2">
            ✨ Mana Depleted ✨
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-3xl font-bold text-base-content">
            Portal Not Found
          </h3>
          <p className="text-lg text-base-content/70 max-w-md mx-auto">
            The mystical gateway you seek has vanished into the ethereal realm. 
            Fear not, brave adventurer - let us guide you back to familiar grounds!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link 
            href="/" 
            className="btn btn-primary btn-lg gap-2 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Sanctuary
          </Link>
          
          <Link 
            href="/tools" 
            className="btn btn-outline btn-lg gap-2 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Visit the Arcane Workshop
          </Link>
        </div>

        <div className="text-sm text-base-content/50 mt-8">
          <p>Spell Miscast: 404 | Portal coordinates unknown</p>
        </div>
      </div>
    </div>
  );
}