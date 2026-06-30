const cron = require('node-cron');
const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');
const Setting = require('../models/Setting');

const startCronJobs = () => {
  // Jadwal: Menit 1, Jam 0, Tanggal 1, Bulan Apa Saja, Hari Apa Saja
  // Berjalan otomatis setiap tanggal 1 jam 00:01 pagi
  cron.schedule('1 0 1 * *', async () => {
    console.log("⏰ [CRON] Menjalankan update Kurs BI Otomatis Bulanan...");
    try {
      const today = new Date();
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

      const latestData = tableData[tableData.length - 1];
      const kursTengah = (parseFloat(latestData.beli_subkurslokal) + parseFloat(latestData.jual_subkurslokal)) / 2;

      await Setting.findOneAndUpdate(
        { settingId: 'GLOBAL_CONFIG' },
        { usdRate: kursTengah, lastSyncDate: new Date() },
        { new: true, upsert: true }
      );
      console.log(`✅ [CRON] Sukses update kurs bulan ini: Rp ${kursTengah}`);
    } catch (error) {
      console.error("❌ [CRON] Gagal update kurs BI:", error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Wajib diset Waktu Jakarta!
  });
};

module.exports = startCronJobs;