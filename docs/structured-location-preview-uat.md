# Structured location Preview UAT

The browser tests simulate Google's native input listener and Places dropdown.
They prove Mason's Enter handler runs after that listener, but jsdom cannot prove
the real Google PAC widget's keyboard or mouse behavior. Before PR merge, check
in a real Preview browser with a working Google Places key:

1. Type an address, highlight a suggestion, and press Enter. The suggestion
   should populate the field without an early form submission.
2. Select a suggestion by click. The selected address should be submitted once.
3. Edit a selected address before submitting. The edited text should submit
   as manual/unknown, without the old Place metadata.
4. Press Enter with no suggestion open. Manual form submission should work.
5. Disable Google Places or its geocode response. Manual address entry must
   remain usable and submission must complete without verified geography.

No Production lead should be submitted for this UAT; use an approved Preview
API/test destination.
