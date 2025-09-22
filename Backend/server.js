import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "https://html-port-folio.vercel.app", // allow only your portfolio site
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());
app.use(express.static("public")); // Serve HTML/JS from public folder

// ✅ POST route to send contact form email
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.RECEIVER_EMAIL,
      subject: `Portfolio Contact Form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending contact form email:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// ✅ POST route for About visitor popup
app.post("/about-visitor", async (req, res) => {
  const { name, company } = req.body;

  if (!name || !company) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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
    res.status(500).json({ success: false, error: "Failed to send visitor info" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
