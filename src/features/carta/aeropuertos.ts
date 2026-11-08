// Los aeropuertos de un parque (OurAirports, de safaris_mundo.json) para su carta: de más cerca a más lejos, con el
// nombre corto.
import { nombreAeropuerto, type Llegar } from "@/features/safaris/modelo";
import type { AeropuertoCarta } from "@/features/carta/CartaParque";

export function aeropuertosCarta(lista: Llegar["aeropuertos"]): AeropuertoCarta[] {
  return [...lista]
    .sort((a, b) => a.km - b.km)
    .map((a) => ({
      nombre: nombreAeropuerto(a),
      iata: a.iata,
      km: a.km,
      internacional: a.internacional,
      lat: a.lat,
      lon: a.lon,
    }));
}
