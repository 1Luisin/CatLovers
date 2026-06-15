self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(payload.title || "CatLovers", {
      body: payload.body || "Você tem uma novidade no CatLovers.",
      icon: payload.icon || "/favicon.ico",
      badge: payload.icon || "/favicon.ico",
      data: {
        ...(payload.data || {}),
        url: payload.url || "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );
        return existing ? existing.focus() : self.clients.openWindow(targetUrl);
      }),
  );
});
