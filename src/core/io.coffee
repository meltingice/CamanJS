# Various I/O based operations
module.exports = class IO
  # Used for parsing image URLs for domain names.
  @domainRegex: /(?:(?:http|https):\/\/)((?:\w+)\.(?:(?:\w|\.)+))/

  # Is the given URL remote?
  # If a cross-origin setting is set, we assume you have CORS
  # properly configured.
  #
  # @param [DOMObject] img The image to check.
  # @return [Boolean]
  @isRemote: (img) ->
    return false unless img?
    return false if @corsEnabled(img)
    return @isURLRemote img.src

  # Given an image, we check to see if a CORS policy has been defined.
  # @param [DOMObject] img The image to check.
  # @return [Boolean]
  @corsEnabled: (img) ->
    img.crossOrigin? and img.crossOrigin.toLowerCase() in ['anonymous', 'use-credentials']

  # Does the given URL exist on a different domain than the current one?
  # This is done by comparing the URL to `document.domain`.
  # @param [String] url The URL to check.
  # @return [Boolean]
  @isURLRemote: (url) ->
    matches = url.match @domainRegex
    return if matches then matches[1] isnt document.domain else false

  # Checks to see if the URL is remote, and if there is a proxy defined, it
  # @param [String] src The URL to check.
  # @return [String] The proxy URL if the image is remote. Nothing otherwise.
  @remoteCheck: (src) ->
    if @isURLRemote src
      if not Caman.remoteProxy.length
        Log.info "Attempting to load a remote image without a configured proxy. URL: #{src}"
        return
      else
        if Caman.isURLRemote Caman.remoteProxy
          Log.info "Cannot use a remote proxy for loading images."
          return
          
        return @proxyUrl(src)

  # Given a URL, get the proxy URL for it.
  # @param [String] src The URL to proxy.
  # @return [String] The proxy URL.
  @proxyUrl: (src) ->
    "#{Caman.remoteProxy}?#{Caman.proxyParam}=#{encodeURIComponent(src)}"

  # Shortcut for using one of the bundled proxies.
  # @param [String] lang String identifier for the proxy script language.
  # @return [String] A proxy URL.
  @useProxy: (lang) ->
    langToExt =
      ruby: 'rb'
      python: 'py'
      perl: 'pl'
      javascript: 'js'

    lang = lang.toLowerCase()
    lang = langToExt[lang] if langToExt[lang]?
    "proxies/caman_proxy.#{lang}"
