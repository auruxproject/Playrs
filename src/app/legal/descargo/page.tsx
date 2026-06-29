"use client";

import { InfoPage, InfoSection } from "@/components/site/InfoPage";

export default function DescargoPage() {
  return (
    <InfoPage
      badge="Legal"
      title="Descargo de responsabilidad"
      subtitle="Lo que Playrs es y lo que no es, y cómo usamos los datos deportivos."
      hideCta
    >
      <InfoSection title="Solo datos públicos">
        <p>Playrs utiliza exclusivamente información de carácter público: nombres de jugadores, equipos y estadísticas deportivas que ya son de dominio público. No reproducimos contenido protegido.</p>
      </InfoSection>
      <InfoSection title="Sin infracción de patentes ni derechos de autor">
        <p>No utilizamos, reclamamos ni infringimos patentes, marcas ni derechos de autor de terceros. El uso de nombres y estadísticas se hace con fines informativos y de entretenimiento, sobre datos de libre acceso, y no implica afiliación, patrocinio ni respaldo de ningún club, liga o jugador.</p>
      </InfoSection>
      <InfoSection title="Entretenimiento, no inversión">
        <p>Playrs es un juego de fantasy trading. No es un producto financiero, no constituye asesoría de inversión y las fichas no son valores ni instrumentos regulados. Juega de forma responsable y solo con lo que estés dispuesto a arriesgar.</p>
      </InfoSection>
      <InfoSection title="Sin garantías de resultado">
        <p>El valor de las fichas depende del rendimiento deportivo real y puede subir o bajar. No garantizamos ganancias de ningún tipo.</p>
      </InfoSection>
      <p className="text-xs text-text-tertiary px-1">Documento preliminar de la beta. Antes del lanzamiento público se revisará con asesoría legal.</p>
    </InfoPage>
  );
}
