"use client";
import { useState, useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

interface UserDetailInterface {
  name: string;
  role: string;
}

const UserDetail: UserDetailInterface = {
  name: "cleaner sample name",
  role: "cleaner",
};

const UserDetails = () => {
  const [currentTime, setCurrentTime] = useState<string>("");

  const user = useAppSelector((state) => state.user)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formattedTime = now.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true, // Use 12-hour format
      });
      setCurrentTime(formattedTime);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      display={"flex"}
      gap={4}
      alignItems={"center"}
      justifyContent={"flex-end"}
      paddingX={10}
      padding={4}
      border="1px"
      borderColor="gray.200"
    >
      <Box display={"flex"} gap={4} as="b">
        <Text>{currentTime} |</Text>
        <Text>{user.user_name} |</Text>
        <Text>{user.role}</Text>
      </Box>
    </Box>
  );
};

export default UserDetails;
