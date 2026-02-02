import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Zap, Download, CheckCircle2, ArrowRight, LayoutTemplate } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-primary/20">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span>LessonGen</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">Updated for the new school year</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Professional Lesson Plans <br />
            <span className="text-gradient">in Minutes, Not Hours</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Upload your syllabus and standards. Get complete, CTE-format lesson plans tailored to your curriculum.
            Automate your paperwork and focus on teaching.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/20 transition-all hover:scale-105">
                Start Generating Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all text-foreground">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Floating UI Mockup/Graphic */}
          <div className="mt-20 relative w-full max-w-5xl group perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass-card rounded-xl p-2 md:p-4 transform transition-transform duration-700 group-hover:rotate-x-2 animate-in fade-in zoom-in-50 delay-500">
              <div className="rounded-lg overflow-hidden border border-white/5 bg-[#0f1115] aspect-[16/9] md:aspect-[21/9] flex items-center justify-center relative">
                {/* Mock UI Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%,rgba(255,255,255,0.02)_100%)] bg-[length:24px_24px]" />
                <div className="flex flex-col items-center gap-4 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-float">
                    <Zap className="w-8 h-8 text-white fill-white" />
                  </div>
                  <p className="text-muted-foreground font-mono text-sm">Generating lesson plans for Week 4...</p>
                </div>
              </div>
            </div>

            {/* Floating Accents */}
            <div className="absolute -right-8 -top-8 p-4 glass rounded-2xl animate-float delay-1000 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-bold">Standards Aligned</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-8 bottom-12 p-4 glass rounded-2xl animate-float delay-700 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="text-sm font-bold">CTE Compliant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="container mx-auto px-4 py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform handles the tedious parts of lesson planning so you can focus on delivering great instruction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText />}
              title="Upload Your Curriculum"
              description="Upload your syllabus, standards, and pacing guides. We'll use them to create personalized lessons."
              color="text-blue-400"
              gradient="from-blue-500/20 to-transparent"
            />
            <FeatureCard
              icon={<Zap />}
              title="Generate Instantly"
              description="Select a week and customize options. Get complete lesson plans, handouts, and presentations in seconds."
              color="text-amber-400"
              gradient="from-amber-500/20 to-transparent"
            />
            <FeatureCard
              icon={<Download />}
              title="Export to Drive"
              description="Automatically save all generated files to your Google Drive, organized by week and ready to use."
              color="text-emerald-400"
              gradient="from-emerald-500/20 to-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-black/20 backdrop-blur-lg mt-20">
          <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LessonGen. All rights reserved.
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color, gradient }: { icon: React.ReactNode, title: string, description: string, color: string, gradient: string }) {
  return (
    <div className="group relative p-1 rounded-2xl bg-gradient-to-br from-white/10 to-transparent hover:from-primary/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative h-full bg-[#0a0a0a] rounded-xl p-8 border border-white/5 flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center ${color} mb-2 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
