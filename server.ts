import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "rifans-secret-key-2026";

const db = new Database('rifans.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    national_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS submission_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT REFERENCES submissions(id),
    status TEXT NOT NULL,
    changed_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    submission_id TEXT REFERENCES submissions(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    submission_id TEXT REFERENCES submissions(id),
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    type TEXT,
    signature_data TEXT,
    signed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe stringify for server-side to prevent circular structure errors
function safeStringify(obj: any): string {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
}

const pool = {
  query: async (text: string, params: any[] = []) => {
    // Convert $1, $2 to ? for SQLite and expand params to match the order
    const placeholders: number[] = [];
    let sqliteSql = text.replace(/\$(\d+)/g, (match, p1) => {
      placeholders.push(parseInt(p1));
      return '?';
    });
    
    // Handle PostgreSQL specific JSON operator if any remain
    if (sqliteSql.includes("data->>'nationalId'")) {
      sqliteSql = sqliteSql.replace(/data->>'nationalId'/g, "json_extract(data, '$.nationalId')");
    }
    if (sqliteSql.includes("data->>'userNationalId'")) {
      sqliteSql = sqliteSql.replace(/data->>'userNationalId'/g, "json_extract(data, '$.userNationalId')");
    }

    let finalParams: any[];
    if (placeholders.length > 0) {
      finalParams = placeholders.map(idx => params[idx - 1]);
    } else {
      finalParams = params;
    }

    // SQLite3 can only bind numbers, strings, bigints, buffers, and null.
    // Automatically stringify objects and arrays.
    const processedParams = finalParams.map(p => {
      if (p === undefined) return null;
      if (p instanceof Date) return p.toISOString();
      if (p !== null && typeof p === 'object') return safeStringify(p);
      return p;
    });

    try {
      const stmt = db.prepare(sqliteSql);
      const isQuery = sqliteSql.trim().toUpperCase().startsWith('SELECT') || sqliteSql.toUpperCase().includes('RETURNING');
      
      if (isQuery) {
        const rows = stmt.all(...processedParams);
        // Automatically parse 'data' column if it exists and is a string
        rows.forEach((row: any) => {
          if (row.data && typeof row.data === 'string') {
            try {
              row.data = JSON.parse(row.data);
            } catch (e) {
              // Not a JSON string, ignore
            }
          }
        });
        return { rows };
      } else {
        const result = stmt.run(...processedParams);
        return { rows: [], rowCount: result.changes };
      }
    } catch (error) {
      console.error("Database Error:", error);
      throw error;
    }
  },
  connect: (callback: any) => {
    callback(null, null, () => {});
  }
};

console.log('✅ Connected to SQLite database');

function normalizeSaudiPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length > 10) cleaned = cleaned.slice(-10);
  return cleaned;
}

// Middleware for Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

// Email Transporter Helper
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const user = (process.env.EMAIL_USER || "r.iifaanis@gmail.com").trim();
    const pass = (process.env.EMAIL_PASS || "xuchzkkqxbulobpl").trim();

    if (!user || !pass) {
      console.warn("⚠️ تنبيه: بيانات البريد الإلكتروني ناقصة (EMAIL_USER, EMAIL_PASS). لن يتم إرسال الإشعارات.");
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    transporter.verify(function (error, success) {
      if (error) {
        console.error("❌ خطأ في إعدادات البريد الإلكتروني:", error.message);
      } else {
        console.log("✅ تم الاتصال بخادم البريد الإلكتروني بنجاح.");
      }
    });
  }
  return transporter;
}

