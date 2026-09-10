import test from "node:test";
import assert from "node:assert/strict";
import { getLeadAttributionContext, storeLeadCtaContext, storeQuizContext, getQuizContext } from "./lead-context";

test("landing campaign and quiz survive navigation and a later booking CTA", () => {
 const storage = new Map<string,string>();
 const browser = {location:{pathname:"/",search:"?utm_source=google&utm_medium=cpc&utm_campaign=preview&utm_term=safety&utm_content=hero&gclid=test-click&fbclid=test-social"},sessionStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)},crypto:{randomUUID:()=>"test-session"}};
 Object.defineProperty(globalThis,"window",{value:browser,configurable:true});
 Object.defineProperty(globalThis,"document",{value:{referrer:"https://example.com/"},configurable:true});
 try {
  storeLeadCtaContext({});
  browser.location={pathname:"/packages",search:""};
  storeLeadCtaContext({});
  storeLeadCtaContext({ctaId:"book-free-safety-assessment",pageSection:"packages"});
  storeQuizContext({quizScore:3,quizBandId:"medium",quizBandLabel:"Medium",recommendedPackageName:"Standard",quizAnswers:{a:"yes"}});
  const result=getLeadAttributionContext();
  assert.equal(result?.utmCampaign,"preview"); assert.equal(result?.utmSource,"google"); assert.equal(result?.utmMedium,"cpc");
  assert.equal(result?.utmTerm,"safety"); assert.equal(result?.utmContent,"hero"); assert.equal(result?.gclid,"test-click"); assert.equal(result?.fbclid,"test-social");
  assert.equal(result?.ctaId,"book-free-safety-assessment"); assert.equal(result?.pagePath,"/packages");
  assert.deepEqual(getQuizContext()?.quizAnswers,{a:"yes"});
 } finally {Reflect.deleteProperty(globalThis,"window");Reflect.deleteProperty(globalThis,"document");}
});

test("unavailable browser storage cannot prevent lead context capture", () => {
 Object.defineProperty(globalThis,"window",{value:{location:{pathname:"/",search:"?utm_campaign=direct"},get sessionStorage(){throw new Error("Blocked");}},configurable:true});
 Object.defineProperty(globalThis,"document",{value:{referrer:""},configurable:true});
 try {assert.doesNotThrow(()=>storeLeadCtaContext({}));assert.equal(getLeadAttributionContext()?.utmCampaign,"direct");}
 finally {Reflect.deleteProperty(globalThis,"window");Reflect.deleteProperty(globalThis,"document");}
});
