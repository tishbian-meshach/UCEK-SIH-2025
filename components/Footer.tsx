import { Star, Github, Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left side - Project info */}
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">UCEK SIH 2025 Team Formation System</span>
          </div>

          {/* Center - GitHub star */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/tishbian-meshach/UCEK-SIH-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Star className="h-4 w-4 mr-2" />
              Give a star on GitHub
            </a>
          </div>

          {/* Right side - Made with love */}
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span className="text-sm">for UCEK students</span>
          </div>
        </div>

        {/* Bottom row - Additional links */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a
                href="https://github.com/tishbian-meshach/UCEK-SIH-2025/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors"
              >
                Report Issues
              </a>
              <a
                href="https://github.com/tishbian-meshach/UCEK-SIH-2025/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors"
              >
                Documentation
              </a>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Github className="h-4 w-4" />
              <span>Open Source Project</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
