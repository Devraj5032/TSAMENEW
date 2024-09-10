"use client";

import { Box } from "@chakra-ui/react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Providers } from "@/app/providers";
import NavText from "@/components/NavText";
import UserDetails from "@/components/UserDetails";
import StoreProvider from "@/app/StoreProvider";
import { useAppSelector } from "@/lib/hooks"; // Import the hook to access the user state

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useAppSelector((state) => state.user); // Get the user state from Redux

  

  return (
    <html lang="en">
      <body className="p-4">
        <StoreProvider>
          <Providers>
            <Box maxW="90%" mx="auto" paddingY={4}>
            {user.id !== 0 && <NavText />}
              
              {/* Conditionally render Navbar and Footer only if user is logged in */}
              {user.id !== 0 && (
                <>
                  <Navbar />
                  <UserDetails />
                </>
              )}

              {children}

              {/* Conditionally render Footer only if user is logged in */}
              {user.id !== 0 && <Footer />}
            </Box>
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}
