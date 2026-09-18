const NOVISOUND_IMAGE_BY_HANDLE: Record<string, string> = {
  "novisound-amplifier-a500": "/images/novisound/products/novisound-amplifier-a500.png",
  "novisound-boom-go-b8": "/images/novisound/products/novisound-boom-go-b8.png",
  "novisound-cinema-bar-c12": "/images/novisound/products/novisound-cinema-bar-c12.png",
  "novisound-soundbar-suite-s900": "/images/novisound/products/novisound-soundbar-suite-s900.png",
  "novisound-studio-pair-s5": "/images/novisound/products/novisound-studio-pair-s5.png",
  "novisound-tower-pro-x1": "/images/novisound/products/novisound-tower-pro-x1.png",
  "novisound-wireless-mic-m2": "/images/novisound/products/novisound-wireless-mic-m2.png",
  "ns-acc-wall-mount":
    "/images/novisound/spares/ns-acc-wall-mount-novisound-soporte-pared.png",
  "ns-acc-xlr-10m": "/images/novisound/spares/ns-acc-xlr-10m-novisound-xlr.png",
  "ns-acc-case-mobile":
    "/images/novisound/spares/ns-acc-case-mobile-recambios11.png",
  "ns-acc-hdmi-arc-5m":
    "/images/novisound/spares/ns-acc-hdmi-arc-5m-recambios19.png",
  "ns-sp-amp-plate-s5":
    "/images/novisound/spares/ns-sp-amp-plate-s5-recambios5.png",
  "ns-sp-battery-b8":
    "/images/novisound/spares/ns-sp-battery-b8-recambios7.png",
  "ns-sp-capsule-m2":
    "/images/novisound/spares/ns-sp-capsule-m2-recambios.png",
  "ns-sp-dsp-module":
    "/images/novisound/spares/ns-sp-dsp-module-novisound-modulo-dsp.png",
  "ns-sp-fan-a500": "/images/novisound/spares/ns-sp-fan-a500-recambios3.png",
  "ns-sp-foot-tx1":
    "/images/novisound/spares/ns-sp-foot-tx1-novisound-patas-niveladoras.png",
  "ns-sp-grille-b8": "/images/novisound/spares/ns-sp-grille-b8-recambios6.png",
  "ns-sp-grille-12":
    "/images/novisound/spares/ns-sp-grille-12-novisound-rejilla.png",
  "ns-sp-psu-c12": "/images/novisound/spares/ns-sp-psu-c12-recambios8.png",
  "ns-sp-rack-kit":
    "/images/novisound/spares/ns-sp-rack-kit-novisound-recambio.png",
  "ns-sp-remote-s900":
    "/images/novisound/spares/ns-sp-remote-s900-recambios2.png",
  "ns-sp-tweeter-s5":
    "/images/novisound/spares/ns-sp-tweeter-s5-recambios9.png",
  "ns-sp-uhf-ant":
    "/images/novisound/spares/ns-sp-uhf-ant-novisound-antenas-uhf.png",
}

export const getProductImageFallback = (handle?: string | null) => {
  if (!handle) {
    return undefined
  }

  return NOVISOUND_IMAGE_BY_HANDLE[handle]
}
