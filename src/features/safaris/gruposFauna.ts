// Grupos de fauna para elegir especie (T34): felinos, primates, grandes herbívoros… por género. Servidor y navegador.
// Un género nuevo sin grupo cae en «Otros».

export const GRUPOS_FAUNA = [
  "Felinos",
  "Otros carnívoros",
  "Primates",
  "Elefantes, rinocerontes e hipopótamos",
  "Antílopes, búfalos y ciervos",
  "Cebras, jirafas y otros herbívoros",
  "Marsupiales y otros mamíferos",
  "Marinos",
  "Aves",
  "Reptiles",
  "Otros",
] as const;

export type GrupoFauna = (typeof GRUPOS_FAUNA)[number];

const POR_GENERO: Record<string, GrupoFauna> = {};
const asignar = (grupo: GrupoFauna, generos: string) => {
  for (const g of generos.split(" ")) POR_GENERO[g] = grupo;
};
asignar("Felinos", "Panthera Acinonyx Puma Caracal Leopardus Lynx Leptailurus Felis Neofelis Prionailurus");
asignar(
  "Otros carnívoros",
  "Canis Lycaon Cuon Crocuta Hyaena Ursus Melursus Tremarctos Suricata Pteronura Lutra Mellivora Chrysocyon Ailuropoda",
);
asignar(
  "Primates",
  "Gorilla Pan Pongo Ateles Cercopithecus Nasalis Piliocolobus Theropithecus Papio Colobus Alouatta Lemur Propithecus Indri",
);
asignar(
  "Elefantes, rinocerontes e hipopótamos",
  "Loxodonta Elephas Ceratotherium Diceros Rhinoceros Dicerorhinus Hippopotamus",
);
asignar(
  "Antílopes, búfalos y ciervos",
  "Syncerus Connochaetes Kobus Oryx Tragelaphus Antidorcas Aepyceros Hippotragus Damaliscus Bubalus Bos Bison Cervus Rucervus Alces Rangifer Capra Ovis Rupicapra",
);
asignar("Cebras, jirafas y otros herbívoros", "Equus Giraffa Lama Vicugna Tapirus Hydrochoerus Phacochoerus");
asignar(
  "Marsupiales y otros mamíferos",
  "Macropus Osphranter Phascolarctos Vombatus Tachyglossus Ornithorhynchus Bradypus Choloepus Tachyoryctes Myrmecophaga",
);
asignar(
  "Marinos",
  "Orcinus Megaptera Eubalaena Balaenoptera Physeter Delphinapterus Tursiops Mirounga Neophoca Arctocephalus Zalophus Trichechus Dugong Manta Rhincodon Chelonia Carcharodon",
);
asignar(
  "Aves",
  "Ara Anodorhynchus Balaeniceps Buceros Ephippiorhynchus Phoenicopterus Phoeniconaias Spheniscus Aptenodytes Struthio Sula Vultur Harpia Aquila Haliaeetus Grus",
);
asignar("Reptiles", "Crocodylus Gavialis Varanus Chelonoidis Amblyrhynchus Alligator Caiman");

export function grupoFauna(cientifico: string, clase?: string | null): GrupoFauna {
  const g = POR_GENERO[cientifico.split(" ")[0]];
  if (g) return g;
  if (clase === "Aves") return "Aves";
  if (clase === "Reptilia") return "Reptiles";
  if (clase === "Mammalia") return "Marsupiales y otros mamíferos";
  return "Otros";
}
