import { Link } from 'react-router-dom'
const actions = [
  ['pages', '✦ Edit website pages', 'Update homepage, About, Services, Plans and Policies content stored in MongoDB.', '/admin/pages'],
  ['catalog', '✦ Manage services & pricing', 'Add, edit, activate/deactivate and remove services or plans.', '/admin/catalog'],
  ['payments', '✦ Paid customers & abandoned checkouts', "See who paid and who reached checkout but didn't complete, with full contact details.", '/admin/payments'],
  ['users', '✦ Manage user accounts', 'View registered customers and administrators.', '/admin/users'],
  ['books', '✦ Upload GeM guide', 'Upload, publish, read, download or remove the PDF shown on the Services hero.', '/admin/books'],
]
export default function DashboardQuickActions(){return <div className="grid md:grid-cols-2 gap-5 mt-8">{actions.map(([id,title,body,to])=><Link to={to} key={id} className="card hover:-translate-y-0.5 transition"><b>{title}</b><p className="text-sm text-ink/60 mt-2">{body}</p></Link>)}</div>}
