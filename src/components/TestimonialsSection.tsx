"use client";

export default function TestimonialsSection() {
  return (
    <section className="w-full py-20 px-4 bg-gradient-to-b from-transparent via-white/50 to-transparent dark:from-transparent dark:via-base-200/50 dark:to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Loved By Creators Worldwide
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied users who are creating amazing content daily
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white dark:bg-base-300 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade to-jade-dark flex items-center justify-center mr-4 shadow-md">
                <span className="dark:text-white text-black font-bold text-lg">JK</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Justine Kase</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Digital Artist</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
              &quot;Studio.Moikas has completely transformed my workflow. I can
              explore concepts and ideas in minutes that would have taken days
              before. The quality is consistently amazing.&quot;
            </p>
          </div>

          <div className="group bg-white dark:bg-base-300 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade to-jade-dark flex items-center justify-center mr-4 shadow-md">
                <span className="dark:text-white text-black font-bold text-lg">MS</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Mark Smith</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Director</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
              &quot;The speed and quality of AI-generated images have allowed
              our small team to produce content at the scale of much larger
              companies. ROI has been incredible.&quot;
            </p>
          </div>

          <div className="group bg-white dark:bg-base-300 p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-jade to-jade-dark flex items-center justify-center mr-4 shadow-md">
                <span className="dark:text-white text-black font-bold text-lg">AJ</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Alex Johnson</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Indie Game Developer</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
              &quot;As a solo developer, Studio.Moikas has been a game-changer. I
              can create professional-quality art assets without hiring a team
              of artists. Essential tool!&quot;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}