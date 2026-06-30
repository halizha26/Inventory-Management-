const Setting = require('../models/Setting');
const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https'); // 1. Tambahkan modul bawaan https untuk menangani SSL

exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ settingId: 'GLOBAL_CONFIG' });
    if (!setting) {
      setting = await Setting.create({ settingId: 'GLOBAL_CONFIG', usdRate: 15000 });
    }
    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pengaturan', error: error.message });
  }
};

exports.syncBiRate = async (req, res) => {
  try {
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 7);
    const startDateStr = pastDate.toISOString().split('T')[0];

    const url = `https://www.bi.go.id/biwebservice/wskursbi.asmx/getSubKursLokal3?mts=USD&startdate=${startDateStr}&enddate=${endDateStr}`;

    // 2. Tembak API BI dengan konfigurasi keamanan tambahan (User-Agent & Bypass SSL)
    const response = await axios.get(url, {
      headers: {
        // Berpura-pura menjadi browser Chrome asli agar tidak diblokir firewall BI
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      // Mengabaikan error "unable to verify the first certificate" yang sering terjadi di Node.js saat hit web pemerintah
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    let tableData = result?.DataSet?.['diffgr:diffgram']?.NewDataSet?.Table;
    
    if (!tableData) {
      return res.status(404).json({ message: "Data kurs tidak ditemukan dari server BI untuk rentang tanggal ini." });
    }

    if (!Array.isArray(tableData)) {
      tableData = [tableData];
    }

    const latestData = tableData[tableData.length - 1];
    
    const kursBeli = parseFloat(latestData.beli_subkurslokal);
    const kursJual = parseFloat(latestData.jual_subkurslokal);
    const tanggalUpdate = latestData.tgl_subkurslokal;

    const kursTengah = (kursBeli + kursJual) / 2;

    await Setting.findOneAndUpdate(
      { settingId: 'GLOBAL_CONFIG' },
      { 
        usdRate: kursTengah,
        lastSyncDate: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ 
      message: 'Berhasil sinkronisasi dengan Bank Indonesia!', 
      data: {
        tanggal_resmi_bi: tanggalUpdate,
        kurs_beli: kursBeli,
        kurs_jual: kursJual,
        kurs_tengah_disimpan: kursTengah
      }
    });

  } catch (error) {
    console.error("Error Sync BI:", error);
    res.status(500).json({ 
      message: 'Gagal menghubungi server Bank Indonesia.', 
      error: error.message 
    });
  }
};