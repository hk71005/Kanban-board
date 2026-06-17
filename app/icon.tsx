import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ width: 8, height: 6, background: 'rgba(124,58,237,1)', borderRadius: 1.5 }} />
            <div style={{ width: 8, height: 10, background: 'rgba(124,58,237,0.55)', borderRadius: 1.5 }} />
            <div style={{ width: 8, height: 4, background: 'rgba(124,58,237,0.25)', borderRadius: 1.5 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ width: 8, height: 10, background: 'rgba(124,58,237,1)', borderRadius: 1.5 }} />
            <div style={{ width: 8, height: 6, background: 'rgba(124,58,237,0.55)', borderRadius: 1.5 }} />
            <div style={{ width: 8, height: 4, background: 'rgba(124,58,237,0.25)', borderRadius: 1.5 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ width: 8, height: 8, background: 'rgba(124,58,237,0.55)', borderRadius: 1.5 }} />
            <div style={{ width: 8, height: 6, background: 'rgba(124,58,237,0.25)', borderRadius: 1.5 }} />
            <div style={{ width: 8, height: 4, background: 'rgba(124,58,237,0.12)', borderRadius: 1.5 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
