'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/login-form';
import { SignupForm } from '@/components/signup-form';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryVerticalEnd } from "lucide-react"

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Assessly
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <LoginForm onToggleMode={() => setIsLogin(false)} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <SignupForm onToggleMode={() => setIsLogin(true)} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <img
                    src="/login.png"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:grayscale-0 transition-all duration-500 hover:brightness-[0.5]"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.background = 'linear-gradient(to bottom right, #1e1e24, #2d2d35)';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-12">
                    <div className="text-white">
                        <h2 className="text-3xl font-bold mb-4">Welcome to Assessly.</h2>
                        <p className="text-neutral-300 text-lg">A platform to practice for interviews and get placed.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
