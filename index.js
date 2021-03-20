const origin = 'https://t.me/s/AppPie'

const matcher = [
  [/(https?:)?\/\/telegram\.org\/dl\/(.*?)/g, origin.replace("/s/", "/")],
  [/(https?:)?\/\/telegram\.org\/(js|css|img)\/(.*?)/g, "/$2/$3"],
  [/(['"])(https?:)?\/\/(\w+)\.telesco\.pe\/file\/(.*?)/g, "$1/file/$3/$4"],
  [/\"\/s\/.*?(\?.*?)\"/g, "\"$1\""],
  [/\\"\\\/s\\\/.*?(\?.*?)\\"/g, "\\\"$1\\\""]
]
const url_matcher = [
  [/^\/(js|css|img|s)\//, url => {
    url.host = "telegram.org"
    return url
  }],
  [/^\/file\/(\w+)\/(.*?)$/, (url, re) => {
    url.host = url.pathname.replace(re, "$1.telesco.pe")
    url.pathname = url.pathname.replace(re, "/file/$2")
    return url
  }],
  [/^\/$/, url => {
    let new_url = new URL(origin);
    if (url.search) {
      new_url.search = url.search
    }
    return new_url
  }],
  [/^\/(?!(js|css|img|file|s|v)\/)/, url => {
    url.host = "t.me"
    return url
  }]
]

addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request) {
  let url = new URL(request.url)
  url.protocol = 'https:'

  for ([re, cb] of url_matcher) {
    if (re.exec(url.pathname)) {
      url = cb(url, re)
    }
  }

  const headers = new Headers(request.headers)
  headers.set('Host', url.hostname)
  headers.set('Referer', url.hostname)

  const resp = await fetch(url.href, {
    method: request.method, headers
  })

  if (/text\/|json/.exec(resp.headers.get('content-type') || "")) {
    let text = await resp.text()
    for ([re, ret] of matcher) {
      text = text.replaceAll(re, ret)
    }

    return new Response(text, {
      status: resp.status,
      headers: resp.headers,
    })
  } else {
    return resp
  }
}