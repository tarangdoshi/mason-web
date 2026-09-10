import { ASSESSMENT_AVAILABILITY_COPY } from "../lib/serviceability";
export const CITIES = "Goa and Bangalore";
export default function ServiceArea({className=""}: {className?:string}) {return <p className={`text-xs leading-relaxed text-sand-600 ${className}`}>{ASSESSMENT_AVAILABILITY_COPY}</p>;}
