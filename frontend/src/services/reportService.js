import api from './api';

const reportService = {
  getSummary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  },

  // 👇 TAMBAHKAN FUNGSI INI UNTUK DRILL-DOWN CHART 👇
  getCategoryDetail: async (category) => {
    // encodeURIComponent penting supaya kategori yang ada spasinya tidak error
    const response = await api.get(`/reports/category-detail/${encodeURIComponent(category)}`);
    return response.data;
  },

  getStockMovement: async (startDate, endDate) => {
    const response = await api.get('/reports/stock-movement', { params: { startDate, endDate } });
    return response.data;
  },

  downloadPDF: async () => {
    const response = await api.get('/export/products/pdf', { 
      responseType: 'blob' 
    });
    return response.data;
  },

  downloadExcel: async () => {
    const response = await api.get('/export/products/excel', { 
        responseType: 'blob' 
      });
      return response.data;
  }
};

export default reportService;