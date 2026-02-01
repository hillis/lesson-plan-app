import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Lesson Plans in Minutes, Not Hours
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your syllabus and standards. Get complete, CTE-format lesson plans
            tailored to your curriculum. Save directly to Google Drive.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-3xl mb-4">&#128221;</div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Curriculum</h3>
              <p className="text-gray-600">
                Upload your syllabus, standards, and pacing guides. We'll use them to create personalized lessons.
              </p>
            </div>
            <div className="p-6">
              <div className="text-3xl mb-4">&#9997;</div>
              <h3 className="text-xl font-semibold mb-2">Generate Lessons</h3>
              <p className="text-gray-600">
                Select a week and customize options. Get complete lesson plans, handouts, and presentations.
              </p>
            </div>
            <div className="p-6">
              <div className="text-3xl mb-4">&#128190;</div>
              <h3 className="text-xl font-semibold mb-2">Save to Drive</h3>
              <p className="text-gray-600">
                Automatically save all generated files to your Google Drive, organized by week.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
