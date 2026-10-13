import Service from '../models/Service.js'
import Plan from '../models/Plan.js'

export class CatalogService {
  /**
   * Fetch all active services sorted by category and price
   */
  static async getActiveServices() {
    return await Service.find({ active: true }).sort({ category: 1, price: 1 })
  }

  /**
   * Fetch all active plans sorted by category and price
   */
  static async getActivePlans() {
    return await Plan.find({ active: true }).sort({ category: 1, price: 1 })
  }
}
