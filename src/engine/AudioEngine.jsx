class AudioEngine {
    constructor() {
        // 1. Инициализация контекста (синглтон)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // 2. Узлы маршрутизации (Routing)
        // Master Out -> идет на колонки пользователя
        this.masterOut = this.ctx.destination;
        
        // Recording Stream -> сюда мы будем дублировать всё, что хотим записать
        this.recordingNode = this.ctx.createMediaStreamDestination();
        
        // Главная шина громкости
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8; // Дефолтная громкость
        
        // СОЕДИНЕНИЕ: MasterGain идет и в колонки, и в запись
        this.masterGain.connect(this.masterOut);
        this.masterGain.connect(this.recordingNode);
        // 3. Метроном State
        this.isPlaying = false;
        this.bpm = 120;
        this.currentBeat = 0;
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.lookahead = 25.0; // мс
        this.scheduleAheadTime = 0.1; // сек
    }
    // --- Core API ---
    async init() {
        if (this.ctx.state === 'suspended') {
           await this.ctx.resume();
        }
    }
    // --- Metronome Logic ---
    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05; // чуть-чуть в будущее
        this.scheduler();
    }
    stop() {
        this.isPlaying = false;
        window.clearTimeout(this.timerID);
    }
    
    setBpm(bpm) {
        this.bpm = bpm;
    }
    // Планировщик (Lookahead)
    scheduler() {
        // Пока есть ноты, которые должны сыграть в ближайшие 100мс...
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }
        // Рекурсивный таймер (но неточный, поэтому мы используем while выше)
        if (this.isPlaying) {
            this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
        }
    }
    // Двигаем виртуальную стрелку вперед
    nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat; // Просто добавляем время
        this.currentBeat = (this.currentBeat + 1) % 4; // 4/4 размер
    }
    // Собственно "БИП"
    scheduleNote(beatNumber, time) {
        // Осциллятор для клика
        const osc = this.ctx.createOscillator();
        const envelope = this.ctx.createGain();
        // Высокий питч на первую долю (Акцент), обычный на остальные
        osc.frequency.value = (beatNumber === 0) ? 1000 : 800;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(envelope);
        
        // Звук метронома НЕ обязательно записывать, 
        // поэтому подключаем только к masterOut (в колонки), минуя recordingNode?
        // Или хотим слышать клик в записи? По ТЗ вроде "флаг isMetronomeRecording".
        // Пока пустим просто в masterGain (будет слышно везде).
        envelope.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.05);
        
        // Тут можно диспатчить событие в UI, чтобы мигала лампочка
        // Но аккуратно, чтобы не спамить рендерами
    }
}
// Экспортируем готовый инстанс (Singleton)
export const audioEngine = new AudioEngine();