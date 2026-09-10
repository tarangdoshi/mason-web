import RiskQuiz from "../app/components/risk-quiz";
import { getHomepageContentData } from "../lib/site-content";
export default async function PackageAdvisor() {
 const content = await getHomepageContentData();
 return <div className="mason-assessment rounded-3xl bg-sand-50 p-6 sm:p-8"><RiskQuiz section={content.riskQuizSection} fallbackPlan="Standard" /></div>;
}
