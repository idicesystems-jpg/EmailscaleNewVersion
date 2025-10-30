import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useLoginUserMutation } from "../services/authService";
import { useDispatch } from "react-redux";
import { setCredentials } from "../services/authSlice";

const Auth = () => {
  const dispatch = useDispatch();
 
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginUser, { isLoading, error }] = useLoginUserMutation();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData).unwrap();
      console.log("Login Success:", response);
       if (response.status) {
        // save token & user in redux
        dispatch(
          setCredentials({
            user: response.user,
            token: response.emailscale_token,
          })
        );
       if (response.user.role_id == 0 || response.user.role_id == 1 ) {
          navigate("/admin"); // admin dashboard
        } else {
          navigate("/dashboard"); // regular user dashboard
        } // redirect after login
      }
       // optional
    } catch (err) {
      console.error("Login Failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              EmailScale
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
