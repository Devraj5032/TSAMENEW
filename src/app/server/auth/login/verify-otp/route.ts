import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getConnection } from "@/app/server/db/db"; // Assuming you have a db connection utility

// Hash the mobile number using SHA-256
const hashMobileNumber = (mobile_number: string): string => {
  const hash = crypto.createHash("sha256").update(mobile_number).digest("hex");
  return "0x" + hash.toUpperCase(); // Format hash with '0x' prefix and uppercase
};

export async function POST(req: NextRequest) {
  try {
    // Extract the mobile_number and otp from the request body
    const { mobile_number, otp } = await req.json();

    // Validate the input
    if (!mobile_number || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    // Hash the mobile number to match the format in the database
    const hashedMobileNumber = hashMobileNumber(mobile_number);

    // Get the database connection
    const pool = await getConnection();

    // Query to fetch OTP and entry_date from the database for the provided hashed mobile number
    const query = `
      SELECT otp, entry_date
      FROM tata_asset_mgmt.jusco_asset_mgmt.txn_otp
      WHERE mobile_no = @mobile_no
      ORDER BY entry_date DESC
    `;

    // Execute the query with the hashed mobile number as a parameter
    const result = await pool
      .request()
      .input("mobile_no", hashedMobileNumber)
      .query(query);

    console.log(result.recordset);

    // If no records are found, return an error
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "OTP not found or expired" },
        { status: 404 }
      );
    }

    // Get the latest OTP entry from the database
    const { otp: storedOtp, entry_date } = result.recordset[0];

    console.log(storedOtp);

    // Check if the provided OTP matches the stored OTP
    if (storedOtp != otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }


    const currentTimeUTC = new Date().toISOString();  // Current time in UTC
    const entryDateUTC = new Date(entry_date).toISOString();  // Entry date in UTC

    // Log the times for debugging
    console.log("Current Time UTC:", currentTimeUTC);
    console.log("Entry Date UTC:", entryDateUTC);

    // Calculate the time difference in minutes
    const timeDifferenceInMinutes =
      (new Date(currentTimeUTC).getTime() - new Date(entryDateUTC).getTime()) / (1000 * 60);

    console.log("Time Difference (minutes):", timeDifferenceInMinutes);

    if (timeDifferenceInMinutes > 10) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Query the database using parameterized queries to avoid SQL injection
    const user = await pool.query(`
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

    // If OTP is valid and within 10 minutes, return success
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: user.recordset
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
