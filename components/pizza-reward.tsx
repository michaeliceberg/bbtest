// components/pizza-reward.tsx

'use client';

import { useState } from 'react';
import { Pizza, Gem, Flame, Crown, Star, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { orderPizza } from '@/actions/order-pizza';
// import { orderPizza } from '@/actions/order-pizza';

type Props = {
    userGems: number;
    userStreak: number;
    userRank: number; // позиция в топе по стрику
    onOrder?: () => void;
};

export const PizzaReward = ({ userGems, userStreak, userRank, onOrder }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [ordering, setOrdering] = useState(false);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    
    // Доступно только топ-10 по стрику
    const isAvailable = userRank <= 10 && userStreak >= 7;
    const price = 100; // 100 гемов
    
    const handleOrder = async () => {
        if (!address || !phone || !deliveryDate || !deliveryTime) {
            toast.error('Заполните все поля');
            return;
        }
        
        setOrdering(true);
        try {
            const result = await orderPizza({
                address,
                phone,
                deliveryTime: new Date(`${deliveryDate}T${deliveryTime}`),
            });
            
            if (result.success) {
                toast.success('🍕 Пицца заказана! Ожидайте доставку');
                setIsOpen(false);
                onOrder?.();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Ошибка при заказе');
        } finally {
            setOrdering(false);
        }
    };
    
    return (
        <>
            <div className={`border-2 rounded-xl p-4 transition-all ${
                isAvailable 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 cursor-pointer hover:scale-105' 
                    : 'bg-[#232F34] opacity-50'
            }`}
            onClick={() => isAvailable && setIsOpen(true)}>
                <div className="flex items-center gap-3">
                    <div className="text-4xl">🍕</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            Реальная пицца!
                            {isAvailable && <Crown className="h-4 w-4 text-yellow-400" />}
                        </h3>
                        <p className="text-sm opacity-90">
                            {isAvailable 
                                ? `Обменяй ${price}💎 на настоящую пиццу из Додо Пиццы!`
                                : `Доступно только для топ-10 по стрику (сейчас ты на ${userRank} месте)`}
                        </p>
                    </div>
                    <ChevronRight className="h-5 w-5" />
                </div>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pizza className="h-5 w-5 text-orange-500" />
                            Заказать пиццу
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <p className="text-sm text-orange-700">
                                Спишется <strong>{price}💎</strong> с твоего счета
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                                Текущий стрик: {userStreak} дней (чем больше стрик, тем выше шанс!)
                            </p>
                        </div>
                        
                        <div>
                            <Label>Адрес доставки</Label>
                            <Input 
                                placeholder="Город, улица, дом, квартира"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <Label>Телефон</Label>
                            <Input 
                                placeholder="+7 XXX XXX-XX-XX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Дата</Label>
                                <Input 
                                    type="date"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Время</Label>
                                <Input 
                                    type="time"
                                    value={deliveryTime}
                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <Button variant='superOutline' onClick={() => setIsOpen(false)}>
                                Отмена
                            </Button>
                            <Button 
                                onClick={handleOrder}
                                disabled={ordering}
                                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500"
                            >
                                {ordering ? 'Заказ оформляется...' : '🍕 Заказать за 100💎'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};