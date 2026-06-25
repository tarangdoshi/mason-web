import { notFound } from "next/navigation";
import { apiFetch } from "../../../../../lib/api";
import { getCrmSessionToken, requireAdminCrmUser } from "../../../../../lib/crm";
import CrmShell from "../../crm-shell";
import ContentModuleView from "../content-module-view";
import MediaStudioView from "../media-studio-view";
import {
  mergeHomepageSectionItems,
  contentModuleMeta,
  getInitialContentItems,
  isContentModuleKey,
  type ContentItemMap,
  type ContentModuleKey,
  type MediaItem
} from "../content-studio";

type PageContext = {
  params: Promise<{
    module: string;
  }>;
};

type ListResponse<T> = {
  data: T[];
};

export default async function CrmContentModulePage({ params }: PageContext) {
  const user = await requireAdminCrmUser();
  const token = await getCrmSessionToken();
  const { module } = await params;

  if (!isContentModuleKey(module)) {
    notFound();
  }

  const meta = contentModuleMeta[module];
  const [moduleResponse, mediaResponse] = await Promise.all([
    apiFetch<ListResponse<ContentItemMap[typeof module]>>(meta.resourcePath, {
      token: token ?? undefined
    }),
    module === "media"
      ? Promise.resolve({ data: [] as MediaItem[] })
      : apiFetch<ListResponse<MediaItem>>(contentModuleMeta.media.resourcePath, {
          token: token ?? undefined
        })
  ]);

  const items =
    module === "media"
      ? (moduleResponse.data as MediaItem[])
      : module === "homepage"
        ? mergeHomepageSectionItems(moduleResponse.data as Array<ContentItemMap["homepage"]>)
        : moduleResponse.data.length > 0
          ? moduleResponse.data
          : getInitialContentItems(module as Exclude<ContentModuleKey, "media">);

  return (
    <CrmShell
      user={user}
      title={meta.title}
      subtitle={meta.description}
    >
      {module === "media" ? (
        <MediaStudioView items={items as MediaItem[]} />
      ) : (
        <ContentModuleView
          userRole={user.role}
          moduleKey={module}
          moduleMeta={meta}
          items={items as Array<ContentItemMap[Exclude<ContentModuleKey, "media">]>}
          mediaItems={mediaResponse.data}
        />
      )}
    </CrmShell>
  );
}
