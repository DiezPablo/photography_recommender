# 0026 — Un planificador mínimo: la luna llena sobre un objeto
Fecha: 2026-11-27 · Estado: vigente (modifica en parte la 0013; ampliada por la 0027)
Contexto: Pablo quiere la foto clásica de la luna llena sobre algo (las Cuatro Torres) y PhotoPills se le hace
difícil: hay que saber de antemano dónde ponerse y luego buscar la fecha. Hecho a mano para las Cuatro Torres, el
cálculo cabe en una página: dado el objeto, salen las fechas y la línea donde ponerse.
Decisión: Rasante calcula una sola cosa de planificación de toma: cuándo sale o se pone la luna casi llena justo
por encima de un objeto (posición y altura), y desde qué punto a cada distancia. Respuesta directa (fecha, hora,
punto), sin herramientas de encuadre. El resto de la 0013 sigue: nada de realidad aumentada, focales, encuadres,
efemérides generales ni alineaciones de cualquier astro con cualquier cosa.
Consecuencias: una dependencia de astronomía en la web (`astronomy-engine`, MIT, solo en el servidor). El sol, el
núcleo de la Vía Láctea o el relieve real del punto de vista quedan para después y piden otra decisión si se
quieren. No se recuperan las alineaciones con picos que podó la spec 022.
