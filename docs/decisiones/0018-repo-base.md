# 0018 — La base es photography_recommender
Fecha: 2026-11-13 · Estado: vigente
Contexto: la fauna de España, sus secretos (GBIF, eBird) y sus datos ya estaban en el antiguo
safari_recommender, renombrado a photography_recommender. Mover todo eso a photo_recommender era más trabajo
y obligaba a recrear secretos.
Decisión: todo Rasante vive en `DiezPablo/photography_recommender` y se despliega desde él. El modo Luz se trajo
de `photo_recommender`, que queda congelado. URLs: `/luz/**` y `/fauna/**`; `/espana/**` redirige.
Consecuencias: los safaris del mundo venían en este repo y se retiraron de la versión (decisión 0021). Hay dos paquetes Python (`rasante`,
`safari`) hasta la spec 006. La URL pública se fija con `NEXT_PUBLIC_SITIO`.
