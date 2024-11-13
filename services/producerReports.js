const { uploadFileToGoogleDrive } = require("../config/googleDrive");
const ProducerReport = require("../models/producerReports");

class ProducerReportsService {
  static async getReports() {
    try {
      const reports = await ProducerReport.find();
      return reports;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Internal Server Error');
    }
  }

  static async getReportsPagination (page, limit, filter) {
    const skip = (page - 1) * limit;
    try {
      const query = filter
        ? {
          $or: [
            { name: { $regex: filter, $options: 'i' } },
            { description: { $regex: filter, $options: 'i' } },
          ]
        }
        : {};
      const reports = await ProducerReport
        .find(query)
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

  static async createReport(user, name, description, file, fileName, dimensions, producers, requiresAttachment, session) {
    if (!file) {
      throw new Error('File is required');
    }
    
    const report = new ProducerReport({
      name,
      description,
      created_by: user,
      requires_attachment: requiresAttachment,
      dimensions,
      producers
    })

    await report.save({ session });

    const fileData = await uploadFileToGoogleDrive(file, 'Reportes/Productores/Formatos', fileName);

    if(!fileData) {
      throw new Error('Error uploading file');
    }

    const fileInfo = {
      id: fileData.id,
      name: fileData.name,
      view_link: fileData.webViewLink,
      download_link: fileData.webContentLink,
      folder_id: fileData.parents[0]
    };

    report.report_example = fileInfo;

    await report.save({ session });
  }
}

module.exports = ProducerReportsService;