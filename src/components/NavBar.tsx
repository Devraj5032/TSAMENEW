"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  useDisclosure,
  useColorModeValue,
  Stack,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/hooks"; // Import the hook
import { logout } from "@/lib/features/user/userSlice"; // Import the logout action
import Cookies from "js-cookie"; // For removing user data from cookies
import { redirect, useRouter } from "next/navigation";

const LinksManager = [
  { name: "View asset status", path: "/client/dashboard/supervisor/asset-status" },
  { name: "Download survey report", path: "/client/dashboard/manager/survey-report" },
  { name: "Download cleaning Report", path: "/client/dashboard/manager/cleaning-report" },
  { name: "View geolocation exception", path: "/client/dashboard/manager/reports-by-variation" },
  { name: "View/Resolve tickets cleaning survey", path: "/client/dashboard/manager/survey-report-action" }
];

const LinksSupervisor = [
  { name: "View asset status", path: "/client/dashboard/supervisor/asset-status" },
  { name: "View geolocation exception", path: "/client/dashboard/manager/reports-by-variation" },
  { name: "View/Resolve tickets cleaning survey", path: "/client/dashboard/manager/survey-report-action" }
];

const LinksCleaner = [
  { name: "View asset status", path: "/client/dashboard/supervisor/asset-status" }
];

const NavLink = ({ children, path }: { children: string; path: string }) => (
  <Link href={path}>
    <Button
      px={2}
      py={1}
      rounded={"md"}
      color="white"
      bg="blue.500"
      _hover={{ bg: "blue.400" }}
    >
      {children}
    </Button>
  </Link>
);

const NavBar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();

  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch(); // Get the dispatch function

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout()); // Redux handles clearing the cookie
    router.replace("/client/auth/login"); // Use router for navigation
  };
  
  

  return (
    <Box bg={useColorModeValue("blue.500", "blue.900")} px={4}>
      <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
        <HStack spacing={8} alignItems={"center"}>
          <Box color="white">Home</Box>
          <HStack as={"nav"} spacing={4} display={{ base: "none", lg: "flex" }}>
            {user.role === "cleaner" &&
              LinksCleaner.map((link: { name: string; path: string }) => (
                <NavLink key={link.name} path={link.path}>
                  {link.name}
                </NavLink>
              ))}
            {user.role === "supervisor" &&
              LinksSupervisor.map((link: { name: string; path: string }) => (
                <NavLink key={link.name} path={link.path}>
                  {link.name}
                </NavLink>
              ))}
            {user.role === "manager" &&
              LinksManager.map((link: { name: string; path: string }) => (
                <NavLink key={link.name} path={link.path}>
                  {link.name}
                </NavLink>
              ))}

            {user.id !== 0 && ( // Conditionally render the Logout button
              <Button colorScheme="blue" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </HStack>
        </HStack>
        <IconButton
          size={"md"}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={"Open Menu"}
          display={{ base: "flex", lg: "none" }}
          onClick={isOpen ? onClose : onOpen}
          color="white"
          bg="blue.500"
          _hover={{ bg: "blue.400" }}
        />
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ lg: "none" }}>
          <Stack as={"nav"} spacing={4}>
            {user.role === "cleaner" &&
              LinksCleaner.map((link: { name: string; path: string }) => (
                <NavLink key={link.name} path={link.path}>
                  {link.name}
                </NavLink>
              ))}
            {user.role === "supervisor" &&
              LinksSupervisor.map((link: { name: string; path: string }) => (
                <NavLink key={link.name} path={link.path}>
                  {link.name}
                </NavLink>
              ))}
            {user.role === "manager" &&
              LinksManager.map((link: { name: string; path: string }) => (
                <NavLink key={link.name} path={link.path}>
                  {link.name}
                </NavLink>
              ))}

            {user.id !== 0 && ( // Conditionally render the Logout button in mobile view
              <Button colorScheme="blue" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default NavBar;
