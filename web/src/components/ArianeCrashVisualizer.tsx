import { HugeiconsIcon } from '@hugeicons/react';
import { FlameIcon, Activity01Icon } from '@hugeicons/core-free-icons';
import { useSimulationPlayback, SimulationToolbar } from './simulation';

interface ArianeStep {
  time: string;
  title: string;
  badge: string;
  badgeClass: string;
  description: string;
  metric: string;
  status: string;
  statusColor: string;
}

const STEPS: ArianeStep[] = [
  {
    time: 'T+0s a T+36s',
    title: 'Decolagem e Aceleracao Nominal',
    badge: 'Fase Nominal',
    badgeClass: 'bg-mint/30 text-emerald-800 border-mint/70',
    description: 'O Ariane 5 decola com potencia superior ao Ariane 4. Os sensores inerciais medem a velocidade e aceleracao horizontal (Horizontal Bias ou BH) em ponto flutuante de 64 bits (float64).',
    metric: 'Aceleracao BH: 12.450,00 (float64)',
    status: 'Normal (Dentro do limite de 32.767)',
    statusColor: 'text-emerald-700',
  },
  {
    time: 'T+36.7s',
    title: 'O Limiar Fisico e Ultrapassado',
    badge: 'Alerta Critico',
    badgeClass: 'bg-coral/20 text-crimson border-coral',
    description: 'A trajetoria agressiva eleva a aceleracao horizontal para 36.842,12. O software tenta converter esse valor float64 para um inteiro com sinal de 16 bits (int16_t).',
    metric: 'Valor Entrada: 36.842,12 > Limite Int16: +32.767',
    status: 'Estouro Iminente (Overflow)',
    statusColor: 'text-crimson',
  },
  {
    time: 'T+36.8s',
    title: 'Excecao de Hardware Nao Tratada',
    badge: 'Falha de Sistema',
    badgeClass: 'bg-coral/20 text-crimson border-coral',
    description: 'A conversao desprotegida transborda a capacidade de 16 bits. A linguagem Ada dispara uma excecao de hardware Operand Error nao capturada. O computador inercial primario (SRI 1) desliga.',
    metric: 'SRI 1: SHUTDOWN | SRI 2 (Backup): SHUTDOWN',
    status: 'Excecao nao tratada em cascata',
    statusColor: 'text-crimson',
  },
  {
    time: 'T+37.0s',
    title: 'Interpretacao de Diagnostico como Navegacao',
    badge: 'Comando Fatal',
    badgeClass: 'bg-coral/25 text-crimson border-coral',
    description: 'O computador de bordo principal (OBC) le os dados de despejo de erro no barramento e os interpreta como angulos reais de guinada, ordenando deflexao maxima nos bocais dos motores.',
    metric: 'Comando do Bocal: Deflexao Maxima (+20 graus)',
    status: 'Angulo de Ataque Critico',
    statusColor: 'text-crimson',
  },
  {
    time: 'T+37.2s',
    title: 'Destruicao Aerodinamica do Lancador',
    badge: 'Catastrofe',
    badgeClass: 'bg-coral/30 text-crimson border-coral',
    description: 'A 4.000 metros de altitude e Mach 1.5, a guinada subita expoem o foguete a esforcos aerodinamicos insustentaveis. Os propulsores se rompem e a autodestruicao e acionada.',
    metric: 'Perda Total: Foguete e 4 satelites Cluster (US$ 370M)',
    status: 'Destruicao aos 37s de voo',
    statusColor: 'text-crimson',
  },
];

export default function ArianeCrashVisualizer() {
  const playback = useSimulationPlayback({
    totalSteps: STEPS.length,
    stepIntervalMs: 2200,
    loop: true,
  });

  const current = STEPS[playback.currentStep];

  return (
    <div
      data-visual-model="VIS-08-ARIANE-OVERFLOW"
      className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/15 text-crimson">
            <HugeiconsIcon icon={FlameIcon} className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-crimson animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-crimson">Incidente Histórico</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              Disseccao Visual: O Voo 501 do Ariane 5 (1996)
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              A cadeia causal deterministica da falha de conversao float64 para int16
            </p>
          </div>
        </div>
      </div>

      {/* Controles de Playback Padronizados */}
      <div className="mt-6">
        <SimulationToolbar
          playback={playback}
          stepLabels={STEPS.map((s) => s.time.split(' ')[0])}
        />
      </div>

      {/* Indicadores de Estágio */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {STEPS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => playback.jumpTo(idx)}
            className={`min-h-[44px] rounded-xl border p-2 text-left font-mono text-[11px] transition-all flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
              idx === playback.currentStep
                ? 'border-lake-blue bg-white shadow-2xs ring-1 ring-lake-blue'
                : idx < playback.currentStep
                ? 'border-ash bg-parchment text-graphite hover:border-off-black'
                : 'border-ash/60 bg-parchment/40 text-smoke'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-off-black">{s.time}</span>
              {idx === playback.currentStep && (
                <span className="h-2 w-2 rounded-full bg-lake-blue animate-ping" />
              )}
            </div>
            <div className="truncate text-[10px] text-graphite">{s.badge}</div>
          </button>
        ))}
      </div>

      {/* Card de Detalhe do Passo */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 font-mono text-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ash/70 pb-3">
          <span className="font-serif text-lg font-normal text-off-black flex items-center gap-2">
            <HugeiconsIcon icon={Activity01Icon} className="h-4 w-4 text-lake-blue" />
            {current.time} : {current.title}
          </span>
          <span className={`rounded-full border px-3 py-1 font-mono text-[11px] font-bold ${current.badgeClass}`}>
            {current.badge}
          </span>
        </div>

        <p className="text-xs text-graphite font-sans leading-relaxed">
          {current.description}
        </p>

        {/* Telemetria e Estado do Hardware */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-ash/70 font-mono text-xs">
          <div className="rounded-card border border-ash bg-white p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] text-graphite uppercase font-bold block">
              Telemetria de Entrada:
            </span>
            <span className="text-sm font-bold text-off-black block mt-0.5">
              {current.metric}
            </span>
          </div>

          <div className="rounded-card border border-ash bg-white p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] text-graphite uppercase font-bold block">
              Estado do Hardware:
            </span>
            <span className={`text-sm font-bold block mt-0.5 ${current.statusColor}`}>
              {current.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
