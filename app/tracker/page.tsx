"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";

const hardcodedClasses = [
  {
    name: "Matemática",
    recommended: 6,
    studied: 2,
    alert: "¡Alerta! Hay prueba la próxima semana.",
  },
  {
    name: "Historia",
    recommended: 4,
    studied: 1,
    alert: "",
  },
  {
    name: "Inglés",
    recommended: 3,
    studied: 2,
    alert: "",
  },
  {
    name: "Software",
    recommended: 5,
    studied: 4,
    alert: "¡Alerta! Hay prueba la próxima semana.",
  },
];

const StudyTracker = () => {
  const [classes, setClasses] = useState(hardcodedClasses);
  const [hoursInput, setHoursInput] = useState(Array(hardcodedClasses.length).fill(""));

  const handleRegisterHours = (index: number) => {
    const newClasses = [...classes];
    const addedHours = parseFloat(hoursInput[index]);
    if (!Number.isNaN(addedHours)) {
      newClasses[index].studied += addedHours;
    }
    setClasses(newClasses);
    const newInputs = [...hoursInput];
    newInputs[index] = "";
    setHoursInput(newInputs);
  };


  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {classes.map((cls, index) => (
          <Card key={cls.name} className="rounded-2xl bg-white p-4 shadow">
            <CardContent>
              <h2 className="mb-2 text-xl font-bold">{cls.name}</h2>
              <p>Horas recomendadas: {cls.recommended}</p>
              <p>Horas estudiadas: {cls.studied}</p>
              <p>Horas restantes: {Math.max(0, cls.recommended - cls.studied)}</p>
              <p>study plan: {getStudyPlansByUserId(useUser().user?.id)};</p>
              {/* MOSTRAR USER ID */}
              <p className="text-sm text-gray-500">ID de usuario: {useUser().user?.id}</p>
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
                <Button onClick={() => handleRegisterHours(index)}>Registrar</Button>
              </div>
              {cls.alert && <p className="mt-2 font-semibold text-red-600">{cls.alert}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Calendario de estudio</h2>
        <div className="grid grid-cols-7 gap-2 text-center">
          {[...Array(7)].map((_, dayIndex) => (
            <div className="rounded-xl bg-blue-100 p-2">
              Día {dayIndex + 1}
              <div className="mt-1 text-sm">Horas: 3</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyTracker;
