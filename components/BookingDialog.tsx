"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import AssessmentLeadForm from "../app/components/assessment-lead-form";
import { smoothScroll } from "./SmoothScroll";
const BookingContext = createContext<{open: () => void} | null>(null);
export function useBooking() { return useContext(BookingContext); }
export default function BookingProvider({children}: {children: React.ReactNode}) {
 const [open, setOpen] = useState(false);
 const dialog = useRef<HTMLDivElement>(null);
 useEffect(() => {
  if (!open) return;
  const previous = document.activeElement as HTMLElement | null;
  const overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  smoothScroll.current?.stop();
  dialog.current?.focus();
  const keyboard = (event: KeyboardEvent) => {
   // The canonical success dialog handles its own focus and Escape.
   if (dialog.current?.querySelector('[aria-modal="true"]')) return;
   if (event.key === "Escape") setOpen(false);
   if (event.key !== "Tab") return;
   const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') || [])];
   const first=items[0], last=items[items.length-1];
   if (event.shiftKey && (document.activeElement===first || document.activeElement===dialog.current)) {event.preventDefault(); last?.focus();}
   else if (!event.shiftKey && document.activeElement===last) {event.preventDefault(); first?.focus();}
  };
  document.addEventListener("keydown", keyboard);
  return () => {document.removeEventListener("keydown", keyboard); document.body.style.overflow=overflow; smoothScroll.current?.start(); previous?.focus();};
 }, [open]);
 return <BookingContext.Provider value={{open: () => setOpen(true)}}>
  <div inert={open}>{children}</div>
  <div aria-hidden={!open} inert={!open} style={{display:open ? undefined : "none"}} className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={() => setOpen(false)}>
   <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="booking-title" tabIndex={-1} data-lenis-prevent className="mason-assessment max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-3xl bg-sand-50 p-6 sm:p-8" onClick={event => event.stopPropagation()}>
    <div className="mb-6 flex items-start justify-between gap-4"><h2 id="booking-title" className="h-display text-3xl">Book a Safety <span className="accent-word">Visit</span></h2><button type="button" className="min-h-11 min-w-11" aria-label="Close booking" onClick={() => setOpen(false)}>✕</button></div>
    <AssessmentLeadForm />
   </div>
  </div>
 </BookingContext.Provider>;
}
