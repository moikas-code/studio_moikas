"use client";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
  return (
    <section className="w-full py-20 px-4 bg-white/80 dark:bg-base-200/80">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about Studio.Moikas
          </p>
        </div>

        <div className="space-y-4">
          <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                What is Studio.Moikas?
              </h3>
              <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Studio.Moikas is an AI-powered creative studio that allows you
                to generate high-quality images from text descriptions. It&apos;s
                designed for artists, designers, marketers, and anyone who needs
                visual content. Our platform offers multiple AI models, flexible pricing,
                and professional-quality results.
              </p>
            </div>
          </details>

          <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                How does the Mana Points system work?
              </h3>
              <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Mana Points (MP) are our flexible credit system. Each image generation
                costs MP based on the model, resolution, and parameters used.
                Free users receive 125 MP monthly (renewed automatically), while
                Standard users get 150 MP monthly plus the ability to purchase additional
                permanent MP as needed.
              </p>
            </div>
          </details>

          <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                Can I use the generated images commercially?
              </h3>
              <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Yes! You own full commercial rights to all images you generate with
                Studio.Moikas. Use them for personal projects, client work, products,
                marketing materials, or any other purpose. The only restriction is
                creating inappropriate or illegal content as outlined in our terms of service.
              </p>
            </div>
          </details>

          <details className="group bg-white dark:bg-base-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                What AI models are available?
              </h3>
              <ChevronDown className="w-5 h-5 text-jade transform group-open:rotate-180 transition-transform duration-300" />
            </summary>
            <div className="px-6 pb-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We offer multiple state-of-the-art AI models including FLUX, SANA, and more.
                Each model has unique strengths - some excel at photorealism, others at
                artistic styles. Premium models offer higher quality and more control
                over generation parameters. We continuously add new models as they become available.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}