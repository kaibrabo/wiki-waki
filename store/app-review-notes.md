# App Review Notes - KTMPO

Paste this into App Store Connect → your version → "Notes for Review."
Sign-In required: No.

---

Thank you for reviewing KTMPO.

KTMPO is an alarm and world-clock app. Each alarm is anchored to a specific time zone, so it rings at that location's local wall-clock time no matter where the user currently is (useful for travel and remote/global teams).

NO ACCOUNT NEEDED
There is no login or sign-up. No credentials are required and no content is gated behind an account.

HOW TO TEST
1. On first launch, allow the two permission prompts:
   - "Schedule alarms and timers" (used to ring alarms - see below).
   - Location ("Allow While Using App") - used only to detect the current time zone and show the current city.
2. The home screen shows your current location plus saved world-clock cities. Tap "+" to add a city (search by city name or airport code, e.g. "JFK" or "LHR").
3. Tap a city card to open it and add an alarm. Set it 1-2 minutes ahead, then lock the device to see it ring.

ALARMS AND iOS VERSION (important)
- On iOS 26 and later, KTMPO uses Apple's AlarmKit to schedule real system alarms - they ring with a full-screen Stop/Snooze and sound through silent mode and Focus. This is why the app requests the "schedule alarms and timers" permission on first launch.
- On earlier iOS versions, or if that permission is declined, KTMPO falls back to standard local notifications for the same alarms. Both paths are expected behavior.

WIDGETS AND APPLE WATCH
- Home Screen widgets (small, medium, large) show the current time and location, the next alarm with a live countdown, and world clocks for saved cities.
- The app includes an Apple Watch app and watch-face complications that mirror the next alarm. Their data is sent from the iPhone over WatchConnectivity; there is no separate account or login on the watch.

PRIVACY
- No data is collected. There are no analytics, ads, or trackers, and no servers that receive personal data (App Privacy: Data Not Collected).
- Location and the city name derived from it are used only on the device to determine the time zone, and are shared only directly between the user's own iPhone and paired Apple Watch.
- Privacy policy: https://kainoabrabo.com/ktmpo/privacy/

Questions during review: kaibrabo@gmail.com
