const cron = require('node-cron');
const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');
const Setting = require('../models/Setting');

const startCronJobs = () => {
  // Jadwal: Menit 0, Jam 16, Hari Apa Saja, Bulan Apa Saja
  // Menjalankan pengecekan setiap hari pukul 16:00 WIB (Setelah BI merilis kurs final harian)
  cron.schedule('0 16 * * *', async () => {
    
    // 👇 LOGIKA DETEKSI AKHIR BULAN 👇
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Jika besok BUKAN tanggal 1, berarti hari ini BUKAN akhir bulan.
    // Hentikan eksekusi di sini, jangan tarik data API BI.
    if (tomorrow.getDate() !== 1) {
      // Buka komentar (uncomment) baris di bawah jika ingin melihat log setiap hari di terminal
      // console.log("⏳ [CRON] Hari ini bukan akhir bulan. Sinkronisasi kurs di-skip.");
      return; 
    }

    console.log("⏰ [CRON] Hari ini adalah AKHIR BULAN! Menjalankan update Kurs BI Otomatis...");
    
    try {
      // Mendapatkan format YYYY-MM-DD
      const endDateStr = today.toISOString().split('T')[0];

      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 7);
      const startDateStr = pastDate.toISOString().split('T')[0];

      const url = `https://www.bi.go.id/biwebservice/wskursbi.asmx/getSubKursLokal3?mts=USD&startdate=${startDateStr}&enddate=${endDateStr}`;

      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

      const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
      const result = await parser.parseStringPromise(response.data);

      let tableData = result?.DataSet?.['diffgr:diffgram']?.NewDataSet?.Table;
      if (!Array.isArray(tableData)) tableData = [tableData];

      // Mengambil baris data terakhir (terbaru)
      const latestData = tableData[tableData.length - 1];
      const kursTengah = (parseFloat(latestData.beli_subkurslokal) + parseFloat(latestData.jual_subkurslokal)) / 2;

      // Simpan ke MongoDB
      await Setting.findOneAndUpdate(
        { settingId: 'GLOBAL_CONFIG' },
        { usdRate: kursTengah, lastSyncDate: new Date() },
        { new: true, upsert: true }
      );
      console.log(`✅ [CRON] Sukses update kurs tutup buku bulan ini: Rp ${kursTengah}`);
      
    } catch (error) {
      console.error("❌ [CRON] Gagal update kurs BI:", error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Sangat krusial agar 16:00 mengacu pada Waktu Jakarta
  });
};

module.exports = startCronJobs;