import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Kanban icon */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 40, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 36, height: 24, background: 'rgba(124,58,237,1)', borderRadius: 6 }} />
            <div style={{ width: 36, height: 44, background: 'rgba(124,58,237,0.55)', borderRadius: 6 }} />
            <div style={{ width: 36, height: 18, background: 'rgba(124,58,237,0.25)', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 36, height: 44, background: 'rgba(124,58,237,1)', borderRadius: 6 }} />
            <div style={{ width: 36, height: 24, background: 'rgba(124,58,237,0.55)', borderRadius: 6 }} />
            <div style={{ width: 36, height: 18, background: 'rgba(124,58,237,0.25)', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ width: 36, height: 32, background: 'rgba(124,58,237,0.55)', borderRadius: 6 }} />
            <div style={{ width: 36, height: 24, background: 'rgba(124,58,237,0.25)', borderRadius: 6 }} />
            <div style={{ width: 36, height: 18, background: 'rgba(124,58,237,0.12)', borderRadius: 6 }} />
          </div>
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#09090b',
            letterSpacing: -2,
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Kanvi
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#71717a',
            letterSpacing: -0.3,
            marginBottom: 44,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          The Kanban board built for freelancers and their clients.
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 24px',
            background: 'rgba(124,58,237,0.07)',
            border: '1.5px solid rgba(124,58,237,0.2)',
            borderRadius: 100,
            fontSize: 20,
            color: '#7c3aed',
            fontWeight: 600,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#7c3aed' }} />
          Open beta · Free to start · No credit card
        </div>
      </div>
    ),
    { ...size }
  )
}
