import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, LinkIcon, TrendingUp, Zap, Users, Shield, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LynkScope</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#preview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preview
            </a>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-purple glow-purple hover:glow-purple-strong transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />
        
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-purple-400">
              Understand Your Audience.<br />Grow Smarter.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Track clicks, conversions, and engagement across every platform — all in one sleek dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-purple glow-purple hover:glow-purple-strong transition-all text-lg px-8 hover:scale-105 duration-300">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 duration-300">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to track and grow your audience</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: LinkIcon,
                title: "Multi-Platform Link Tracking",
                description: "Track links across Instagram, TikTok, YouTube, and more — all in one place."
              },
              {
                icon: BarChart3,
                title: "Real-Time Analytics Dashboard",
                description: "Beautiful charts and insights that update live as your audience engages."
              },
              {
                icon: TrendingUp,
                title: "Smart Insights for Creators",
                description: "AI-powered recommendations to optimize your content strategy."
              },
              {
                icon: Zap,
                title: "Simple, Clean, Powerful",
                description: "Intuitive interface that makes complex data easy to understand."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-xl hover:scale-105 hover:glow-purple transition-all duration-300 group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-20 px-6 bg-gradient-to-b from-transparent via-card/30 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Beautiful Dashboard</h2>
            <p className="text-xl text-muted-foreground">See your data come to life with stunning visualizations</p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl animate-slide-in-right">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                <div className="text-sm text-muted-foreground mb-2">Total Clicks</div>
                <div className="text-3xl font-bold text-primary">12,547</div>
                <div className="text-xs text-green-500 mt-1">+23% this week</div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                <div className="text-sm text-muted-foreground mb-2">Top Platform</div>
                <div className="text-3xl font-bold">Instagram</div>
                <div className="text-xs text-muted-foreground mt-1">42% of traffic</div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                <div className="text-sm text-muted-foreground mb-2">Engagement Rate</div>
                <div className="text-3xl font-bold text-primary">8.4%</div>
                <div className="text-xs text-green-500 mt-1">+1.2% this week</div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="text-sm text-muted-foreground mb-4">Last 7 Days Trend</div>
              <div className="h-48 flex items-end gap-2">
                {[65, 78, 82, 70, 88, 95, 100].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:from-primary/80 hover:to-purple-400"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Creators</h2>
            <p className="text-xl text-muted-foreground">Join thousands of creators tracking their success</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "LynkScope transformed how I track my audience. The insights are incredible!",
                author: "Sarah Chen",
                role: "Content Creator"
              },
              {
                quote: "Finally, a dashboard that's both beautiful and powerful. Game changer!",
                author: "Marcus Rodriguez",
                role: "Digital Marketer"
              },
              {
                quote: "The real-time analytics help me make better content decisions every day.",
                author: "Emily Watson",
                role: "Influencer"
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 bg-gradient-to-t from-primary/10 to-transparent">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start tracking smarter — try LynkScope free for 14 days.
            </h2>
            <Link to="/auth">
              <Button size="lg" className="gradient-purple glow-purple-strong hover:scale-110 transition-all text-lg px-12 animate-glow-pulse">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LynkScope</span>
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#preview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preview</a>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2025 LynkScope. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
