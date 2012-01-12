class IO
  @domainRegex = /(?:(?:http|https):\/\/)((?:\w+)\.(?:(?:\w|\.)+))/

  @isRemote: (url) ->
    return if not url

    matches = url.match @domainRegex
    return if matches then matches[1] isnt document.domain else false

  @remoteCheck: (src) ->
    if @isRemote src
      if not Caman.remoteProxy.length
        Log.info "Attempting to load a remote image without a configured proxy. URL: #{src}"
        return
      else
        if Caman.isRemote Caman.remoteProxy
          Log.info "Cannot use a remote proxy for loading images."
          return

        "#{Caman.remoteProxy}?camanProxyUrl=#{encodeURIComponent(src)}"

  @useProxy: (lang) ->
    langToExt =
      ruby: 'rb'
      python: 'py'
      perl: 'pl'
      javascript: 'js'

    lang = lang.toLowerCase()
    lang = langToExt[lang] if langToExt[lang]?
    "proxies/caman_proxy.#{lang}"
  
  save: (type = "png") ->
    type = type.toLowerCase()

    # Force download (its a bit hackish)
    image = @toBase64(type).replace "image/#{type}", "image/octet-stream"
    document.location.href = image

  toImage: (type) ->
    img = document.createElement 'img'
    img.src = @toBase64 type
    return img

  toBase64: (type = "png") ->
    type = type.toLowerCase()
    return @canvas.toDataURL "image/#{type}"

extend CamanInstance::, IO::
Caman.IO = IO