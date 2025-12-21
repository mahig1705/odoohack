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
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { profile, role, isLoading } = useAuth();
  const isLoggedIn = !!profile && !!role;
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection 
          isLoggedIn={isLoggedIn}
          userName={profile?.full_name}
          userRole={role || undefined}
        />
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
