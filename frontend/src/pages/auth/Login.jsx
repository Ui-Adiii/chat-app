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
  sendOtp,
  updateProfile,
  verifyOtp,
} from "@/services/auth.service";
import { Loader } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "react-toastify";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import Bar from "@/components/Bar";

const Login = () => {
  const {
    step,
    setEmailData,
    setStep,
    resetLoginState,
    setUser,
    loginEmail,
  } = useStore();
  const navigate = useNavigate();
  const [otp, setotp] = useState("");
  const [email, setemail] = useState("");
  const [loader, setloader] = useState(false);
  const [profilePictureFile, setprofilePictureFile] = useState(null);
  const [preview, setpreview] = useState(null);
  const [username, setusername] = useState("");
  const [about, setabout] = useState("");
  const [agreed, setagreed] = useState(false);
  const handleChangeImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setprofilePictureFile(file);
      setpreview(URL.createObjectURL(file));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      setloader(true);
      const data = await sendOtp(email);
      if (data.status === "success") {
        setEmailData(data?.data?.email);
        toast.info(data?.message);
        setStep(2);
      } else {
        // Handle different types of errors
        if (data.message.includes("wait")) {
          toast.warn(data.message); // Cooldown warning
        } else if (data.message.includes("many")) {
          toast.error("Rate limit exceeded. Please try again later."); // Rate limit error
        } else {
          toast.error(data.message); // Other errors
        }
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setloader(false);
    }
  };
  
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      setloader(true);
      const data = await verifyOtp(loginEmail, otp);
      if (data.status === "success") {
        const verifiedUser = data?.data?.user;
        if (verifiedUser?.isVerified && verifiedUser?.username) {
          setUser(verifiedUser);
          resetLoginState();
          toast.success("Logged in successfully");
          navigate("/");
        } else {
          setStep(3);
        }
      } else {
        // Handle different types of OTP errors
        if (data.message.includes("expired")) {
          toast.warn("OTP has expired. Please request a new one.");
        } else if (data.message.includes("many")) {
          toast.error("Too many attempts. Please try again later.");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
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
        toast.success(data.message);
        setUser(data?.data);
        resetLoginState();
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setloader(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center p-4">
      {step === 1 && (
        <Card className="w-full max-w-sm">
         <Bar step={step} />

          <CardHeader>
            <CardTitle>Login to your Chat App</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setemail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              onClick={handleEmailSubmit}
              className="w-full"
              disabled={loader}
            >
              {loader && (
                <>
                  <Loader className={` animate-spin`} />
                  <h1>Sending...</h1>
                </>
              )}
              {!loader && <h1>Send OTP</h1>}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="w-full max-w-sm">
         <Bar step={step} />

          <CardHeader>
            <CardTitle>Enter your OTP</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtpSubmit}>
              <div className="flex  gap-6 justify-center">
                <InputOTP
                  value={otp}
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  onChange={(val) => setotp(val)}
                >
                    <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              onClick={handleOtpSubmit}
              className="w-full"
              disabled={loader}
            >
              {loader && (
                <>
                  <Loader className={` animate-spin`} />
                  <h1>Verifying...</h1>
                </>
              )}
              {!loader && <h1>Verify</h1>}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="w-full max-w-sm">
          <Bar step={step} />

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

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your UserName"
                  required
                  value={username}
                  onChange={(e) => setusername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
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