import type { SVGProps } from 'react'

/**
 * Custom "Team Hub" icon — center node with spokes and outer nodes.
 * Matches the reference in docs/Menu-Sidebar/team-hub-icon-reference.png.
 * Sized to work alongside Lucide icons (default 24×24 viewBox).
 */
export default function TeamHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={17}
      height={17}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Center node */}
      <circle cx="12" cy="12" r="3" />
      {/* Outer nodes */}
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="20" cy="7.5" r="1.5" />
      <circle cx="20" cy="16.5" r="1.5" />
      <circle cx="12" cy="21" r="1.5" />
      <circle cx="4" cy="16.5" r="1.5" />
      <circle cx="4" cy="7.5" r="1.5" />
      {/* Spokes from center to outer nodes */}
      <line x1="12" y1="9" x2="12" y2="4.5" />
      <line x1="14.6" y1="10" x2="18.7" y2="8.3" />
      <line x1="14.6" y1="14" x2="18.7" y2="15.7" />
      <line x1="12" y1="15" x2="12" y2="19.5" />
      <line x1="9.4" y1="14" x2="5.3" y2="15.7" />
      <line x1="9.4" y1="10" x2="5.3" y2="8.3" />
    </svg>
  )
}
