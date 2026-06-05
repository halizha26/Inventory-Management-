const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel");
// 👇 TAMBAHAN: Import Model Notifikasi yang baru kita buat
const Notification = require("../models/NotificationModel"); 
const nodemailer = require("nodemailer"); 

// --- KONFIGURASI EMAIL (NODEMAILER) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

const sendNotificationEmail = async (toEmail, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Inventory System" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email successfully sent to ${toEmail}`);
    } catch (error) {
        console.error("❌ Failed to send email:", error.message);
    }
};

// @desc    Stock In - Staff input (status: pending)
const stockIn = asyncHandler(async (req, res) => {
    // Menangkap currency dari Frontend
    const { productId, quantity, reason, inputBy, unitPrice, currency } = req.body;

    // CCTV 1: Cek apakah form berhasil mengirim Dollar
    console.log("👉 [CCTV 1] DATA DARI FORM:", { unitPrice, currency });

    if (!quantity || quantity <= 0) {
        res.status(400);
        throw new Error("Invalid quantity");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const uPrice = Number(unitPrice) || 0;
    const tPrice = uPrice * Number(quantity);

    const history = await StockHistory.create({
        user: req.user.id,
        productId,
        type: "IN",
        quantity,
        unitPrice: uPrice,
        totalPrice: tPrice,
        currency: currency || "IDR", // Simpan ke Database!
        reason,
        status: "pending",
        inputBy: inputBy || req.user.id,
    });

    // CCTV 2: Cek apakah sukses masuk database
    console.log("👉 [CCTV 2] DATA DI DATABASE:", history.currency);

    // 👇 TAMBAHAN: Trigger Notifikasi Database Otomatis
    try {
        await Notification.create({
            title: 'Menunggu Persetujuan Masuk',
            message: `Ada permintaan Stock In baru untuk ${quantity} unit ${product.name} yang menunggu konfirmasi.`,
            type: 'approval',
            color: 'emerald' // Sesuai warna tema Stock In
        });
    } catch (err) {
        console.error("Gagal membuat notifikasi:", err.message);
    }

    const subject = "Action Required: Pending Approval for Stock In Request";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #10b981; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0;">Stock In Approval Required</h2>
            </div>
            <div style="padding: 20px;">
                <p><b>Hello Team,</b></p>
                <p>A new <b>Stock In</b> request has been submitted and is currently waiting for your review.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Product:</b> ${product.name}</p>
                    <p style="margin: 5px 0;"><b>Quantity:</b> ${quantity} unit(s)</p>
                    <p style="margin: 5px 0;"><b>Unit Price:</b> ${currency === 'USD' ? '$' : 'Rp'} ${uPrice.toLocaleString('id-ID')}</p>
                    <p style="margin: 5px 0;"><b>Total Price:</b> ${currency === 'USD' ? '$' : 'Rp'} ${tPrice.toLocaleString('id-ID')}</p>
                    <p style="margin: 5px 0;"><b>Reason:</b> ${reason}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/stock-in" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Review Request Now</a>
                </div>
            </div>
        </div>
    `;
    
    const targetEmails = `${process.env.FINANCE_EMAIL}, ${process.env.TRAINING_EMAIL}`;
    sendNotificationEmail(targetEmails, subject, htmlContent);

    res.status(201).json({ message: "Stock In request submitted", history });
});

// @desc    Stock Out - Staff input (status: pending)
const stockOut = asyncHandler(async (req, res) => {
    const { productId, quantity, reason, salesOrderNumber, inputBy } = req.body;

    if (!quantity || quantity <= 0) {
        res.status(400);
        throw new Error("Invalid quantity");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    if (product.quantity < quantity) {
        res.status(400);
        throw new Error("Insufficient stock");
    }

    const history = await StockHistory.create({
        user: req.user.id,
        productId,
        type: "OUT",
        quantity,
        reason,
        salesOrderNumber,
        status: "pending",
        inputBy: inputBy || req.user.id,
    });

    // 👇 TAMBAHAN: Trigger Notifikasi Database Otomatis
    try {
        await Notification.create({
            title: 'Menunggu Persetujuan Keluar',
            message: `Ada permintaan Stock Out baru untuk ${quantity} unit ${product.name} yang menunggu konfirmasi.`,
            type: 'approval',
            color: 'amber' // Menggunakan warna peringatan (kuning/merah) untuk stok keluar
        });
    } catch (err) {
        console.error("Gagal membuat notifikasi:", err.message);
    }

    const subject = "Action Required: Pending Approval for Stock Out Request";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0;">Stock Out Approval Required</h2>
            </div>
            <div style="padding: 20px;">
                <p><b>Hello Team,</b></p>
                <p>A new <b>Stock Out</b> request has been submitted and is currently waiting for your review.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Product:</b> ${product.name}</p>
                    <p style="margin: 5px 0;"><b>Quantity:</b> ${quantity} unit(s)</p>
                    <p style="margin: 5px 0;"><b>Reason:</b> ${reason}</p>
                    ${salesOrderNumber ? `<p style="margin: 5px 0;"><b>Sales Order No:</b> ${salesOrderNumber}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/stock-out" style="background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Review Request Now</a>
                </div>
            </div>
        </div>
    `;
    
    const targetEmails = `${process.env.MANAGEMENT_EMAIL}, ${process.env.TRAINING_EMAIL}`;
    sendNotificationEmail(targetEmails, subject, htmlContent);

    res.status(201).json({ message: "Stock Out request submitted", history });
});

// @desc    Approve Stock In
const approveStockIn = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);

    if (!history || history.type !== "IN") {
        res.status(404);
        throw new Error("Stock record not found or invalid type");
    }
    if (history.status !== "pending") {
        res.status(400);
        throw new Error(`Data ini sudah diproses. Status saat ini: ${history.status}`);
    }

    const product = await Product.findById(history.productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    product.quantity += Number(history.quantity);
    await product.save();

    history.status = "approved";
    history.approvedBy = req.user.id;
    await history.save();

    res.status(200).json({ message: "Stock In approved and Product quantity increased", history });
});

// @desc    Acknowledge Stock In
const acknowledgeStockIn = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);
    if (!history) { res.status(404); throw new Error("Not found"); }
    
    history.status = "acknowledged";
    history.validatedBy = req.user.id;
    await history.save();
    
    res.status(200).json({ message: "Stock In acknowledged", history });
});

// @desc    Approve Stock Out
const approveStockOut = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);
    
    if (!history || history.type !== "OUT") { 
        res.status(404); 
        throw new Error("Invalid record"); 
    }
    if (history.status !== "pending") {
        res.status(400);
        throw new Error(`Data ini sudah diproses. Status saat ini: ${history.status}`);
    }
    
    const product = await Product.findById(history.productId);
    if (product.quantity < history.quantity) { 
        res.status(400); 
        throw new Error("Insufficient stock"); 
    }
    
    product.quantity -= Number(history.quantity);
    await product.save();

    history.status = "approved";
    history.approvedBy = req.user.id;
    await history.save();
    
    res.status(200).json({ message: "Stock Out approved and Product quantity decreased", history });
});

// @desc    Acknowledge Stock Out
const acknowledgeStockOut = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);
    if (!history) { res.status(404); throw new Error("Not found"); }

    history.status = "acknowledged";
    history.validatedBy = req.user.id;
    await history.save();

    res.status(200).json({ message: "Stock Out acknowledged", history });
});

// @desc    Reject a stock request
const rejectStock = asyncHandler(async (req, res) => {
    const { rejectNote } = req.body;
    const history = await StockHistory.findById(req.params.id);
    if (history.status !== "pending") { 
        res.status(400); 
        throw new Error("Hanya data pending yang dapat ditolak"); 
    }

    history.status = "rejected";
    history.rejectedBy = req.user.id;
    history.rejectNote = rejectNote || "No reason provided";
    await history.save();
    
    res.status(200).json({ message: "Stock request rejected", history });
});

// @desc    Get Stock History
const getStockHistory = asyncHandler(async (req, res) => {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const history = await StockHistory.find(filter)
        .populate("productId", "name category")
        .populate("user", "name role")
        .populate("inputBy", "name role")
        .populate("approvedBy", "name role")
        .populate("validatedBy", "name role")
        .populate("rejectedBy", "name role")
        .sort("-createdAt");

    const result = history.map(item => ({
        ...item.toObject(),
        product: item.productId,
    }));

    res.status(200).json(result);
});

module.exports = {
    stockIn,
    stockOut,
    approveStockIn,
    acknowledgeStockIn,
    approveStockOut,
    acknowledgeStockOut,
    rejectStock,
    getStockHistory,
};