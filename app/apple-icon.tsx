import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 40, height: 28, background: 'rgba(124,58,237,1)', borderRadius: 7 }} />
            <div style={{ width: 40, height: 50, background: 'rgba(124,58,237,0.55)', borderRadius: 7 }} />
            <div style={{ width: 40, height: 22, background: 'rgba(124,58,237,0.25)', borderRadius: 7 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 40, height: 50, background: 'rgba(124,58,237,1)', borderRadius: 7 }} />
            <div style={{ width: 40, height: 28, background: 'rgba(124,58,237,0.55)', borderRadius: 7 }} />
            <div style={{ width: 40, height: 22, background: 'rgba(124,58,237,0.25)', borderRadius: 7 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 40, height: 38, background: 'rgba(124,58,237,0.55)', borderRadius: 7 }} />
            <div style={{ width: 40, height: 28, background: 'rgba(124,58,237,0.25)', borderRadius: 7 }} />
            <div style={{ width: 40, height: 22, background: 'rgba(124,58,237,0.12)', borderRadius: 7 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
