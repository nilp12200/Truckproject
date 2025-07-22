const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ CORS should be used like this:
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // ✅ Allow all origins dynamically
    },
    credentials: true,
  })
);

app.use(bodyParser.json());

// ✅ MySQL configuration
const config = {
  host: process.env.DB_HOST || "srv1403.hstgr.io",
  user: process.env.DB_USER || "u327005182_lemonsoftwares",
  password: process.env.DB_PASSWORD || "Dpmq@6791",
  database: process.env.DB_DATABASE || "u327005182_truck",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(config);

// ✅ Connect to database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}
initializeDatabase();

/////////////////////////////////////////////////////log in api///////////////////////////////////////////////////////////////////////////////////////
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT Username, Role, AllowedPlants 
       FROM users 
       WHERE LOWER(Username) = LOWER(?) 
         AND Password = ? 
         AND (IsDelete = 0 OR IsDelete IS NULL)`,
      [username, password]
    );
    if (rows.length > 0) {
      const user = rows[0];
      res.json({
        success: true,
        message: "Login successful",
        role: user.Role,
        username: user.Username,
        allowedPlants: user.AllowedPlants,
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}); ////////////////done login api working fine

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get all plant master records
app.get("/api/plant-master", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM plantmaster");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// Soft delete plant by setting IsDeleted = 1
app.delete("/api/plant-master/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE plantmaster SET IsDeleted = 1 WHERE PlantID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json({ message: "✅ Plant soft deleted successfully" });
  } catch (error) {
    console.error("Error deleting plant:", error);
    res.status(500).json({ error: "❌ Failed to delete plant" });
  }
});

// Create new plant master record
app.post("/api/plant-master", async (req, res) => {
  const { plantName, plantAddress, contactPerson, mobileNo, remarks } =
    req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO plantmaster (PlantName, PlantAddress, ContactPerson, MobileNo, Remarks) 
       VALUES (?, ?, ?, ?, ?)`,
      [plantName, plantAddress, contactPerson, mobileNo, remarks]
    );

    res.status(201).json({
      PlantID: result.insertId,
      plantName,
      plantAddress,
      contactPerson,
      mobileNo,
      remarks
    });
  } catch (error) {
    console.error("Error creating plant:", error);
    res.status(500).json({ error: "Failed to create plant" });
  }
});

// Update plant by ID
app.put("/api/plant-master/:id", async (req, res) => {
  const { id } = req.params;
  const { plantName, plantAddress, contactPerson, mobileNo, remarks } =
    req.body;

  try {
    const [result] = await pool.query(
      `UPDATE plantmaster 
       SET PlantName = ?, 
           PlantAddress = ?, 
           ContactPerson = ?, 
           MobileNo = ?, 
           Remarks = ? 
       WHERE PlantID = ?`,
      [plantName, plantAddress, contactPerson, mobileNo, remarks, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json({
      PlantID: id,
      plantName,
      plantAddress,
      contactPerson,
      mobileNo,
      remarks
    });
  } catch (error) {
    console.error("Error updating plant:", error);
    res.status(500).json({ error: "Failed to update plant" });
  }
});

// Get single plant by ID with camelCase field names
app.get("/api/plantmaster/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT 
        PlantID as plantId, 
        PlantName as plantName, 
        PlantAddress as plantAddress, 
        ContactPerson as contactPerson, 
        MobileNo as mobileNo, 
        Remarks as remarks 
      FROM plantmaster 
      WHERE PlantID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Plant not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching plant:", error);
    res.status(500).json({ error: "Failed to fetch plant" });
  }
});

app.get("/api/plants", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "select * from plantmaster where isdeleted = 0 or isdeleted is null"
    );
    res.json(rows); // Send plant data
  } catch (error) {
    console.error("Error fetching plant list:", error);
    res.status(500).json({ error: "Failed to fetch plant list" });
  }
});

// Get all users API
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        Username as username,
        Password as password,
        Role as role,
        AllowedPlants as allowedplants,
        ContactNumber as contactnumber
      FROM users 
      WHERE (IsDelete = 0 OR IsDelete IS NULL)
      ORDER BY Username
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get all plants for plantmaster API (used by UserRegister)
app.get("/api/plantmaster", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        PlantID as plantid,
        PlantName as plantname
      FROM plantmaster 
      WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
      ORDER BY PlantName
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ error: "Failed to fetch plants" });
  }
});

