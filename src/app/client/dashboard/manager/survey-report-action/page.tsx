"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Textarea,
  useDisclosure,
  Stack,
} from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { format } from "date-fns";
import { useAppSelector } from "@/lib/hooks";

interface Supervisor {
  id: Number;
  user_name: String;
}

const SurveyReportAction = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState("");
  const [apiResponse, setApiResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [remarks, setRemarks] = useState("");
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [supervisor, setSupervisor] = useState("");
  const [resolveImage1, setResolveImage1] = useState<File | null>(null);
  const [resolveImage2, setResolveImage2] = useState<File | null>(null);
  const toast = useToast();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState("");
  const [closingImage1, setClosingImage1] = useState<File | null>(null);
  const [closingImage2, setClosingImage2] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview1, setImagePreview1] = useState(null);
  const [imagePreview2, setImagePreview2] = useState(null);

  const user = useAppSelector((state) => state.user);

  const handleImageUpload = (event, setImage, setPreview) => {
    const file = event.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getSupervisors = async () => {
    try {
      // const res = await axios.get(
      //   "/server/api/supervisor/asset-status/getSupervisors"
      // );
      // setSupervisors(res.data.supervisors);
      setSupervisors([
        {
          id: user.id,
          user_name: user.user_name,
        },
      ]);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  };

  const handleDateChange = (date, type) => {
    if (type === "from") {
      setFromDate(date);
      if (toDate && date > toDate) {
        setToDate(null);
      }
    } else if (type === "to") {
      setToDate(date);
    }
  };

  const isDateRangeValid = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    const maxEndDate = new Date(startDate);
    maxEndDate.setDate(startDate.getDate() + 90);
    return endDate <= maxEndDate;
  };

  const handleSubmit = async () => {
    if (isDateRangeValid(fromDate, toDate)) {
      setLoading(true);
      try {
        const formattedFromDate = format(fromDate, "yyyy-MM-dd");
        const formattedToDate = format(toDate, "yyyy-MM-dd");

        console.log({
          startDate: formattedFromDate,
          endDate: formattedToDate,
        });

        const response = await axios.post(
          "/server/api/manager/survey-closure-by-supervisor/retriveAverageRating",
          {
            startDate: formattedFromDate,
            endDate: formattedToDate,
          }
        );

        setApiResponse(response.data.data); // assuming the data comes under `data`
        console.log(apiResponse);

        toast({
          title: "Success",
          description: "The form has been submitted successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Submission Error",
          description: "An error occurred while submitting the form.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    } else {
      toast({
        title: "Invalid date range.",
        description: "The end date must be within 90 days of the start date.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isDateDisabled = (date) => {
    if (!fromDate) return false;
    const maxEndDate = new Date(fromDate);
    maxEndDate.setDate(fromDate.getDate() + 30);
    return date > maxEndDate || date > today;
  };

  const handleActionClick = (survey) => {
    setSelectedSurvey(survey);
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (user.role == "supervisor") {
        if (!selectedSurvey.scanned_date || !selectedSurvey.entry_time) {
          throw new Error("Date or time is missing.");
        }

        const combinedDateTime = `${selectedSurvey.scanned_date} ${selectedSurvey.entry_time}.000`;
        let resolveDateTime = selectedDate ? new Date(selectedDate) : null;

        if (resolveDateTime) {
          resolveDateTime.setHours(resolveDateTime.getHours() + 5);
          resolveDateTime.setMinutes(resolveDateTime.getMinutes() + 30);
          resolveDateTime = resolveDateTime
            .toISOString()
            .replace("T", " ")
            .replace("Z", "");
        }

        const formData = new FormData();
        formData.append("user_id", supervisor);
        formData.append("code", selectedSurvey.code);
        formData.append("date", combinedDateTime);
        formData.append("average_rating", selectedSurvey.average_rating);
        formData.append("remarks", remarks || "");
        formData.append("resolve_date_time", resolveDateTime || "");

        // Convert image files to Base64
        if (resolveImage1) {
          const base64Image1 = await toBase64(resolveImage1);
          formData.append("resolve_image_1", base64Image1);
        }
        if (resolveImage2) {
          const base64Image2 = await toBase64(resolveImage2);
          formData.append("resolve_image_2", base64Image2);
        }

        await axios.post(
          "/server/api/manager/survey-closure-by-supervisor/insertIntoMatrixSurvey",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        toast({
          title: "Success",
          description: "Survey has been saved successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        handleSubmit();
        onClose();
      } else if (user.role == "manager") {
      }
    } catch (error) {
      console.error(
        "Error saving data:",
        error.response ? error.response.data : error.message
      );
      toast({
        title: "Error",
        description: error.response
          ? error.response.data.message
          : "An error occurred while saving the data.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Helper function to convert file to Base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); // Get only the Base64 part
      reader.onerror = (error) => reject(error);
    });

  // Function to format questions_and_ratings
  const formatQuestionsAndRatings = (questionsAndRatings) => {
    return questionsAndRatings
      .split(";")
      .map((item, index) => <Text key={index}>{item.trim()}</Text>);
  };

  // Helper function to round average rating
  const formatAverageRating = (rating) => {
    return rating.toFixed(2);
  };

  useEffect(() => {
    getSupervisors();
  }, []);

  const handleSupervisorChange = async (e) => {
    const selectedSupervisor = e.target.value;
    setSupervisor(selectedSupervisor); // Update supervisor state
  };

  return (
    <Box
      p={6}
      mx="auto"
      w="full"
      minW="360px"
      bg="white"
      borderRadius="md"
      boxShadow="lg"
    >
      <Box
        mb={4}
        display="flex"
        flexDir={{ base: "column", md: "row" }}
        gap={4}
        alignItems="center"
      >
        <FormControl position="relative">
          <FormLabel>From</FormLabel>
          <Input
            placeholder="Select start date"
            value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
            onClick={() => setCalendarOpen("from")}
            readOnly
          />
          {calendarOpen === "from" && (
            <Box position="absolute" zIndex={10}>
              <DatePicker
                selected={fromDate}
                onChange={(date) => handleDateChange(date, "from")}
                maxDate={today}
                onClickOutside={() => setCalendarOpen("")}
                inline
                dateFormat="yyyy/MM/dd"
              />
            </Box>
          )}
        </FormControl>

        <FormControl position="relative">
          <FormLabel>To</FormLabel>
          <Input
            placeholder="Select end date"
            value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
            onClick={() => setCalendarOpen("to")}
            readOnly
          />
          {calendarOpen === "to" && (
            <Box position="absolute" zIndex={10}>
              <DatePicker
                selected={toDate}
                onChange={(date) => handleDateChange(date, "to")}
                minDate={fromDate ? new Date(fromDate) : undefined}
                maxDate={
                  fromDate
                    ? new Date(fromDate).setDate(fromDate.getDate() + 30)
                    : today
                }
                filterDate={(date) => !isDateDisabled(date)}
                onClickOutside={() => setCalendarOpen("")}
                inline
                dateFormat="yyyy/MM/dd"
              />
            </Box>
          )}
        </FormControl>
      </Box>

      <Center>
        <Button
          colorScheme="blue"
          w="full"
          mt={4}
          maxW="400px"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </Center>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Spinner size="xl" />
        </Box>
      )}

      {!loading &&
        apiResponse.length > 0 &&
        (user.role == "manager" ? (
          <Box mt={6}>
            <div>
              {apiResponse.map((survey, index) => (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderRadius="md"
                  p={8}
                  mb={4}
                  boxShadow="md"
                  bg="white"
                >
                  <Box
                    display="flex"
                    gap={3}
                    justifyContent="space-between"
                    flexWrap="wrap"
                  >
                    {/* Survey Details */}
                    <Box>
                      <Text fontWeight="bold">Code: {survey.code}</Text>
                      <Text fontWeight="bold">Locality: {survey.locality}</Text>
                      <Text fontWeight="bold">Area: {survey.area}</Text>
                      <Text fontWeight="bold">Zone: {survey.zone}</Text>
                    </Box>

                    {/* Questions and Ratings */}
                    <Box>
                      <Text fontWeight="bold">Questions and Ratings:</Text>
                      <Box>
                        {formatQuestionsAndRatings(
                          survey.questions_and_ratings
                        )}
                      </Box>
                    </Box>

                    {/* Average Rating and Scanned Date */}
                    <Box>
                      <Text fontWeight="bold">
                        Average Rating:{" "}
                        {formatAverageRating(survey.average_rating)}
                      </Text>
                      <Text fontWeight="bold">
                        Scanned date: {survey?.scanned_date}
                      </Text>
                    </Box>

                    {/* Remarks Section */}
                    <Box width="300px">
                      <Text fontWeight="bold">Remarks:</Text>
                      <Text fontWeight="bold" whiteSpace="normal">
                        {survey.remarks.length === 0 ? "NONE" : survey.remarks}
                      </Text>
                    </Box>

                    {/* Resolving Remarks Section */}
                    {survey.resolve_remarks && (
                      <Box>
                        <Box>
                          <Text fontWeight="bold">Resolving remarks:</Text>
                          <Text>{survey.resolve_remarks}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">Resolving Supervisor:</Text>
                          <Text>{survey.resolving_supervisor}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">
                            Resolved date: {survey?.resolved_date}
                          </Text>
                        </Box>

                        {survey?.resolved_date && (
                          <Button
                            colorScheme="blue"
                            onClick={() => handleActionClick(survey)}
                            // isDisabled={survey.average_rating >= 4}
                            marginTop={4}
                          >
                            Close ticket
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </div>
          </Box>
        ) : (
          <Box mt={6}>
            <div>
              {apiResponse.map((survey, index) => (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderRadius="md"
                  p={8}
                  mb={4}
                  boxShadow="md"
                  bg="white"
                >
                  <Box
                    display={"flex"}
                    gap={3}
                    justifyContent={"space-between"}
                    flexWrap={"wrap"}
                  >
                    <Box>
                      <Text fontWeight="bold">Code: {survey.code}</Text>
                      <Text fontWeight="bold">Locality: {survey.locality}</Text>
                      <Text fontWeight="bold">Area: {survey.area}</Text>
                      <Text fontWeight="bold">Zone: {survey.zone}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Questions and Ratings:</Text>

                      <Box>
                        {formatQuestionsAndRatings(
                          survey.questions_and_ratings
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">
                        Average Rating:{" "}
                        {formatAverageRating(survey.average_rating)}
                      </Text>
                      <Text fontWeight="bold">
                        Scanned date: {survey?.scanned_date}
                      </Text>
                    </Box>
                    <Box width={"300px"}>
                      <Text fontWeight="bold">Remarks:</Text>
                      <Text
                        fontWeight="bold"
                        whiteSpace="normal" // Allow text to wrap
                      >
                        {survey.remarks.length === 0 ? "NONE" : survey.remarks}
                      </Text>
                    </Box>

                    {survey.resolve_remarks ? (
                      <Box>
                        <Box>
                          <Text fontWeight={"bold"}>Resolving remarks: </Text>{" "}
                          <Text>{survey.resolve_remarks}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight={"bold"}>
                            Resolving Supervisor:{" "}
                          </Text>
                          <Text>{survey.resolving_supervisor}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="bold">
                            Resolved date: {survey?.resolved_date}
                          </Text>
                        </Box>
                      </Box>
                    ) : survey.average_rating >= 4 ? (
                      <div></div>
                    ) : (
                      <Button
                        colorScheme="blue"
                        onClick={() => handleActionClick(survey)}
                        isDisabled={survey.average_rating >= 4}
                      >
                        Take Action
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </div>
          </Box>
        ))}

      {/* Modal for Action */}
      {selectedSurvey && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Action for {selectedSurvey.code}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {user.role == "manager" ? (
                <>
                  <FormControl isRequired>
                    <FormLabel>Select Manager</FormLabel>
                    <Select
                      value={supervisor}
                      onChange={(e) => setSupervisor(e.target.value)}
                    >
                      <option value="">Select manager</option>
                      {supervisors.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.user_name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Date</FormLabel>
                    <Input
                      placeholder="Select closing date"
                      value={
                        selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                      }
                      onClick={() => setCalendarOpen(true)}
                      readOnly
                    />
                    {calendarOpen && (
                      <Box position="absolute" zIndex={10}>
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }}
                          onClickOutside={() => setCalendarOpen(false)}
                          inline
                          dateFormat="yyyy-MM-dd"
                          minDate={selectedSurvey.resolved_date}
                          maxDate={today}
                        />
                      </Box>
                    )}
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Remarks</FormLabel>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter closing remarks"
                    />
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Upload Closing Image 1</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) =>
                        handleImageUpload(e, setClosingImage1, setImagePreview1)
                      }
                    />
                    {imagePreview1 && (
                      <Box mt={2}>
                        <Text>Preview:</Text>
                        <img
                          src={imagePreview1}
                          alt="Closing Image 1 Preview"
                          style={{ width: "100%", maxWidth: "150px" }}
                        />
                      </Box>
                    )}
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Upload Closing Image 2</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) =>
                        handleImageUpload(e, setClosingImage2, setImagePreview2)
                      }
                    />
                    {imagePreview2 && (
                      <Box mt={2}>
                        <Text>Preview:</Text>
                        <img
                          src={imagePreview2}
                          alt="Closing Image 2 Preview"
                          style={{ width: "100%", maxWidth: "150px" }}
                        />
                      </Box>
                    )}
                  </FormControl>
                </>
              ) : (
                <>
                  <FormControl mt={4} position="relative">
                    <FormLabel>Date</FormLabel>
                    <Input
                      placeholder="Select date"
                      value={
                        selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                      }
                      onClick={() => setCalendarOpen(true)}
                      readOnly
                    />
                    {calendarOpen && (
                      <Box position="absolute" zIndex={10}>
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }}
                          onClickOutside={() => setCalendarOpen(false)}
                          inline
                          dateFormat="yyyy-MM-dd"
                          minDate={selectedSurvey.scanned_date}
                          // maxDate={() => {
                          //   return Date.now()
                          // }}
                        />
                      </Box>
                    )}
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Remarks</FormLabel>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                    />
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Upload Resolve Image 1</FormLabel>
                    <Input
                      type="file"
                      onChange={(e) =>
                        setResolveImage1(e.target.files?.[0] || null)
                      }
                    />
                  </FormControl>

                  <FormControl mt={4}>
                    <FormLabel>Upload Resolve Image 2</FormLabel>
                    <Input
                      type="file"
                      onChange={(e) =>
                        setResolveImage2(e.target.files?.[0] || null)
                      }
                    />
                  </FormControl>
                </>
              )}
            </ModalBody>

            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={() => {
                  handleSave();
                }}
              >
                Save
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default SurveyReportAction;
