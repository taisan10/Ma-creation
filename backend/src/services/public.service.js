import Page from '../models/Page.js'
import FAQ from '../models/FAQ.js'
import Partner from '../models/Partner.js'
import SiteSettings from '../models/SiteSettings.js'
import { AppError } from '../utils/AppError.js'

export class PublicService {
  /**
   * Get published page by slug
   */
  static async getPageBySlug(slug) {
    const page = await Page.findOne({ slug, published: true })
    if (!page) {
      throw new AppError('Page content not found', 404, 'NOT_FOUND')
    }
    return page
  }

  /**
   * Get active FAQs sorted by order and creation
   */
  static async getActiveFaqs() {
    return await FAQ.find({ active: true }).sort({ order: 1, createdAt: 1 })
  }

  /**
   * Get active partners sorted by order and creation
   */
  static async getActivePartners() {
    return await Partner.find({ active: true }).sort({ order: 1, createdAt: 1 })
  }

  /**
   * Get site setting for allowed keys (brand, theme)
   */
  static async getSiteSetting(key) {
    const allowedKeys = new Set(['brand', 'theme'])
    if (!allowedKeys.has(key)) {
      throw new AppError('Unknown setting key', 404, 'NOT_FOUND')
    }
    const setting = await SiteSettings.findOne({ key })
    return setting || { key, value: {} }
  }
}
