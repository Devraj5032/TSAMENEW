import { getConnection } from "@/app/server/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Retrieve fields from formData
    const code = formData.get("code");  // Unique identifier for the record to update
    const date = formData.get("date");
    const average_rating = formData.get("average_rating");
    const remarks = formData.get("remarks");
    const description = formData.get("description") || ' ';
    const user_id = formData.get("user_id");
    const closing_date_time = formData.get("resolve_date_time");

    // Get image files as Base64 strings
    const closing_image_1 = formData.get("resolve_image_1");
    const closing_image_2 = formData.get("resolve_image_2");

    const pool = await getConnection();
    const request = pool.request();
    
    // Setting up parameters for SQL
    request.input("closing_remarks", remarks);
    request.input("description", description);
    request.input("closing_user_id", user_id);
    request.input("closing_date_time", closing_date_time);
    request.input("code", code);  // Unique identifier for the WHERE clause

    if (closing_image_1) {
      const binaryImage1 = Buffer.from(closing_image_1, "base64");
      request.input("closing_image_1", binaryImage1);
    }
    if (closing_image_2) {
      const binaryImage2 = Buffer.from(closing_image_2, "base64");
      request.input("closing_image_2", binaryImage2);
    }

    // Building the UPDATE query
    let query = `
      UPDATE tata_asset_mgmt.jusco_asset_mgmt.matrix_survey_close
      SET 
        closing_remarks = @closing_remarks,
        closing_user_id = @closing_user_id,
        closing_date_time = @closing_date_time
    `;

    if (closing_image_1) query += `, closing_image_1 = @closing_image_1`;
    if (closing_image_2) query += `, closing_image_2 = @closing_image_2`;

    query += ` WHERE code = @code;`;  // Use code as the unique identifier

    await request.query(query);

    return NextResponse.json({ message: "Data updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error updating data", error);
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}
