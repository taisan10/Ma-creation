import { RefundService } from '../services/refund.service.js'

export async function createTicket(req, res) {
  const ticket = await RefundService.createTicket({
    userId: req.user?.sub,
    paymentId: req.body.paymentId,
    reason: req.body.reason,
  })
  res.status(201).json({ success: true, ticket })
}

export async function listTickets(req, res) {
  const tickets = await RefundService.listTickets()
  res.json({ success: true, tickets })
}

export async function approveRefund(req, res) {
  const result = await RefundService.approveRefund({
    ticketId: req.params.id,
    adminNotes: req.body.adminNotes,
  })
  res.json({ success: true, ...result })
}

export async function rejectRefund(req, res) {
  const result = await RefundService.rejectRefund({
    ticketId: req.params.id,
    adminNotes: req.body.adminNotes,
  })
  res.json({ success: true, ...result })
}