// Update user API
app.put("/api/users/:username", async (req, res) => {
  const { username } = req.params;
  const {
    username: newUsername,
    password,
    role,
    allowedplants,
    contactnumber,
  } = req.body;

  try {
    const [result] = await pool.query(`
        update users
        set username = ?,
          password = ?,
          role = ?,
          allowedplants = ?,
          contactnumber = ?
        where username = ?
    `, [newUsername, password, role, allowedplants, contactnumber, username]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user API
app.delete("/api/users/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const [result] = await pool.query(`
      UPDATE users 
      SET isdelete = 1 
      WHERE username = ?
    `, [username]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

///////////////////////////////////////////////////////////////////////////////truck transaction api///////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/api/truck-transaction", async (req, res) => {
  const { formData, tableData } = req.body;
  const truckNo = formData.truckNo.trim().toLowerCase();
  const transaction = await pool.getConnection();

  try {
    await transaction.beginTransaction();
    let transactionId = formData.transactionId;

    // Check if the truck is already in transport
    if (!transactionId) {
      const [truckExists] = await transaction.query(
        `select 1 from trucktransactionmaster
         where lower(ltrim(rtrim(truckno))) = ? and (completed = 0 or completed is null)`,
        [truckNo]
      );
      if (truckExists.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "🚫 Truck number already exists.",
        });
      }

      const [pendingCheck] = await transaction.query(
        `select 1 from trucktransactiondetails d
         join trucktransactionmaster m on d.transactionid = m.transactionid
         where lower(ltrim(rtrim(m.truckno))) = ?
           and (d.checkinstatus = 0 or d.checkoutstatus = 0)
         limit 1`,
        [truckNo]
      );
      if (pendingCheck.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "🚫 Truck already in transport. Complete check-out first.",
        });
      }
    }

    // Insert or Update Master Record
    if (transactionId) {
      await transaction.query(
        `update trucktransactionmaster set
          truckno = ?,
          transactiondate = ?,
          cityname = ?,
          transporter = ?,
          amountperton = ?,
          truckweight = ?,
          deliverpoint = ?,
          remarks = ?
         where transactionid = ?`,
        [
          formData.truckNo,
          formData.transactionDate,
          formData.cityName,
          formData.transporter,
          formData.amountPerTon,
          formData.truckWeight,
          formData.deliverPoint,
          formData.remarks,
          transactionId,
        ]
      );
    } else {
      const [insertResult] = await transaction.query(
        `insert into trucktransactionmaster
          (truckno, transactiondate, cityname, transporter, amountperton, truckweight, deliverpoint, remarks, createdat)
         values (?, ?, ?, ?, ?, ?, ?, ?, now())`,
        [
          formData.truckNo,
          formData.transactionDate,
          formData.cityName,
          formData.transporter,
          formData.amountPerTon,
          formData.truckWeight,
          formData.deliverPoint,
          formData.remarks,
        ]
      );
      transactionId = insertResult.insertId;
    }

    // Delete unchecked rows
    await transaction.query(
      `delete from trucktransactiondetails
       where transactionid = ?
         and (checkinstatus = 0 and checkoutstatus = 0)`,
      [transactionId]
    );

    const filteredTableData = tableData.filter((row) => row.plantName?.trim() !== "");

    for (const row of filteredTableData) {
      const [plantResult] = await transaction.query(
        `select plantid from plantmaster where lower(ltrim(rtrim(plantname))) = lower(ltrim(rtrim(?)))`,
        [row.plantName]
      );
      const plantId = plantResult[0]?.plantid;
      if (!plantId) throw new Error(`Plant not found: ${row.plantName}`);

      if (row.detailId) {
        // UPDATE existing row
        await transaction.query(
          `update trucktransactiondetails
           set plantid = ?, loadingslipno = ?, qty = ?, priority = ?, remarks = ?, freight = ?, checkintime = ?, checkouttime = ?
           where detailid = ?`,
          [
            plantId,
            row.loadingSlipNo,
            row.qty,
            row.priority,
            row.remarks || "",
            row.freight,
            row.checkinTime || null,
            row.checkoutTime || null,
            row.detailId
          ]
        );
      } else {
        // INSERT new row
        await transaction.query(
          `insert into trucktransactiondetails
            (transactionid, plantid, loadingslipno, qty, priority, remarks, freight, checkintime, checkouttime)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            plantId,
            row.loadingSlipNo,
            row.qty,
            row.priority,
            row.remarks || "",
            row.freight,
            row.checkinTime || null,
            row.checkoutTime || null,
          ]
        );
      }
    }

    await transaction.commit();
    res.json({ success: true, transactionId });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    transaction.release();
  }
});

