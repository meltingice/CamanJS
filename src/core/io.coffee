# Various I/O based operations
class Caman.IO
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

  # Grabs the canvas data, encodes it to Base64, then sets the browser location to 
  # the encoded data so that the user will be prompted to download it.
  # If we're in NodeJS, then we can save the image to disk.
  # @see Caman
Caman::save = ->
    if exports?
      @nodeSave.apply @, arguments
    else
      @browserSave.apply @, arguments

Caman::browserSave = (type = "png") ->
    type = type.toLowerCase()

    # Force download (its a bit hackish)
    image = @toBase64(type).replace "image/#{type}", "image/octet-stream"
    document.location.href = image

Caman::nodeSave = (file, overwrite = true, callback = null) ->
    try
      stats = fs.statSync file
      return false if stats.isFile() and not overwrite
    catch e
      Log.debug "Creating output file #{file}"

    fs.writeFile file, @canvas.toBuffer(), (err) ->
      Log.debug "Finished writing to #{file}"
      callback.call this, err if callback

  # Takes the current canvas data, converts it to Base64, then sets it as the source 
  # of a new Image object and returns it.
Caman::toImage = (type) ->
    img = new Image()
    img.src = @toBase64 type
    img.width = @dimensions.width
    img.height = @dimensions.height

    if window.devicePixelRatio
      img.width /= window.devicePixelRatio
      img.height /= window.devicePixelRatio

    return img

  # Base64 encodes the current canvas
Caman::toBase64 = (type = "png") ->
    type = type.toLowerCase()
    return @canvas.toDataURL "image/#{type}"

IO = Caman.IO