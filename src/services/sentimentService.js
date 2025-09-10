const positiveKeywords = ['bom', 'ótimo', 'incrível', 'amei', 'adoro', 'perfeito', 'lindo', 'maravilhoso', 'excelente', 'top', 'demais', 'curti', 'amor', 'feliz', 'parabéns'];
const negativeKeywords = ['ruim', 'péssimo', 'odeio', 'lixo', 'horrível', 'terrível', 'problema', 'demora', 'caro', 'reclamar', 'merda', 'bosta', 'chato'];

class SentimentService {
    static analyze(text) {
        const lowerCaseText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;

        positiveKeywords.forEach(word => {
            if (lowerCaseText.includes(word)) {
                positiveScore++;
            }
        });

        negativeKeywords.forEach(word => {
            if (lowerCaseText.includes(word)) {
                negativeScore++;
            }
        });

        if (negativeScore > positiveScore) {
            return 'negative';
        }
        if (positiveScore > 0 && negativeScore === 0) {
            return 'positive';
        }
        
        return 'neutral';
    }
}

module.exports = SentimentService;