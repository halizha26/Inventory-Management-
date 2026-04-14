const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

   // --- MANTRA PENERJEMAH ERROR 11000 (DUPLIKAT MONGODB) ---
   if (err.code === 11000) {
    statusCode = 400; // Ubah status jadi 400 (Bad Request)
    // Ambil nama kolom yang kembar (misal: 'sku' atau 'name')
    const field = Object.keys(err.keyValue)[0]; 
    
    // Versi Bahasa Inggris:
    message = `Failed! The ${field.toUpperCase()} '${err.keyValue[field]}' is already in use by another product.`;
}
// ---------------------------------------------------------
    // Mongoose validation error (misal ada kolom wajib yg kosong)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }

    res.status(statusCode).json({
        message: message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

module.exports = errorHandler;