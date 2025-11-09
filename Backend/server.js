import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// 💡 CRITICAL FIX: Global Transporter Configuration
// ===============================================

// 1. Define the transporter ONCE globally for efficiency.
// 2. Using explicit host/port (465) is generally more stable than service: "gmail"
//    in cloud environments like Render and helps debug firewalls/timeouts.
const transporter = nodemailer.createTransport({
    // Use the explicit configuration for better stability:
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use implicit SSL/TLS on port 465
    auth: {
        // CRITICAL: EMAIL_PASS MUST be the 16-character Gmail App Password.
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    },
    // Add a higher timeout to help against slow network issues on Render
    timeout: 30000, // 30 seconds
});

// Middleware
app.use(cors({
    // It's a good practice to use a constant for the origin,
    // though hardcoding here is acceptable for a simple app.
    origin: "https://html-port-folio.vercel.app", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express.json());
app.use(express.static("public")); // Serve HTML/JS from public folder

// ===============================================
// ✅ POST route to send contact form email
// ===============================================
app.post("/contact", async (req, res) => {
    // Note: Frontend uses '/contact', Backend uses '/contact'. Adjust if needed.
    const { name, email, message } = req.body;

    if (!name || !email || !!message) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }

    try {
        // Use the globally defined transporter
        const mailOptions = {
            // Note: Use a verified sender email for 'from' if possible to avoid spam flags.
            // Using the client's email here is common but sometimes restricted by Gmail.
            from: email, 
            to: process.env.RECEIVER_EMAIL,
            subject: `Portfolio Contact Form: ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        // Log the full error to the console for debugging the ETIMEDOUT issue
        console.error("Error sending contact form email:", error);
        
        // Check for specific error types (e.g., App Password failure)
        const errorMessage = error.code === 'EAUTH' 
            ? "Authentication failed. Check EMAIL_PASS (App Password)." 
            : "Failed to send message (Connection or internal error).";
            
        res.status(500).json({ success: false, error: errorMessage });
    }
});

// ===============================================
// ✅ POST route for About visitor popup
// ===============================================
app.post("/about-visitor", async (req, res) => {
    const { name, company } = req.body;

    if (!name || !company) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }

    try {
        // Use the globally defined transporter
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVER_EMAIL,
            subject: "New About Page Visitor",
            text: `Visitor Details:\n\nName: ${name}\nCompany: ${company}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Visitor info sent successfully!" });
    } catch (error) {
        console.error("Error sending visitor info:", error);
        
        const errorMessage = error.code === 'EAUTH' 
            ? "Authentication failed. Check EMAIL_PASS (App Password)." 
            : "Failed to send visitor info (Connection or internal error).";
            
        res.status(500).json({ success: false, error: errorMessage });
    }
});

// ===============================================
// 💡 Improvement: Catch-all Route for 404
// ===============================================
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});


app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
