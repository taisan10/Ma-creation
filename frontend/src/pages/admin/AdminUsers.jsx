import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const r = await api('/admin/users')
      setUsers(Array.isArray(r.users) ? r.users : [])
    } catch (e) {
      setError(e.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function role(u) {
    const newRole = u.role === 'admin' ? 'customer' : 'admin'
    try {
      await api(`/admin/users/${u._id}`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) })
      load()
    } catch (e) { setError(e.message) }
  }

  async function del(u) {
    if (!confirm(`Delete ${u.email}?`)) return
    try {
      await api(`/admin/users/${u._id}`, { method: 'DELETE' })
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <AdminShell>
      <h1 className="h2">Users</h1>
      <p className="mt-2 text-ink/60">Customer and administrator accounts.</p>
      {error && <p className="mt-4 text-rust text-sm">{error}</p>}
      {loading ? (
        <p className="mt-7 text-ink/50 text-sm">Loading…</p>
      ) : users.length === 0 ? (
        <p className="mt-7 text-ink/50 text-sm">No users yet.</p>
      ) : (
        <div className="table-wrap mt-7">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="th-cell">Name</th>
                <th className="th-cell">Email</th>
                <th className="th-cell">Phone</th>
                <th className="th-cell">Company</th>
                <th className="th-cell">Role</th>
                <th className="th-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td className="td-cell">{u.name || '—'}</td>
                  <td className="td-cell">{u.email || '—'}</td>
                  <td className="td-cell">{u.phone || '—'}</td>
                  <td className="td-cell">{u.company || '—'}</td>
                  <td className="td-cell"><span className="badge">{u.role}</span></td>
                  <td className="td-cell">
                    <div className="flex gap-2">
                      <button className="btn-outline btn-sm" onClick={() => role(u)}>
                        {u.role === 'admin' ? 'Make customer' : 'Make admin'}
                      </button>
                      <button className="btn-outline btn-sm text-rust" onClick={() => del(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  )
}