async function sendEmailNotification(rawPayload: any) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) return;

  console.log("📧 Sending email notification for payload:", rawPayload.id || 'unknown');

  // Extract nested data if it exists
  let submissionData: any = {};
  if (rawPayload.data) {
    if (typeof rawPayload.data === 'object') {
      submissionData = rawPayload.data;
    } else if (typeof rawPayload.data === 'string') {
      try {
        submissionData = JSON.parse(rawPayload.data);
      } catch (e) {
        console.error("Error parsing submission data in email notification:", e);
      }
    }
  }
  
  // Create a flattened data object with robust fallbacks
  const data: any = {
    ...submissionData,
    ...rawPayload
  };

  // Explicitly handle common fields to ensure they are not "undefined" or "null"
  const userName = data.userName || data.user_name || (data.firstName ? `${data.firstName} ${data.middleName || ''} ${data.lastName || ''}`.trim() : '') || 'عميل';
  const userMobile = data.userMobile || data.mobile || data.phone || 'غير مسجل';
  const userNationalId = data.userNationalId || data.nationalId || data.national_id || 'غير مسجل';
  const userEmail = data.userEmail || data.email || 'غير مسجل';
  const displayId = data.requestId || data.submissionId || data.id || 'بدون رقم';
  
  const region = data.region && data.region !== "undefined" && data.region !== "null" ? data.region : 'غير محدد';
  const city = data.city && data.city !== "undefined" && data.city !== "null" ? data.city : 'غير محدد';
  const bank = data.bank && data.bank !== "undefined" && data.bank !== "null" ? data.bank : 'غير محدد';
  
  const recipient = process.env.EMAIL_TO || "r.iifaanis@gmail.com";
  const sender = process.env.EMAIL_USER || "r.iifaanis@gmail.com";

  const type = data.type || "waive_request";
  const isConsultation = type === "consultation_request";
  const isRescheduling = type === "rescheduling_request" || type === "scheduling_request";
  const isService = type === "service_request";
  const isContact = data.isContactRequest || type === "contact_request";
  
  const typeLabel = isConsultation ? "استشارة مالية" : 
                    isRescheduling ? "إعادة جدولة" : 
                    isService ? `طلب خدمة (${data.subService || data.Sub_Service || 'عامة'})` :
                    isContact ? "تواصل" : "إعفاء";
  
  let subject = isContact 
    ? `رسالة تواصل جديدة: ${data.subject || 'بدون موضوع'}`
    : data.isSignatureNotification 
      ? `تم توقيع عقد جديد - ${typeLabel} - ${displayId}`
      : `طلب ${typeLabel} جديد - ${displayId}`;

  const emailAttachments: any[] = [];

  if (data.signature) {
    const base64Data = data.signature.split(",")[1];
    if (base64Data) {
      emailAttachments.push({
        filename: 'signature.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'user_signature'
      });
    }
  }

  if (data.attachments && Array.isArray(data.attachments)) {
    data.attachments.forEach((att: any, index: number) => {
      if (att.content && att.content.includes(",")) {
        const base64Content = att.content.split(",")[1];
        emailAttachments.push({
          filename: att.fileName || `attachment_${index}`,
          content: base64Content,
          encoding: 'base64'
        });
      }
    });
  }

  let htmlContent = `
    <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
      <h2 style="color: #22042C; border-bottom: 2px solid #C7A969; padding-bottom: 10px;">${isContact ? 'رسالة تواصل جديدة' : (data.isSignatureNotification ? 'إشعار توقيع عقد إلكتروني' : subject)}</h2>
  `;

  if (isContact) {
    htmlContent += `
      <div style="margin-top: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
        <p><strong>الاسم:</strong> ${userName}</p>
        <p><strong>البريد الإلكتروني:</strong> ${userEmail}</p>
        <p><strong>الموضوع:</strong> ${data.subject || 'بدون موضوع'}</p>
        <div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 5px;">
          <p><strong>الرسالة:</strong></p>
          <p>${data.message || 'لا يوجد نص'}</p>
        </div>
      </div>
    `;
  } else if (data.isSignatureNotification) {
    htmlContent += `
      <p style="font-size: 16px;">قام العميل <strong>${userName}</strong> بتوقيع العقد الخاص بـ <strong>${typeLabel}</strong> رقم <strong>${displayId}</strong>.</p>
      <p><strong>تاريخ التوقيع:</strong> ${new Date().toLocaleString('ar-EG')}</p>
      <p>يمكنك مراجعة العقد والتفاصيل من خلال لوحة تحكم الإدارة.</p>
    `;
  }

  if (!isContact) {
    htmlContent += `
      <div style="margin-top: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #C7A969; font-size: 16px;">بيانات العميل:</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <p><strong>الاسم:</strong> ${userName}</p>
          <p><strong>البريد الإلكتروني:</strong> ${userEmail}</p>
          <p><strong>الجوال:</strong> ${userMobile}</p>
          <p><strong>الهوية:</strong> ${userNationalId}</p>
        </div>
      </div>
    `;
  }

  if (isConsultation) {
    htmlContent += `
      <div style="margin-top: 20px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #C7A969; font-size: 16px;">تفاصيل الاستشارة:</h3>
        <p><strong>الراتب:</strong> ${data.salary || 0} ر.س</p>
        <p><strong>الالتزامات:</strong> ${data.obligations || 0} ر.س</p>
        <p><strong>نسبة الاستقطاع:</strong> ${data.dbr || 0}%</p>
        <p><strong>الحالة:</strong> <span style="color: #C7A969; font-weight: bold;">${data.status || 'قيد المراجعة'}</span></p>
      </div>
    `;
  } else if (!isContact) {
    htmlContent += `
      <div style="margin-top: 20px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
        <h3 style="margin-top: 0; color: #C7A969; font-size: 16px;">تفاصيل طلب ${typeLabel}:</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <p><strong>رقم الطلب:</strong> ${displayId}</p>
          <p><strong>المنطقة/المدينة:</strong> ${region} - ${city}</p>
          <p><strong>الجهة المالية:</strong> ${bank}</p>
          <p><strong>إجمالي الالتزامات:</strong> ${data.totalAmount || 0} ر.س</p>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #fcfcfc; border: 1px dashed #ddd;">
          <p><strong>الملخص:</strong> ${data.summary || "لا يوجد"}</p>
        </div>
      </div>

      ${data.products && Array.isArray(data.products) && data.products.length > 0 ? `
        <div style="margin-top: 20px;">
          <p style="font-weight: bold; color: #22042C;">المنتجات التمويلية:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="border: 1px solid #eee; padding: 8px; text-align: right;">المنتج</th>
                <th style="border: 1px solid #eee; padding: 8px; text-align: right;">رقم الحساب</th>
                <th style="border: 1px solid #eee; padding: 8px; text-align: right;">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${data.products.map((p: any) => `
                <tr>
                  <td style="border: 1px solid #eee; padding: 8px;">${p.type || p.productType || '-'}</td>
                  <td style="border: 1px solid #eee; padding: 8px;">${p.accountNumber || '-'}</td>
                  <td style="border: 1px solid #eee; padding: 8px;">${p.amount || 0} ر.س</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
    
    if (data.signature) {
      htmlContent += `
        <div style="margin-top: 20px; text-align: center;">
          <p style="font-weight: bold; color: #22042C;">التوقيع الإلكتروني:</p>
          <img src="cid:user_signature" style="max-width: 300px; border: 1px solid #eee; padding: 5px; background: #fff;" />
        </div>
      `;
    }
  }

  htmlContent += `
      <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 11px; color: #999; text-align: center;">تم الإرسال آلياً من منصة ريفانس المالية</p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from: `"ريفانس المالية" <${sender}>`,
      to: recipient,
      subject: subject,
      html: htmlContent,
      attachments: emailAttachments
    });
    if (userEmail) {
      await mailTransporter.sendMail({
        from: `"ريفانس المالية" <${sender}>`,
        to: userEmail,
        subject: `تأكيد استلام طلبك - ${displayId}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif;">
            <h2>تم استلام طلبك بنجاح</h2>
            <p>عزيزي العميل، نشكرك على ثقتك في ريفانس المالية.</p>
            <p>لقد تم استلام طلبك رقم <strong>${displayId}</strong> وهو الآن قيد المراجعة.</p>
            <p>يمكنك متابعة حالة الطلب من خلال لوحة التحكم الخاصة بك.</p>
            <hr />
            ${htmlContent}
          </div>
        `,
        attachments: emailAttachments
      });
    }
  } catch (error: any) {
    console.error("❌ Failed to send email notification:", error.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Auth Routes
  app.get("/api/auth/check-user/:nationalId", async (req, res) => {
    const { nationalId } = req.params;
    try {
      const result = await pool.query("SELECT * FROM users WHERE national_id = $1", [nationalId]);
      const user = result.rows[0];
      res.json({ exists: !!user, user });
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.post("/api/auth/direct-login", async (req, res) => {
    try {
      const { nationalId, mobile } = req.body;
      
      if (!nationalId || !mobile) {
        return res.status(400).json({ message: "يرجى إدخال رقم الهوية ورقم الجوال" });
      }

      const normalizedPhone = normalizeSaudiPhone(mobile);
      
      // Find or create user
      let result = await pool.query("SELECT * FROM users WHERE national_id = $1", [nationalId]);
      let user = result.rows[0];

      if (!user) {
        const userId = Date.now().toString();
        await pool.query(
          "INSERT INTO users (id, national_id, phone, created_at) VALUES ($1, $2, $3, $4)",
          [userId, nationalId, normalizedPhone, new Date()]
        );
        result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
        user = result.rows[0];
      }

      // Link any previously anonymous submissions to this user
      await pool.query(
        "UPDATE submissions SET user_id = $1 WHERE user_id IS NULL AND (json_extract(data, '$.nationalId') = $2 OR json_extract(data, '$.userNationalId') = $2)",
        [user.id, nationalId]
      );

      const token = jwt.sign(user, JWT_SECRET);

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          nationalId: user.national_id, 
          mobile: user.phone,
          login_time: new Date()
        }
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(500).json({ 
        message: error.message || "تعذر تسجيل الدخول",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    // Simple admin login for demo
    if (email === 'admin@rifans.sa' && password === '1234') {
      const user = { id: 'admin', email, name: 'مدير النظام', role: 'admin' };
      const token = jwt.sign(user, JWT_SECRET);
      return res.json({ token, user });
    }

    res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
  });


  // API Routes
  app.post("/api/submit-request", async (req, res) => {
    try {
      const data = req.body;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      let userId = null;
      let userName = data.userName || (data.firstName ? `${data.firstName} ${data.lastName}` : 'عميل');

      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          data.userNationalId = decoded.nationalId || decoded.national_id;
          data.userMobile = decoded.phone || decoded.mobile;
        } catch (e) {
          console.error("Token verification error in submit-request:", e);
        }
      }

      const type = data.type || "waive_request";
      const submissionId = data.requestId || `REQ-${Date.now()}`;
      
      // Link anonymous request to user if they exist by nationalId
      if (!userId && data.nationalId) {
        const userResult = await pool.query("SELECT id FROM users WHERE national_id = $1", [data.nationalId]);
        if (userResult.rows[0]) {
          userId = userResult.rows[0].id;
        }
      }

      await pool.query(
        "INSERT INTO submissions (id, user_id, user_name, type, status, data, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [submissionId, userId, userName, type, 'pending', safeStringify(data), new Date()]
      );
      
      const enrichedData = { 
        id: submissionId,
        user_id: userId,
        user_name: userName,
        type, 
        status: 'pending',
        data,
        timestamp: new Date() 
      };

      // Send email
      sendEmailNotification(enrichedData).catch(err => console.error("Email error:", err));
      
      res.status(201).json({ success: true, submissionId });
    } catch (error: any) {
      console.error("Submit Request Error:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الطلب" });
    }
  });

  app.get("/api/my-submissions", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query("SELECT * FROM submissions WHERE user_id = $1 ORDER BY timestamp DESC", [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/submissions/:id", authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM submissions WHERE id = $1", [id]);
      const submission = result.rows[0];

      if (submission) {
        // Check if user owns this submission or is admin
        if (submission.user_id === req.user.id || req.user.role === 'admin') {
          // Find if there's a contract with signature
          const contractResult = await pool.query("SELECT signature_data, signed_at FROM contracts WHERE submission_id = $1", [id]);
          const contract = contractResult.rows[0];
          
          const responseData = { ...submission };
          if (contract && contract.signature_data) {
            responseData.signature_data = contract.signature_data;
            responseData.signed_at = contract.signed_at;
          }
          res.json(responseData);
        } else {
          res.status(403).json({ message: "Forbidden" });
        }
      } else {
        res.status(404).json({ message: "الطلب غير موجود" });
      }
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/admin/submissions", authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const result = await pool.query("SELECT * FROM submissions ORDER BY timestamp DESC");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/admin/submissions/:id/history", authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM submission_history WHERE submission_id = $1 ORDER BY timestamp DESC", [id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/admin/users", authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.patch("/api/admin/submissions/:id/status", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const subResult = await pool.query("SELECT * FROM submissions WHERE id = $1", [id]);
      const submission = subResult.rows[0];

      if (submission) {
        await pool.query("UPDATE submissions SET status = $1 WHERE id = $2", [status, id]);
        
        // Add to history
        await pool.query(
          "INSERT INTO submission_history (submission_id, status, changed_by, timestamp) VALUES ($1, $2, $3, $4)",
          [id, status, req.user.name || 'Admin', new Date()]
        );

        // Create notification for user
        const statusLabels: any = {
          pending: 'جديد',
          processing: 'تحت الإجراء',
          executing: 'قيد التنفيذ',
          completed: 'مكتمل',
          rejected: 'مرفوض'
        };

        await pool.query(
          "INSERT INTO notifications (id, user_id, submission_id, title, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
            Date.now().toString(),
            submission.user_id,
            id,
            'تحديث حالة الطلب',
            `تم تغيير حالة طلبك رقم ${id} إلى: ${statusLabels[status] || status}`,
            'status_update',
            0,
            new Date()
          ]
        );

        res.json({ success: true });
      } else {
        res.status(404).json({ message: "الطلب غير موجود" });
      }
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/my-contracts", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query("SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.post("/api/notifications/mark-all-read", authenticateToken, async (req: any, res) => {
    try {
      await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = $1", [req.user.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.post("/api/admin/send-contract", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    
    const { userId, submissionId } = req.body;
    try {
      const subResult = await pool.query("SELECT * FROM submissions WHERE id = $1", [submissionId]);
      const sub = subResult.rows[0];
      
      if (sub) {
        await pool.query("UPDATE submissions SET status = $1 WHERE id = $2", ['contract_signature', submissionId]);
        
        const contractId = `CON-${Date.now()}`;
        await pool.query(
          "INSERT INTO contracts (id, submission_id, user_id, user_name, type, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [contractId, submissionId, userId, sub.user_name, sub.type, new Date()]
        );

        await pool.query(
          "INSERT INTO notifications (id, user_id, submission_id, title, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
            Date.now().toString(),
            userId,
            submissionId,
            'عقد جديد بانتظار التوقيع',
            `تم إرسال عقد تقديم الخدمات لطلبك رقم ${submissionId}. يرجى التوقيع للمتابعة.`,
            'contract_signature',
            0,
            new Date()
          ]
        );

        res.json({ success: true });
      } else {
        res.status(404).json({ message: "الطلب غير موجود" });
      }
    } catch (error) {
      console.error("Send contract error:", error);
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/admin/contracts", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const result = await pool.query("SELECT * FROM contracts ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/admin/notifications", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const result = await pool.query("SELECT * FROM notifications WHERE user_id = 'admin' ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.post("/api/submit-signature", authenticateToken, async (req: any, res) => {
    try {
      const { submission_id, signature_data } = req.body;
      
      const contractResult = await pool.query("SELECT * FROM contracts WHERE submission_id = $1", [submission_id]);
      const contract = contractResult.rows[0];

      if (contract) {
        await pool.query(
          "UPDATE contracts SET signature_data = $1, signed_at = $2 WHERE submission_id = $3",
          [signature_data, new Date(), submission_id]
        );
        
        await pool.query("UPDATE submissions SET status = $1 WHERE id = $2", ['executing', submission_id]);

        const subResult = await pool.query("SELECT * FROM submissions WHERE id = $1", [submission_id]);
        const sub = subResult.rows[0];

        // Create notification for admin
        await pool.query(
          "INSERT INTO notifications (id, user_id, submission_id, title, message, type, is_read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
            Date.now().toString(),
            'admin',
            submission_id,
            'تم توقيع عقد جديد',
            `قام العميل ${sub?.user_name || 'عميل'} بتوقيع العقد الخاص بالطلب رقم ${submission_id}`,
            'contract_signature',
            0,
            new Date()
          ]
        );

        // Notify admin via email
        sendEmailNotification({
          ...sub,
          isSignatureNotification: true,
          signature: signature_data
        }).catch(err => console.error("Email error:", err));

        res.json({ success: true });
      } else {
        res.status(404).json({ message: "العقد غير موجود" });
      }
    } catch (error: any) {
      console.error("Submit signature error:", error);
      res.status(500).json({ message: "Error submitting signature" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      await sendEmailNotification({
        type: 'contact_request',
        userName: name,
        userEmail: email,
        subject: subject,
        message: message,
        isContactRequest: true
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Contact Email Error:", error);
      res.status(500).json({ success: false });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Fatal Server Start Error:", err);
  process.exit(1);
});
