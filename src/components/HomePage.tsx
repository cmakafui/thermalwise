// src/components/HomePage.tsx
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Zap,
  Shield,
  TrendingUp,
  Eye,
  FileText,
  ArrowRight,
  Thermometer,
  Building,
  Euro,
} from "lucide-react";

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <Badge variant="secondary" className="mb-4">
            Professional Thermal Analysis Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Smart Energy Efficiency
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform thermal imaging into actionable insights with AI-powered
            analysis. Meet EU energy requirements while reducing costs and
            improving building performance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button asChild size="lg" className="group">
            <Link to="/upload">
              <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Start Analysis
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg">
            <FileText className="mr-2 h-4 w-4" />
            View Sample Report
          </Button>
        </div>
      </section>

      {/* Key Features */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Why Choose ThermalWise?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional-grade thermal analysis that combines AI intelligence
            with human expertise
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>AI-Powered Detection</CardTitle>
              <CardDescription>
                Advanced computer vision identifies thermal anomalies with
                precision
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Thermal bridge detection</li>
                <li>• Air leakage identification</li>
                <li>• Insulation gap analysis</li>
                <li>• Moisture intrusion alerts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>EU Compliance</CardTitle>
              <CardDescription>
                Meet energy efficiency requirements with standardized reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Professional PDF reports</li>
                <li>• Energy rating assessment</li>
                <li>• Regulatory documentation</li>
                <li>• Audit trail included</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Cost-Benefit Analysis</CardTitle>
              <CardDescription>
                Get clear ROI calculations and prioritized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Repair cost estimates</li>
                <li>• Energy savings forecast</li>
                <li>• Payback period analysis</li>
                <li>• Priority recommendations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Process Overview */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Simple 3-Step Process</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From image upload to professional report in minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Upload Image Pairs</h3>
            <p className="text-muted-foreground">
              Upload RGB and thermal images of building areas you want to
              analyze
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">AI Analysis</h3>
            <p className="text-muted-foreground">
              Our AI identifies thermal anomalies and provides expert
              recommendations
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Professional Report</h3>
            <p className="text-muted-foreground">
              Receive a comprehensive PDF report with actionable insights
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 rounded-xl p-8 space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Proven Results</h2>
          <p className="text-muted-foreground">
            Helping building owners across Finland improve energy efficiency
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-2">
              <Building className="h-6 w-6 text-primary mr-2" />
              <span className="text-3xl font-bold">500+</span>
            </div>
            <p className="text-sm text-muted-foreground">Buildings Analyzed</p>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-2">
              <Euro className="h-6 w-6 text-primary mr-2" />
              <span className="text-3xl font-bold">€2M+</span>
            </div>
            <p className="text-sm text-muted-foreground">Energy Savings</p>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-2">
              <Thermometer className="h-6 w-6 text-primary mr-2" />
              <span className="text-3xl font-bold">95%</span>
            </div>
            <p className="text-sm text-muted-foreground">Detection Accuracy</p>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-primary mr-2" />
              <span className="text-3xl font-bold">30%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Avg. Energy Reduction
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your thermal images and discover energy efficiency
            opportunities in your building
          </p>
        </div>

        <Button asChild size="lg" className="group">
          <Link to="/upload">
            <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Start Your Analysis
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
