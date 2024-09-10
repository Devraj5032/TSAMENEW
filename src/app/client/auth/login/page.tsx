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
import { useRouter } from "next/navigation"; // Changed from "next/navigation"
import axios from "axios";
import { setUser } from "@/lib/features/user/userSlice";
import { useAppDispatch } from "@/lib/hooks";
import Cookies from "js-cookie"; // Import js-cookie

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
      const userData = JSON.parse(storedUser);
      dispatch(setUser(userData));
      router.push("/"); // Redirect to home if user data is found in cookies
    }
  }, [dispatch, router]);

  const handleSendOtp = async () => {
    setOtpSent(true);
    console.log("otp");

    const response = await axios.post("/server/auth/login", {
      mobile_number: phoneNumber,
    });
    console.log(response.data);
  };

  const handleSubmitOtp = async () => {
    try {
      const response = await axios.post("/server/auth/login/verify-otp", {
        mobile_number: phoneNumber,
        otp: otp,
      });

      console.log("Login successful:", response.data);

      const userData = {
        id: response.data.user.id,
        user_name: response.data.user.user_name,
        role: response.data.user.role,
      };

      // Save user data in Redux
      dispatch(setUser(userData));

      // Save user data in cookies
      Cookies.set("user", JSON.stringify(userData), { expires: 7 }); // Expires in 7 days

      // Redirect to home page
      router.push("/");
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
