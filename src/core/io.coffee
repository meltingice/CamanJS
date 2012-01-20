# Various I/O based operations
class IO
  @domainRegex = /(?:(?:http|https):\/\/)((?:\w+)\.(?:(?:\w|\.)+))/

  # Is the given URL remote?
  @isRemote: (url) ->
    return if not url

    matches = url.match @domainRegex
    return if matches then matches[1] isnt document.domain else false

  # Checks if the given URL is remote, and if so, returns the proxy URL (if
  # one is defined)
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

  # Shortcut for using one of the bundled proxies.
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
  save: ->
    if exports?
      @nodeSave.apply @, arguments
    else
      @browserSave.apply @, arguments

  browserSave: (type = "png") ->
    type = type.toLowerCase()

    # Force download (its a bit hackish)
    image = @toBase64(type).replace "image/#{type}", "image/octet-stream"
    document.location.href = image

  nodeSave: (file, overwrite = true) ->
    try
      stats = fs.statSync file
      return false if stats.isFile() and not overwrite
    catch e
      Log.debug "Creating output file #{file}"

    fs.writeFile file, @canvas.toBuffer(), ->
      Log.debug "Finished writing to #{file}"

  # Takes the current canvas data, converts it to Base64, then sets it as the source 
  # of a new Image object and returns it.
  toImage: (type) ->
    img = document.createElement 'img'
    img.src = @toBase64 type
    return img

  # Base64 encodes the current canvas
  toBase64: (type = "png") ->
    type = type.toLowerCase()
    return @canvas.toDataURL "image/#{type}"

Util.extend CamanInstance::, IO::
Caman.IO = IO