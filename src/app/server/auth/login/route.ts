import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/app/server/db/db";
import crypto from "crypto";
import axios from "axios";
import https from "https";

const SMS_API_URL = "https://enterprise.smsgupshup.com/GatewayAPI/rest";

const hashMobileNumber = (mobile_number: string): string => {
  const hash = crypto.createHash("sha256").update(mobile_number).digest("hex");
  return "0x" + hash.toUpperCase(); // Format hash with '0x' prefix and uppercase
};

const generateUniqueId = () => {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now();

  // Generate a random number to ensure uniqueness within the same millisecond
  const randomNum = Math.floor(Math.random() * 1000000);

  // Combine the timestamp and random number to form the ID
  const uniqueId = `${timestamp}${randomNum}`;

  // Convert to a BigInt or leave as a string if needed
  return BigInt(uniqueId);
};

const saveOTP = async (hashedNumber: string, otp: string) => {
  try {
    const pool = await getConnection();

    const id = generateUniqueId(); // Generate unique ID

    // Construct the SQL INSERT query
    const query = `
      INSERT INTO tata_asset_mgmt.jusco_asset_mgmt.txn_otp (id, mobile_no, otp, entry_date)
      VALUES (@id, @mobile_no, @otp, GETDATE())
    `;

    // Prepare and execute the query with parameters
    await pool.request()
      .input('id', id)  // Assign the unique ID to the parameter
      .input('mobile_no', hashedNumber)  // Assign the hashed number to the parameter
      .input('otp', otp)  // Assign the OTP to the parameter
      .query(query);

    console.log("OTP saved successfully");
  } catch (error) {
    console.error("Error saving OTP to database:", error);
    throw new Error(`Failed to save OTP: ${error.message}`);
  }
};

// Function to generate a random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (
  mobile_number: string,
  otp: string,
  hashedNumber: string
) => {
  const message = `To login in TATA STEEL UISL Bulk Generation System, your OTP is ${otp}. -Tata Steel UISL (JUSCO)`;
  const encodedMessage = encodeURIComponent(message);

  const fullUrl = `${SMS_API_URL}?method=SendMessage&send_to=${mobile_number}&msg=${encodedMessage}&msg_type=TEXT&userid=2000060285&auth_scheme=plain&password=jusco&v=1.1&format=text`;

  console.log(fullUrl);

  try {
    // Option 1: Allow unsafe legacy renegotiation (if necessary)
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const agent = new https.Agent({
      rejectUnauthorized: false, // Adjust as per your needs
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT, // Allow legacy renegotiation
    });

    await saveOTP(hashedNumber, otp);

    const response = await axios.get(fullUrl, { httpsAgent: agent });

    if (response.status !== 200) {
      throw new Error(`Failed to send OTP: ${response.statusText}`);
    }
    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // Parse the request body to get mobile_number
    const body = await req.json();
    let { mobile_number } = body;

    // Validate mobile_number
    if (typeof mobile_number !== "string" || mobile_number.trim() === "") {
      return NextResponse.json(
        { error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    // Add country code '91' if not already present
    const mobile_number_with_CC = mobile_number.startsWith("91")
      ? mobile_number
      : "91" + mobile_number.trim();

    // Hash the mobile number
    const hashedMobileNumber = hashMobileNumber(mobile_number);

    // Get the database connection
    const pool = await getConnection();

    // Query the database using parameterized queries to avoid SQL injection
    const query = await pool.query(`
      SELECT
        du.id,
        du.user_name,
        mur.role
      FROM 
        tata_asset_mgmt.jusco_asset_mgmt.data_users AS du
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.meta_user_role AS mur 
      ON 
        mur.id = du.user_role
      WHERE 
        du.user_id = '${hashedMobileNumber}'
    `);

    console.log(query);

    if (query.recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate OTP
    const otp = generateOTP();

    // Send OTP via SMS
    await sendOTP(mobile_number_with_CC, otp, hashedMobileNumber);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `OTP sent to ${mobile_number}`,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
