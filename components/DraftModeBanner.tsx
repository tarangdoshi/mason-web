/* Shown only while Next draft mode is on (switched on from Sanity Studio's
   preview). Ordinary visitors never have draft mode, so they never see it. */
export default function DraftModeBanner() {
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-2 text-sm text-sand-100 shadow-lg ring-1 ring-white/20"
    >
      <span>Previewing unpublished changes</span>
      {/* A plain link: the route clears the cookie and returns to the homepage. */}
      <a href="/api/draft-mode/disable" className="font-semibold underline underline-offset-2">
        Exit preview
      </a>
    </div>
  );
}
