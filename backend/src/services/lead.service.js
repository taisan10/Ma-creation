import Lead from '../models/Lead.js'

export class LeadService {
  /**
   * Create a new lead in database
   */
  static async createLead(data) {
    return await Lead.create(data)
  }

  /**
   * Fetch leads list with sorting and limit
   */
  static async getLeadsList(limit = 500) {
    return await Lead.find().sort({ createdAt: -1 }).limit(limit)
  }
}
