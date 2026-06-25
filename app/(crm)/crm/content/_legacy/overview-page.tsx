import { apiFetch } from "../../../../../lib/api";
import { getCrmSessionToken, requireAdminCrmUser } from "../../../../../lib/crm";
import CrmShell from "../../crm-shell";
import ContentOverviewView from "../content-overview-view";
import {
  contentModuleKeys,
  contentModuleMeta,
  getInitialContentItems,
  mergeHomepageSectionItems,
  getPublishedCount,
  type ContentItemMap
} from "../content-studio";

type ListResponse<T> = {
  data: T[];
};

export default async function CrmContentOverviewPage() {
  const user = await requireAdminCrmUser();
  const token = await getCrmSessionToken();

  const responses = await Promise.all(
    contentModuleKeys.map(async (key) => {
      const response = await apiFetch<ListResponse<ContentItemMap[typeof key]>>(contentModuleMeta[key].resourcePath, {
        token: token ?? undefined
      });
      const items =
        key === "media"
          ? response.data
          : key === "homepage"
            ? mergeHomepageSectionItems(response.data as Array<ContentItemMap["homepage"]>)
            : response.data.length > 0
              ? response.data
              : getInitialContentItems(key);
      return {
        key,
        title: contentModuleMeta[key].title,
        description: contentModuleMeta[key].description,
        route: contentModuleMeta[key].route,
        totalCount: items.length,
        publishedCount: getPublishedCount(items)
      };
    })
  );

  return (
    <CrmShell
      user={user}
      title="Content studio"
      subtitle="Manage the launch website, proof assets, and package storytelling in the same Ant Design control panel."
    >
      <ContentOverviewView modules={responses} />
    </CrmShell>
  );
}
