export function GridVignetteBackground({
  className = '',
  size = 48,
  x = 50,
  y = 50,
  horizontalVignetteSize = 100,
  verticalVignetteSize = 100,
  intensity = 0,
  style = {},
  ...props
}) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
        backgroundImage: `
          linear-gradient(to right, var(--grid-color, rgba(0,0,0,0.1)) 1px, transparent 1px),
          linear-gradient(to bottom, var(--grid-color, rgba(0,0,0,0.1)) 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        maskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${100 - intensity}%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${100 - intensity}%, transparent 100%)`,
        ...style,
      }}
      {...props}
    />
  )
}
