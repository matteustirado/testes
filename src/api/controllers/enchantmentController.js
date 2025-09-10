const EnchantmentModel = require('../models/enchantmentModel');
const SentimentService = require('../../services/sentimentService');
const VideoService = require('../../services/videoService');
const socketService = require('../../services/socketService');

const pollVideoStatus = (videoId, maxAttempts = 30, interval = 10000) => {
    let attempts = 0;
    const poll = setInterval(async () => {
        if (attempts >= maxAttempts) {
            clearInterval(poll);
            console.error(`[Enchantment] Tempo esgotado para o vídeo ${videoId}`);
            return;
        }

        try {
            console.log(`[Enchantment] Verificando status do vídeo ${videoId}, tentativa ${attempts + 1}`);
            const videoStatus = await VideoService.getVideoStatus(videoId);

            if (videoStatus && videoStatus.status === 'completed' && videoStatus.video_url) {
                clearInterval(poll);
                console.log(`[Enchantment] Vídeo ${videoId} pronto! URL: ${videoStatus.video_url}`);
                const updated = await EnchantmentModel.updateVideoUrl(videoId, videoStatus.video_url);
                if (updated) {
                    const io = socketService.getIo();
                    if (io) {
                        console.log(`[Enchantment] Emitindo evento 'enchantment:videoReady' para o frontend.`);
                        io.emit('enchantment:videoReady', {
                            videoId: videoId,
                            videoUrl: videoStatus.video_url
                        });
                    }
                }
            } else if (videoStatus && videoStatus.status === 'failed') {
                clearInterval(poll);
                console.error(`[Enchantment] Falha ao gerar o vídeo ${videoId}:`, videoStatus.error);
            }
        } catch (error) {
            console.error(`[Enchantment] Erro ao verificar status do vídeo:`, error);
        }
        attempts++;
    }, interval);
};

class EnchantmentController {
    static async createMessage(request, response) {
        try {
            const {
                wristband_code,
                user_name,
                message_text,
                character_model
            } = request.body;

            if (!wristband_code || !user_name || !message_text) {
                return response.status(400).json({
                    message: 'Todos os campos são obrigatórios: pulseira, nome e mensagem.'
                });
            }

            if (wristband_code !== '0108') {
                const existingMessage = await EnchantmentModel.findByWristbandAndDate(wristband_code);
                if (existingMessage) {
                    return response.status(429).json({
                        message: 'Você já enviou uma mensagem hoje. Tente novamente amanhã!'
                    });
                }
            }

            const sentiment = SentimentService.analyze(message_text);
            const isApproved = sentiment === 'positive' || sentiment === 'neutral';
            const status = isApproved ? 'approved' : 'pending_approval';

            const messageData = {
                wristband_code,
                user_name,
                message_text,
                sentiment,
                status,
                character_model: isApproved ? character_model : null,
                video_id: null
            };

            if (isApproved && character_model) {
                const fullText = `Olá ${user_name}, aqui é o seu personagem! Você disse: "${message_text}"`;
                const videoId = await VideoService.generateVideo(fullText, character_model);
                messageData.video_id = videoId;
                pollVideoStatus(videoId);
            }

            const newMessage = await EnchantmentModel.create(messageData);

            response.status(201).json({
                message: 'Sua mensagem foi recebida com sucesso!',
                sentiment: sentiment,
                data: newMessage
            });

        } catch (error) {
            console.error("Erro ao criar mensagem de encantamento:", error);
            response.status(500).json({
                message: 'Ocorreu um erro interno ao processar sua mensagem.'
            });
        }
    }

    static async getVideoStatus(request, response) {
        try {
            const {
                videoId
            } = request.params;
            const statusData = await VideoService.getVideoStatus(videoId);

            if (statusData && statusData.status === 'completed' && statusData.video_url) {
                const updated = await EnchantmentModel.updateVideoUrl(videoId, statusData.video_url);
                if (updated) {
                    const io = socketService.getIo();
                    if (io) {
                        io.emit('enchantment:videoReady', {
                            videoId: videoId,
                            videoUrl: statusData.video_url
                        });
                    }
                }
            }

            response.status(200).json(statusData);
        } catch (error) {
            response.status(500).json({
                message: error.message
            });
        }
    }

    static async getApprovedMessages(request, response) {
        try {
            const messages = await EnchantmentModel.getApprovedMessages();
            response.status(200).json(messages);
        } catch (error) {
            console.error("Erro ao buscar mensagens aprovadas:", error);
            response.status(500).json({
                message: 'Erro ao buscar mensagens.'
            });
        }
    }
}

module.exports = EnchantmentController;