import React, { useRef, useState, useEffect, useCallback } from 'react';

const Ruleta = ({ titulos = [] }) => {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [ganador, setGanador] = useState(null);

    const canvasSize = 300;
    const numSegmentos = titulos.length;
    const segmentAngle = 360 / (numSegmentos || 1);

    // Envuelve drawWheel en useCallback para poder usarlo como dependencia
    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        const center = canvasSize / 2;
        const radius = center;
        const colores = ['#FFCC00', '#FF6666'];

        for (let i = 0; i < numSegmentos; i++) {
            const startAngle = ((i * segmentAngle) * Math.PI) / 180;
            const endAngle = (((i + 1) * segmentAngle) * Math.PI) / 180;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colores[i % colores.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dibuja el texto en el centro del segmento
            const midAngle = (startAngle + endAngle) / 2;
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(midAngle);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(titulos[i], radius - 10, 5);
            ctx.restore();
        }
    }, [titulos, canvasSize, numSegmentos, segmentAngle]);

    // Usa el hook useEffect con drawWheel como dependencia
    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    // Gira la ruleta
    const spinWheel = () => {
        if (spinning || numSegmentos === 0) return;
        setSpinning(true);
        setGanador(null);
        const indiceGanador = Math.floor(Math.random() * numSegmentos);
        const centroSegmento = indiceGanador * segmentAngle + segmentAngle / 2;
        const vueltasCompletas = Math.floor(Math.random() * 10) + 3; // 3 a 12 vueltas
        // Calcula el ángulo final, de forma absoluta, para que el centro del segmento ganador quede a 0° (a la derecha)
        const finalAngle = vueltasCompletas * 360 - centroSegmento;
        setSpinAngle(finalAngle);
        setTimeout(() => {
            setSpinning(false);
            setGanador(titulos[indiceGanador]);
        }, 4000);
    };

    return (
        <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Contenedor de la ruleta */}
                <div
                    style={{
                        margin: 'auto',
                        width: canvasSize,
                        height: canvasSize,
                        borderRadius: '50%',
                        boxShadow: '0 0 15px rgba(0,0,0,0.3)',
                        transition: 'transform 4s ease-out',
                        transform: `rotate(${spinAngle}deg)`
                    }}
                >
                    <canvas ref={canvasRef} width={canvasSize} height={canvasSize} style={{ borderRadius: '50%' }} />
                </div>
                {/* Indicador: flecha que apunta al segmento ganador */}
                {/* Indicador: flecha apuntando horizontalmente hacia el centro (a la derecha) */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-20px',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '15px solid transparent',
                        borderBottom: '15px solid transparent',
                        borderRight: '20px solid red'
                    }}
                ></div>
            </div>
            <button
                onClick={spinWheel}
                disabled={spinning}
                style={{
                    marginTop: 20,
                    padding: '10px 20px',
                    borderRadius: '5px',
                    backgroundColor: '#61dafb',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}
            >
                {spinning ? 'Girando...' : 'Girar ruleta'}
            </button>
            {ganador && (
                <div style={{ marginTop: 20, fontSize: 18, color: '#fff' }}>
                    Resultado: <strong>{ganador}</strong>
                </div>
            )}
        </div>
    );
};

export default Ruleta;