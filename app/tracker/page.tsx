"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const hardcodedClasses = [
    {
        name: 'Matemática',
        recommended: 6,
        studied: 2,
        alert: '¡Alerta! Hay prueba la próxima semana.',
    },
    {
        name: 'Historia',
        recommended: 4,
        studied: 1,
        alert: '',
    },
    {
        name: 'Inglés',
        recommended: 3,
        studied: 2,
        alert: '',
    },
    {
        name: 'Software',
        recommended: 5,
        studied: 4,
        alert: '¡Alerta! Hay prueba la próxima semana.',
    },
];

const StudyTracker = () => {
    const [classes, setClasses] = useState(hardcodedClasses);
    const [hoursInput, setHoursInput] = useState(Array(hardcodedClasses.length).fill(''));

    const handleRegisterHours = (index: number) => {
        const newClasses = [...classes];
        const addedHours = parseFloat(hoursInput[index]);
        if (!isNaN(addedHours)) {
            newClasses[index].studied += addedHours;
        }
        setClasses(newClasses);
        const newInputs = [...hoursInput];
        newInputs[index] = '';
        setHoursInput(newInputs);
    };

    return (
        <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {classes.map((cls, index) => (
                    <Card key={index} className="bg-white shadow rounded-2xl p-4">
                        <CardContent>
                            <h2 className="text-xl font-bold mb-2">{cls.name}</h2>
                            <p>Horas recomendadas: {cls.recommended}</p>
                            <p>Horas estudiadas: {cls.studied}</p>
                            <p>Horas restantes: {Math.max(0, cls.recommended - cls.studied)}</p>
                            <div className="mt-2 flex space-x-2">
                                <Input
                                    type="number"
                                    min="0"
                                    value={hoursInput[index]}
                                    onChange={(e) => {
                                        const newInputs = [...hoursInput];
                                        newInputs[index] = e.target.value;
                                        setHoursInput(newInputs);
                                    }}
                                    placeholder="Horas"
                                />
                                <Button onClick={() => handleRegisterHours(index)}>
                                    Registrar
                                </Button>
                            </div>
                            {cls.alert && (
                                <p className="mt-2 text-red-600 font-semibold">{cls.alert}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Calendario de estudio</h2>
                <div className="grid grid-cols-7 gap-2 text-center">
                    {[...Array(7)].map((_, dayIndex) => (
                        <div key={dayIndex} className="bg-blue-100 rounded-xl p-2">
                            Día {dayIndex + 1}
                            <div className="text-sm mt-1">Horas: 3</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudyTracker;

