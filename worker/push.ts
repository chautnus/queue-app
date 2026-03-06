// Custom service worker code - merged into the generated Workbox SW by @ducanh2912/next-pwa
// Handles incoming push notifications

declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title: string = data.title ?? 'Đến lượt bạn!'
  const options: NotificationOptions = {
    body: data.body ?? 'Vui lòng đến quầy phục vụ.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'queue-notification',
    renotify: true,
    requireInteraction: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
