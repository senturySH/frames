import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/frames/frame1')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/frames/frame1"!</div>
}
