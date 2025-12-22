import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Metric, Client } from "@/types";

interface ClientGeolocationMapProps {
  entity: string;
  metric: Metric | null;
  popupText: String | null;
  formatDateTime: (dateString: string) => string;
}

export default function GeolocationMap({
                                         entity,
                                         metric,
                                         popupText,
                                         formatDateTime,
                                       }: ClientGeolocationMapProps) {
  if (!metric) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Геолокация {entity == "client" ? "клиента" : "устройства"} неизвестна
      </div>
    );
  }

  // Handle both correct spelling (latitude/longitude) and typo in Metric type (latitiude)
  const lat = (metric as any).latitude || (metric as any).latitiude;
  const lon = metric.longitude;

  if (!lat || !lon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Геолокация {entity == "client" ? "клиента" : "устройства"} неизвестна.
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
      {/*<MapContainer center={[lat, lon]} zoom={13} scrollWheelZoom={false}>*/}
      {/*  <TileLayer*/}

      {/*    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"*/}
      {/*    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'*/}
      {/*  />*/}
      {/*  <Marker position={[lat, lon]}>*/}
      {/*    <Popup>*/}
      {/*      A pretty CSS3 popup. <br /> Easily customizable.*/}
      {/*    </Popup>*/}
      {/*  </Marker>*/}
      {/*</MapContainer>,*/}
      <MapContainer
        center={[lat, lon]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker
          position={[lat, lon]}
          icon={L.icon({
            iconUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            shadowSize: [41, 41],
          })}
        >
          <Popup>
            <div className="text-sm">
              {popupText && (
                <p className="font-semibold">
                  {popupText}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Широта: {lat.toFixed(6)}<br></br>
                Долгота: {lon.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
