const ProducerReport = require("../models/producerReports");

class ProducerReports {
  static async getReportsPagination (page, limit, filter) {
    const skip = (page - 1) * limit;
    try {
      const query = filter
        ? {
          $or: [
            { name: { $regex: filter, $options: 'i' } },
            { description: { $regex: filter, $options: 'i' } },
            { period: { $regex: filter, $options: 'i' } }
          ]
        }
        : {};
      const reports = await ProducerReport
        .find(query)
        .populate('period')
        .skip(skip)
        .limit(limit);
      const total = await ProducerReport.countDocuments(query);

      return {
        reports,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Internal Server Error');
    }
  }

  static async getReport(id) {
    try {
      const report = await ProducerReport.findById(id);
      return report;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw new Error('Internal Server Error');
    }
  }
}

module.exports = ProducerReports;