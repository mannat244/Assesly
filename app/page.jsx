import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-lg font-bold">Assessly</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Login</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <Hero />
                <Features />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
