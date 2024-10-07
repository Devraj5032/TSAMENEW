import { Box } from "@chakra-ui/react";
import Navbar from "../components/NavBar";
import Footer from "../components/Footer";
import { Providers } from "./providers";
import NavText from "../components/NavText";
import UserDetails from "../components/UserDetails";
import StoreProvider from "./StoreProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const roleBasedRedirects = {
    manager: "/client/dashboard/manager/survey-report", // Manager dashboard
    supervisor: "/client/dashboard/supervisor/asset-status", // Supervisor dashboard
    cleaner: "/client/dashboard/supervisor/asset-status", // Cleaner dashboard
  };

  
  return (
    <html lang="en">
      <body className="p-4">
        <StoreProvider>
          <Providers>
            {children}
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}
