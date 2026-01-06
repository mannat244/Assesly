import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Building2, BarChart3 } from "lucide-react";

export default function Features() {
    const features = [
        {
            title: "Real-time Interaction",
            description:
                "Experience seamless turn-by-turn conversations with our ultra-fast AI interviewer that mimics real human cadence.",
            icon: MessageSquare,
            color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
        },
        {
            title: "Company-Specific Roles",
            description:
                "Tailor your practice for specific roles at top tech giants like Google, Amazon, and Microsoft to prepare for specific culture fits.",
            icon: Building2,
            color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
        },
        {
            title: "Detailed Feedback",
            description:
                "Receive comprehensive reports and verdicts on your performance to identify areas for improvement instantly.",
            icon: BarChart3,
            color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
        },
    ];

    return (
        <section id="features" className="container space-y-12 px-4 py-16 md:px-6 md:py-24 lg:px-8">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl">
                    Everything you need to get hired
                </h2>
                <p className="max-w-[85%] text-lg text-muted-foreground">
                    Comprehensive tools designed to take you from preparation to offer letter.
                </p>
            </div>
            <div className="mx-auto grid gap-6 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-3">
                {features.map((feature) => (
                    <Card key={feature.title} className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
                        <CardHeader className="space-y-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                                <CardDescription className="text-base leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </section>
    );
}
