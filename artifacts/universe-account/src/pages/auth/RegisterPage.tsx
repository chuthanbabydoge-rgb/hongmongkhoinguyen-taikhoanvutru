import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Hexagon, Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(32, "Username too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" }
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await register(values.username, values.email, values.password);
      setSuccess(true);
      toast({ title: "Account created", description: "Welcome to the Universe. Please sign in." });
      setTimeout(() => setLocation("/login"), 2000);
    } catch (e: unknown) {
      toast({
        title: "Registration failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-600/12 blur-[100px] animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px] animate-pulse" style={{ animationDuration: "7s" }} />
      </div>

      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: 1,
            height: 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(124,58,237,0.5)]">
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Universe</h1>
          <p className="text-white/40 text-sm mt-1 tracking-widest uppercase">Account System</p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-10 shadow-2xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to Universe</h2>
            <p className="text-white/50 text-sm">Account created. Redirecting to sign in...</p>
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-1">Create Account</h2>
            <p className="text-white/40 text-sm mb-6">Join the Universe ecosystem</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">Username</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-username"
                          placeholder="your_username"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">Email address</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-email"
                          type="email"
                          placeholder="you@universe.io"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 h-11 pr-11"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(s => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  data-testid="button-register"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 border-0"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account...</>
                  ) : (
                    <><span>Create Account</span><ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-center text-white/40 text-sm mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
