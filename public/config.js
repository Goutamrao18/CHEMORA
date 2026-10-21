// CHEMORA Video & CDN Configuration for Static Pages
(function () {
  var defaultCdn = "https://mcwadkgzplurjtstrhdd.supabase.co/storage/v1/object/public/videos";
  window.CHEMORA_VIDEO_BASE = (window.CHEMORA_VIDEO_BASE || defaultCdn).replace(/\/$/, "");

  window.CHEMORA_VIDEO_MANIFEST = {
    "chemora-intro": { "mp4": "chemora-intro.mp4", "webm": "chemora-intro.webm", "poster": "chemora-intro-poster.webp" },
    "catalyst-manganese": { "mp4": "catalyst-manganese.mp4", "webm": "catalyst-manganese.webm", "poster": "catalyst-manganese-poster.webp" },
    "chromatography": { "mp4": "chromatography.mp4", "webm": "chromatography.webm", "poster": "chromatography-poster.webp" },
    "co2-test": { "mp4": "co2-test.mp4", "webm": "co2-test.webm", "poster": "co2-test-poster.webp" },
    "conductivity": { "mp4": "conductivity.mp4", "webm": "conductivity.webm", "poster": "conductivity-poster.webp" },
    "displacement": { "mp4": "displacement.mp4", "webm": "displacement.webm", "poster": "displacement-poster.webp" },
    "distillation": { "mp4": "distillation.mp4", "webm": "distillation.webm", "poster": "distillation-poster.webp" },
    "electrolysis-copper": { "mp4": "electrolysis-copper.mp4", "webm": "electrolysis-copper.webm", "poster": "electrolysis-copper-poster.webp" },
    "elephant": { "mp4": "elephant.mp4", "webm": "elephant.webm", "poster": "elephant-poster.webp" },
    "flame-test": { "mp4": "flame-test.mp4", "webm": "flame-test.webm", "poster": "flame-test-poster.webp" },
    "golden-rain": { "mp4": "golden-rain.mp4", "webm": "golden-rain.webm", "poster": "golden-rain-poster.webp" },
    "halide": { "mp4": "halide.mp4", "webm": "halide.webm", "poster": "halide-poster.webp" },
    "iodine-starch": { "mp4": "iodine-starch.mp4", "webm": "iodine-starch.webm", "poster": "iodine-starch-poster.webp" },
    "neutralisation": { "mp4": "neutralisation.mp4", "webm": "neutralisation.webm", "poster": "neutralisation-poster.webp" },
    "ph-rainbow": { "mp4": "ph-rainbow.mp4", "webm": "ph-rainbow.webm", "poster": "ph-rainbow-poster.webp" },
    "rate-temperature": { "mp4": "rate-temperature.mp4", "webm": "rate-temperature.webm", "poster": "rate-temperature-poster.webp" },
    "reactivity-acid": { "mp4": "reactivity-acid.mp4", "webm": "reactivity-acid.webm", "poster": "reactivity-acid-poster.webp" },
    "reducing-sugar": { "mp4": "reducing-sugar.mp4", "webm": "reducing-sugar.webm", "poster": "reducing-sugar-poster.webp" },
    "solubility-crystals": { "mp4": "solubility-crystals.mp4", "webm": "solubility-crystals.webm", "poster": "solubility-crystals-poster.webp" },
    "surface-area": { "mp4": "surface-area.mp4", "webm": "surface-area.webm", "poster": "surface-area-poster.webp" },
    "titration-acid": { "mp4": "titration-acid.mp4", "webm": "titration-acid.webm", "poster": "titration-acid-poster.webp" }
  };

  window.chemoraVideoUrl = function (name, format) {
    var base = (window.CHEMORA_VIDEO_BASE || "/videos").replace(/\/$/, "");
    var clean = String(name || "").trim().replace(/^\/?videos\//, "");
    var manifest = window.CHEMORA_VIDEO_MANIFEST || {};

    if (format && manifest[clean]) {
      return base + "/" + manifest[clean][format];
    }
    if (manifest[clean]) {
      return base + "/" + manifest[clean].mp4;
    }
    return base + "/" + clean;
  };
})();
