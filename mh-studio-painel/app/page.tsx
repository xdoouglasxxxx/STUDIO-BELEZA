import { redirect } from 'next/navigation'

// O site público das clientes é o projeto mh-studio-app.
// O painel serve apenas a área administrativa da Myleine.
export default function Home() {
  redirect('/admin')
}
