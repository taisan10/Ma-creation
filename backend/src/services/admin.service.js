import User from '../models/AUTH/User.js'
import Lead from '../models/CMS/Lead.js'
import Payment from '../models/LMS/Payment.js'
import Service from '../models/CMS/Service.js'
import Plan from '../models/CMS/Plan.js'
import Page from '../models/CMS/Page.js'
import FAQ from '../models/CMS/FAQ.js'
import Partner from '../models/CMS/Partner.js'
import SiteSettings from '../models/CMS/SiteSettings.js'
import Book from '../models/LMS/Book.js'
import SecurityIncident from '../models/AUTH/SecurityIncident.js'
import { AppError } from '../utils/AppError.js'
import { broadcastCmsUpdate } from '../services/realtime.js'

const models = {
  services: Service,
  plans: Plan,
  pages: Page,
  faqs: FAQ,
  partners: Partner,
}

const publicResources = new Set(['services', 'plans', 'pages', 'faqs', 'partners'])

function publish(resource, action, key = null) {
  if (publicResources.has(resource) || resource === 'settings' || resource === 'brand' || resource === 'theme') {
    broadcastCmsUpdate({ resource, action, key })
  }
}

export class AdminService {
  /**
   * Aggregate total counts for admin dashboard
   */
  static async getDashboardStats() {
    const [users, leads, payments, services, plans, pages, faqs, partners, books, revenueTrend, userGrowth] = await Promise.all([
      User.countDocuments(),
      Lead.countDocuments(),
      Payment.countDocuments(),
      Service.countDocuments(),
      Plan.countDocuments(),
      Page.countDocuments(),
      FAQ.countDocuments(),
      Partner.countDocuments(),
      Book.countDocuments(),

      Payment.aggregate([
        {$match: { status: "paid" }},
        { $group: { _id: {$dateToString: {format: '%b', date: '$createdAt' }}, revenue: { $sum: '$amount' } }},
        { $project: { _id: 0, month: '$_id', revenue: 1 } },

      ]),

      User.aggregate([
        { $group: { _id: {$dateToString: {format: '%b', date: '$createdAt' }}, newUsers: { $sum: 1 }}},
        { $project: { _id: 0, month: '$_id', newUsers: 1 }}
      ])
    ])
    return { users, leads, payments, services, plans, pages, faqs, partners, books, revenueTrend, userGrowth }
  }

  // Users Management
  static async listUsers(limit = 500) {
    return await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(limit)
  }




  // Leads Management
  static async listLeads(limit = 500) {
    return await Lead.find().sort({ createdAt: -1 }).limit(limit)
  }

  static async updateLead(leadId, data) {
    const lead = await Lead.findByIdAndUpdate(leadId, { $set: data }, { new: true, runValidators: true })
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND')
    return lead
  }

  static async deleteLead(leadId) {
    const lead = await Lead.findByIdAndDelete(leadId)
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND')
  }

  // Payments Management
  static async listPayments(limit = 500) {
    return await Payment.find()
      .populate('user', 'name email phone company')
      .populate('plan', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit)
  }

  // Generic Resource CMS Management
  static getModel(resource) {
    const Model = models[resource]
    if (!Model) throw new AppError('Unknown resource', 404, 'NOT_FOUND')
    return Model
  }

  static async listResource(resource, limit = 500) {
    const Model = this.getModel(resource)
    return await Model.find().sort({ order: 1, createdAt: -1 }).limit(limit)
  }

  static async createResource(resource, data) {
    const Model = this.getModel(resource)
    const item = await Model.create(data)
    publish(resource, 'created', String(item._id))
    return item
  }

  static async updateResource(resource, id, data) {
    const Model = this.getModel(resource)
    const item = await Model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true, strict: true })
    if (!item) throw new AppError('Resource not found', 404, 'NOT_FOUND')
    publish(resource, 'updated', String(item._id))
    return item
  }

  static async deleteResource(resource, id) {
    const Model = this.getModel(resource)
    const item = await Model.findByIdAndDelete(id)
    if (!item) throw new AppError('Resource not found', 404, 'NOT_FOUND')
    publish(resource, 'deleted', String(item._id))
  }

  // Settings Management
  static async getSetting(key) {
    const item = await SiteSettings.findOne({ key })
    return item || { key, value: {} }
  }

  static async upsertSetting(key, value) {
    const allowedKeys = new Set(['brand', 'theme'])
    if (!allowedKeys.has(key)) throw new AppError('Unknown setting key', 400, 'INVALID_KEY')
    const item = await SiteSettings.findOneAndUpdate(
      { key },
      { key, value },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    publish('settings', 'updated', key)
    return item
  }

  // Security Incident Management & Unlock Control
  static async listSecurityIncidents(status) {
    const filter = status ? { status } : {}
    return await SecurityIncident.find(filter)
      .populate('user', 'name email phone company role recordingStrikes playbackLocked')
      .populate('video', 'title durationSeconds')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(200)
  }

  static async approveIncidentAndUnlockPlayback(adminId, incidentId, adminNotes) {
    const incident = await SecurityIncident.findById(incidentId)
    if (!incident) throw new AppError('Incident not found', 404, 'NOT_FOUND')

    incident.status = 'approved_unlocked'
    incident.resolvedAt = new Date()
    incident.resolvedBy = adminId
    if (adminNotes) incident.adminNotes = adminNotes
    await incident.save()

    // Unlock the user's playback so they can resume
    await User.findByIdAndUpdate(incident.user, {
      $set: { playbackLocked: false, playbackLockedAt: null },
    })

    return incident
  }

  static async revokePlanFromIncident() {
    throw new AppError('Revoke plan feature is disabled', 400, 'FEATURE_DISABLED')
  }

  static async banUserFromIncident(adminId, incidentId, adminNotes) {
    const incident = await SecurityIncident.findById(incidentId)
    if (!incident) throw new AppError('Incident not found', 404, 'NOT_FOUND')

    incident.status = 'user_banned'
    incident.resolvedAt = new Date()
    incident.resolvedBy = adminId
    if (adminNotes) incident.adminNotes = adminNotes
    await incident.save()

    // Deactivate user permanently
    await User.findByIdAndUpdate(incident.user, {
      $set: { isActive: false, playbackLocked: true },
    })

    return incident
  }
}
