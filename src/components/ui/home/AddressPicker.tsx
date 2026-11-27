'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AddressPosition } from './AddressMap';

const AddressMap = dynamic(() => import('./AddressMap'), { ssr: false });

export interface SelectedAddress {
    address: string;
    position: AddressPosition | null;
}
interface Props {
    initialAddress: string;
    initialPosition?: AddressPosition | null;
    language: string;
    onConfirm: (value: SelectedAddress) => void;
    onCancel: () => void;
}
interface PhotonFeature {
    geometry: { coordinates: [number, number] };
    properties: Record<string, string | undefined>;
}
const defaultPosition = { lat: 10.8231, lng: 106.6297 };
function label(f: PhotonFeature) {
    const p = f.properties;
    return [...new Set([p.name, [p.housenumber, p.street].filter(Boolean).join(' '), p.district, p.city, p.state, p.country].filter(Boolean))].join(', ');
}
export default function AddressPicker({ initialAddress, initialPosition, language, onConfirm, onCancel }: Props) {
    const vi = language === 'vi';
    const [address, setAddress] = useState(initialAddress);
    const [position, setPosition] = useState<AddressPosition>(initialPosition ?? defaultPosition);
    const [hasPosition, setHasPosition] = useState(Boolean(initialPosition));
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PhotonFeature[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const reverse = useRef<AbortController | null>(null);
    useEffect(() => () => reverse.current?.abort(), []);
    useEffect(() => {
        if (query.trim().length < 3) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setBusy(true);
            try {
                const url = new URL('https://photon.komoot.io/api/');
                url.searchParams.set('q', query.trim());
                url.searchParams.set('limit', '5');
                url.searchParams.set('lat', '10.8231');
                url.searchParams.set('lon', '106.6297');
                const response = await fetch(url, { signal: controller.signal });
                if (!response.ok) throw new Error('Search failed');
                const data = await response.json();
                if (!controller.signal.aborted) setResults(data.features ?? []);
            } catch {
                if (!controller.signal.aborted) setError(true);
            } finally {
                if (!controller.signal.aborted) setBusy(false);
            }
        }, 800);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query]);
    const choosePosition = async (p: AddressPosition) => {
        reverse.current?.abort();
        const controller = new AbortController();
        reverse.current = controller;
        setPosition(p); setHasPosition(true); setQuery(''); setResults([]); setBusy(false); setError(false);
        setAddress(`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
        try {
            const response = await fetch(`https://photon.komoot.io/reverse?lat=${p.lat}&lon=${p.lng}`, { signal: controller.signal });
            if (!response.ok) throw new Error('Reverse failed');
            const data = await response.json();
            if (!controller.signal.aborted && data.features?.[0]) setAddress(label(data.features[0]) || `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
        } catch { /* Coordinates remain available as a fallback. */ }
    };
    return (
        <div className="mt-3 space-y-3 text-xs text-[#2A211B] dark:text-stone-100">
            <input type="text" value={address} maxLength={300} autoFocus
                aria-label={vi ? 'Địa chỉ giao nhận' : 'Handover address'}
                placeholder={vi ? 'Tìm địa chỉ...' : 'Search address...'}
                onChange={(e) => {
                    reverse.current?.abort();
                    setAddress(e.target.value); setQuery(e.target.value); setHasPosition(false); setResults([]); setError(false); setBusy(false);
                }}
                className="w-full rounded-xl border border-[#EADBCE] dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 outline-none focus:border-[#C46A28]" />
            {busy && <p>{vi ? 'Đang tìm địa chỉ...' : 'Searching...'}</p>}
            {error && <p role="status">{vi ? 'Không thể tìm kiếm. Bạn vẫn có thể nhập thủ công.' : 'Search unavailable. You can enter an address manually.'}</p>}
            {results.length > 0 && <div className="max-h-36 overflow-y-auto rounded-xl border border-[#EADBCE] dark:border-stone-700">
                {results.map((f, i) => <button type="button" key={i} className="block w-full border-b border-[#EADBCE] dark:border-stone-700 p-2 text-left hover:bg-amber-50 dark:hover:bg-stone-700" onClick={() => {
                    reverse.current?.abort();
                    const [lng, lat] = f.geometry.coordinates;
                    setAddress(label(f)); setPosition({ lat, lng }); setHasPosition(true); setQuery(''); setResults([]); setBusy(false);
                }}>{label(f)}</button>)}
            </div>}
            <AddressMap position={position} onChange={choosePosition} language={language} />
            <p className="text-stone-500 dark:text-stone-400">{vi ? 'Tìm kiếm sử dụng Photon. Chỉ nhập địa điểm bạn muốn chia sẻ.' : 'Search uses Photon. Only enter locations you wish to share.'}</p>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="rounded-lg border border-[#EADBCE] dark:border-stone-600 px-3 py-2">{vi ? 'Hủy' : 'Cancel'}</button>
                <button type="button" disabled={!address.trim()} onClick={() => onConfirm({ address: address.trim(), position: hasPosition ? position : null })} className="rounded-lg bg-[#A65A24] px-3 py-2 font-semibold text-white disabled:opacity-50">{vi ? 'Xác nhận địa chỉ' : 'Confirm address'}</button>
            </div>
        </div>
    );
}
