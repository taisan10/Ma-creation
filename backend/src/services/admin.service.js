import User from '../models/User.js'
import Lead from '../models/Lead.js'
import Payment from '../models/Payment.js'
import Service from '../models/Service.js'
import Plan from '../models/Plan.js'
import Page from '../models/Page.js'
import FAQ from '../models/FAQ.js'
import Partner from '../models/Partner.js'
import SiteSettings from '../models/SiteSettings.js'
import Book from '../models/Book.js'
import SecurityIncident from '../models/SecurityIncident.js'
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
    const [users, leads, payments, services, plans, pages, faqs, partners, books] = await Promise.all([
      User.countDocuments(),
      Lead.countDocuments(),
      Payment.countDocuments(),
      Service.countDocuments(),
      Plan.countDocuments(),
      Page.countDocuments(),
      FAQ.countDocuments(),
      Partner.countDocuments(),
      Book.countDocuments(),
    ])
    return { users, leads, payments, services, plans, pages, faqs, partners, books }
  }

  // Users Management
  static async listUsers(limit = 500) {
    return await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(limit)
  }

  static async updateUser(callerAdminId, targetUserId, data) {
    if (String(callerAdminId) === String(targetUserId) && data.role === 'customer') {
      throw new AppError('You cannot remove your own admin access', 400, 'SELF_ROLE_CHANGE')
    }
    if (data.role === 'customer') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) throw new AppError('Cannot demote the last admin', 400, 'LAST_ADMIN')
    }
    const { name, email, phone, company, role, interest } = data
    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { name, email, phone, company, role, interest } },
      { new: true, runValidators: true }
    ).select('-passwordHash')
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    return user
  }
  static async deleteUser(callerAdminId, targetUserId) {
    if (String(callerAdminId) === String(targetUserId)) {
      throw new AppError('You cannot delete your own account', 400, 'SELF_DELETE')
    }

    // 1. Target user ko fetch karein
    const targetUser = await User.findById(targetUserId)
    if (!targetUser) throw new AppError('User not found', 404, 'NOT_FOUND')

    // 2. Agar target user admin hai, toh ensure karein ki database mein aur bhi admins hain
    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        throw new AppError('Cannot delete the last admin', 400, 'LAST_ADMIN')
      }
    }

    // 3. Safe deletion
    await User.findByIdAndDelete(targetUserId)
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
