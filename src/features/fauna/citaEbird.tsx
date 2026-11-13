// Cita del conjunto de eBird en GBIF, de donde sale la frecuencia de detección (% de listas): «EOD – eBird
// Observation Dataset», Cornell Lab of Ornithology, CC BY 4.0, que pide citarlo. Decisión de la auditoría (D4,
// 08-11-2026): se puede publicar con la cita.
export const DOI_EBIRD = "https://doi.org/10.15468/aomfnb";

export default function CitaEbird() {
  return (
    <>
      % de listas: <a href={DOI_EBIRD}>EOD – eBird Observation Dataset</a> (Cornell Lab of Ornithology, vía GBIF, CC BY
      4.0).
    </>
  );
}
