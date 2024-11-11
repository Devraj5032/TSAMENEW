import { getConnection } from "@/app/server/db/db";
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql"; // Ensure 'mssql' is imported

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate } = await req.json();
    console.log({ startDate, endDate });

    const pool = await getConnection();
    console.log(`'${startDate} 00:00:01' AND '${endDate} 23:59:59'`);

    const result = await pool
      .request()
      .input("startDate", sql.DateTime, `${startDate} 00:00:01`)
      .input("endDate", sql.DateTime, `${endDate} 23:59:59`).query(`
      SELECT 
        da.code AS code,
        AVG(CAST(tf.rating AS FLOAT)) AS average_rating,
        ta.remarks,
        STRING_AGG(CONCAT(dq.questions, ': ', tf.rating), '; ') WITHIN GROUP (ORDER BY tf.question_no) AS questions_and_ratings,
        CONVERT(VARCHAR, ta.entry_date, 108) AS entry_time,
        dl.locality, 
        daa.area, 
        dz.zone,
        CONVERT(VARCHAR, ta.entry_date, 23) AS scanned_date
      FROM 
        tata_asset_mgmt.jusco_asset_mgmt.txn_feedback AS tf
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.txn_activity AS ta ON tf.txn_id = ta.id
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.data_asset_list AS da ON ta.asset_id = da.id
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.data_locality AS dl ON dl.id = da.locality_id
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.data_area AS daa ON daa.id = dl.area_id
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.data_zone AS dz ON dz.id = daa.zone_id
      JOIN 
        tata_asset_mgmt.jusco_asset_mgmt.data_questions AS dq ON tf.question_no = dq.id
      WHERE
        dq.category = 'FEEDBACK' AND
        ta.entry_date BETWEEN @startDate AND @endDate
      GROUP BY
        da.code, 
        ta.entry_date, 
        ta.remarks, 
        dl.locality, 
        daa.area, 
        dz.zone
      ORDER BY
        ta.entry_date, da.code;
    `);

    const data = await result.recordset;

    console.log(data);

    const filteredData = [];

    for (let item of data) {
      // Combine entry_date and entry_time into a single Date object
      const entryDate = new Date(item.scanned_date);
      const entryTime = item.entry_time;
      const combinedDateTime = new Date(
        `${entryDate.toISOString().split("T")[0]}T${entryTime}`
      );
      const formattedDateTime = formatDateTime(combinedDateTime);

      // console.log(formattedDateTime);

      if (item.average_rating < 4) {
        const matrixResult = await pool.request().query(`
          SELECT *, CONVERT(VARCHAR, msu.resolve_date_time, 23) AS resolved_date,
                 CONVERT(VARCHAR, msu.survey_date, 23) AS scanned_date
          FROM tata_asset_mgmt.jusco_asset_mgmt.matrix_survey_close as msu
          JOIN tata_asset_mgmt.jusco_asset_mgmt.data_users as du on du.id = msu.user_id
          LEFT JOIN tata_asset_mgmt.jusco_asset_mgmt.data_users AS du2 ON du2.id = msu.closing_user_id
          WHERE code = '${item.code}' AND survey_date = '${formattedDateTime}';
        `);

        console.log(matrixResult.recordset[0]);

        if (matrixResult.recordset.length > 0) {
          item.resolve_remarks = matrixResult.recordset[0].remarks;
          item.resolving_supervisor = matrixResult.recordset[0].user_name;
          item.resolved_date = matrixResult.recordset[0].resolved_date;
          item.scanned_date = matrixResult.recordset[0].scanned_date;
          item.resolve_image_1 = matrixResult.recordset[0].resolve_image_1;
          item.resolve_image_2 = matrixResult.recordset[0].resolve_image_2;
          item.closing_remarks = matrixResult.recordset[0].closing_remarks;
          item.closing_user_id = matrixResult.recordset[0].closing_user_id;
          item.closing_date_time = matrixResult.recordset[0].closing_date_time;
          item.closing_image_1 = matrixResult.recordset[0].closing_image_1;
          item.closing_image_2 = matrixResult.recordset[0].closing_image_2;
        }
        filteredData.push(item);
      } else {
        filteredData.push(item);
      }
    }

    return NextResponse.json({ data: filteredData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data", error);
    return NextResponse.json(
      { error: "Failed to retrieve data" },
      { status: 500 }
    );
  }
}
