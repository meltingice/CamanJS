import { Filter } from "../caman/filter";

export function Filters(Caman) {
  Caman.Renderer.register("brightness", function (adjust) {
    adjust = Math.floor(255 * (adjust / 100));

    return new Filter(function () {
      this.r += adjust;
      this.g += adjust;
      this.b += adjust;
    });
  });
}
