import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="prosa">
      <h1>No encontrado</h1>
      <p>
        Esa página no existe o ha cambiado de dirección. <Link href="/">Volver al inicio</Link>.
      </p>
    </main>
  );
}
