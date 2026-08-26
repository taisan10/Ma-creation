import { showValue, parseValue } from './cmsFields'
export default function CmsFieldEditor({ fields, content, onChange, onError }) {
  return <div className="grid md:grid-cols-2 gap-4 mt-6">
    {fields.map(([key,label,type]) => <div key={key} className={type==='json'||type==='array'||type==='long'?'md:col-span-2':''}>
      <label className="field-label">{label}</label>
      {type==='json'||type==='array'||type==='long'
        ? <textarea className="field-input min-h-[110px] font-mono text-xs" value={showValue(content[key],type)} onChange={e=>{try{onChange(key,parseValue(e.target.value,type));onError?.('')}catch{onError?.(`${key} must contain valid JSON.`)}}} placeholder={type==='array'?'One item per line':type==='json'?'Valid JSON array':'Text'}/>
        : <input className="field-input" value={showValue(content[key],type)} onChange={e=>onChange(key,e.target.value)}/>}
    </div>)}
  </div>
}
