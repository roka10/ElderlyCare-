import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Heart, Bell, Video } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CareCompanion</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 md:py-32 space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Caring for your loved ones, <span className="text-primary">even when you're away</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              An AI-powered monitoring system that provides peace of mind for families and caregivers of elderly
              individuals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted py-24">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Voice Reminders</h3>
                <p className="text-muted-foreground">
                  Alexa-integrated to-do lists and medication reminders that can be managed remotely.
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="bg-secondary/10 p-3 rounded-full w-fit mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Monitoring</h3>
                <p className="text-muted-foreground">
                  Fall detection and emotion analysis with real-time alerts to caregivers.
                </p>
              </div>

              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="bg-accent/10 p-3 rounded-full w-fit mb-4">
                  <Video className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Feed & SOS</h3>
                <p className="text-muted-foreground">
                  Real-time video monitoring and emergency SOS system for immediate assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Set Up Your System</h3>
                    <p className="text-muted-foreground">
                      Connect your cameras and Alexa devices to the CareCompanion platform.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Add Known Visitors</h3>
                    <p className="text-muted-foreground">
                      Upload photos of family members and regular visitors for face recognition.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Manage Tasks & Reminders</h3>
                    <p className="text-muted-foreground">
                      Create voice-activated reminders for medications and daily tasks.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Monitor & Receive Alerts</h3>
                    <p className="text-muted-foreground">
                      Get real-time notifications for falls, unknown visitors, or emotional distress.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Demo Video</p>
                  <Button>Watch How It Works</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of families who trust CareCompanion for their elderly care monitoring needs.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">CareCompanion</h3>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Caring since 2024</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CareCompanion. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
