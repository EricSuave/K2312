import {HttpError} from './http';
export function prepStorageError(error:{code?:string;message?:string}){
 if(['42P01','42883','PGRST205','PGRST202'].includes(error.code??''))return new HttpError(503,'Admin member entry needs the 004_admin_member_prep.sql database update. Ask the site owner to run it in Supabase, then refresh.');
 return error;
}
