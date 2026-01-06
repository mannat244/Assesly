import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
    return (
        <section className="container px-4 py-16 md:px-6 md:py-24 lg:px-8">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center gap-6 text-center">
                <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl">
                    Ready to get hired?
                </h2>
                <p className="max-w-[85%] text-lg text-muted-foreground">
                    Join thousands of candidates who are crushing their interviews with Assessly.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/login">
                        <Button size="lg" className="w-full sm:w-[200px]">
                            Get Started for Free
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" size="lg" className="w-full sm:w-[200px]">
                            See Pricing
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
