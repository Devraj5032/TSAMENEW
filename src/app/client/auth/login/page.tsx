"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Center,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { setUser } from "@/lib/features/user/userSlice";
import { useAppDispatch } from "@/lib/hooks";
import Cookies from "js-cookie"; // Import js-cookie

// Role-based redirection paths
const roleBasedRedirects = {
  manager: "/client/dashboard/manager/survey-report", // Manager dashboard
  supervisor: "/client/dashboard/supervisor/asset-status", // Supervisor dashboard
  cleaner: "/client/dashboard/supervisor/asset-status", // Cleaner dashboard
};

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Load user data from cookies on initial render
  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser); // Parse the JSON string
        if (userData && userData.id) {
          dispatch(setUser(userData));
          router.push("/"); // Redirect to home if user data is valid
        } else {
          console.error("No valid user data found in cookie");
        }
      } catch (error) {
        console.error("Error parsing user data from cookies:", error);
      }
    }
  }, [dispatch, router]);

  // Function to send OTP
  const handleSendOtp = async () => {
    setOtpSent(true);
    try {
      const response = await axios.post("/server/auth/login", {
        mobile_number: phoneNumber,
      });
      console.log(response.data);
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Please try again.");
    }
  };

  // Function to submit OTP and handle login
  const handleSubmitOtp = async () => {
    try {
      const response = await axios.post("/server/auth/login/verify-otp", {
        mobile_number: phoneNumber,
        otp: otp,
      });

      console.log("Login successful:", response.data);

      const userData = {
        id: response.data.user[0].id,
        user_name: response.data.user[0].user_name,
        role: response.data.user[0].role,
      };

      // Ensure userData is valid
      if (userData && userData.id) {
        // Save user data in Redux
        dispatch(setUser(userData));

        // Save user data in cookies, properly stringify it
        Cookies.set("user", JSON.stringify(userData), { expires: 7 }); // Expires in 7 days

        // Redirect based on user role
        const redirectPath = roleBasedRedirects[userData.role] || "/";
        router.push(redirectPath); // Redirect to respective dashboard based on role
      } else {
        console.error("Invalid user data:", userData);
        alert("Failed to log in. Invalid user data.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <Box display={"flex"} flexDir={"column"} gap={4}>
      <Box bg={useColorModeValue("blue.500", "blue.900")} px={4}>
        .
      </Box>
      <Center>
        <Box
          p={4}
          maxWidth="md"
          borderWidth={1}
          borderRadius="lg"
          overflow="hidden"
        >
          <VStack spacing={4}>
            <Text>Registered Mobile No.</Text>
            {!otpSent ? (
              <>
                <Input
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Button colorScheme="blue" onClick={handleSendOtp}>
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Button colorScheme="blue" onClick={handleSubmitOtp}>
                  Submit OTP
                </Button>
              </>
            )}
          </VStack>
        </Box>
      </Center>
      <Box></Box>
    </Box>
  );
};

export default Login;
