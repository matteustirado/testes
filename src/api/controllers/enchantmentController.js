const EnchantmentModel = require('../models/enchantmentModel');
const SentimentService = require('../../services/sentimentService');
const DidService = require('../../services/didService');
const socketService = require('../../services/socketService');

class EnchantmentController {
    static async createMessage(request, response) {
        try {
            const { wristband_code, user_name, message_text, character_model } = request.body;

            if (!wristband_code || !user_name || !message_text) {
                return response.status(400).json({ message: 'Todos os campos são obrigatórios: pulseira, nome e mensagem.' });
            }

            if (wristband_code !== '0108') {
                const existingMessage = await EnchantmentModel.findByWristbandAndDate(wristband_code);
                if (existingMessage) {
                    return response.status(429).json({ message: 'Você já enviou uma mensagem hoje. Tente novamente amanhã!' });
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
                const talkId = await DidService.generateVideo(fullText, character_model);
                messageData.video_id = talkId;
            }

            const newMessage = await EnchantmentModel.create(messageData);

            response.status(201).json({
                message: 'Sua mensagem foi recebida com sucesso!',
                sentiment: sentiment,
                data: newMessage
            });

        } catch (error) {
            console.error("Erro ao criar mensagem de encantamento:", error);
            response.status(500).json({ message: 'Ocorreu um erro interno ao processar sua mensagem.' });
        }
    }

    static async getVideoStatus(request, response) {
        try {
            const { videoId } = request.params;
            const statusData = await DidService.getVideoStatus(videoId);
            
            if (statusData && statusData.status === 'done' && statusData.result_url) {
                const updated = await EnchantmentModel.updateVideoUrl(videoId, statusData.result_url);
                if (updated) {
                    const io = socketService.getIo();
                    if (io) {
                        io.emit('enchantment:videoReady', { videoId: videoId, videoUrl: statusData.result_url });
                    }
                }
            }
            
            response.status(200).json(statusData);
        } catch (error) {
            response.status(500).json({ message: error.message });
        }
    }

    static async getApprovedMessages(request, response) {
        try {
            const messages = await EnchantmentModel.getApprovedMessages();
            response.status(200).json(messages);
        } catch (error) {
            console.error("Erro ao buscar mensagens aprovadas:", error);
            response.status(500).json({ message: 'Erro ao buscar mensagens.' });
        }
    }
}

module.exports = EnchantmentController;