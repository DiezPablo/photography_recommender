// Hueco de la altura del contenido mientras carga (T02): sin saltos de maquetación al llegar los datos.
export default function Esqueleto({ alto, texto = "Cargando…" }: { alto: number; texto?: string }) {
  return (
    <div className="esqueleto" style={{ minHeight: alto }} role="status">
      <span className="sr">{texto}</span>
    </div>
  );
}
