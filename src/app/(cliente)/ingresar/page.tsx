import { Suspense } from "react"
import LoginForm from "./LoginForm"

export default function IngresarPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
