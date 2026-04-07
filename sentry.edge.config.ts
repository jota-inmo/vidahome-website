import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://73706b979feeb6bd1095ea28bf270eb8@o4511168397836288.ingest.de.sentry.io/4511168403210320",
  tracesSampleRate: 0.1,
});
