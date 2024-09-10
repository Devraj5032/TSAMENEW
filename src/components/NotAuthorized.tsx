import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

const NotAuthorized = () => {
  return (
    <Box textAlign="center" mt={8}>
      <Heading as="h2" size="lg" mb={4}>
        Not Authorized
      </Heading>
      <Text>
        You do not have permission to access this page.
      </Text>
    </Box>
  );
};

export default NotAuthorized;
