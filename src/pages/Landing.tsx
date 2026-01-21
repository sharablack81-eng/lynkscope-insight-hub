import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, BarChart3, LinkIcon, TrendingUp, Zap, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const Landing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  const goNext = () => goToSlide(currentSlide + 1);
  const goPrev = () => goToSlide(currentSlide - 1);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-lg z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LynkScope</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#features" onClick={(e) => { e.preventDefault(); setCurrentSlide(1); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#preview" onClick={(e) => { e.preventDefault(); setCurrentSlide(2); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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

      {/* Main Carousel Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Slides Container */}
        <div 
          className="h-full flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* Slide 1: Hero / Value Proposition */}
          <div className="w-full h-full flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />
            
            <div className="h-full flex items-center justify-center px-6">
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
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="text-lg px-8 hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 duration-300"
                      onClick={goNext}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2: Features */}
          <div id="features" className="w-full h-full flex-shrink-0 overflow-hidden">
            <div className="h-full flex items-center px-4">
              <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-4 animate-fade-in-up">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Powerful Features</h2>
                  <p className="text-base text-muted-foreground">Everything you need to track and grow your audience</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      className="glass-card p-4 rounded-xl hover:scale-105 hover:glow-purple transition-all duration-300 group animate-scale-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3: Dashboard Preview */}
          <div id="preview" className="w-full h-full flex-shrink-0 overflow-hidden bg-gradient-to-b from-transparent via-card/30 to-transparent">
            <div className="h-full flex items-center px-4">
              <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-4 animate-fade-in-up">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Beautiful Dashboard</h2>
                  <p className="text-base text-muted-foreground">See your data come to life with stunning visualizations</p>
                </div>
                
                <div className="glass-card p-4 md:p-6 rounded-2xl animate-slide-in-right">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">Total Clicks</div>
                      <div className="text-2xl font-bold text-primary">12,547</div>
                      <div className="text-xs text-green-500 mt-1">+23% this week</div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">Top Platform</div>
                      <div className="text-2xl font-bold">Instagram</div>
                      <div className="text-xs text-muted-foreground mt-1">42% of traffic</div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">Engagement Rate</div>
                      <div className="text-2xl font-bold text-primary">8.4%</div>
                      <div className="text-xs text-green-500 mt-1">+1.2% this week</div>
                    </div>
                  </div>
                  
                  <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground mb-3">Last 7 Days Trend</div>
                    <div className="h-24 flex items-end gap-2">
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
            </div>
          </div>

          {/* Slide 4: Testimonials + CTA */}
          <div className="w-full h-full flex-shrink-0 overflow-hidden">
            <div className="h-full flex items-center px-4">
              <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-4 animate-fade-in-up">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Loved by Creators</h2>
                  <p className="text-base text-muted-foreground">Join thousands of creators tracking their success</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
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
                      className="glass-card p-4 rounded-xl hover:scale-105 transition-all duration-300 animate-scale-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Sparkles key={i} className="w-3 h-3 text-primary fill-primary" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 italic">"{testimonial.quote}"</p>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.author}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Section */}
                <div className="text-center bg-gradient-to-t from-primary/10 to-transparent py-6 rounded-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Start tracking smarter — try LynkScope free for 14 days.
                  </h2>
                  <Link to="/auth">
                    <Button size="lg" className="gradient-purple glow-purple-strong hover:scale-110 transition-all text-base px-10 animate-glow-pulse">
                      Start 14-Day Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-card/80 backdrop-blur border border-border hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goNext}
          disabled={currentSlide === totalSlides - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-card/80 backdrop-blur border border-border hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index 
                  ? 'bg-primary w-6' 
                  : 'bg-muted-foreground/50 hover:bg-muted-foreground'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 py-4 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LynkScope</span>
            </div>
            
            <div className="flex flex-wrap gap-6 md:gap-8">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentSlide(0); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" onClick={(e) => { e.preventDefault(); setCurrentSlide(1); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#preview" onClick={(e) => { e.preventDefault(); setCurrentSlide(2); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preview</a>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
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
