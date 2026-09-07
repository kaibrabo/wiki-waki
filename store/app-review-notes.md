# App Review Notes - Waimea

Paste the section below into App Store Connect → your version → App Review Information → "Notes for Review,"
AND send it as your reply in the App Review message thread (Guideline 2.1 information request).

Sign-In required: No. Demo account: Not applicable (no accounts).

---

Thank you for reviewing Waimea. Responses to each requested item are below.

1) SCREEN RECORDING
A screen recording captured on a physical iPhone running the latest iOS is attached to this
reply / provided in App Store Connect. It begins by launching the app and shows the typical
flow: granting the alarm and location permissions, viewing the current-location clock and
saved world clocks, adding a city, opening a city and creating an alarm a minute ahead, and
the alarm ringing on the locked device with Stop/Snooze.
- There are NO account registration, login, or account-deletion flows (the app has no
  accounts).
- There is NO user-generated content, and no sharing, so no reporting or blocking mechanisms
  apply.
- There is NO in-app purchase or paid content inside the app; Waimea is a one-time paid app,
  so all features are available immediately after install with nothing gated.

2) PURPOSE AND TARGET AUDIENCE
Waimea is an alarm and world-clock app. Every alarm is anchored to a specific time zone, so it
rings at that location's local wall-clock time regardless of where the user physically is.
- Problem it solves: ordinary alarms fire on the phone's current time zone, which breaks for
  travelers and for people coordinating across regions. Waimea lets a user set "7:00 AM in
  Tokyo" or "a call at 9:00 AM New York time" and have it ring correctly whether they are home
  or abroad.
- Value: reliable time-zone-anchored alarms plus at-a-glance world clocks and Home Screen /
  Apple Watch views of the next alarm.
- Target audience: frequent travelers, remote and globally distributed teams, and anyone who
  regularly deals with multiple time zones. General audience; suitable for all ages.

3) SETUP AND ACCESS INSTRUCTIONS
No login or credentials are required; nothing is gated behind an account.
a. On first launch, allow the two permission prompts:
   - "Schedule alarms and timers" - required for the app to ring alarms (see item 4).
   - Location "Allow While Using App" - used only on-device to detect the current time zone
     and label the current city. The app works if this is declined; the user can add cities
     manually.
b. The home screen shows the current location plus saved world-clock cities. Tap "+" to add a
   city (search by city name or airport code, e.g. "JFK", "LHR", "HND").
c. Tap a city card to open it, then tap "+" to add an alarm. Set the time 1-2 minutes ahead,
   choose a label / recurrence / sound, and save. Lock the device to see the alarm ring.
d. Optional: add a Home Screen widget (small / medium / large) and/or use the Apple Watch app
   and complication to see the next alarm and world clocks.

4) EXTERNAL SERVICES, TOOLS, AND PLATFORMS
Waimea has NO backend and makes NO network requests for its core functionality. It does not use
any data providers, authentication services, payment processors, analytics, ads, trackers, or
AI services. All logic runs on-device. Specifically:
- Alarms: Apple AlarmKit on iOS 26+ (real system alarms with full-screen Stop/Snooze that ring
  through silent mode and Focus). On earlier iOS, or if the alarm permission is declined, it
  falls back to standard local notifications (UNUserNotificationCenter). Both are expected.
- Time-zone detection: Apple Core Location (device GPS) plus the on-device IANA time-zone
  database; no location data leaves the device.
- iPhone ↔ Apple Watch: Apple WatchConnectivity, a direct device-to-device link with no server.
- Home Screen widgets: Apple WidgetKit.
There are no third-party services of any kind.

5) REGIONAL DIFFERENCES
There are no regional differences. The app's features and content are identical in every
region and country. It contains no region-locked content, no server-driven content, and no
region-specific behavior beyond standard time-zone and locale formatting.

6) REGULATED INDUSTRY / PROTECTED THIRD-PARTY MATERIAL
Not applicable. Waimea does not operate in a regulated industry (no health, finance, gambling,
etc.) and contains no protected third-party material. All content and code are the developer's
own; time-zone data comes from the public IANA time-zone database, and alarm sounds are
originally generated tones bundled with the app.

PRIVACY
- App Privacy: Data Not Collected. No analytics, ads, trackers, or servers that receive
  personal data.
- Location and the derived city name are used only on-device to determine the time zone, and
  are shared only directly between the user's own iPhone and paired Apple Watch.
- Privacy policy: https://kainoabrabo.com/waimea/privacy/

Questions during review: brabo.kainoa@gmail.com
