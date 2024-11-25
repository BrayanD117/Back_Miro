const { uploadFileToGoogleDrive } = require("../config/googleDrive");
const Period = require("../models/periods");
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
      const report = await ProducerReport.findById(id)
      .populate('dimensions')
      .populate('producers');
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

    const fileData = await uploadFileToGoogleDrive(file, 'Formatos/Informes/Productores', fileName);

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

  static async updateReport(id, name, description, file, file_name, dimensions, producers, requires_attachment, session) {
    let fileInfo = null;
    const pubReportsToUpdate = [];
    
    if (file) {
        const fileData = await uploadFileToGoogleDrive(file, 'Formatos/Informes/Productores', file_name);
        if (!fileData) {
            throw new Error('Error uploading file');
        }

        fileInfo = {
            id: fileData.id,
            name: fileData.name,
            view_link: fileData.webViewLink,
            download_link: fileData.webContentLink,
            folder_id: fileData.parents[0],
        };
    }

    const periods = await Period.find({
      responsible_start_date: { $lte: nowDate },
      responsible_end_date: { $gte: nowDate }
    }).session(session);

    if (periods.length > 0) {
      const publishedReportsRelated = await ProducerReport.find({
        'report._id': new ObjectId(id),
        period: { $in: periods.map(period => period._id) }
      }).session(session);

      for (const pubReport of publishedReportsRelated) {
        if (pubReport.filled_reports.length > 0) {
          const error = new Error('Cannot update this report because it is already filled in a published report');
          error.status = 401;
          throw error;
        }
        pubReportsToUpdate.push(pubReport)
      }
    }

    const updateData = {
        name,
        description,
        requires_attachment,
        dimensions,
        producers,
        file_name
    };

    if (fileInfo) {
        updateData.report_example = fileInfo;
    }

    await ProducerReport.findByIdAndUpdate(id, updateData, { session });
    for (const pubReport of pubReportsToUpdate) {
      pubReport.report = report;
      await pubReport.save({ session });
    }
  }
}


module.exports = ProducerReportsService;