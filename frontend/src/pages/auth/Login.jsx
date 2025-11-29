import useStore from "@/store/useStore";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfile,
  login, // Import new login function
  register // Import new register function
} from "@/services/auth.service";
import { Loader } from "lucide-react";
import { toast } from "react-toastify";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const {
    step,
    setStep,
    resetLoginState,
    setUser,
  } = useStore();
  const navigate = useNavigate();
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [loader, setloader] = useState(false);
  const [profilePictureFile, setprofilePictureFile] = useState(null);
  const [preview, setpreview] = useState(null);
  const [username, setusername] = useState("");
  const [about, setabout] = useState("");
  const [agreed, setagreed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleChangeImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setprofilePictureFile(file);
      setpreview(URL.createObjectURL(file));
    }
  };

  // New function for password-based login/register
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setloader(true);
      let data;
      
      if (isRegistering) {
        data = await register(email, password);
      } else {
        data = await login(email, password);
      }
      
      if (data.status === "success") {
        const user = data?.data?.user;
        // Check if user needs to complete profile (newly registered users)
        if (!user?.username) {
          setUser(user);
          setStep(2); // Go to profile setup step
        } else {
          // Existing user with completed profile
          setUser(user);
          resetLoginState();
          toast.success(isRegistering ? "Registered successfully" : "Logged in successfully");
          navigate("/");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Password auth error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setloader(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("username", username);
    form.append("agreed", agreed ? "true" : "false");
    form.append("about", about);
    if (profilePictureFile) form.append("profilePicture", profilePictureFile);
    try {
      setloader(true);
      const data = await updateProfile(form);
      if (data.status === "success") {
        setUser(data?.data);
        resetLoginState();
        toast.success("Profile updated successfully");
        navigate("/");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setloader(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Step 1: Email and Password Login */}
      {step === 1 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{isRegistering ? "Create Account" : "Login"}</CardTitle>
            <CardDescription>
              {isRegistering 
                ? "Enter your email and password to create an account" 
                : "Enter your email and password to login"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setemail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setpassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              onClick={handlePasswordSubmit}
              className="w-full"
              disabled={loader}
            >
              {loader && (
                <>
                  <Loader className={` animate-spin`} />
                  <h1>{isRegistering ? "Registering..." : "Logging in..."}</h1>
                </>
              )}
              {!loader && <h1>{isRegistering ? "Register" : "Login"}</h1>}
            </Button>
            <div className="text-center text-sm">
              {isRegistering ? (
                <>
                  Already have an account?{" "}
                  <button 
                    type="button"
                    className="text-blue-500 hover:underline"
                    onClick={() => setIsRegistering(false)}
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    className="text-blue-500 hover:underline"
                    onClick={() => setIsRegistering(true)}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Profile Setup */}
      {step === 2 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Update Your Profile</CardTitle>
            <CardDescription>
              Choose a profile picture and username
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleUpdateProfile}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-center">
                <label htmlFor="profilePicture" className="cursor-pointer">
                  <div className="h-32 w-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm text-center">
                        Upload Image
                      </span>
                    )}
                  </div>
                </label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChangeImage}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={(e) => setusername(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="about">About</Label>
                <Input
                  id="about"
                  type="text"
                  placeholder="About Your Self"
                  required
                  value={about}
                  onChange={(e) => setabout(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(val) => setagreed(val)}
                />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              onClick={handleUpdateProfile}
              className="w-full"
              disabled={loader}
            >
              {loader ? (
                <>
                  <Loader className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <h1>Save Profile</h1>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Login;