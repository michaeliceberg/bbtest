// components/collect-gems-button.tsx

'use client';

import { useState, useEffect } from 'react';
import { Pickaxe } from 'lucide-react';
import { Button } from './ui/button';

export const CollectGemsButton = () => {
    const [pendingGems, setPendingGems] = useState(0);
    const [collecting, setCollecting] = useState(false);
    
    useEffect(() => {
        fetch('/api/user/pending-gems')
            .then(res => res.json())
            .then(data => setPendingGems(data.pendingGems))
            .catch(err => console.error(err));
    }, []);
    
    const handleCollect = async () => {
        if (pendingGems === 0) return;
        setCollecting(true);
        try {
            const res = await fetch('/api/user/collect-gems', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setPendingGems(0);
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCollecting(false);
        }
    };
    
    if (pendingGems === 0) return null;
    
    return (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2 animate-pulse">
                        <Pickaxe className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Готово к сбору!</p>
                        <p className="text-2xl font-bold">{pendingGems} 💎</p>
                    </div>
                </div>
                <Button 
                    onClick={handleCollect}
                    disabled={collecting}
                    className="bg-[#151F23] text-amber-600 hover:bg-[#151F23]/90"
                >
                    {collecting ? 'Сбор...' : 'Собрать'}
                </Button>
            </div>
        </div>
    );
};