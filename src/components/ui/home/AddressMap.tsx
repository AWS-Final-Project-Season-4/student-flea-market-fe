
'use client';

import { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import { LocateFixed, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export interface AddressPosition {
    lat: number;
    lng: number;
}

interface AddressMapProps {
    position: AddressPosition;
    onChange: (position: AddressPosition) => void;
    language: string;
}

function MapController({
    position,
    onChange,
}: Omit<AddressMapProps, 'language'>) {
    const map = useMap();

    useEffect(() => {
        map.panTo([position.lat, position.lng]);
    }, [map, position.lat, position.lng]);

    useMapEvents({
        click(e) {
            onChange({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
            });
        },
    });

    return null;
}

export default function AddressMap({
    position,
    onChange,
    language,
}: AddressMapProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isVi = language === 'vi';

    const handleLocate = () => {
        setError('');

        if (!navigator.geolocation) {
            setError(
                isVi
                    ? 'Trình duyệt không hỗ trợ GPS.'
                    : 'Geolocation is not supported.'
            );
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (result) => {
                onChange({
                    lat: result.coords.latitude,
                    lng: result.coords.longitude,
                });

                setLoading(false);
            },
            () => {
                setError(
                    isVi
                        ? 'Không thể lấy vị trí. Hãy kiểm tra quyền truy cập GPS.'
                        : 'Unable to get location. Check location permissions.'
                );

                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="space-y-2">
            <div className="relative z-0 overflow-hidden rounded-xl border border-[#EADBCE] dark:border-stone-700">
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={16}
                    scrollWheelZoom={true}
                    className="h-[260px] w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                    />

                    <MapController
                        position={position}
                        onChange={onChange}
                    />

                    <CircleMarker
                        center={[position.lat, position.lng]}
                        radius={10}
                        pathOptions={{
                            color: '#FFFFFF',
                            weight: 3,
                            fillColor: '#C46A28',
                            fillOpacity: 1,
                        }}
                    />
                </MapContainer>
            </div>

            <button
                type="button"
                onClick={handleLocate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#EADBCE] dark:border-stone-700 px-3 py-2 text-xs font-semibold text-[#C46A28] dark:text-[#F5A764] hover:bg-[#FAF7F2] dark:hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
            >
                <LocateFixed className="w-4 h-4" />

                {loading
                    ? isVi
                        ? 'Đang lấy vị trí...'
                        : 'Getting location...'
                    : isVi
                        ? 'Sử dụng vị trí hiện tại'
                        : 'Use current location'}
            </button>

            {error && (
                <p className="text-xs text-red-500">
                    {error}
                </p>
            )}

            <div className="flex items-center justify-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                <MapPin className="w-3 h-3" />

                {isVi
                    ? 'Bấm vào bản đồ để chọn vị trí'
                    : 'Tap the map to select a location'}
            </div>

            <p className="text-center text-[10px] text-stone-500">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
        </div>
    );
}
