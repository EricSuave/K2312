import type {Metadata} from 'next';
export function pageMetadata(title:string,description:string):Metadata{return {title,description,openGraph:{title:`${title} | Kingdom 2312`,description},twitter:{title:`${title} | Kingdom 2312`,description}}}
