import { 
  Navbar, 
  HeroSection, 
  TrustSection, 
  IndustriesSection, 
  FeaturesSection, 
  TimelineSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  Footer 
} from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustSection />
        <IndustriesSection />
        <FeaturesSection />
        <TimelineSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
