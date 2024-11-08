import { getConnection } from "@/app/server/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Retrieve fields from formData
    const code = formData.get("code");
    const date = formData.get("date");
    const average_rating = formData.get("average_rating");
    const remarks = formData.get("remarks");
    const description = formData.get("description") || ' ';
    const user_id = formData.get("user_id");
    const resolve_date_time = formData.get("resolve_date_time");
    
    // Get image files as Base64 strings
    const resolve_image_1 = formData.get("resolve_image_1");
    const resolve_image_2 = formData.get("resolve_image_2");

    const pool = await getConnection();
    const request = pool.request();

    request.input("average_rating", average_rating);
    request.input("code", code);
    request.input("date", date);
    request.input("remarks", remarks);
    request.input("description", description);
    request.input("user_id", user_id);
    request.input("resolve_date_time", resolve_date_time);

    if (resolve_image_1) {
      const binaryImage1 = Buffer.from(resolve_image_1, "base64");
      request.input("resolve_image_1", binaryImage1);
    }
    if (resolve_image_2) {
      const binaryImage2 = Buffer.from(resolve_image_2, "base64");
      request.input("resolve_image_2", binaryImage2);
    }

    let query = `
      INSERT INTO tata_asset_mgmt.jusco_asset_mgmt.matrix_survey_close 
      (average_rating, code, survey_date, remarks, description, user_id, resolve_date_time
    `;

    if (resolve_image_1) query += `, resolve_image_1`;
    if (resolve_image_2) query += `, resolve_image_2`;

    query += `)
      VALUES (@average_rating, @code, @date, @remarks, @description, @user_id, @resolve_date_time
    `;

    if (resolve_image_1) query += `, @resolve_image_1`;
    if (resolve_image_2) query += `, @resolve_image_2`;

    query += `);`;

    await request.query(query);

    return NextResponse.json({ message: "Data inserted successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error inserting data", error);
    return NextResponse.json({ error: "Failed to insert data" }, { status: 500 });
  }
}
