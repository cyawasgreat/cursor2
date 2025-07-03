self.__uv$config = {
  prefix: "/uv/",
  encodeUrl: Ultraviolet.codec.plain.encode,
  decodeUrl: Ultraviolet.codec.plain.decode,
  handler:
    "https://unpkg.com/@titaniumnetwork-dev/ultraviolet/dist/uv.handler.js",
  client:
    "https://unpkg.com/@titaniumnetwork-dev/ultraviolet/dist/uv.client.js",
  bundle:
    "https://unpkg.com/@titaniumnetwork-dev/ultraviolet/dist/uv.bundle.js",
  config: "/uv.config.js",
  sw: "https://unpkg.com/@titaniumnetwork-dev/ultraviolet/dist/uv.sw.js",
}