// Fetch Truck Numbers API
app.get("/api/trucks", async (req, res) => {
  const { plantName } = req.query;

  try {
    const [rows] = await pool.query(`
        SELECT DISTINCT m.TruckNo
FROM plantmaster p
JOIN trucktransactiondetails d ON p.PlantID = d.PlantID
JOIN trucktransactionmaster m ON d.TransactionID = m.TransactionID
WHERE LOWER(LTRIM(RTRIM(p.PlantName))) = LOWER(LTRIM(RTRIM('mihiram')))
  AND (d.CheckInStatus = 0 OR d.CheckInStatus IS NULL)
  AND (m.Completed = 0 OR m.Completed IS NULL);

    `, [plantName]);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching truck numbers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Truck Status API
app.post('/api/update-truck-status', (req, res) => {
  const { truckNo, plantName, invoicenumber, type } = req.body;

  // 1. Get TransactionID
  pool.query(`
    SELECT transactionid
    FROM trucktransactionmaster
    WHERE LOWER(LTRIM(RTRIM(truckno))) = LOWER(LTRIM(RTRIM(?))) 
    AND completed = 0
    ORDER BY transactionid DESC
    LIMIT 1
  `, [truckNo], (error, transactionResult) => {
    if (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ error: "Server error" });
    }

    if (transactionResult.length === 0) {
      return res.status(404).json({ message: "❌ Truck not found or already completed" });
    }
    const transactionId = transactionResult[0].transactionid;

    // 2. Get PlantID
    pool.query(`
      SELECT plantid
      FROM plantmaster 
      WHERE LOWER(LTRIM(RTRIM(plantname))) = LOWER(LTRIM(RTRIM(?)))
    `, [plantName], (error, plantResult) => {
      if (error) {
        console.error("Error fetching plant:", error);
        return res.status(500).json({ error: "Server error" });
      }

      if (plantResult.length === 0) {
        return res.status(404).json({ message: "❌ Plant not found" });
      }
      const plantId = plantResult[0].plantid;

      // 3. Get current status
      pool.query(`
        SELECT checkinstatus, checkoutstatus
        FROM trucktransactiondetails
        WHERE plantid = ? AND transactionid = ?
      `, [plantId, transactionId], (error, statusResult) => {
        if (error) {
          console.error("Error fetching status:", error);
          return res.status(500).json({ error: "Server error" });
        }

        if (statusResult.length === 0) {
          return res.status(404).json({ message: "❌ Truck detail not found for this plant" });
        }
        const status = statusResult[0];

        // 4. Handle Check-In
        if (type === "Check In" && status.checkinstatus === 0) {
          pool.query(`
            UPDATE trucktransactiondetails
            SET checkinstatus = 1,
                checkintime = NOW()
            WHERE plantid = ? AND transactionid = ?
          `, [plantId, transactionId], (error) => {
            if (error) {
              console.error("Error updating check-in:", error);
              return res.status(500).json({ error: "Server error" });
            }

            return res.status(200).json({ message: "✅ Truck checked in successfully!" });
          });
        }

        // 5. Handle Check-Out
        if (type === "Check Out") {
          if (status.checkinstatus === 0) {
            return res.status(400).json({ message: "❌ Please Check In first before Check Out" });
          }

          if (status.checkoutstatus === 1) {
            return res.status(400).json({ message: "🚫 This truck has already been checked out." });
          }

          pool.query(`
            UPDATE trucktransactiondetails
            SET checkoutstatus = 1,
                checkouttime = NOW(),
                invoice_number = ?
            WHERE plantid = ? AND transactionid = ?
          `, [invoicenumber, plantId, transactionId], (error) => {
            if (error) {
              console.error("Error updating check-out:", error);
              return res.status(500).json({ error: "Server error" });
            }

            // 6. Check if all plants completed
            pool.query(`
              SELECT COUNT(*) AS totalplants,
                     SUM(CASE WHEN checkinstatus = 1 THEN 1 ELSE 0 END) AS checkedin,
                     SUM(CASE WHEN checkoutstatus = 1 THEN 1 ELSE 0 END) AS checkedout
              FROM trucktransactiondetails
              WHERE transactionid = ?
            `, [transactionId], (error, allStatusResult) => {
              if (error) {
                console.error("Error checking status:", error);
                return res.status(500).json({ error: "Server error" });
              }

              const statusCheck = allStatusResult[0];
              if (
                statusCheck.totalplants === statusCheck.checkedin &&
                statusCheck.totalplants === statusCheck.checkedout
              ) {
                pool.query(`
                  UPDATE trucktransactionmaster
                  SET completed = 1
                  WHERE transactionid = ?
                  AND NOT EXISTS (
                    SELECT 1 FROM trucktransactiondetails
                    WHERE transactionid = ?
                    AND (checkinstatus <> 1 OR checkoutstatus <> 1)
                  )
                `, [transactionId, transactionId], (error) => {
                  if (error) {
                    console.error("Error updating master transaction:", error);
                    return res.status(500).json({ error: "Server error" });
                  }

                  return res.json({
                    message: "✅ All plants processed. Truck process completed.",
                  });
                });
              } else {
                return res.status(200).json({ message: "✅ Truck checked out successfully!" });
              }
            });
          });
        }
      });
    });
  });
});



// Check Priority Status API
app.get("/api/check-priority-status", async (req, res) => {
  const { truckNo, plantName } = req.query;

  try {
    // Get the latest active transaction
    const [transResult] = await pool.query(`
      select transactionid 
from trucktransactionmaster
where lower(ltrim(rtrim(truckno))) = lower(ltrim(rtrim(?))) and completed = 0
order by transactionid desc
limit 1
`, [truckNo]);

    if (transResult.length === 0) {
      return res.json({ hasPending: false });
    }

    const transactionId = transResult[0].TransactionID;

    // Get all rows with check statuses
    const [detailResult] = await pool.query(`
      SELECT d.Priority, d.CheckInStatus, d.CheckOutStatus, p.PlantName
      FROM trucktransactiondetails d
      JOIN plantmaster p ON d.PlantID = p.PlantID
      WHERE d.TransactionID = ?
    `, [transactionId]);

    if (detailResult.length === 0) {
      return res.json({ hasPending: false });
    }

    const sorted = detailResult.sort((a, b) => a.Priority - b.Priority);

    // Find the lowest pending priority
    const pending = sorted.find(
      (row) => row.CheckInStatus !== 1 || row.CheckOutStatus !== 1
    );

    if (!pending) {
      return res.json({ hasPending: false });
    }

    const currentRow = sorted.find(
      (row) => row.PlantName.toLowerCase() === plantName.toLowerCase()
    );

    if (!currentRow) {
      return res
        .status(400)
        .json({ error: "Current plant not found in transaction" });
    }

    const canProceed = currentRow.Priority === pending.Priority;

    res.json({
      hasPending: true,
      canProceed,
      nextPriority: pending.Priority,
      nextPlant: pending.PlantName,
    });
  } catch (err) {
    console.error("Priority status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get Finished Plant API
app.get("/api/finished-plant", async (req, res) => {
  const { truckNo } = req.query;

  try {
    const [transResult] = await pool.query(`
      SELECT TransactionID 
      FROM trucktransactionmaster 
      WHERE LOWER(LTRIM(RTRIM(TruckNo))) = LOWER(LTRIM(RTRIM(?))) AND Completed = 0 
      ORDER BY TransactionID DESC
      LIMIT 1
    `, [truckNo]);

    if (transResult.length === 0) {
      return res.json({ lastFinished: null });
    }

    const transactionId = transResult[0].TransactionID;

    const [finishedResult] = await pool.query(`
      SELECT p.PlantName, d.Priority
      FROM trucktransactiondetails d
      JOIN plantmaster p ON d.PlantID = p.PlantID
      WHERE d.TransactionID = ? 
        AND d.CheckInStatus = 1 
        AND d.CheckOutStatus = 1
      ORDER BY d.Priority DESC
      LIMIT 1
    `, [transactionId]);

    if (finishedResult.length === 0) {
      return res.json({ lastFinished: null });
    }

    res.json({ lastFinished: finishedResult[0].PlantName });
  } catch (error) {
    console.error("Error in /api/finished-plant:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Truck Report API
app.get("/api/truck-report", async (req, res) => {
  const { fromDate, toDate, plant } = req.query;

  if (!fromDate || !toDate || !plant) {
    return res.status(400).json({ error: "Missing required filters" });
  }

  let plantArray = [];
  try {
    plantArray = JSON.parse(plant);
  } catch (err) {
    return res.status(400).json({ error: "Invalid plant parameter" });
  }

  if (!Array.isArray(plantArray) || plantArray.length === 0) {
    return res.status(400).json({ error: "No plants selected" });
  }

  try {
    const placeholders = plantArray.map(() => '?').join(',');

    const query = `
      SELECT 
         ttm.TruckNo AS truckNo,
         ttm.TransactionDate AS transactionDate,
         p.PlantName AS plantName,
         ttd.CheckInTime AS checkInTime,
         ttd.CheckOutTime AS checkOutTime,
         ttd.LoadingSlipNo AS loadingSlipNo,
         ttd.Qty AS qty,
         ttd.Freight AS freight,
         ttd.Priority AS priority,
         ttd.Remarks AS remarks
      FROM trucktransactiondetails ttd
      JOIN plantmaster p ON ttd.PlantID = p.PlantID
      JOIN trucktransactionmaster ttm ON ttd.TransactionID = ttm.TransactionID
      WHERE ttd.PlantID IN (${placeholders})
        AND CAST(ttm.TransactionDate AS DATE) BETWEEN ? AND ?
      ORDER BY ttm.TransactionDate DESC
    `;

    const [result] = await pool.query(query, [...plantArray, fromDate, toDate]);
    res.json(result);
  } catch (error) {
    console.error("Error fetching truck report:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Checked-in Trucks API
app.get("/api/checked-in-trucks", async (req, res) => {
  const { plantName } = req.query;

  try {
    const [result] = await pool.query(`
      SELECT DISTINCT m.TruckNo
FROM plantmaster p
JOIN trucktransactiondetails d ON p.PlantID = d.PlantID
JOIN trucktransactionmaster m ON d.TransactionID = m.TransactionID
WHERE LOWER(TRIM(p.PlantName)) = LOWER(TRIM(?))
  AND (d.CheckInStatus = 1 OR d.CheckInStatus IS Not NULL)
  AND (d.CheckOutStatus = 0 OR d.CheckOutStatus IS NULL);


    `, [plantName]);

    res.json(result);
  } catch (error) {
    console.error("Error fetching truck numbers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Remarks API
app.get("/api/fetch-remarks", async (req, res) => {
  const { plantName, truckNo } = req.query;

  try {
    // Step 1: Get PlantID
    const [plantResult] = await pool.query(`
      select plantid from plantmaster where lower(ltrim(rtrim(plantname))) = lower(ltrim(rtrim(?)))
    `, [plantName]);

    if (plantResult.length === 0) {
      return res.status(404).json({ message: "Plant not found" });
    }
    const plantId = plantResult[0].PlantID;

    // Step 2: Get TransactionID
    const [txnResult] = await pool.query(`
      select transactionid from trucktransactionmaster where lower(ltrim(rtrim(truckno))) = lower(ltrim(rtrim(?)))
    `, [truckNo]);

    if (txnResult.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    const transactionId = txnResult[0].TransactionID;

    // Step 3: Fetch Remarks
    const [remarksResult] = await pool.query(`
      select remarks from trucktransactiondetails where plantid = ? and transactionid = ?
    `, [plantId, transactionId]);

    if (remarksResult.length === 0) {
      return res.status(404).json({ message: "Remarks not found" });
    }

    const remarks = remarksResult[0].Remarks;
    res.json({ remarks });
  } catch (error) {
    console.error("Error fetching remarks:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create User API
app.post("/api/users", async (req, res) => {
  const { username, password, contactNumber, moduleRights, allowedPlants } =
    req.body;

  if (!username || !password || !contactNumber) {
    return res.status(400).json({
      message: "Username, password, and contact number are required.",
    });
  }

  try {
    const roleString = moduleRights.join(",");
    const plantsString = allowedPlants.join(",");

    console.log("👉 Incoming Data:", {
      username,
      password,
      contactNumber,
      roleString,
      plantsString,
    });

    await pool.query(`      INSERT INTO users (Username, Password, ContactNumber, Role, AllowedPlants)
      VALUES (?, ?, ?, ?, ?)
    `, [username, password, contactNumber, roleString, plantsString]);

    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ message: "Error creating user." });
  }
});

// Get Truck Plant Quantities API
app.get("/api/truck-plant-quantities", async (req, res) => {
  const { truckNo } = req.query;

  try {
    const [result] = await pool.query(`
      select 
  p.plantname,
  sum(ttd.qty) as quantity,
  min(ttd.priority) as priority
from trucktransactiondetails ttd
join trucktransactionmaster ttm on ttd.transactionid = ttm.transactionid
join plantmaster p on ttd.plantid = p.plantid
where lower(ltrim(rtrim(ttm.truckno))) = lower(ltrim(rtrim(?)))
  and ttm.completed = 0
group by p.plantname
order by min(ttd.priority)
    `, [truckNo]);

    res.json(result);
  } catch (error) {
    console.error("Error fetching truck quantities:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get Truck Find API
app.get("/api/truck-find", async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT truckno, transactiondate, cityname
      FROM trucktransactionmaster
      WHERE truckno IS NOT NULL AND (completed = 0 OR completed IS NULL)
      ORDER BY transactiondate DESC
    `);

    const formattedData = result.map((truck) => ({
      truckno: truck.truckno,
      transactiondate: truck.transactiondate,
      cityname: truck.cityname,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Error fetching truck transactions:", err);
    res.status(500).json({ error: "Failed to fetch truck data" });
  }
});

// Get Truck Transaction by Truck Number
app.get("/api/truck-transaction/:truckNo", async (req, res) => {
  const { truckNo } = req.params;
  try {
    const [masterResult] = await pool.query(
      `select * from trucktransactionmaster
       where lower(ltrim(rtrim(truckno))) = lower(ltrim(rtrim(?))) and (completed = 0 or completed is null)
       order by transactionid desc
       limit 1`,
      [truckNo]
    );
    const master = masterResult[0];
    if (!master) return res.status(404).json({ error: "Truck not found" });

    const [detailsResult] = await pool.query(
      `select d.*, p.plantname
       from trucktransactiondetails d
       left join plantmaster p on d.plantid = p.plantid
       where d.transactionid = ?`,
      [master.transactionid]
    );
    res.json({ master, details: detailsResult });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Truck Schedule API
app.get("/api/truck-schedule", async (req, res) => {
  const { fromDate, toDate, status, plant } = req.query;

  if (!fromDate || !toDate || !status || !plant) {
    return res.status(400).json({ error: "Missing required filters" });
  }

  let plantArray = [];
  try {
    plantArray = JSON.parse(plant);
  } catch (err) {
    return res.status(400).json({ error: "Invalid plant format" });
  }

  if (!Array.isArray(plantArray) || plantArray.length === 0) {
    return res.status(400).json({ error: "No plants selected" });
  }

  let statusCondition = "";
  if (status === "Dispatched") {
    statusCondition = "ttd.CheckInStatus = 0 AND ttd.CheckOutStatus = 0";
  } else if (status === "InTransit") {
    statusCondition =
      "ttd.CheckInStatus = 1 AND (ttd.CheckOutStatus = 0 OR ttd.CheckOutStatus IS NULL)";
  } else if (status === "CheckedOut") {
    statusCondition = "ttd.CheckInStatus = 1 AND ttd.CheckOutStatus = 1";
  } else if (status === "All") {
    statusCondition = "1=1";
  } else {
    return res.status(400).json({ error: "Invalid status filter" });
  }

  try {
    const placeholders = plantArray.map(() => '?').join(',');

    const query = `
      SELECT 
        ttm.TruckNo AS truckNo,
        ttm.TransactionDate AS transactionDate,
        p.PlantName AS plantName,
        ttd.CheckInTime AS checkInTime,
        ttd.CheckOutTime AS checkOutTime,
        ttd.LoadingSlipNo AS loadingSlipNo,
        ttd.Qty AS qty,
        ttd.Freight AS freight,
        ttd.Priority AS priority,
        ttd.Remarks AS remarks
      FROM trucktransactiondetails ttd
      JOIN plantmaster p ON ttd.PlantID = p.PlantID
      JOIN trucktransactionmaster ttm ON ttd.TransactionID = ttm.TransactionID
      WHERE ttd.PlantID IN (${placeholders})
        AND CAST(ttm.TransactionDate AS DATE) BETWEEN ? AND ?
        AND ${statusCondition}
      ORDER BY ttm.TransactionDate DESC
    `;

    const [result] = await pool.query(query, [...plantArray, fromDate, toDate]);
    res.json(result);
  } catch (err) {
    console.error("Error fetching truck schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete('/api/truck-transaction/detail/:detailId', async (req, res) => {
  const { detailId } = req.params;
  try {
    const [result] = await pool.query(
      "delete from trucktransactiondetails where detailid = ?",
      [detailId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Detail not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 🚀 Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

