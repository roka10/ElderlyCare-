import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Heart, Bell, Video, Sparkles, Activity, Eye, Users, Zap, ChevronRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">

      {/* ── Global Animated Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/10" />
        <div className="absolute top-20 -left-32 w-[500px] h-[500px] bg-blue-400/15 dark:bg-blue-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-indigo-400/15 dark:bg-indigo-500/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-[350px] h-[350px] bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/40 dark:border-slate-800/40 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
            <div className="relative">
              <Heart className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <Sparkles className="h-3 w-3 text-primary/60 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xl font-bold gradient-text">CareCompanion</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ══════════════════════════════ HERO ══════════════════════════════ */}
        <section className="container py-24 md:py-36 space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-in fade-in-0 slide-in-from-bottom-6 duration-1000">

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Care Monitoring
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Caring for loved ones,{" "}
              <span className="gradient-text">even when you&apos;re away</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              An AI-powered monitoring system that combines face recognition, emotion analysis,
              fall detection, and smart reminders — giving families and caregivers complete peace of mind.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all gap-2 h-12 px-8 text-base">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base glass border-primary/20 hover:bg-primary/5 transition-all">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* ── Trust Badges ── */}
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                <span>HIPAA Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-blue-500" />
                <span>Real-time AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-500" />
                <span>Multi-user</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ FEATURES ══════════════════════════ */}
        <section id="features" className="py-24 relative">
          <div className="container">
            <div className="text-center mb-16 space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Core Capabilities
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Everything you need for{" "}
                <span className="gradient-text">complete care</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Four AI models working together in real-time to keep your loved ones safe.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Eye, color: "blue",
                  title: "Face Recognition",
                  desc: "Upload a photo and the system instantly identifies known visitors on the live feed."
                },
                {
                  icon: Heart, color: "rose",
                  title: "Emotion Analysis",
                  desc: "Real-time facial expression detection tracks emotional well-being throughout the day."
                },
                {
                  icon: Activity, color: "purple",
                  title: "Motion & Fall Detection",
                  desc: "Posture analysis detects falls instantly and sends emergency alerts to designated contacts."
                },
                {
                  icon: Bell, color: "amber",
                  title: "Smart Reminders",
                  desc: "Voice-activated reminders for medications, meals, and daily tasks."
                },
              ].map((feature, i) => (
                <div key={i} className="group relative">
                  <div className={`absolute inset-0 bg-${feature.color}-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative glass rounded-2xl p-6 shadow-lg shadow-black/[0.03] hover:shadow-xl border border-white/60 dark:border-slate-700/40 transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-4 shadow-lg shadow-${feature.color}-500/25`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
        <section id="how-it-works" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent dark:from-slate-900/50 -z-10" />
          <div className="container">
            <div className="text-center mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Zap className="h-3.5 w-3.5" />
                Setup Guide
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Up and running in{" "}
                <span className="gradient-text">minutes</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div className="space-y-8">
                {[
                  { step: "1", title: "Set Up Your System", desc: "Connect your cameras and create your secure account." },
                  { step: "2", title: "Add Known Visitors", desc: "Upload photos of family members and caregivers for instant recognition." },
                  { step: "3", title: "Manage Tasks & Reminders", desc: "Create medication schedules and daily task lists from anywhere." },
                  { step: "4", title: "Monitor & Receive Alerts", desc: "Get real-time notifications for falls, unknown visitors, or emotional distress." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-2xl p-8 shadow-xl border border-white/60 dark:border-slate-700/40">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 dark:from-primary/5 dark:to-indigo-500/5 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-xl shadow-primary/30">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Live AI Detection Preview</p>
                    <Link href="/login">
                      <Button size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-indigo-600">
                        Try It Now <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
        <section id="testimonials" className="py-24">
          <div className="container">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">
                Trusted by{" "}
                <span className="gradient-text">families everywhere</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { name: "Sarah M.", role: "Daughter", text: "CareCompanion gave me peace of mind. I can check on my mother anytime, and the fall detection feature is a lifesaver." },
                { name: "Dr. Patel", role: "Family Physician", text: "The emotion tracking helps me understand my patients' well-being between visits. Truly innovative technology." },
                { name: "James W.", role: "Professional Caregiver", text: "Managing multiple clients is so much easier now. The smart reminders and visitor management save hours every week." },
              ].map((t, i) => (
                <div key={i} className="glass rounded-2xl p-6 shadow-lg border border-white/60 dark:border-slate-700/40 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ CTA ══════════════════════ */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 -z-10" />
          <div className="absolute inset-0 -z-[5] opacity-20">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-float-delayed" />
          </div>
          <div className="container text-center space-y-6 relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to get started?</h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Join families who trust CareCompanion for their elderly care monitoring needs.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="border-t border-white/40 dark:border-slate-800/40 py-12 glass-subtle">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-bold gradient-text">CareCompanion</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered elderly care for peace of mind.</p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "FAQ"] },
              { title: "Company", links: ["About", "Blog", "Careers"] },
              { title: "Legal", links: ["Privacy", "Terms", "Cookie Policy"] },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4 text-sm">{col.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="hover:text-foreground transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/20 dark:border-slate-800/40 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CareCompanion. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
