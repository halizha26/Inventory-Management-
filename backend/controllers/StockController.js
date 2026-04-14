const asyncHandler = require("../utils/AsyncHandler");
const Product = require("../models/ProductModel");
const StockHistory = require("../models/StockHistoryModel");
const nodemailer = require("nodemailer"); 

// --- KONFIGURASI EMAIL (NODEMAILER) DIPERKUAT ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Gunakan SSL agar diizinkan Google
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

// Fungsi pembantu untuk mengirim email
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
// ---------------------------------------

// @desc    Stock In - Staff input (status: pending)
const stockIn = asyncHandler(async (req, res) => {
    // TAMBAHAN: Tangkap unitPrice dari frontend
    const { productId, quantity, reason, inputBy, unitPrice } = req.body;

    if (!quantity || quantity <= 0) {
        res.status(400);
        throw new Error("Invalid quantity");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // --- LOGIKA PERHITUNGAN HARGA ---
    const uPrice = Number(unitPrice) || 0;
    const tPrice = uPrice * Number(quantity);
    // --------------------------------

    const history = await StockHistory.create({
        user: req.user.id,
        productId,
        type: "IN",
        quantity,
        unitPrice: uPrice,   // Simpan ke database
        totalPrice: tPrice,  // Simpan ke database
        reason,
        status: "pending",
        inputBy: inputBy || req.user.id,
    });

    // --- KIRIM EMAIL KE FINANCE (Dengan info harga) ---
    const subject = "Action Required: Pending Approval for Stock In Request";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #10b981; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0;">Stock In Approval Required</h2>
            </div>
            <div style="padding: 20px;">
                <p><b>Hello Finance Team,</b></p>
                <p>A new <b>Stock In</b> request has been submitted and is currently waiting for your review and approval.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Product:</b> ${product.name}</p>
                    <p style="margin: 5px 0;"><b>Quantity:</b> ${quantity} unit(s)</p>
                    <p style="margin: 5px 0;"><b>Unit Price:</b> Rp ${uPrice.toLocaleString('id-ID')}</p>
                    <p style="margin: 5px 0;"><b>Total Price:</b> Rp ${tPrice.toLocaleString('id-ID')}</p>
                    <p style="margin: 5px 0;"><b>Reason:</b> ${reason}</p>
                </div>
                <p>Please review the request carefully before taking action.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/stock-in" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Review Request Now</a>
                </div>
                <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    This is an automated message from the Inventory Management System.<br>Please do not reply to this email.
                </p>
            </div>
        </div>
    `;
    
    sendNotificationEmail(process.env.FINANCE_EMAIL, subject, htmlContent);

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

    // --- KIRIM EMAIL KE MANAGEMENT ---
    const subject = "Action Required: Pending Approval for Stock Out Request";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0;">Stock Out Approval Required</h2>
            </div>
            <div style="padding: 20px;">
                <p><b>Hello Management Team,</b></p>
                <p>A new <b>Stock Out</b> request has been submitted and is currently waiting for your review and approval.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Product:</b> ${product.name}</p>
                    <p style="margin: 5px 0;"><b>Quantity:</b> ${quantity} unit(s)</p>
                    <p style="margin: 5px 0;"><b>Reason:</b> ${reason}</p>
                    ${salesOrderNumber ? `<p style="margin: 5px 0;"><b>Sales Order No:</b> ${salesOrderNumber}</p>` : ''}
                </div>
                <p>Please ensure this deduction aligns with our current operational needs.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/stock-out" style="background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Review Request Now</a>
                </div>
                <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    This is an automated message from the Inventory Management System.<br>Please do not reply to this email.
                </p>
            </div>
        </div>
    `;
    
    sendNotificationEmail(process.env.MANAGEMENT_EMAIL, subject, htmlContent);

    res.status(201).json({ message: "Stock Out request submitted", history });
});

// @desc    Approve Stock In - Finance (MENGUBAH STATUS PRODUK OTOMATIS)
const approveStockIn = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);

    if (!history) {
        res.status(404);
        throw new Error("Stock record not found");
    }
    if (history.type !== "IN") {
        res.status(400);
        throw new Error("Only for Stock In");
    }
    if (history.status !== "pending") {
        res.status(400);
        throw new Error(`Current status: ${history.status}`);
    }

    const product = await Product.findById(history.productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    product.status = "approved"; 
    product.quantity += Number(history.quantity);
    await product.save();

    history.status = "approved";
    history.approvedBy = req.user.id;
    await history.save();

    res.status(200).json({ message: "Stock In approved and Product status updated", history });
});

// @desc    Acknowledge Stock In - Management
const acknowledgeStockIn = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);
    if (!history) { res.status(404); throw new Error("Not found"); }
    history.status = "acknowledged";
    history.validatedBy = req.user.id;
    await history.save();
    res.status(200).json({ message: "Stock In acknowledged", history });
});

// @desc    Approve Stock Out - Management
const approveStockOut = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);
    if (!history || history.type !== "OUT") { res.status(404); throw new Error("Invalid record"); }
    
    const product = await Product.findById(history.productId);
    if (product.quantity < history.quantity) { res.status(400); throw new Error("Insufficient stock"); }
    
    product.quantity -= Number(history.quantity);
    await product.save();

    history.status = "approved";
    history.approvedBy = req.user.id;
    await history.save();
    res.status(200).json({ message: "Stock Out approved", history });
});

// @desc    Acknowledge Stock Out - Finance
const acknowledgeStockOut = asyncHandler(async (req, res) => {
    const history = await StockHistory.findById(req.params.id);
    history.status = "acknowledged";
    history.validatedBy = req.user.id;
    await history.save();
    res.status(200).json({ message: "Stock Out acknowledged", history });
});

// @desc    Reject a stock request
const rejectStock = asyncHandler(async (req, res) => {
    const { rejectNote } = req.body;
    const history = await StockHistory.findById(req.params.id);
    if (history.status !== "pending") { res.status(400); throw new Error("Cannot reject"); }

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