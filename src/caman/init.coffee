Promise = require 'bluebird'

module.exports =
  extended: (Caman) ->
    @fromURL = (url) ->
      new Promise (resolve, reject) =>
        image = new Image()
        image.onload = => resolve @fromImage(image)
        image.src = url

    @fromImage = (image) ->
      loadImage = new Promise (resolve, reject) ->
        if image.complete or (image.naturalWidth? and image.naturalWidth > 0)
          resolve(image)
        else
          image.onload = -> resolve(image)

      new Promise (resolve, reject) ->
        loadImage.then (image) =>

          canvas = document.createElement 'canvas'
          canvas.width = image.width
          canvas.height = image.height

          context = canvas.getContext '2d'

          # TODO copy attributes

          context.drawImage image,
            0, 0
            image.width, image.height,
            0, 0,
            canvas.width, canvas.height

          resolve new Caman(canvas)

    @fromCanvas = (canvas) ->
      new Promise (resolve, reject) =>
        resolve new Caman(canvas)

