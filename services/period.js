class PeriodService {
  static async validatePeriodResponsible(publishedReport, nowDate) {
    const startDate = new Date(publishedReport.period.responsible_start_date);
    const endDate = new Date(publishedReport.period.responsible_end_date);
    if (nowDate < startDate || nowDate > endDate) {
      throw new Error("Period is closed for reports uploading");
    }
  }

  static async validatePeriodProducer(publishedReport, nowDate) {
    const startDate = new Date(publishedReport.period.producer_start_date);
    const endDate = new Date(publishedReport.period.producer_end_date);
    if (nowDate < startDate || nowDate > endDate) {
      throw new Error("Period is closed for reports uploading");
    }
  }
}