import {AppError} from '../utils/AppError.js'
export const validate=(schema,source='body')=>(req,res,next)=>{const result=schema.safeParse(req[source]);if(!result.success)return next(new AppError(result.error.issues.map(i=>i.message).join(', '),400,'VALIDATION_ERROR'));req[source]=result.data;next()}
